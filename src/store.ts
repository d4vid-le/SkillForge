import { useState, useCallback } from 'react';
import type { BaseLockState, AdapterConfig, RouteEntry, EvalResult, TrainingConfig } from './types';

// Default base lock state
const defaultBaseLock: BaseLockState = {
  modelPath: '/models/llama-3.2-3b-instruct-bf16',
  precision: 'bf16',
  checksum: 'a7f3c9e2d1b8456f0e9a7c3b2d5f8e1a',
  isFrozen: true,
  lastVerified: new Date().toISOString(),
};

// Sample adapters for demo
const defaultAdapters: AdapterConfig[] = [
  {
    id: 'adapter-001',
    domain: 'sql-query',
    rank: 8,
    alpha: 16,
    scale: 2.0,
    layers: 'last-6',
    dataPath: '/data/sql-train.jsonl',
    status: 'keeper',
    createdAt: '2026-01-15T10:30:00Z',
    greedyScore: 0.847,
    robustScore: 0.812,
    robustPass: true,
    lossHistory: [2.4, 2.1, 1.8, 1.5, 1.3, 1.1, 0.95, 0.82, 0.71, 0.65, 0.58, 0.52],
  },
  {
    id: 'adapter-002',
    domain: 'code-review',
    rank: 8,
    alpha: 16,
    scale: 2.0,
    layers: 'last-6',
    dataPath: '/data/code-review-train.jsonl',
    status: 'keeper',
    createdAt: '2026-01-18T14:20:00Z',
    greedyScore: 0.791,
    robustScore: 0.764,
    robustPass: true,
    lossHistory: [2.8, 2.5, 2.2, 1.9, 1.6, 1.4, 1.2, 1.05, 0.92, 0.84, 0.78, 0.72],
  },
  {
    id: 'adapter-003',
    domain: 'legal-summary',
    rank: 8,
    alpha: 16,
    scale: 2.0,
    layers: 'last-6',
    dataPath: '/data/legal-train.jsonl',
    status: 'quarantined',
    createdAt: '2026-01-20T09:15:00Z',
    greedyScore: 0.523,
    robustScore: 0.401,
    robustPass: false,
    lossHistory: [3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1, 2.05, 2.0, 1.98, 1.95],
  },
];

const defaultRoutes: RouteEntry[] = [
  { adapterId: 'adapter-001', domain: 'sql-query', gate: 1.0, status: 'keeper' },
  { adapterId: 'adapter-002', domain: 'code-review', gate: 0.8, status: 'keeper' },
  { adapterId: 'adapter-003', domain: 'legal-summary', gate: 0.0, status: 'quarantined' },
];

export function useSkillForge() {
  const [baseLock, setBaseLock] = useState<BaseLockState>(defaultBaseLock);
  const [adapters, setAdapters] = useState<AdapterConfig[]>(defaultAdapters);
  const [routes, setRoutes] = useState<RouteEntry[]>(defaultRoutes);
  const [isTraining, setIsTraining] = useState(false);
  const [currentEval, setCurrentEval] = useState<EvalResult | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] SkillForge engine loaded',
    '[R1] Base model checksum verified: a7f3c9e2...',
    '[R5] Precision locked: bf16',
    '[R6] Scale math enforced: α/rank = 16/8 = 2.0',
  ]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-50), msg]);
  }, []);

  const verifyChecksum = useCallback(() => {
    const newChecksum = 'a7f3c9e2d1b8456f0e9a7c3b2d5f8e1a';
    setBaseLock(prev => ({
      ...prev,
      checksum: newChecksum,
      lastVerified: new Date().toISOString(),
    }));
    addLog(`[R1] Checksum re-verified: ${newChecksum.slice(0, 8)}...`);
  }, [addLog]);

  const startTraining = useCallback((config: TrainingConfig) => {
    // Enforce R6: scale must be alpha / rank
    const expectedScale = config.alpha / config.rank;
    if (config.rank !== 8) {
      addLog(`[BLOCKED] R6 violation: rank must be 8`);
      return;
    }
    if (Math.abs(config.alpha / config.rank - expectedScale) > 0.001) {
      addLog(`[BLOCKED] R6 violation: scale must be α/rank`);
      return;
    }

    setIsTraining(true);
    addLog(`[TRAIN] Starting adapter for domain: ${config.domain}`);
    addLog(`[R2] Domain purity check: single domain "${config.domain}"`);
    addLog(`[R7] Data gate: dropping rows where tokens > ${config.maxSeqLength - 200}`);
    addLog(`[R5] Training precision: bf16`);
    addLog(`[R6] Scale: ${config.alpha}/${config.rank} = ${expectedScale}`);

    // Simulate training
    const newAdapter: AdapterConfig = {
      id: `adapter-${String(adapters.length + 1).padStart(3, '0')}`,
      domain: config.domain,
      rank: config.rank,
      alpha: config.alpha,
      scale: expectedScale,
      layers: `last-${config.layers}`,
      dataPath: config.dataPath,
      status: 'training',
      createdAt: new Date().toISOString(),
      greedyScore: null,
      robustScore: null,
      robustPass: null,
      lossHistory: [],
    };

    setAdapters(prev => [...prev, newAdapter]);

    // Simulate loss curve
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const loss = 2.5 * Math.exp(-0.3 * step) + 0.4 + Math.random() * 0.1;
      setAdapters(prev => prev.map(a => 
        a.id === newAdapter.id 
          ? { ...a, lossHistory: [...a.lossHistory, loss] }
          : a
      ));
      
      if (step >= 12) {
        clearInterval(interval);
        const finalGreedy = 0.7 + Math.random() * 0.2;
        const finalRobust = finalGreedy - 0.03 - Math.random() * 0.05;
        const pass = finalRobust > 0.65;
        
        setAdapters(prev => prev.map(a =>
          a.id === newAdapter.id
            ? { ...a, status: pass ? 'keeper' : 'quarantined', greedyScore: finalGreedy, robustScore: finalRobust, robustPass: pass }
            : a
        ));

        if (!pass) {
          addLog(`[R4] ADAPTER QUARANTINED: "${config.domain}" failed robustness (score: ${finalRobust.toFixed(3)})`);
        } else {
          addLog(`[PASS] Adapter "${config.domain}" approved. Greedy: ${finalGreedy.toFixed(3)}, Robust: ${finalRobust.toFixed(3)}`);
        }

        setRoutes(prev => [...prev, {
          adapterId: newAdapter.id,
          domain: config.domain,
          gate: pass ? 0.8 : 0.0,
          status: pass ? 'keeper' : 'quarantined',
        }]);

        setIsTraining(false);
        addLog(`[R8] Audit log written to REPRO_LOG.md`);
      }
    }, 400);
  }, [adapters, addLog]);

  const updateGate = useCallback((adapterId: string, gate: number) => {
    // Check if adapter is quarantined
    const adapter = adapters.find(a => a.id === adapterId);
    if (adapter?.status === 'quarantined') {
      addLog(`[BLOCKED] R4: Cannot enable quarantined adapter "${adapter.domain}"`);
      return;
    }

    // Check sum constraint
    const currentSum = routes.reduce((sum, r) => sum + (r.adapterId === adapterId ? gate : r.gate), 0);
    if (currentSum > 1.0) {
      addLog(`[BLOCKED] R3: Σ gates would exceed 1.0 (current: ${currentSum.toFixed(2)})`);
      return;
    }

    setRoutes(prev => prev.map(r => 
      r.adapterId === adapterId ? { ...r, gate } : r
    ));
    addLog(`[ROUTE] Gate updated: ${adapterId} → ${gate.toFixed(2)}`);
  }, [adapters, routes, addLog]);

  const quarantineAdapter = useCallback((adapterId: string) => {
    setAdapters(prev => prev.map(a =>
      a.id === adapterId ? { ...a, status: 'quarantined' } : a
    ));
    setRoutes(prev => prev.map(r =>
      r.adapterId === adapterId ? { ...r, gate: 0.0, status: 'quarantined' as const } : r
    ));
    const adapter = adapters.find(a => a.id === adapterId);
    addLog(`[R4] QUARANTINE: Adapter "${adapter?.domain}" gated to 0.0`);
  }, [adapters, addLog]);

  const runEval = useCallback(() => {
    addLog(`[EVAL] Running evaluation harness...`);
    addLog(`[R3] Robustness eval: temp=0.3, n=6, binomial band`);
    addLog(`[R5] Eval precision: 8-bit (group_size=64)`);
    
    setTimeout(() => {
      const greedy = 0.75 + Math.random() * 0.15;
      const robust = greedy - 0.02 - Math.random() * 0.04;
      const lower = robust - 0.03;
      const upper = robust + 0.03;
      const pass = robust > 0.65;

      setCurrentEval({
        greedyScore: greedy,
        robustScore: robust,
        robustLower: lower,
        robustUpper: upper,
        pass,
        n: 6,
        temp: 0.3,
      });
      addLog(`[EVAL] Complete. Greedy: ${greedy.toFixed(3)}, Robust: ${robust.toFixed(3)} [${pass ? 'PASS' : 'FAIL'}]`);
    }, 2000);
  }, [addLog]);

  return {
    baseLock,
    adapters,
    routes,
    isTraining,
    currentEval,
    logs,
    verifyChecksum,
    startTraining,
    updateGate,
    quarantineAdapter,
    runEval,
  };
}
