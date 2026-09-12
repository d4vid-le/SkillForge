export interface BaseLockState {
  modelPath: string;
  precision: 'bf16' | 'fp16' | 'fp32';
  checksum: string;
  isFrozen: boolean;
  lastVerified: string;
}

export interface AdapterConfig {
  id: string;
  domain: string;
  rank: number;
  alpha: number;
  scale: number; // strictly alpha / rank
  layers: string;
  dataPath: string;
  status: 'training' | 'keeper' | 'quarantined' | 'evaluating';
  createdAt: string;
  greedyScore: number | null;
  robustScore: number | null;
  robustPass: boolean | null;
  lossHistory: number[];
}

export interface RouteEntry {
  adapterId: string;
  domain: string;
  gate: number;
  status: 'keeper' | 'quarantined';
}

export interface TrainingConfig {
  domain: string;
  dataPath: string;
  rank: number;
  alpha: number;
  layers: number;
  lr: number;
  gradAccum: number;
  maxSeqLength: number;
}

export interface EvalResult {
  greedyScore: number;
  robustScore: number;
  robustLower: number;
  robustUpper: number;
  pass: boolean;
  n: number;
  temp: number;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  domain: string;
  config: Partial<TrainingConfig>;
  metrics: Record<string, number>;
}
