import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

// ── Types ──────────────────────────────────────────────────────────────────────

export type FaceValidationErrorType =
  | 'no_face'
  | 'multiple_faces'
  | 'face_too_small'
  | 'too_dark'
  | 'image_error';

export interface FaceValidationResult {
  valid: boolean;
  errorType: FaceValidationErrorType | null;
}

// ── Timeout utility ────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const race = Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`[FACEMAX] Timeout after ${ms}ms: ${label}`)),
        ms,
      );
    }),
  ]);
  // Always clear the timer so it doesn't keep the process alive
  race.finally(() => clearTimeout(timer)).catch(() => {});
  return race;
}

// ── Singleton detector with hard timeout on every load step ───────────────────

let detectorInstance: FaceDetector | null = null;
let loadPromise: Promise<FaceDetector | null> | null = null;

async function getDetector(): Promise<FaceDetector | null> {
  if (detectorInstance) return detectorInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      console.log('[FACEMAX] Loading MediaPipe WASM runtime...');
      const vision = await withTimeout(
        FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        ),
        10_000,
        'FilesetResolver.forVisionTasks',
      );

      console.log('[FACEMAX] Loading face detection model...');
      const detector = await withTimeout(
        FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.45,
        }),
        10_000,
        'FaceDetector.createFromOptions',
      );

      console.log('[FACEMAX] Face detector ready ✓');
      detectorInstance = detector;
      return detector;
    } catch (err) {
      console.warn('[FACEMAX] Detector failed to load (fail-open):', err);
      // Clear the promise so the next call can retry
      loadPromise = null;
      return null;
    }
  })();

  return loadPromise;
}

/** Pre-warm the detector in the background while user is on the upload screen. */
export function preloadFaceDetector(): void {
  getDetector();
}

// ── Image helpers ──────────────────────────────────────────────────────────────

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return withTimeout(
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < 20 || img.naturalHeight < 20) {
          reject(new Error('Image too small to be valid'));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image (corrupt or unsupported format)'));
      img.src = src;
    }),
    5_000,
    'loadImageElement',
  );
}

function measureBrightness(img: HTMLImageElement): number {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 128;
    ctx.drawImage(img, 0, 0, 48, 48);
    const { data } = ctx.getImageData(0, 0, 48, 48);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    return sum / (48 * 48);
  } catch {
    return 128; // assume OK if canvas read fails (e.g. CORS tainted canvas)
  }
}

// ── Core validation logic (no global timeout — added by public wrapper) ────────

async function _validate(imageSrc: string, strict: boolean): Promise<FaceValidationResult> {
  // 1. Load the image element
  console.log('[FACEMAX] Loading image...');
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(imageSrc);
    console.log(`[FACEMAX] Image loaded OK: ${img.naturalWidth}×${img.naturalHeight}px`);
  } catch (err) {
    console.warn('[FACEMAX] Image load failed:', err);
    return { valid: false, errorType: 'image_error' };
  }

  // 2. Brightness check (applies to both strict and lenient modes)
  const brightness = measureBrightness(img);
  console.log(`[FACEMAX] Image brightness: ${brightness.toFixed(1)}/255`);
  if (brightness < 22) {
    console.log('[FACEMAX] Image too dark → rejected');
    return { valid: false, errorType: 'too_dark' };
  }

  // Side-profile photos skip face detection (extreme angles confuse the model)
  if (!strict) {
    console.log('[FACEMAX] Side photo — brightness OK, skipping face detection');
    return { valid: true, errorType: null };
  }

  // 3. Load (or reuse cached) detector
  console.log('[FACEMAX] Starting face detection...');
  const detector = await getDetector();
  if (!detector) {
    // CDN unreachable or timed out — fail open so users aren't permanently blocked
    console.warn('[FACEMAX] Detector unavailable — skipping face check (fail-open)');
    return { valid: true, errorType: null };
  }

  // 4. Run detection
  let detections: ReturnType<typeof detector.detect>['detections'];
  try {
    const result = detector.detect(img);
    detections = result.detections;
    console.log(`[FACEMAX] Detection complete: ${detections.length} face(s)`);
  } catch (err) {
    console.warn('[FACEMAX] Detection threw — fail-open:', err);
    return { valid: true, errorType: null };
  }

  // 5. Evaluate results
  if (detections.length === 0) {
    console.log('[FACEMAX] No face found → rejected');
    return { valid: false, errorType: 'no_face' };
  }

  if (detections.length > 1) {
    console.log(`[FACEMAX] Multiple faces (${detections.length}) → rejected`);
    return { valid: false, errorType: 'multiple_faces' };
  }

  const bbox = detections[0].boundingBox;
  if (bbox) {
    const imageArea = img.naturalWidth * img.naturalHeight;
    const faceArea = bbox.width * bbox.height;
    const ratio = faceArea / imageArea;
    console.log(`[FACEMAX] Face-to-image ratio: ${(ratio * 100).toFixed(1)}%`);
    if (ratio < 0.025) {
      console.log('[FACEMAX] Face too small → rejected');
      return { valid: false, errorType: 'face_too_small' };
    }
  }

  console.log('[FACEMAX] Face validation passed ✓');
  return { valid: true, errorType: null };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Validates that the image contains exactly one human face of adequate size.
 * Hard 10-second timeout guards against CDN hangs or model stalls.
 * On timeout or unexpected crash → fail-open (returns valid: true) so the
 * user is never permanently blocked by infrastructure issues.
 *
 * @param imageSrc  blob URL or data URL of the photo
 * @param strict    set false for the side-profile — skips face detection
 */
export async function validateFaceImage(
  imageSrc: string,
  strict = true,
): Promise<FaceValidationResult> {
  try {
    return await withTimeout(_validate(imageSrc, strict), 10_000, 'validateFaceImage');
  } catch (err) {
    // This catch handles the outer timeout — always fail-open so the user
    // can still get an analysis even on slow connections
    console.warn('[FACEMAX] Validation timeout — fail-open:', err);
    return { valid: true, errorType: null };
  }
}
