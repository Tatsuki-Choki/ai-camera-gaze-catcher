import { describe, expect, it } from 'vitest';
import { scoreGaze } from './gazeScoring';
import type { GazeScoreInput } from '../types';

const centeredInput: GazeScoreInput = {
  hasFace: true,
  eyeLookOutLeft: 0.02,
  eyeLookOutRight: 0.02,
  eyeLookInLeft: 0.02,
  eyeLookInRight: 0.02,
  eyeLookUpLeft: 0.01,
  eyeLookUpRight: 0.01,
  eyeLookDownLeft: 0.01,
  eyeLookDownRight: 0.01,
  headYaw: 0.02,
  headPitch: 0.01,
  headRoll: 0.01,
};

describe('scoreGaze', () => {
  it('正面視線を高スコア候補として扱う', () => {
    const result = scoreGaze(centeredInput, 0.25);

    expect(result.score).toBeGreaterThan(0.85);
    expect(result.isCandidate).toBe(true);
  });

  it('顔がない場合は候補にしない', () => {
    const result = scoreGaze({ ...centeredInput, hasFace: false }, 0.25);

    expect(result.score).toBe(0);
    expect(result.isCandidate).toBe(false);
  });

  it('横向きや視線ずれが強い場合は低スコアにする', () => {
    const result = scoreGaze({
      ...centeredInput,
      eyeLookOutLeft: 0.7,
      eyeLookOutRight: 0.7,
      headYaw: 0.8,
    }, 0.25);

    expect(result.score).toBeLessThan(0.5);
    expect(result.isCandidate).toBe(false);
  });

  it('感度を上げると候補判定が厳しくなる', () => {
    const borderline: GazeScoreInput = {
      ...centeredInput,
      eyeLookDownLeft: 0.22,
      eyeLookDownRight: 0.22,
      headPitch: 0.2,
    };

    expect(scoreGaze(borderline, 0.1).isCandidate).toBe(true);
    expect(scoreGaze(borderline, 0.9).isCandidate).toBe(false);
  });
});
