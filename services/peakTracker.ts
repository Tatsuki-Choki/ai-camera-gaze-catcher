// スコア時系列をストリーミングで受け取り、ピーク領域ごとに最良の1フレームを
// 候補として確定させる。解析エンジン（WebCodecs / シーク両方）が共用する。
//
// 呼び出し側の契約:
//   push() が becameBest を返したら現在のフレームをスナップショットに描き込む。
//   completed を返したらスナップショットを確定して候補として出力する。
//   becameBest と completed が同時に true になることはない。

export interface PeakSample {
  time: number;
  score: number;
  sharpness: number;
}

export interface PeakCandidate {
  time: number;
  score: number;
  sharpness: number;
  replacesPrevious: boolean;
}

export interface PeakTrackerOptions {
  enterThreshold: number;
  exitThreshold: number;
  closeDelaySeconds: number;
  minGapSeconds: number;
  sharpnessWeight: number;
}

export interface PushResult {
  becameBest: boolean;
  completed: PeakCandidate | null;
}

export class PeakTracker {
  private readonly options: PeakTrackerOptions;
  private regionBest: PeakSample | null = null;
  private lastAboveExitTime = 0;
  private lastEmitted: PeakSample | null = null;

  constructor(options: PeakTrackerOptions) {
    this.options = options;
  }

  get isActive(): boolean {
    return this.regionBest !== null;
  }

  private rank(sample: PeakSample): number {
    return sample.score + this.options.sharpnessWeight * sample.sharpness;
  }

  private emit(best: PeakSample): PeakCandidate | null {
    const { minGapSeconds } = this.options;
    if (this.lastEmitted && best.time - this.lastEmitted.time < minGapSeconds) {
      if (this.rank(best) <= this.rank(this.lastEmitted)) {
        return null;
      }
      this.lastEmitted = best;
      return { ...best, replacesPrevious: true };
    }
    this.lastEmitted = best;
    return { ...best, replacesPrevious: false };
  }

  push(sample: PeakSample): PushResult {
    const { enterThreshold, exitThreshold, closeDelaySeconds } = this.options;

    if (this.regionBest) {
      if (sample.score >= exitThreshold) {
        this.lastAboveExitTime = sample.time;
        if (this.rank(sample) > this.rank(this.regionBest)) {
          this.regionBest = sample;
          return { becameBest: true, completed: null };
        }
        return { becameBest: false, completed: null };
      }

      if (sample.time - this.lastAboveExitTime >= closeDelaySeconds) {
        const completed = this.emit(this.regionBest);
        this.regionBest = null;
        return { becameBest: false, completed };
      }

      return { becameBest: false, completed: null };
    }

    if (sample.score >= enterThreshold) {
      this.regionBest = sample;
      this.lastAboveExitTime = sample.time;
      return { becameBest: true, completed: null };
    }

    return { becameBest: false, completed: null };
  }

  flush(): PeakCandidate | null {
    if (!this.regionBest) {
      return null;
    }
    const completed = this.emit(this.regionBest);
    this.regionBest = null;
    return completed;
  }
}
