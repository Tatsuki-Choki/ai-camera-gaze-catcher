export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
  score: number;
  selected: boolean;
}

export enum AnalysisStatus {
  Idle = 'idle',
  Initializing = 'initializing',
  Processing = 'processing',
  Done = 'done',
  Error = 'error',
  Canceled = 'canceled',
}

export type ScanMode = 'fast' | 'standard' | 'precise';

export interface ScanModeOption {
  id: ScanMode;
  label: string;
  intervalSeconds: number;
}

export interface GazeScoreInput {
  hasFace: boolean;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
}

export interface GazeScoreResult {
  score: number;
  isCandidate: boolean;
}
