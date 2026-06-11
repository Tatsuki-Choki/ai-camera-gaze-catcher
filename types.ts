export interface Screenshot {
  id: string;
  time: number;
  score: number;
  sharpness: number;
  width: number;
  height: number;
  fullBlob: Blob;
  thumbUrl: string;
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

export type EngineKind = 'webcodecs' | 'seek';

export type ExportFormat = 'jpeg' | 'png';

export interface ScanModeOption {
  id: ScanMode;
  label: string;
  intervalSeconds: number;
}

export interface ScorePoint {
  time: number;
  score: number;
}

export interface GazeFrameFeatures {
  hasFace: boolean;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
}

export interface GazeScoreResult {
  score: number;
  isCandidate: boolean;
  threshold: number;
}
