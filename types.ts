
export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export enum AnalysisStatus {
  Idle = 'idle',
  Initializing = 'initializing',
  Processing = 'processing',
  Done = 'done',
  Error = 'error',
}