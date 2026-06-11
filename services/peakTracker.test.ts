import { describe, expect, it } from 'vitest';
import { PeakTracker, type PeakCandidate } from './peakTracker';

const defaultOptions = {
  enterThreshold: 0.7,
  exitThreshold: 0.62,
  closeDelaySeconds: 0.4,
  minGapSeconds: 1.2,
  sharpnessWeight: 0.15,
};

const runTimeline = (
  tracker: PeakTracker,
  samples: Array<[time: number, score: number, sharpness?: number]>,
) => {
  const candidates: PeakCandidate[] = [];
  const bestTimes: number[] = [];
  for (const [time, score, sharpness = 0.5] of samples) {
    const result = tracker.push({ time, score, sharpness });
    if (result.becameBest) {
      bestTimes.push(time);
    }
    if (result.completed) {
      candidates.push(result.completed);
    }
  }
  const flushed = tracker.flush();
  if (flushed) {
    candidates.push(flushed);
  }
  return { candidates, bestTimes };
};

describe('PeakTracker', () => {
  it('ピーク領域から最高スコアの1フレームだけを候補にする', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.1],
      [0.5, 0.75],
      [1.0, 0.9],
      [1.5, 0.8],
      [2.0, 0.2],
      [2.5, 0.2],
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].time).toBe(1.0);
    expect(candidates[0].score).toBe(0.9);
  });

  it('閾値未満のままなら候補を出さない', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0, 0.3],
      [1, 0.5],
      [2, 0.6],
    ]);

    expect(candidates).toHaveLength(0);
  });

  it('離れた2つのピークをそれぞれ候補にする', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.85],
      [0.5, 0.1],
      [1.0, 0.1],
      [5.0, 0.9],
      [5.5, 0.1],
      [6.0, 0.1],
    ]);

    expect(candidates).toHaveLength(2);
    expect(candidates[0].time).toBe(0.0);
    expect(candidates[1].time).toBe(5.0);
  });

  it('近接ピークはより良い方で置き換える', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.75],
      [0.5, 0.1],
      [1.0, 0.1],
      [1.1, 0.95],
      [1.6, 0.1],
      [2.1, 0.1],
    ]);

    expect(candidates).toHaveLength(2);
    expect(candidates[1].replacesPrevious).toBe(true);
    expect(candidates[1].time).toBe(1.1);
  });

  it('近接ピークが劣る場合は出力しない', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.95],
      [0.5, 0.1],
      [1.0, 0.1],
      [1.1, 0.72],
      [1.6, 0.1],
      [2.1, 0.1],
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].time).toBe(0.0);
  });

  it('同スコアならシャープな方を選ぶ', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.8, 0.2],
      [0.2, 0.8, 0.9],
      [0.4, 0.8, 0.3],
      [1.0, 0.1],
      [1.5, 0.1],
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].time).toBe(0.2);
  });

  it('ヒステリシス: exit閾値の短い谷では領域を分割しない', () => {
    const { candidates } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.8],
      [0.2, 0.5],
      [0.4, 0.85],
      [1.0, 0.1],
      [1.5, 0.1],
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].time).toBe(0.4);
  });

  it('ストリーム終端で進行中の領域をflushで確定する', () => {
    const tracker = new PeakTracker(defaultOptions);
    tracker.push({ time: 0, score: 0.9, sharpness: 0.5 });

    const flushed = tracker.flush();
    expect(flushed?.time).toBe(0);
    expect(tracker.flush()).toBeNull();
  });

  it('becameBestはスナップショットすべきフレームでのみ立つ', () => {
    const { bestTimes } = runTimeline(new PeakTracker(defaultOptions), [
      [0.0, 0.75],
      [0.5, 0.9],
      [1.0, 0.8],
      [2.0, 0.1],
      [2.5, 0.1],
    ]);

    expect(bestTimes).toEqual([0.0, 0.5]);
  });
});
