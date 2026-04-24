import type { GazeScoreInput, GazeScoreResult } from '../types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const average = (values: number[]) => (
  values.reduce((sum, value) => sum + value, 0) / values.length
);

export const scoreGaze = (
  input: GazeScoreInput,
  sensitivity: number,
): GazeScoreResult => {
  if (!input.hasFace) {
    return { score: 0, isCandidate: false };
  }

  const normalizedSensitivity = clamp01((sensitivity - 0.1) / 0.8);
  const eyeTolerance = 0.34 - normalizedSensitivity * 0.16;
  const headTolerance = 0.42 - normalizedSensitivity * 0.22;
  const threshold = 0.62 + normalizedSensitivity * 0.18;

  const eyeDrift = average([
    input.eyeLookOutLeft,
    input.eyeLookOutRight,
    input.eyeLookInLeft,
    input.eyeLookInRight,
    input.eyeLookUpLeft,
    input.eyeLookUpRight,
    input.eyeLookDownLeft,
    input.eyeLookDownRight,
  ]);

  const headDrift = average([
    Math.abs(input.headYaw),
    Math.abs(input.headPitch),
    Math.abs(input.headRoll),
  ]);

  const eyeScore = 1 - clamp01(eyeDrift / eyeTolerance);
  const headScore = 1 - clamp01(headDrift / headTolerance);
  const score = clamp01(eyeScore * 0.62 + headScore * 0.38);

  return {
    score,
    isCandidate: score >= threshold,
  };
};
