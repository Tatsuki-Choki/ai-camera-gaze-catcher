export interface ScoreLabel {
  label: string;
  tone: 'strong' | 'good' | 'check';
}

export const getScoreLabel = (score: number): ScoreLabel => {
  if (score >= 0.84) {
    return { label: '正面', tone: 'strong' };
  }
  if (score >= 0.72) {
    return { label: '良好', tone: 'good' };
  }
  return { label: '要確認', tone: 'check' };
};
