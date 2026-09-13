import { useState, useCallback } from 'react';
import type {
  BaseLockState, AdapterConfig, RouteEntry, EvalResult,
  TrainingConfig, RecipePreset, RouterMode, HotSwapResult,
  LogEntry, LogSeverity,
} from './types';

// ============================================================================
// Recipe Presets
// ============================================================================
export const RECIPES: RecipePreset[] = [
  { id: 'smoke-0.5b', name: 'smoke-0.5B', rank: 8, alpha: 16, layers: 4, iters: 300, lr: 1e-4, maskMode: 'last', gradAccum: 4 },
  { id: 'standard-3b', name: 'standard-3B', rank: 8, alpha: 16, layers: 6, iters: 500, lr: 1e-4, maskMode: 'last', gradAccum: 4 },
  { id: 'port-14b', name: 'port-14B', rank: 8, alpha: 16, layers: 8, iters: 600, lr: 5e-5, maskMode: 'all_assistant', gradAccum: 8 },
];

// ============================================================================
// Defaults
// ============================================================================
const BASE_GREEDY = 0.612;
const BASE_ROBUST = 0.589;

const defaultBaseLock: BaseLockState = {
  modelPath: '/models/llama-3.2-3b-instruct-bf16',
  precision: 'bf16',
  checksum: 'a7f3c9e2d1b8456f',
  lastVerified: new Date().toISOString(),
  memory: { base: 6.2, adapters: 1.4, total: 7.6, system: 64 },
};

const defaultAdapters: AdapterConfig[] = [
  {
    id: 'adapter-001', domain: 'sql-query', rank: 8, alpha: 16, scale: 2.0,
    layers: 'last-6', dataPath: '/data/sql-train.jsonl', status: 'keeper',
    createdAt: '2026-01-15T10:30:00Z', sizeMB: 42, checkpoints: 3,
    greedyScore: 0.847, robustScore: 0.812, robustPass: true,
    baseGreedy: BASE_GREEDY, baseRobust: BASE_ROBUST,
    holdoutScore: 5.5, lossHistory: [2.4, 2.1, 1.8, 1.5, 1.3, 1.1, 0.95, 0.82, 0.71, 0.65, 0.58, 0.52],
    trainingProgress: null,
    bestCheckpoint: { step: 420, valLoss: 0.52 },
  },
  {
    id: 'adapter-002', domain: 'code-review', rank: 8, alpha: 16, scale: 2.0,
    layers: 'last-6', dataPath: '/data/code-review-train.jsonl', status: 'keeper',
    createdAt: '2026-01-18T14:20:00Z', sizeMB: 42, checkpoints: 2,
    greedyScore: 0.791, robustScore: 0.764, robustPass: true,
    baseGreedy: BASE_GREEDY, baseRobust: BASE_ROBUST,
    holdoutScore: 5.2, lossHistory: [2.8, 2.5, 2.2, 1.9, 1.6, 1.4, 1.2, 1.05, 0.92, 0.84, 0.78, 0.72],
    trainingProgress: null,
    bestCheckpoint: { step: 380, valLoss: 0.72 },
  },
  {
    id: 'adapter-003', domain: 'legal-summary', rank: 8, alpha: 16, scale: 2.0,
    layers: 'last-6', dataPath: '/data/legal-train.jsonl', status: 'quarantined',
    createdAt: '2026-01-20T09:15:00Z', sizeMB: 42, checkpoints: 1,
    greedyScore: 0.523, robustScore: 0.401, robustPass: false,
    baseGreedy: BASE_GREEDY, baseRobust: BASE_ROBUST,
    holdoutScore: 2.1, lossHistory: [3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1, 2.05, 2.0, 1.98, 1.95],
    trainingProgress: null,
    bestCheckpoint: { step: 150, valLoss: 1.95 },
  },
];

const defaultRoutes: RouteEntry[] = [
  { adapterId: 'adapter-001', domain: 'sql-query', gate: 0.6, status: 'keeper' },
  { adapterId: 'adapter-002', domain: 'code-review', gate: 0.4, status: 'keeper' },
  { adapterId: 'adapter-003', domain: 'legal-summary', gate: 0.0, status: 'quarantined' },
];

// ============================================================================
// Hook
// ============================================================================
export function useSkillForge() {
  const [baseLock, setBaseLock] = useState<BaseLockState>(defaultBaseLock);
  const [adapters, setAdapters] = useState<AdapterConfig[]>(defaultAdapters);
  const [routes, setRoutes] = useState<RouteEntry[]>(defaultRoutes);
  const [isTraining, setIsTraining] = useState(false);
  const [currentEval, setCurrentEval] = useState<EvalResult | null>(null);
  const [routerMode, setRouterMode] = useState<RouterMode>('keyword_v3');
  const [hotSwapResult, setHotSwapResult] = useState<HotSwapResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toISOString(), severity: 'info', message: 'SkillForge engine loaded' },
    { timestamp: new Date().toISOString(), severity: 'info', message: `Base checksum: ${defaultBaseLock.checksum}` },
    { timestamp: new Date().toISOString(), severity: 'info', message: 'Memory: 6.2 GB base + 1.4 GB adapters = 7.6 / 64 GB' },
  ]);

  const addLog = useCallback((severity: LogSeverity, message: string) => {
    setLogs(prev => [...prev.slice(-100), { timestamp: new Date().toISOString(), severity, message }]);
  }, []);

  // Auto-verify checksum on load
  const verifyChecksum = useCallback(() => {
    setBaseLock(prev => ({
      ...prev,
      lastVerified: new Date().toISOString(),
    }));
    addLog('info', `Checksum verified: ${defaultBaseLock.checksum}`);
  }, [addLog]);

  // ============================================================================
  // Training — coupled gates, read-only scale, gating conditions visible
  // ============================================================================
  const startTraining = useCallback((config: TrainingConfig) => {
    const { recipe } = config;
    const scale = recipe.alpha / recipe.rank; // R6: derived, never set

    setIsTraining(true);
    addLog('info', `Training started: ${config.domain}`);
    addLog('info', `Recipe: ${recipe.name} — rank=${recipe.rank}, α=${recipe.alpha}, scale=${scale}, iters=${recipe.iters}`);
    addLog('info', `Data gate: dropping rows > ${config.maxSeqLength - 200} tokens`);
    addLog('info', `Data validation: 1,247 rows → 1,189 valid (58 dropped, 0 cross-domain)`);

    const newAdapter: AdapterConfig = {
      id: `adapter-${String(adapters.length + 1).padStart(3, '0')}`,
      domain: config.domain,
      rank: recipe.rank,
      alpha: recipe.alpha,
      scale,
      layers: `last-${recipe.layers}`,
      dataPath: config.dataPath,
      status: 'training',
      createdAt: new Date().toISOString(),
      sizeMB: 0,
      checkpoints: 0,
      greedyScore: null,
      robustScore: null,
      robustPass: null,
      baseGreedy: BASE_GREEDY,
      baseRobust: BASE_ROBUST,
      holdoutScore: null,
      lossHistory: [],
      trainingProgress: { step: 0, total: recipe.iters, eta: 'calculating...' },
      bestCheckpoint: null,
    };

    setAdapters(prev => [...prev, newAdapter]);

    // Simulate training with progress
    let step = 0;
    const totalSteps = recipe.iters;
    const interval = setInterval(() => {
      step += Math.floor(totalSteps / 12);
      if (step > totalSteps) step = totalSteps;

      const progress = step / totalSteps;
      const loss = 2.5 * Math.exp(-3 * progress) + 0.35 + Math.random() * 0.08;
      const remaining = Math.max(0, Math.round((totalSteps - step) * 0.4));

      setAdapters(prev => prev.map(a =>
        a.id === newAdapter.id
          ? {
            ...a,
            lossHistory: [...a.lossHistory, loss],
            trainingProgress: { step, total: totalSteps, eta: `${remaining}s` },
            checkpoints: Math.floor(step / 100),
          }
          : a
      ));

      if (step >= totalSteps) {
        clearInterval(interval);
        const finalGreedy = 0.7 + Math.random() * 0.2;
        const finalRobust = finalGreedy - 0.03 - Math.random() * 0.05;
        const pass = finalRobust > 0.65;
        const holdout = 3 + Math.random() * 3;

        setAdapters(prev => prev.map(a =>
          a.id === newAdapter.id
            ? {
              ...a,
              status: pass ? 'keeper' : 'quarantined',
              greedyScore: finalGreedy,
              robustScore: finalRobust,
              robustPass: pass,
              holdoutScore: holdout,
              sizeMB: 42,
              trainingProgress: null,
              bestCheckpoint: { step: Math.floor(totalSteps * 0.8), valLoss: loss },
            }
            : a
        ));

        if (!pass) {
          addLog('error', `Adapter "${config.domain}" failed robustness (${finalRobust.toFixed(3)} < 0.650) — quarantined`);
        } else {
          addLog('info', `Adapter "${config.domain}" approved — greedy: ${finalGreedy.toFixed(3)}, robust: ${finalRobust.toFixed(3)}, holdout: ${holdout.toFixed(1)}/6`);
        }

        setRoutes(prev => [...prev, {
          adapterId: newAdapter.id,
          domain: config.domain,
          gate: pass ? 0.5 : 0.0,
          status: pass ? 'keeper' : 'quarantined',
        }]);

        // Update memory
        setBaseLock(prev => ({
          ...prev,
          memory: { ...prev.memory, adapters: prev.memory.adapters + (pass ? 0.042 : 0) },
        }));

        setIsTraining(false);
        addLog('info', `Audit written to REPRO_LOG.md`);
      }
    }, 350);
  }, [adapters, addLog]);

  // ============================================================================
  // Route — coupled sliders, sum ≤ 1.0 enforced
  // ============================================================================
  const updateGate = useCallback((adapterId: string, newGate: number) => {
    const adapter = adapters.find(a => a.id === adapterId);
    if (!adapter) return;

    if (adapter.status === 'quarantined') {
      addLog('warning', `Cannot enable quarantined adapter "${adapter.domain}"`);
      return;
    }

    // Compute sum of all OTHER gates
    const otherSum = routes.reduce((sum, r) => sum + (r.adapterId === adapterId ? 0 : r.gate), 0);
    const maxAllowed = Math.max(0, 1.0 - otherSum);
    const clampedGate = Math.min(newGate, maxAllowed);

    if (newGate > maxAllowed) {
      addLog('warning', `Gate clamped: ${adapter.domain} → ${clampedGate.toFixed(2)} (Σ would exceed 1.0)`);
    }

    setRoutes(prev => prev.map(r =>
      r.adapterId === adapterId ? { ...r, gate: clampedGate } : r
    ));
  }, [adapters, routes, addLog]);

  const quarantineAdapter = useCallback((adapterId: string) => {
    const adapter = adapters.find(a => a.id === adapterId);
    if (!adapter) return;

    setAdapters(prev => prev.map(a =>
      a.id === adapterId ? { ...a, status: 'quarantined' as const } : a
    ));
    setRoutes(prev => prev.map(r =>
      r.adapterId === adapterId ? { ...r, gate: 0.0, status: 'quarantined' as const } : r
    ));
    addLog('warning', `Quarantined "${adapter.domain}" — gate → 0.0`);
  }, [adapters, addLog]);

  // ============================================================================
  // Eval — with base baseline, Δ, holdout per domain
  // ============================================================================
  const runEval = useCallback(() => {
    addLog('info', 'Evaluation started (temp=0.3, n=6, 8-bit quantized)');

    setTimeout(() => {
      const greedy = 0.75 + Math.random() * 0.15;
      const robust = greedy - 0.02 - Math.random() * 0.04;
      const lower = robust - 0.03;
      const upper = robust + 0.03;
      const pass = robust > 0.65;

      const domainHoldout = adapters
        .filter(a => a.status === 'keeper')
        .map(a => ({
          domain: a.domain,
          score: 3 + Math.random() * 3,
          pass: Math.random() > 0.2,
        }));

      setCurrentEval({
        greedyScore: greedy,
        robustScore: robust,
        robustLower: lower,
        robustUpper: upper,
        pass,
        n: 6,
        temp: 0.3,
        baseGreedy: BASE_GREEDY,
        baseRobust: BASE_ROBUST,
        delta: greedy - BASE_GREEDY,
        domainHoldout,
      });
      addLog('info', `Eval complete — greedy: ${greedy.toFixed(3)} (base: ${BASE_GREEDY}), robust: ${robust.toFixed(3)} (base: ${BASE_ROBUST}), Δ: +${(greedy - BASE_GREEDY).toFixed(3)}`);
    }, 1800);
  }, [adapters, addLog]);

  // ============================================================================
  // Hot-swap test
  // ============================================================================
  const testHotSwap = useCallback((query: string) => {
    if (!query.trim()) return;

    const activeRoutes = routes.filter(r => r.gate > 0 && r.status === 'keeper');
    let matchedDomain: string | null = null;
    let maxGate = 0;

    const gateValues = activeRoutes.map(r => {
      // Simple keyword matching simulation
      const match = query.toLowerCase().includes(r.domain.split('-')[0]) ||
        (r.domain === 'sql-query' && query.toLowerCase().includes('select')) ||
        (r.domain === 'code-review' && (query.toLowerCase().includes('function') || query.toLowerCase().includes('code')));
      const effectiveGate = match ? r.gate : r.gate * 0.1;
      if (effectiveGate > maxGate) {
        maxGate = effectiveGate;
        matchedDomain = r.domain;
      }
      return { domain: r.domain, gate: effectiveGate };
    });

    setHotSwapResult({ query, matchedDomain, gateValues });
    addLog('info', `Hot-swap test: "${query.slice(0, 40)}..." → ${matchedDomain || 'no match'}`);
  }, [routes, addLog]);

  return {
    baseLock,
    adapters,
    routes,
    isTraining,
    currentEval,
    routerMode,
    hotSwapResult,
    logs,
    verifyChecksum,
    startTraining,
    updateGate,
    quarantineAdapter,
    runEval,
    setRouterMode,
    testHotSwap,
  };
}
