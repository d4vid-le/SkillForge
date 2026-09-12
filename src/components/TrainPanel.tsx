import { useState } from 'react';
import type { TrainingConfig, RecipePreset } from '../types';
import { RECIPES } from '../store';

interface Props {
  isTraining: boolean;
  lossHistory: number[];
  trainingProgress: { step: number; total: number; eta: string } | null;
  bestCheckpoint: { step: number; valLoss: number } | null;
  checksumVerified: boolean;
  onStartTraining: (config: TrainingConfig) => void;
}

export function TrainPanel({
  isTraining, lossHistory, trainingProgress, bestCheckpoint,
  checksumVerified, onStartTraining,
}: Props) {
  const [domain, setDomain] = useState('');
  const [dataPath, setDataPath] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipePreset>(RECIPES[1]);
  const [lrOverride, setLrOverride] = useState<string>('');
  const [showLrWarning, setShowLrWarning] = useState(false);

  const scale = selectedRecipe.alpha / selectedRecipe.rank; // R6: derived

  // Gating conditions for train button
  const canTrain = domain.trim() !== '' && dataPath.trim() !== '' && checksumVerified && !isTraining;
  const blockedReasons: string[] = [];
  if (!domain.trim()) blockedReasons.push('domain');
  if (!dataPath.trim()) blockedReasons.push('data path');
  if (!checksumVerified) blockedReasons.push('checksum');
  if (isTraining) blockedReasons.push('training in progress');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canTrain) return;
    const recipe = lrOverride
      ? { ...selectedRecipe, lr: parseFloat(lrOverride) }
      : selectedRecipe;
    onStartTraining({ domain, dataPath, recipe, maxSeqLength: 2048 });
  };

  const handleLrChange = (val: string) => {
    setLrOverride(val);
    if (val && parseFloat(val) !== selectedRecipe.lr) {
      setShowLrWarning(true);
    } else {
      setShowLrWarning(false);
    }
  };

  // Loss sparkline
  const displayLoss = lossHistory;
  const maxLoss = Math.max(...displayLoss, 3);
  const minLoss = Math.min(...displayLoss, 0);

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">Train</h2>
        {isTraining && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse-dot" />
            <span className="text-[10px] font-mono text-[#0a84ff]">
              {trainingProgress ? `${trainingProgress.step}/${trainingProgress.total}` : '...'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 flex-1">
        {/* Domain */}
        <div>
          <label className="block text-[10px] text-[#636366] mb-1">domain</label>
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. sql-query"
            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-[#636366] focus:outline-none focus:border-[#0a84ff] transition-colors"
            disabled={isTraining}
          />
        </div>

        {/* Data path */}
        <div>
          <label className="block text-[10px] text-[#636366] mb-1">data</label>
          <input
            type="text"
            value={dataPath}
            onChange={e => setDataPath(e.target.value)}
            placeholder="/data/domain-train.jsonl"
            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-[#636366] focus:outline-none focus:border-[#0a84ff] transition-colors"
            disabled={isTraining}
          />
        </div>

        {/* Recipe Presets */}
        <div>
          <label className="block text-[10px] text-[#636366] mb-1">recipe</label>
          <div className="flex gap-1">
            {RECIPES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setSelectedRecipe(r); setLrOverride(''); setShowLrWarning(false); }}
                disabled={isTraining}
                className={`flex-1 py-1.5 rounded text-[10px] font-mono transition-colors ${
                  selectedRecipe.id === r.id
                    ? 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30'
                    : 'bg-[#1e1e1e] text-[#8e8e93] border border-[#3a3a3a] hover:border-[#636366]'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Derived params — read-only */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1.5 text-center">
            <div className="text-[9px] text-[#636366]">rank</div>
            <div className="text-[11px] font-mono text-white">{selectedRecipe.rank}</div>
          </div>
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1.5 text-center">
            <div className="text-[9px] text-[#636366]">α</div>
            <div className="text-[11px] font-mono text-white">{selectedRecipe.alpha}</div>
          </div>
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1.5 text-center">
            <div className="text-[9px] text-[#636366]">scale</div>
            <div className="text-[11px] font-mono text-[#8e8e93]">{scale.toFixed(1)}</div>
          </div>
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1.5 text-center">
            <div className="text-[9px] text-[#636366]">iters</div>
            <div className="text-[11px] font-mono text-white">{selectedRecipe.iters}</div>
          </div>
        </div>

        {/* Mask mode + LR */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1.5">
            <div className="text-[9px] text-[#636366] mb-0.5">mask</div>
            <div className="text-[11px] font-mono text-white">{selectedRecipe.maskMode}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#636366] mb-0.5">lr (override)</div>
            <input
              type="text"
              value={lrOverride}
              onChange={e => handleLrChange(e.target.value)}
              placeholder={selectedRecipe.lr.toExponential(0)}
              className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1 text-[11px] font-mono text-white placeholder-[#636366] focus:outline-none focus:border-[#0a84ff]"
              disabled={isTraining}
            />
            {showLrWarning && (
              <div className="text-[9px] text-[#ffd60a] mt-0.5">non-default lr</div>
            )}
          </div>
        </div>

        {/* Loss Sparkline */}
        {displayLoss.length > 0 && (
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-[#636366]">loss</span>
              <div className="flex items-center gap-3">
                {bestCheckpoint && (
                  <span className="text-[9px] font-mono text-[#8e8e93]">
                    best: step {bestCheckpoint.step} ({bestCheckpoint.valLoss.toFixed(4)})
                  </span>
                )}
                <span className="text-[11px] font-mono text-white">
                  {displayLoss[displayLoss.length - 1]?.toFixed(4)}
                </span>
              </div>
            </div>
            <svg viewBox="0 0 200 32" className="w-full h-8">
              <polyline
                fill="none"
                stroke="#0a84ff"
                strokeWidth="1.2"
                points={displayLoss.map((l, i) => {
                  const x = (i / Math.max(displayLoss.length - 1, 1)) * 200;
                  const y = 30 - ((l - minLoss) / (maxLoss - minLoss || 1)) * 28 - 1;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            {trainingProgress && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono text-[#636366]">
                  holdout-gated checkpoint selection
                </span>
                <span className="text-[9px] font-mono text-[#8e8e93]">
                  eta {trainingProgress.eta}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Train Button with gating conditions */}
        <button
          type="submit"
          disabled={!canTrain}
          className={`w-full py-2 rounded text-[11px] font-semibold tracking-wide transition-colors ${
            canTrain
              ? 'bg-[#0a84ff] text-white hover:bg-[#0a75e6]'
              : 'bg-[#3a3a3a] text-[#636366] cursor-not-allowed'
          }`}
        >
          {isTraining ? 'Training...' : 'Train Adapter'}
        </button>

        {/* Show what's blocking */}
        {!canTrain && blockedReasons.length > 0 && !isTraining && (
          <div className="text-[9px] text-[#636366] text-center">
            waiting: {blockedReasons.join(', ')}
          </div>
        )}
      </form>
    </div>
  );
}
