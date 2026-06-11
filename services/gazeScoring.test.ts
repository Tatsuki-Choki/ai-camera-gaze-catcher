import { describe, expect, it } from 'vitest';
import { scoreGaze } from './gazeScoring';
import type { GazeFrameFeatures } from '../types';

const centeredInput: GazeFrameFeatures = {
  hasFace: true,
  eyeLookOutLeft: 0.02,
  eyeLookOutRight: 0.02,
  eyeLookInLeft: 0.02,
  eyeLookInRight: 0.02,
  eyeLookUpLeft: 0.01,
  eyeLookUpRight: 0.01,
  eyeLookDownLeft: 0.01,
  eyeLookDownRight: 0.01,
  eyeBlinkLeft: 0.05,
  eyeBlinkRight: 0.05,
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
      eyeLookInRight: 0.7,
      headYaw: 0.8,
    }, 0.25);

    expect(result.score).toBeLessThan(0.5);
    expect(result.isCandidate).toBe(false);
  });

  it('左右の目が同じ方向を向く自然な視線ずれを検出する', () => {
    // 左を見る: 左目がout、右目がin
    const lookingLeft = scoreGaze({
      ...centeredInput,
      eyeLookOutLeft: 0.45,
      eyeLookInRight: 0.45,
    }, 0.25);

    expect(lookingLeft.isCandidate).toBe(false);
  });

  it('まばたき中のフレームを候補から外す', () => {
    const blinking = scoreGaze({
      ...centeredInput,
      eyeBlinkLeft: 0.8,
      eyeBlinkRight: 0.75,
    }, 0.25);

    expect(blinking.score).toBe(0);
    expect(blinking.isCandidate).toBe(false);
  });

  it('半目状態はスコアを減衰させる', () => {
    const halfBlink = scoreGaze({
      ...centeredInput,
      eyeBlinkLeft: 0.45,
      eyeBlinkRight: 0.45,
    }, 0.25);
    const open = scoreGaze(centeredInput, 0.25);

    expect(halfBlink.score).toBeLessThan(open.score);
    expect(halfBlink.score).toBeGreaterThan(0);
  });

  it('首をかしげただけならカメラ目線として許容する', () => {
    const tilted = scoreGaze({ ...centeredInput, headRoll: 0.3 }, 0.25);

    expect(tilted.isCandidate).toBe(true);
  });

  it('感度を上げると候補判定が厳しくなる', () => {
    const borderline: GazeFrameFeatures = {
      ...centeredInput,
      eyeLookDownLeft: 0.18,
      eyeLookDownRight: 0.18,
      headPitch: 0.2,
    };

    expect(scoreGaze(borderline, 0.1).isCandidate).toBe(true);
    expect(scoreGaze(borderline, 0.9).isCandidate).toBe(false);
  });
});
