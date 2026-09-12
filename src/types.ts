export interface BaseLockState {
  modelPath: string;
  precision: 'bf16';
  checksum: string;
  lastVerified: string;
  memory: {
    base: number;       // GB
    adapters: number;   // GB
    total: number;      // GB
    system: number;     // GB total
  };
}

export interface RecipePreset {
  id: string;
  name: string;
  rank: number;
  alpha: number;
  layers: number;
  iters: number;
  lr: number;
  maskMode: 'last' | 'all_assistant';
  gradAccum: number;
}

export type RouterMode = 'keyword_v3' | 'v3q_diagnostic' | 'oracle';

export interface AdapterConfig {
  id: string;
  domain: string;
  rank: number;
  alpha: number;
  scale: number;
  layers: string;
  dataPath: string;
  status: 'training' | 'keeper' | 'quarantined' | 'superseded';
  createdAt: string;
  sizeMB: number;
  checkpoints: number;
  greedyScore: number | null;
  robustScore: number | null;
  robustPass: boolean | null;
  baseGreedy: number;
  baseRobust: number;
  holdoutScore: number | null;
  lossHistory: number[];
  trainingProgress: { step: number; total: number; eta: string } | null;
  bestCheckpoint: { step: number; valLoss: number } | null;
}

export interface RouteEntry {
  adapterId: string;
  domain: string;
  gate: number;
  status: 'keeper' | 'quarantined' | 'superseded';
}

export interface TrainingConfig {
  domain: string;
  dataPath: string;
  recipe: RecipePreset;
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
  baseGreedy: number;
  baseRobust: number;
  delta: number;
  domainHoldout: { domain: string; score: number; pass: boolean }[];
}

export interface HotSwapResult {
  query: string;
  matchedDomain: string | null;
  gateValues: { domain: string; gate: number }[];
}

export type LogSeverity = 'info' | 'warning' | 'error' | 'doctrine';

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  message: string;
}
