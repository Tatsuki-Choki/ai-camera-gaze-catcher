import type { GazeFrameFeatures, GazeScoreResult } from '../types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// 被写体が左を向くと eyeLookOutLeft / eyeLookInRight が同時に上がるため、
// 8値の単純平均では信号が薄まる。左右ペア・上下ペアの差分で方向ベクトル化する。
const eyeDeviation = (input: GazeFrameFeatures): number => {
  const horizontal =
    (input.eyeLookOutLeft + input.eyeLookInRight) / 2 -
    (input.eyeLookInLeft + input.eyeLookOutRight) / 2;
  const vertical =
    (input.eyeLookUpLeft + input.eyeLookUpRight) / 2 -
    (input.eyeLookDownLeft + input.eyeLookDownRight) / 2;
  return Math.hypot(horizontal, vertical);
};

// 首をかしげていてもカメラ目線は成立するので roll の重みは低くする。
const headDeviation = (input: GazeFrameFeatures): number => Math.hypot(
  input.headYaw,
  input.headPitch,
  input.headRoll * 0.25,
);

// 目を閉じかけたフレームを候補から外す。0.35 までは無害、0.6 で完全に除外。
const blinkFactor = (input: GazeFrameFeatures): number => {
  const blink = Math.max(input.eyeBlinkLeft, input.eyeBlinkRight);
  if (blink <= 0.35) {
    return 1;
  }
  if (blink >= 0.6) {
    return 0;
  }
  return 1 - (blink - 0.35) / 0.25;
};

export const candidateThreshold = (sensitivity: number): number => {
  const normalizedSensitivity = clamp01((sensitivity - 0.1) / 0.8);
  return 0.55 + normalizedSensitivity * 0.25;
};

export const scoreGaze = (
  input: GazeFrameFeatures,
  sensitivity: number,
): GazeScoreResult => {
  const normalizedSensitivity = clamp01((sensitivity - 0.1) / 0.8);
  const threshold = candidateThreshold(sensitivity);

  if (!input.hasFace) {
    return { score: 0, isCandidate: false };
  }

  const eyeTolerance = 0.38 - normalizedSensitivity * 0.2;
  const headTolerance = 0.5 - normalizedSensitivity * 0.26;

  const eyeScore = 1 - clamp01(eyeDeviation(input) / eyeTolerance);
  const headScore = 1 - clamp01(headDeviation(input) / headTolerance);
  const score = clamp01(eyeScore * 0.6 + headScore * 0.4) * blinkFactor(input);

  return {
    score,
    isCandidate: score >= threshold,
  };
};
