export interface ImageMetrics {
  brightness: number;
  brightnessQuality: number;
  contrast: number;
  contrastQuality: number;
  sharpness: number;
  sharpnessQuality: number;
  symmetry: number;
  skinUniformity: number;
  skinBlemishRatio: number;   // fraction of skin pixels that are local anomalies (0=clean, 1=many spots)
  skinRednessRatio: number;   // fraction of skin pixels with elevated redness (inflammation)
  skinLocalVariance: number;  // micro-texture variance within small blocks (lighting-independent)
  topRegionScore: number;
  eyeRegionScore: number;
  eyeUpperEdgeScore: number;  // brow ridge / upper orbital area (rows 20–32%)
  eyeLowerEdgeScore: number;  // under-eye / lower orbital (rows 32–45%)
  lateralEdgeScore: number;   // outer 15% column edges — facial contour strength
  lowerEdgeDensity: number;
  midEdgeDensity: number;
  midfaceToLowerRatio: number; // midEdgeDensity / lowerEdgeDensity — midface prominence
  faceFound: boolean;
  overallQuality: number;
}

function getLum(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function bell(value: number, optimal: number, spread: number): number {
  return Math.exp(-((value - optimal) ** 2) / (2 * spread * spread));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export async function analyzeImage(imageUrl: string): Promise<ImageMetrics> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onerror = () => {
      resolve({
        brightness: 0, brightnessQuality: 0, contrast: 0, contrastQuality: 0,
        sharpness: 0, sharpnessQuality: 0, symmetry: 0.5, skinUniformity: 0.45,
        skinBlemishRatio: 0, skinRednessRatio: 0, skinLocalVariance: 0.25,
        topRegionScore: 0.3, eyeRegionScore: 0.3, eyeUpperEdgeScore: 0.3,
        eyeLowerEdgeScore: 0.3, lateralEdgeScore: 0.3, lowerEdgeDensity: 0,
        midEdgeDensity: 0, midfaceToLowerRatio: 1.0, faceFound: false, overallQuality: 0,
      });
    };

    img.onload = () => {
      const W = 240;
      const H = 240;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        img.onerror!(new Event('error'));
        return;
      }
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);
      const total = W * H;

      // === Brightness ===
      let lumSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        lumSum += getLum(data[i], data[i + 1], data[i + 2]);
      }
      const brightness = lumSum / total;
      const brightnessQuality = bell(brightness, 128, 45);

      // === Contrast (std dev of luminance) ===
      let sqSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const d = getLum(data[i], data[i + 1], data[i + 2]) - brightness;
        sqSum += d * d;
      }
      const contrast = Math.sqrt(sqSum / total);
      const contrastQuality = bell(contrast, 52, 28);

      // === Sharpness (gradient magnitude) ===
      let edgeSum = 0;
      let edgeCount = 0;
      for (let y = 1; y < H - 1; y += 2) {
        for (let x = 1; x < W - 1; x += 2) {
          const c = (y * W + x) * 4;
          const r = c + 4;
          const d = ((y + 1) * W + x) * 4;
          const gx = getLum(data[r], data[r + 1], data[r + 2]) - getLum(data[c], data[c + 1], data[c + 2]);
          const gy = getLum(data[d], data[d + 1], data[d + 2]) - getLum(data[c], data[c + 1], data[c + 2]);
          edgeSum += Math.sqrt(gx * gx + gy * gy);
          edgeCount++;
        }
      }
      const sharpness = edgeCount > 0 ? edgeSum / edgeCount : 0;
      const sharpnessQuality = clamp01(sharpness / 18);

      // === Bilateral Symmetry ===
      const mid = Math.floor(W / 2);
      let diffSum = 0;
      let diffCount = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < mid; x++) {
          const iL = (y * W + x) * 4;
          const iR = (y * W + (W - 1 - x)) * 4;
          diffSum += Math.abs(
            getLum(data[iL], data[iL + 1], data[iL + 2]) -
            getLum(data[iR], data[iR + 1], data[iR + 2])
          );
          diffCount++;
        }
      }
      const symmetry = clamp01(1 - (diffSum / (diffCount * 255)));

      // === Skin Tone Uniformity ===
      const skinLums: number[] = [];
      for (let i = 0; i < data.length; i += 8) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 85 && g > 55 && b > 25 && r > g && r > b && r - g > 12 && r - b > 22) {
          skinLums.push(getLum(r, g, b));
        }
      }
      let skinUniformity = 0.45;
      if (skinLums.length > 30) {
        const mean = skinLums.reduce((a, b) => a + b, 0) / skinLums.length;
        const variance = skinLums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / skinLums.length;
        skinUniformity = clamp01(1 - Math.sqrt(variance) / 48);
      }

      // === Skin Blemish Detection ===
      // Samples face-center region and detects localized dark anomalies (acne/spots)
      // that are significantly below their immediate neighborhood average.
      // This is lighting-independent: we compare each pixel to its LOCAL neighbors.
      const faceY0 = Math.floor(H * 0.22), faceY1 = Math.floor(H * 0.82);
      const faceX0 = Math.floor(W * 0.18), faceX1 = Math.floor(W * 0.82);
      let blemishCount = 0, blemishTotal = 0;
      // Step every 4px for performance
      for (let y = faceY0 + 4; y < faceY1 - 4; y += 4) {
        for (let x = faceX0 + 4; x < faceX1 - 4; x += 4) {
          const ci = (y * W + x) * 4;
          const cr = data[ci], cg = data[ci + 1], cb = data[ci + 2];
          // Only count pixels that look like skin
          if (!(cr > 70 && cg > 45 && cb > 20 && cr > cg && cr > cb)) continue;
          blemishTotal++;
          const cLum = getLum(cr, cg, cb);
          // 3x3 neighbourhood average (excluding center)
          let nbSum = 0;
          for (let dy = -4; dy <= 4; dy += 4) {
            for (let dx = -4; dx <= 4; dx += 4) {
              if (dy === 0 && dx === 0) continue;
              const ni = ((y + dy) * W + (x + dx)) * 4;
              nbSum += getLum(data[ni], data[ni + 1], data[ni + 2]);
            }
          }
          const nbMean = nbSum / 8;
          // Blemish: significantly darker than local area (threshold: 22 luma units)
          if (nbMean - cLum > 22) blemishCount++;
        }
      }
      const skinBlemishRatio = blemishTotal > 0 ? clamp01(blemishCount / blemishTotal) : 0;

      // === Skin Redness Detection (inflammation / acne flush) ===
      // R-G difference far above baseline for skin = redness signal
      let rednessCount = 0, rednessTotal = 0;
      for (let i = 0; i < data.length; i += 8) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (!(r > 85 && g > 45 && b > 20 && r > g && r > b)) continue;
        rednessTotal++;
        // High R-G gap above normal skin baseline (>55) suggests inflammation
        if (r - g > 55) rednessCount++;
      }
      const skinRednessRatio = rednessTotal > 0 ? clamp01(rednessCount / rednessTotal) : 0;

      // === Skin Local Variance (micro-texture, lighting-independent) ===
      // Divides the face region into 10x10 blocks, subtracts each block's mean,
      // then computes variance of residuals. This cancels out global lighting gradients
      // so only fine texture (pores, bumps) contributes to the score.
      const blockSize = 10;
      let localVarSum = 0, blockCount = 0;
      for (let by = faceY0; by < faceY1 - blockSize; by += blockSize) {
        for (let bx = faceX0; bx < faceX1 - blockSize; bx += blockSize) {
          const blockLums: number[] = [];
          for (let dy = 0; dy < blockSize; dy++) {
            for (let dx = 0; dx < blockSize; dx++) {
              const bi = ((by + dy) * W + (bx + dx)) * 4;
              blockLums.push(getLum(data[bi], data[bi + 1], data[bi + 2]));
            }
          }
          const bMean = blockLums.reduce((s, v) => s + v, 0) / blockLums.length;
          const bVar  = blockLums.reduce((s, v) => s + (v - bMean) ** 2, 0) / blockLums.length;
          localVarSum += bVar;
          blockCount++;
        }
      }
      // localVariance: 0=very smooth, high=lots of micro-texture
      const rawLocalVar = blockCount > 0 ? localVarSum / blockCount : 200;
      // Normalise: ~50 = average texture; clamp 0-1 (lower variance = smoother skin)
      const skinLocalVariance = clamp01(rawLocalVar / 400);

      // === Top Region (hair, top 25%) ===
      const topRows = Math.floor(H * 0.25);
      let topLumSum = 0;
      for (let y = 0; y < topRows; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          topLumSum += getLum(data[i], data[i + 1], data[i + 2]);
        }
      }
      const topBrightness = topLumSum / (topRows * W);
      const topRegionScore = bell(topBrightness, 75, 48);

      // Helper: edge density for a row band
      function rowBandEdge(yStart: number, yEnd: number, xMin = 1, xMax = W - 1): number {
        let eSum = 0, eCnt = 0;
        for (let y = yStart; y < yEnd - 1; y += 2) {
          for (let x = xMin; x < xMax; x += 2) {
            const c = (y * W + x) * 4;
            const r = c + 4;
            const d = ((y + 1) * W + x) * 4;
            eSum += Math.abs(getLum(data[r], data[r + 1], data[r + 2]) - getLum(data[c], data[c + 1], data[c + 2]))
                  + Math.abs(getLum(data[d], data[d + 1], data[d + 2]) - getLum(data[c], data[c + 1], data[c + 2]));
            eCnt++;
          }
        }
        return eCnt > 0 ? eSum / eCnt : 0;
      }

      // === Eye Region — full (20–45%) ===
      const eyeStart   = Math.floor(H * 0.20);
      const eyeMid     = Math.floor(H * 0.325); // split for upper/lower
      const eyeEnd     = Math.floor(H * 0.45);
      const eyeRaw     = rowBandEdge(eyeStart, eyeEnd);
      const eyeRegionScore    = clamp01(eyeRaw / 12);

      // === Eye Upper (brow ridge / deep orbital — rows 20–32%) ===
      const eyeUpperEdgeScore = clamp01(rowBandEdge(eyeStart, eyeMid) / 12);

      // === Eye Lower (under-eye / cheek transition — rows 32–45%) ===
      const eyeLowerEdgeScore = clamp01(rowBandEdge(eyeMid, eyeEnd) / 12);

      // === Lateral Edge Score (outer 15% columns — facial contour) ===
      const lateralW = Math.floor(W * 0.15);
      const lateralLeft  = rowBandEdge(Math.floor(H * 0.20), Math.floor(H * 0.80), 1, lateralW);
      const lateralRight = rowBandEdge(Math.floor(H * 0.20), Math.floor(H * 0.80), W - lateralW, W - 1);
      const lateralEdgeScore = clamp01((lateralLeft + lateralRight) / 2 / 10);

      // === Lower Region (jaw/chin, bottom 33%) ===
      const lowerStart = Math.floor(H * 0.67);
      const lowerRaw   = rowBandEdge(lowerStart, H - 1);
      const lowerEdgeDensity = clamp01(lowerRaw / 14);

      // === Mid Region (cheekbones/mid-face, 33–67%) ===
      const midStart = Math.floor(H * 0.33);
      const midEnd   = Math.floor(H * 0.67);
      const midRaw   = rowBandEdge(midStart, midEnd);
      const midEdgeDensity = clamp01(midRaw / 10);

      // === Midface-to-Lower ratio (photo-quality-independent structural signal) ===
      const midfaceToLowerRatio = lowerEdgeDensity > 0.01
        ? clamp01(midEdgeDensity / lowerEdgeDensity)   // capped 0–1; 1 = equal, >0.8 = good midface
        : 0.5;

      // === Face Detection ===
      const tryFaceDetector = async (): Promise<void> => {
        if ('FaceDetector' in window) {
          try {
            const detector = new (window as unknown as Record<string, new (opts: Record<string, unknown>) => { detect: (img: HTMLImageElement) => Promise<Array<unknown>> }>)['FaceDetector']({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await detector.detect(img);
            if (faces.length === 0) {
              resolve({
                brightness, brightnessQuality, contrast, contrastQuality,
                sharpness, sharpnessQuality, symmetry, skinUniformity,
                skinBlemishRatio, skinRednessRatio, skinLocalVariance,
                topRegionScore, eyeRegionScore, eyeUpperEdgeScore, eyeLowerEdgeScore,
                lateralEdgeScore, lowerEdgeDensity, midEdgeDensity, midfaceToLowerRatio,
                faceFound: false, overallQuality: 0,
              });
              return;
            }
          } catch {
            // API unavailable — fall through
          }
        }

        const overallQuality = brightnessQuality * 0.3 + contrastQuality * 0.3 + sharpnessQuality * 0.4;
        const faceFound = overallQuality > 0.10;

        resolve({
          brightness, brightnessQuality, contrast, contrastQuality,
          sharpness, sharpnessQuality, symmetry, skinUniformity,
          skinBlemishRatio, skinRednessRatio, skinLocalVariance,
          topRegionScore, eyeRegionScore, eyeUpperEdgeScore, eyeLowerEdgeScore,
          lateralEdgeScore, lowerEdgeDensity, midEdgeDensity, midfaceToLowerRatio,
          faceFound, overallQuality,
        });
      };

      tryFaceDetector();
    };

    img.src = imageUrl;
  });
}
