import { ImageMetrics } from './imageAnalysis';

export interface CategoryResult {
  id: string;
  name: string;
  score: number;
  tip: string;
}

export interface UserProfile {
  gender: 'male' | 'female';
  age: number;
}

export type Archetype = 'Masculine' | 'Aesthetic' | 'Balanced' | 'Prettyboy' | 'Soft Aesthetic' | 'Model-type';

export interface AnalysisResult {
  overallScore: number;
  tier: string;
  archetype: Archetype;
  categories: CategoryResult[];
  appeal: CategoryResult;
  strengths: CategoryResult[];      // score >= 7
  weaknesses: CategoryResult[];     // score < 7
  confidenceScore: number;          // 0–100 photo quality only
  blockingReason: string | null;    // first hard gate triggered
  improvementHints: string[];
  isAgeAdjusted: boolean;
  isGenderAdjusted: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function weighted(pairs: Array<[number, number]>): number {
  const tw = pairs.reduce((s, [, w]) => s + w, 0);
  return pairs.reduce((s, [v, w]) => s + v * w, 0) / tw;
}

/**
 * Calibrated linear mapping. Maps [lo, hi] range to [1, 10].
 * Values below lo → 1, above hi → 10.
 */
function calibrate(v: number, lo: number, hi: number): number {
  return clamp(1 + clamp01((v - lo) / (hi - lo)) * 9);
}

// ─── Tips ─────────────────────────────────────────────────────────────────────

const TIPS: Record<string, [string, string, string, string]> = {
  skin: [
    'Начни использовать ретинол + увлажнение вечером — разница будет за 6–8 недель.',
    'Больше воды, сон 8 часов. Кожа восстанавливается ночью.',
    'Стабильный уход. Добавь SPF 30+ днём — сохранит результат.',
    'Отличная кожа — SPF, увлажнение и постоянство сохранят её надолго.',
  ],
  jaw: [
    'Мьюинг + твёрдая пища (морковь, Mastic Gum). Долго, но работает.',
    'Снижение % жира чётче покажет линию. Меньше соли — меньше отёков.',
    'Линия хорошая — немного снизить % жира сделает её ещё резче.',
    'Чёткая линия — сохраняй питанием и тренировками.',
  ],
  maxilla: [
    'Нос вверх (мьюинг), правильная осанка. Проекция midface — долгосрочная работа.',
    'Снижение % жира поможет проявить среднюю зону. Убрать отёки.',
    'Midface выглядит неплохо. Правильный свет подчёркивает зону.',
    'Хорошая проекция midface — сильная черта. Поддерживай форму.',
  ],
  hunterEyes: [
    'Рельеф вокруг глаз зависит от % жира и правильного угла фото.',
    'Снижение % жира и более глубокий взгляд. Взгляд прямо в камеру.',
    'Зона глаз выглядит выразительно — фотоугол усиливает эффект.',
    'Глубокий выразительный взгляд — сильное первое впечатление.',
  ],
  cheekbones: [
    'Меньше соли и больше калия. Гуаша 5–10 мин/день.',
    'Снижение % жира проявит скулы. Освещение сбоку их подчёркивает.',
    'Скулы неплохие — чуть снизить % жира и будет ещё лучше.',
    'Выраженные скулы — держи низкий % жира.',
  ],
  symmetry: [
    'Небольшая асимметрия — норма для всех людей. Не акцентируй.',
    'Жуй равномерно, следи за осанкой. Результат медленный, но есть.',
    'Симметрия хорошая — незначительные различия почти не заметны.',
    'Высокая симметрия — редкая и сильная черта.',
  ],
  hair: [
    'Подбери стрижку под форму лица — это меняет восприятие больше, чем кажется.',
    'Текстурирующая глина или пудра дадут объём и форму.',
    'Причёска смотрится хорошо. Регулярная стрижка сохраняет форму.',
    'Волосы — часть образа. Правильная стрижка усиливает всё остальное.',
  ],
  puffiness: [
    'Лёгкий дефицит калорий 200–300 ккал/день постепенно проявит черты.',
    'Больше белка, меньше соли и быстрых углеводов. Рельеф станет чётче.',
    'Рельеф неплохой — ещё немного работы сделает черты ещё резче.',
    'Отличный рельеф и определённость черт — поддерживай.',
  ],
  eyeArea: [
    'Сон, увлажнение под глаза, меньше соли. Взгляд станет свежее.',
    'Маски для кожи вокруг глаз + полноценный сон. Зона требует ухода.',
    'Зона глаз выглядит привлекательно. Уход сохранит эффект.',
    'Выразительные глаза — одна из главных черт привлекательности. Сохраняй.',
  ],
  harmony: [
    'Баланс лица — системная работа. Уход за кожей и стиль меняют общее восприятие.',
    'Пропорции в порядке — акцент на уход и правильное освещение усилит их.',
    'Хорошая гармония пропорций. Стиль и уверенность добавят последнее.',
    'Исключительный баланс черт. Такое сочетание встречается редко.',
  ],
  softness: [
    'Увлажнение + здоровый сон придают коже мягкость и свежесть.',
    'Меньше соли и стресса. Мягкость черт улучшается с правильным уходом.',
    'Мягкие черты выглядят привлекательно — поддерживай уход за кожей.',
    'Нежные мягкие черты — женственное и привлекательное сочетание.',
  ],
  profile: [
    'Профиль усиливается правильной осанкой и работой с шеей.',
    'Низкий % жира делает профиль чётче. Мьюинг помогает при долгой практике.',
    'Профиль выглядит гармонично — поддерживай форму.',
    'Сильный профиль — редкая и высоко ценимая черта.',
  ],
};

function pickTip(id: string, score: number): string {
  const pool = TIPS[id] ?? TIPS['harmony'];
  const idx = Math.min(pool.length - 1, Math.floor(clamp01((score - 1) / 9) * pool.length));
  return pool[idx];
}

function appealExplanation(score: number, archetype: Archetype, gender: 'male' | 'female'): string {
  const archetypeLabel = {
    'Masculine':     gender === 'male' ? 'Мужская структура' : 'Сильные черты',
    'Aesthetic':     'Эстетика',
    'Balanced':      'Баланс',
    'Prettyboy':     'Prettyboy',
    'Soft Aesthetic':'Мягкая эстетика',
    'Model-type':    'Модельный тип',
  }[archetype];

  if (score >= 8.5) return `${archetypeLabel} · Исключительный уровень привлекательности. Редкое сочетание структуры и эстетики.`;
  if (score >= 7.5) return `${archetypeLabel} · Высокая привлекательность. Хороший баланс черт — заметно выше среднего.`;
  if (score >= 6.5) return `${archetypeLabel} · Выше среднего. Приятные черты, явный потенциал. Уход и стиль раскроют его.`;
  if (score >= 5.0) return `${archetypeLabel} · Средний уровень. Базовая гармония есть — работа над формой и уходом изменит картину.`;
  return `${archetypeLabel} · Потенциал есть. Снижение % жира, уход и правильный угол фото меняют восприятие.`;
}

// ─── Archetype Detection ───────────────────────────────────────────────────────

function detectArchetype(structuralIdx: number, aestheticIdx: number): Archetype {
  if (structuralIdx >= 0.62 && aestheticIdx >= 0.62) return 'Model-type';
  if (aestheticIdx >= 0.65 && structuralIdx < 0.48)  return 'Aesthetic';
  if (structuralIdx >= 0.62 && aestheticIdx < 0.50)  return 'Masculine';
  // Prettyboy: attractive face, good symmetry/harmony, not hypermasculine structure
  if (aestheticIdx >= 0.58 && structuralIdx >= 0.38 && structuralIdx < 0.60) return 'Prettyboy';
  if (aestheticIdx >= 0.50 && structuralIdx >= 0.43) return 'Balanced';
  return 'Soft Aesthetic';
}

// ─── Main analysis ─────────────────────────────────────────────────────────────

export function generateAnalysis(
  front: ImageMetrics,
  side: ImageMetrics,
  profile: UserProfile,
): AnalysisResult {
  const { gender, age } = profile;
  const isTeen  = age < 16;
  const isYoung = age < 18;

  // ── Confidence = photo quality ONLY (never enters beauty formulas) ──────────
  const rawConf = weighted([
    [front.brightnessQuality, 0.25],
    [front.sharpnessQuality,  0.45],
    [front.contrastQuality,   0.30],
  ]);
  const confidenceScore = Math.round(clamp01(rawConf) * 100);

  // ── Symmetry (calibrated range 0.70–0.97) ────────────────────────────────
  // 0.78 → ~3, 0.84 → ~5.5, 0.90 → ~8, 0.95 → ~9.5
  const symmetryNorm  = clamp01((front.symmetry - 0.70) / 0.27);
  const symmetryScore = calibrate(front.symmetry, 0.70, 0.97);

  // ── Skin — blemish-first model (benefit-of-the-doubt for clean skin) ────────
  //
  // Philosophy:
  //   • Normal clean skin → 6.5–7.5 (not penalised for lighting/texture/noise)
  //   • Visible acne / redness / blemishes → reduces score
  //   • Very smooth / glowing skin → above 8
  //   • Low photo quality → confidence reduced, not beauty score
  //
  // Start at a generous baseline then subtract for detected problems only.
  const skinBase = 7.0;

  // Blemish penalty: 0 blemishes → 0 penalty; 10% blemish ratio → -3; 20% → -5
  const blemishPenalty = clamp01(front.skinBlemishRatio * 3.5) * 5.0;

  // Redness penalty: slight redness is normal; extreme redness = inflammation
  // rednessRatio < 0.15 → no penalty; 0.30+ → -2
  const rednessRaw    = Math.max(0, front.skinRednessRatio - 0.12);
  const rednessPenalty = clamp01(rednessRaw / 0.20) * 2.0;

  // Smoothness bonus: very low local variance = glowing skin (+1.5 max)
  // skinLocalVariance: 0=glass-smooth, 0.25=average, 0.5=rough
  const smoothnessBonus = clamp01(1 - front.skinLocalVariance / 0.30) * 1.5;

  // Uniformity contribution: small positive signal for even tone (max +0.5)
  const uniformityBonus = clamp01((front.skinUniformity - 0.40) / 0.40) * 0.5;

  // If confidence is low: blur/noise may be hiding or faking blemishes.
  // We cap the smoothness bonus so blurry ≠ perfect skin.
  const effectiveSmoothness = confidenceScore < 40
    ? Math.min(smoothnessBonus, 0.3)  // very blurry → no glow bonus
    : smoothnessBonus;

  const rawSkinScore = skinBase - blemishPenalty - rednessPenalty + effectiveSmoothness + uniformityBonus;
  const skinScore = clamp(rawSkinScore, 1, 10);

  // ── Facial Definition (computed before jaw/cheekbones — used as floor) ────
  //
  // Rationale: a lean/angular/model face has high edge density EVERYWHERE.
  // Ratio-only metrics miss this: jaw/mid ratio stays ~1 even on a sharp face
  // because both are high. The definition index captures this "all edges sharp"
  // signal and prevents puffiness/photo-angle from tanking structural scores.
  //
  const frontEdgeAvg   = (front.lowerEdgeDensity + front.midEdgeDensity + front.lateralEdgeScore) / 3;
  const sideEdgeAvg    = (side.lowerEdgeDensity  + side.midEdgeDensity  + side.lateralEdgeScore)  / 3;
  const overallEdgeAvg = frontEdgeAvg * 0.55 + sideEdgeAvg * 0.45;
  // puffinessNorm computed here (needed as floor for jaw/cheekbones below)
  const puffinessNorm = clamp01((front.lowerEdgeDensity + front.midEdgeDensity) / 2);
  // facialDefinitionIdx: 0 = soft/puffy/undefined, 1 = lean/angular/model
  const facialDefinitionIdx = clamp01(
    overallEdgeAvg * 0.45 +
    puffinessNorm  * 0.35 +
    symmetryNorm   * 0.20
  );

  // ── Jaw ───────────────────────────────────────────────────────────────────
  // Primary: ratio jaw/midface (defined jaw stands out from midface)
  // Secondary: absolute lower-edge density (lean face overall = defined jaw)
  // Floor: if facialDefinitionIdx is high, jaw is defined by definition.
  const frontJawRatio = front.lowerEdgeDensity / Math.max(front.midEdgeDensity, 0.01);
  const sideJawRatio  = side.lowerEdgeDensity  / Math.max(side.midEdgeDensity,  0.01);
  const jawRatioAvg   = (frontJawRatio * 0.45 + sideJawRatio * 0.55);
  // Ratio norm (0.55–1.40 range)
  const jawRatioNorm = clamp01((jawRatioAvg - 0.55) / 0.85);
  // Absolute norm: captures defined jaw even when ALL edges are sharp (lean face)
  const jawAbsoluteNorm = clamp01(
    (front.lowerEdgeDensity * 0.5 + side.lowerEdgeDensity * 0.5 - 0.20) / 0.35
  );
  // Take the stronger signal
  let jawNorm = Math.max(jawRatioNorm, jawAbsoluteNorm * 0.82);
  // Definition floor: lean/angular face → jaw cannot be "weak"
  // facialDefinitionIdx > 0.58 → floor at 0.72 = ~7.5/10 on calibrate(0,1)
  // facialDefinitionIdx > 0.48 → floor at 0.56 = ~6.0/10
  if (facialDefinitionIdx > 0.58)      jawNorm = Math.max(jawNorm, 0.72);
  else if (facialDefinitionIdx > 0.48) jawNorm = Math.max(jawNorm, 0.56);
  // Teen/young: jaw still developing → soften penalty
  if (isTeen)       jawNorm = jawNorm + (0.45 - jawNorm) * 0.40;
  else if (isYoung) jawNorm = jawNorm + (0.45 - jawNorm) * 0.20;
  let jawScore = calibrate(jawNorm, 0, 1);

  // ── Maxilla / Midface (ratio-based: midfaceToLowerRatio from front + side) ─
  // midfaceToLowerRatio: 0 = weak midface, 1 = midface equals lower face
  // Side profile adds separate signal
  const frontMaxilla = front.midfaceToLowerRatio;   // 0–1
  const sideMaxilla  = side.midfaceToLowerRatio;    // 0–1
  let maxillaNorm = clamp01(frontMaxilla * 0.55 + sideMaxilla * 0.45);
  if (isTeen)       maxillaNorm = maxillaNorm + (0.45 - maxillaNorm) * 0.30;
  else if (isYoung) maxillaNorm = maxillaNorm + (0.45 - maxillaNorm) * 0.15;
  // Wider calibration range makes the full 1–10 span actually usable.
  // Without the wider range, any ratio ≥ 0.7 trivially scored 8–10.
  // Typical values: weak ≈0.25→4-5, average ≈0.45→6-7, good ≈0.60→7-8.
  let maxillaScore = calibrate(maxillaNorm, 0.12, 0.95);
  // Non-linear compression above 7.5: score 9–10 requires genuinely exceptional
  // combined evidence from both views + facial definition. Prevents auto-10.
  if (maxillaScore > 7.5) {
    const excess = maxillaScore - 7.5;
    const exceptionEvidence = frontMaxilla * 0.50 + sideMaxilla * 0.35 + facialDefinitionIdx * 0.15;
    const compressionFactor =
      exceptionEvidence > 0.88 ? 0.80   // truly exceptional → 9–9.5 range
    : exceptionEvidence > 0.80 ? 0.60   // very good         → 8.5 range
    : exceptionEvidence > 0.70 ? 0.40   // good              → ~8.0
    : 0.25;                              // average evidence  → compressed to ~7.8
    maxillaScore = clamp(7.5 + excess * compressionFactor);
  }

  // ── Hunter Eyes (ratio: upper eye region vs mid-face) ─────────────────────
  // eyeUpperEdgeScore / midEdgeDensity: higher = more prominent brow ridge / deeper orbital
  // Typical ratio: 0.5 (flat) → 1.8 (deep-set, strong brow)
  const eyeUpperToMid = front.eyeUpperEdgeScore / Math.max(front.midEdgeDensity, 0.02);
  // Also consider overall eye region definition
  const eyeRegionNorm = front.eyeRegionScore;
  const hunterRaw = clamp01(
    eyeUpperToMid * 0.55 + eyeRegionNorm * 0.30 + symmetryNorm * 0.15
  );
  // Map ratio 0.5→2.0 to 0→1
  const hunterRatioNorm = clamp01((eyeUpperToMid - 0.45) / 1.20);
  const hunterEyesNorm = hunterRaw * 0.40 + hunterRatioNorm * 0.60;
  const hunterEyesScore = calibrate(hunterEyesNorm, 0.15, 0.85);

  // ── Eye Area (female-primary) ─────────────────────────────────────────────
  // For females, eye area = quality + expressiveness; uses different emphasis
  const eyeAreaNorm  = clamp01(front.eyeRegionScore * 0.50 + front.eyeUpperEdgeScore * 0.30 + symmetryNorm * 0.20);
  const eyeAreaScore = calibrate(eyeAreaNorm, 0.15, 0.80);

  // ── Cheekbones ────────────────────────────────────────────────────────────
  // Primary: lateral edge ratio vs midface (sharp cheekbones project laterally)
  // Secondary: absolute lateral edge density (lean face = visible cheekbones)
  // Floor: high facialDefinitionIdx → cheekbones visible by definition
  const cheekLateralRatio = front.lateralEdgeScore / Math.max(front.midEdgeDensity, 0.02);
  const sideLateralRatio  = side.lateralEdgeScore  / Math.max(side.midEdgeDensity,  0.02);
  const cheekRatioAvg = cheekLateralRatio * 0.60 + sideLateralRatio * 0.40;
  // Ratio norm (0.40–1.40 range)
  const cheekRatioNorm = clamp01((cheekRatioAvg - 0.40) / 1.00);
  // Absolute norm: lean face → lateral edges present regardless of ratio
  const cheekAbsoluteNorm = clamp01(
    (front.lateralEdgeScore * 0.60 + side.lateralEdgeScore * 0.40 - 0.18) / 0.32
  );
  let cheekNorm = Math.max(cheekRatioNorm, cheekAbsoluteNorm * 0.82);
  // No facialDefinitionIdx floor here: a lean/angular face is not the same as
  // having visible hollow cheeks or cheekbone shadow. The lateral/mid ratio
  // already captures the differential signal. Floors were inflating average faces.
  let cheekScore = calibrate(cheekNorm, 0.10, 0.90);

  // ── Jaw / Cheekbones mutual reinforcement ─────────────────────────────────
  // When both are strong, they confirm each other (angular, model-like face).
  // Small mutual boost — cannot manufacture Chad alone, max +0.4 pts each.
  if (jawScore >= 7.5 && cheekScore >= 7.5) {
    const mutualBoost = Math.min(0.4, (jawScore + cheekScore - 15.0) * 0.12);
    jawScore   = Math.min(10, jawScore   + mutualBoost);
    cheekScore = Math.min(10, cheekScore + mutualBoost);
  }

  // ── Hair (top region — less critical, kept simple) ────────────────────────
  const hairScore = calibrate(front.topRegionScore, 0.25, 0.88);

  // ── Puffiness / Facial definition ────────────────────────────────────────
  // puffinessNorm already computed above (used as jaw/cheekbone floor).
  // facialDefinitionIdx feeds into it — defined face = high puffiness score.
  const puffinessScore = calibrate(puffinessNorm, 0.15, 0.70);

  // ── Harmony (symmetry + facial balance) ──────────────────────────────────
  // No photo quality input. Uses skin uniformity and symmetry.
  const harmonyNorm  = clamp01(symmetryNorm * 0.45 + front.skinUniformity * 0.30 + (front.midfaceToLowerRatio * 0.25));
  const harmonyScore = calibrate(harmonyNorm, 0.20, 0.85);

  // ── Softness (female: smooth, gentle features) ────────────────────────────
  // High skin uniformity + low harsh-edge ratio
  const softnessNorm  = clamp01(front.skinUniformity * 0.55 + (1 - front.midEdgeDensity) * 0.30 + (1 - front.lowerEdgeDensity) * 0.15);
  const softnessScore = calibrate(softnessNorm, 0.25, 0.85);

  // ── Profile score (for tier gates — side image quality independent) ────────
  const profileNorm  = clamp01(sideMaxilla * 0.50 + sideJawRatio * 0.30 + side.symmetry * 0.20);
  const profileScore = calibrate(profileNorm, 0.20, 0.90);

  // ── Structural Index (0–1) ────────────────────────────────────────────────
  // facialDefinitionIdx included as a small weight — lean/angular faces are
  // structurally strong even if individual ratios are close (both high).
  let structuralIdx: number;
  if (gender === 'male') {
    structuralIdx = weighted([
      [jawNorm,              0.28],
      [maxillaNorm,          0.23],
      [cheekNorm,            0.23],
      [hunterEyesNorm,       0.18],
      [facialDefinitionIdx,  0.08],
    ]);
  } else {
    structuralIdx = weighted([
      [maxillaNorm,          0.32],
      [cheekNorm,            0.32],
      [jawNorm,              0.14],
      [hunterEyesNorm,       0.14],
      [facialDefinitionIdx,  0.08],
    ]);
  }

  // ── Consistency: strong structural index → floor jaw & cheekbone scores ───
  // Prevents contradiction: "strong facial structure" archetype + weak jaw/cheekbones.
  // If the combined structural index is clearly high, individual scores follow.
  if (structuralIdx > 0.60) {
    jawScore   = Math.max(jawScore,   7.5);
    cheekScore = Math.max(cheekScore, 7.5);
  } else if (structuralIdx > 0.50) {
    jawScore   = Math.max(jawScore,   7.0);
    cheekScore = Math.max(cheekScore, 7.0);
  } else if (structuralIdx > 0.42) {
    jawScore   = Math.max(jawScore,   6.0);
    cheekScore = Math.max(cheekScore, 6.0);
  }

  // ── Consistency: maxilla score ↔ structural support ───────────────────────
  // A high maxilla score without supporting structural evidence is contradictory.
  // e.g. "Maxilla 9.5 / Cheekbones 4.0" — doesn't make anatomical sense.
  // Cap maxilla if the broader structural index doesn't support it.
  if (maxillaScore > 9.0 && structuralIdx < 0.55) maxillaScore = Math.min(maxillaScore, 8.5);
  if (maxillaScore > 8.5 && structuralIdx < 0.45) maxillaScore = Math.min(maxillaScore, 7.8);
  if (maxillaScore > 7.8 && structuralIdx < 0.35) maxillaScore = Math.min(maxillaScore, 7.2);
  // Symmetric floor: if maxilla is very high it implies decent structural index,
  // so jaw/cheekbones can't be extremely weak (no "Maxilla 9 + Jaw 3" scenario).
  if (maxillaScore >= 8.5) {
    jawScore   = Math.max(jawScore,   6.5);
    cheekScore = Math.max(cheekScore, 6.5);
  } else if (maxillaScore >= 7.5) {
    jawScore   = Math.max(jawScore,   5.5);
    cheekScore = Math.max(cheekScore, 5.5);
  }

  // ── Aesthetic Index (0–1) ─────────────────────────────────────────────────
  const aestheticIdx = weighted([
    [symmetryNorm,              0.35],
    [front.skinUniformity,      0.25],
    [eyeAreaNorm,               0.25],
    [front.midfaceToLowerRatio, 0.15],
  ]);

  // ── Archetype ─────────────────────────────────────────────────────────────
  const archetype = detectArchetype(structuralIdx, aestheticIdx);

  // ── Appeal — both structural and aesthetic combine, archetype steers weight ─
  // IMPORTANT: no photo quality here
  let appealNorm: number;
  if (gender === 'female') {
    // Female: aesthetic heavily dominant
    appealNorm = weighted([
      [aestheticIdx,    0.45],
      [eyeAreaNorm,     0.25],
      [structuralIdx,   0.15],
      [harmonyNorm,     0.15],
    ]);
  } else {
    // Male: archetype-dependent blending
    const structW = archetype === 'Aesthetic' || archetype === 'Soft Aesthetic' ? 0.20
                  : archetype === 'Masculine' ? 0.35
                  : 0.28;
    const aesthetW = 1 - structW - 0.15;
    appealNorm = weighted([
      [aestheticIdx,  aesthetW],
      [structuralIdx, structW],
      [eyeAreaNorm,   0.15],
    ]);
  }

  // Archetype bonus: aesthetic/model faces get a small appeal lift if harmony is high
  // (compensates for non-hypermasculine jaw — but capped so it can't make average → Chad)
  let archetypeBonus = 0;
  if ((archetype === 'Aesthetic' || archetype === 'Model-type') && aestheticIdx > 0.60) {
    archetypeBonus = Math.min(0.06, (aestheticIdx - 0.60) * 0.30); // max +0.06
  }

  // Cheekbone boost: visible cheekbone definition slightly enhances appeal
  let cheekBoneBoost = 0;
  if (confidenceScore >= 40 && cheekNorm > 0.55 && harmonyNorm > 0.38) {
    const isAestheticArchetype = archetype === 'Aesthetic' || archetype === 'Model-type' || archetype === 'Soft Aesthetic';
    const multiplier = isAestheticArchetype ? 0.22 : 0.14;
    cheekBoneBoost = Math.min(0.04, (cheekNorm - 0.55) * multiplier);
  }

  // Facial Definition boost: lean/angular/sharp face gets a modest appeal lift.
  // Models with strong facial definition (low fat, sharp features everywhere) look
  // more attractive — this is a well-documented effect in aesthetics research.
  // Cap: +0.07 — meaningful but cannot manufacture a Chad without other factors.
  let facialDefinitionBoost = 0;
  if (facialDefinitionIdx > 0.55) {
    const defStrength = (facialDefinitionIdx - 0.55) / 0.45;
    // Structural archetypes (Masculine/Model-type) benefit more from facial definition
    const isStructuralArchetype = archetype === 'Masculine' || archetype === 'Model-type';
    const cap = isStructuralArchetype ? 0.07 : 0.05;
    facialDefinitionBoost = Math.min(cap, defStrength * 0.12);
  }

  const appealNormFinal = clamp01(appealNorm + archetypeBonus + cheekBoneBoost + facialDefinitionBoost);
  const appealScore = calibrate(appealNormFinal, 0.15, 0.92);

  // ── Build categories ──────────────────────────────────────────────────────
  let categories: CategoryResult[];

  if (gender === 'male') {
    categories = [
      { id: 'symmetry',   name: 'Симметрия',        score: +symmetryScore.toFixed(1),    tip: pickTip('symmetry',   symmetryScore) },
      { id: 'jaw',        name: 'Челюсть',           score: +jawScore.toFixed(1),         tip: pickTip('jaw',        jawScore) },
      { id: 'maxilla',    name: 'Maxilla / Midface', score: +maxillaScore.toFixed(1),     tip: pickTip('maxilla',    maxillaScore) },
      { id: 'hunterEyes', name: 'Hunter Eyes',       score: +hunterEyesScore.toFixed(1),  tip: pickTip('hunterEyes', hunterEyesScore) },
      { id: 'cheekbones', name: 'Скулы',             score: +cheekScore.toFixed(1),       tip: pickTip('cheekbones', cheekScore) },
      { id: 'skin',       name: 'Кожа',              score: +skinScore.toFixed(1),        tip: pickTip('skin',       skinScore) },
      { id: 'profile',    name: 'Профиль',           score: +profileScore.toFixed(1),     tip: pickTip('profile',    profileScore) },
      { id: 'puffiness',  name: 'Рельеф лица',       score: +puffinessScore.toFixed(1),   tip: pickTip('puffiness',  puffinessScore) },
    ];
  } else {
    categories = [
      { id: 'symmetry',   name: 'Симметрия',         score: +symmetryScore.toFixed(1),    tip: pickTip('symmetry',   symmetryScore) },
      { id: 'eyeArea',    name: 'Зона глаз',         score: +eyeAreaScore.toFixed(1),     tip: pickTip('eyeArea',    eyeAreaScore) },
      { id: 'harmony',    name: 'Гармония',          score: +harmonyScore.toFixed(1),     tip: pickTip('harmony',    harmonyScore) },
      { id: 'cheekbones', name: 'Скулы',             score: +cheekScore.toFixed(1),       tip: pickTip('cheekbones', cheekScore) },
      { id: 'skin',       name: 'Кожа',              score: +skinScore.toFixed(1),        tip: pickTip('skin',       skinScore) },
      { id: 'softness',   name: 'Мягкость черт',     score: +softnessScore.toFixed(1),    tip: pickTip('softness',   softnessScore) },
      { id: 'profile',    name: 'Профиль',           score: +profileScore.toFixed(1),     tip: pickTip('profile',    profileScore) },
      { id: 'puffiness',  name: 'Рельеф лица',       score: +puffinessScore.toFixed(1),   tip: pickTip('puffiness',  puffinessScore) },
    ];
  }

  // ── Overall score ─────────────────────────────────────────────────────────
  let rawOverall: number;
  if (gender === 'female') {
    rawOverall = weighted([
      [appealScore,    0.35],
      [eyeAreaScore,   0.15],
      [symmetryScore,  0.15],
      [harmonyScore,   0.12],
      [skinScore,      0.10],
      [softnessScore,  0.08],
      [profileScore,   0.05],
    ]);
  } else {
    const isAesthetic = archetype === 'Aesthetic' || archetype === 'Soft Aesthetic';
    rawOverall = isAesthetic
      ? weighted([
          [appealScore,      0.38],
          [symmetryScore,    0.18],
          [maxillaScore,     0.10],
          [hunterEyesScore,  0.10],
          [cheekScore,       0.10],
          [skinScore,        0.08],
          [jawScore,         0.06],
        ])
      : weighted([
          [appealScore,      0.30],
          [symmetryScore,    0.18],
          [jawScore,         0.12],
          [maxillaScore,     0.12],
          [hunterEyesScore,  0.10],
          [cheekScore,       0.08],
          [skinScore,        0.06],
          [profileScore,     0.04],
        ]);
  }

  // ── Hard caps (tier gates — photo quality never applies here) ──────────────
  let cappedOverall = rawOverall;
  let blockingReason: string | null = null;

  const cap = (max: number, reason: string) => {
    if (cappedOverall > max) {
      cappedOverall = max;
      if (!blockingReason) blockingReason = reason;
    }
  };

  // Age caps
  if (isTeen)              cap(8.0, `Для возраста ${age} лет оценка скорректирована (лицо ещё формируется)`);
  if (isYoung && !isTeen)  cap(8.5, `Для возраста ${age} лет применён возрастной коэффициент`);

  // ── Chadlite gate: appeal≥7, symmetry≥6.5, 4+ params above 7 ──────────────
  if (cappedOverall > 6.9) {
    const p7 = categories.filter(c => c.score >= 7.0).length;
    if (appealScore < 7.0)
      cap(6.9, `APPEAL (${appealScore.toFixed(1)}/10) — для Chadlite нужен ≥ 7.0`);
    if (symmetryScore < 6.5)
      cap(6.9, `Симметрия (${symmetryScore.toFixed(1)}/10) — для Chadlite нужна ≥ 6.5`);
    if (p7 < 4)
      cap(6.9, `Параметров выше 7.0: ${p7} — для Chadlite нужно минимум 4`);
  }

  // ── Chad gate (was Chad Light): appeal≥7.8, symmetry≥7.2, profile≥7, 5+ params above 7.5 ──
  if (cappedOverall > 7.8) {
    const p75 = categories.filter(c => c.score >= 7.5).length;
    if (appealScore < 7.8)
      cap(7.8, `APPEAL (${appealScore.toFixed(1)}/10) — для Chad нужен ≥ 7.8`);
    if (symmetryScore < 7.2)
      cap(7.8, `Симметрия (${symmetryScore.toFixed(1)}/10) — для Chad нужна ≥ 7.2`);
    if (profileScore < 7.0)
      cap(7.8, `Профиль (${profileScore.toFixed(1)}/10) — для Chad нужен ≥ 7.0`);
    if (p75 < 5)
      cap(7.8, `Параметров выше 7.5: ${p75} — для Chad нужно минимум 5`);
  }

  // ── True Adam gate: near-impossible. appeal≥9, symmetry≥8.5, profile≥8.5, 7+ params above 8.5 ──
  if (cappedOverall > 8.8) {
    const p85 = categories.filter(c => c.score >= 8.5).length;
    if (appealScore < 9.0)
      cap(8.8, `APPEAL (${appealScore.toFixed(1)}/10) — для True Adam нужен ≥ 9.0`);
    if (symmetryScore < 8.5)
      cap(8.8, `Симметрия (${symmetryScore.toFixed(1)}/10) — для True Adam нужна ≥ 8.5`);
    if (profileScore < 8.5)
      cap(8.8, `Профиль (${profileScore.toFixed(1)}/10) — для True Adam нужен ≥ 8.5`);
    if (p85 < 7)
      cap(8.8, `Параметров выше 8.5: ${p85} — для True Adam нужно минимум 7`);
    if (confidenceScore < 80)
      cap(8.8, `Уверенность анализа (${confidenceScore}%) — для True Adam нужна ≥ 80%`);
  }

  const overallScore = Number(clamp(cappedOverall, 1, 10).toFixed(1));

  // ── Tier ──────────────────────────────────────────────────────────────────
  let tier: string;
  if (overallScore <= 4.9)      tier = 'Sub5';
  else if (overallScore <= 5.9) tier = 'LTN';
  else if (overallScore <= 6.9) tier = 'HTN';
  else if (overallScore <= 7.8) tier = 'Chadlite';
  else if (overallScore <= 8.8) tier = 'Chad';
  else                          tier = 'True Adam';

  // ── Improvement Hints ─────────────────────────────────────────────────────
  const improvementHints: string[] = [];
  if (tier !== 'True Adam') {
    if (['Sub5', 'LTN', 'HTN'].includes(tier)) {
      if (appealScore < 7.0)   improvementHints.push(`APPEAL ${appealScore.toFixed(1)} → нужен ≥ 7.0 для Chadlite`);
      if (symmetryScore < 6.5) improvementHints.push(`Симметрия ${symmetryScore.toFixed(1)} → нужна ≥ 6.5`);
      const p7 = categories.filter(c => c.score >= 7.0).length;
      if (p7 < 4) improvementHints.push(`Параметров ≥ 7.0 : ${p7} из 4 нужных — поработай над рельефом и кожей`);
    }
    if (tier === 'Chadlite') {
      if (appealScore < 7.8)   improvementHints.push(`APPEAL ${appealScore.toFixed(1)} → нужен ≥ 7.8 для Chad`);
      if (symmetryScore < 7.2) improvementHints.push(`Симметрия ${symmetryScore.toFixed(1)} → нужна ≥ 7.2`);
      if (profileScore < 7.0)  improvementHints.push(`Профиль ${profileScore.toFixed(1)} → нужен ≥ 7.0 (осанка, шея)`);
      const p75 = categories.filter(c => c.score >= 7.5).length;
      if (p75 < 5) improvementHints.push(`Параметров ≥ 7.5 : ${p75} из 5 нужных`);
    }
    if (tier === 'Chad') {
      if (appealScore < 9.0)    improvementHints.push(`APPEAL ${appealScore.toFixed(1)} → нужен ≥ 9.0 для True Adam`);
      if (symmetryScore < 8.5)  improvementHints.push(`Симметрия ${symmetryScore.toFixed(1)} → нужна ≥ 8.5`);
      if (profileScore < 8.5)   improvementHints.push(`Профиль ${profileScore.toFixed(1)} → нужен ≥ 8.5`);
      if (confidenceScore < 80) improvementHints.push(`Качество фото (${confidenceScore}%) — нужно ≥ 80% для True Adam`);
    }
    if (improvementHints.length === 0) {
      improvementHints.push('Ключевые параметры уже высокие — дальнейший рост зависит от генетики и угла фото');
    }
  }

  // ── Strengths & Weaknesses (score ≥ 7 / < 7) ──────────────────────────────
  const allScored: CategoryResult[] = [
    ...categories,
    { id: 'appeal', name: 'APPEAL', score: +appealScore.toFixed(1), tip: '' },
  ];
  const strengths  = allScored.filter(c => c.score >= 7.0).sort((a, b) => b.score - a.score);
  const weaknesses = categories.filter(c => c.score < 7.0).sort((a, b) => a.score - b.score);

  const appealCat: CategoryResult = {
    id:    'appeal',
    name:  'APPEAL',
    score: +appealScore.toFixed(1),
    tip:   appealExplanation(appealScore, archetype, gender),
  };

  return {
    overallScore,
    tier,
    archetype,
    categories,
    appeal: appealCat,
    strengths,
    weaknesses,
    confidenceScore,
    blockingReason,
    improvementHints,
    isAgeAdjusted:    isTeen || isYoung,
    isGenderAdjusted: true,
  };
}
