import { useState } from 'react';
import type { TrainingConfig } from '../types';

interface Props {
  isTraining: boolean;
  lossHistory: number[];
  onStartTraining: (config: TrainingConfig) => void;
}

export function TrainPanel({ isTraining, lossHistory, onStartTraining }: Props) {
  const [domain, setDomain] = useState('');
  const [dataPath, setDataPath] = useState('');
  const [rank] = useState(8);
  const [alpha] = useState(16);
  const [layers] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !dataPath) return;
    onStartTraining({
      domain,
      dataPath,
      rank,
      alpha,
      layers,
      lr: 1e-4,
      gradAccum: 4,
      maxSeqLength: 2048,
    });
  };

  const displayLoss = isTraining ? lossHistory : [];
  const maxLoss = Math.max(...displayLoss, 3);
  const minLoss = Math.min(...displayLoss, 0);

  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Train</h2>
        {isTraining && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#53c2ff] animate-pulse-cyan" />
            <span className="text-xs font-mono text-[#53c2ff]">TRAINING</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-[#8a92a6] mb-1">Domain Name</label>
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. sql-query"
            className="w-full bg-[#0b0e14] border border-[#232a38] rounded px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#4a5568] focus:outline-none focus:border-[#53c2ff]"
            disabled={isTraining}
          />
        </div>

        <div>
          <label className="block text-xs text-[#8a92a6] mb-1">Data Path (JSONL)</label>
          <input
            type="text"
            value={dataPath}
            onChange={e => setDataPath(e.target.value)}
            placeholder="/data/domain-train.jsonl"
            className="w-full bg-[#0b0e14] border border-[#232a38] rounded px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#4a5568] focus:outline-none focus:border-[#53c2ff]"
            disabled={isTraining}
          />
        </div>

        {/* Recipe Presets */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0b0e14] border border-[#232a38] rounded px-2 py-1.5 text-center">
            <div className="text-[10px] text-[#8a92a6]">RANK</div>
            <div className="text-xs font-mono text-[#53c2ff] font-bold">{rank}</div>
          </div>
          <div className="bg-[#0b0e14] border border-[#232a38] rounded px-2 py-1.5 text-center">
            <div className="text-[10px] text-[#8a92a6]">ALPHA</div>
            <div className="text-xs font-mono text-[#53c2ff] font-bold">{alpha}</div>
          </div>
          <div className="bg-[#0b0e14] border border-[#232a38] rounded px-2 py-1.5 text-center">
            <div className="text-[10px] text-[#8a92a6]">LAYERS</div>
            <div className="text-xs font-mono text-[#53c2ff] font-bold">last-{layers}</div>
          </div>
        </div>

        {/* R6 Scale Display */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#0b0e14] border border-[#232a38] rounded">
          <span className="text-[10px] text-[#8a92a6]">R6 SCALE (α/rank)</span>
          <span className="text-xs font-mono text-[#3ddc84] font-bold">{(alpha / rank).toFixed(1)}</span>
        </div>

        {/* Loss Sparkline */}
        {displayLoss.length > 0 && (
          <div className="bg-[#0b0e14] border border-[#232a38] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8a92a6]">LOSS</span>
              <span className="text-xs font-mono text-[#53c2ff]">
                {displayLoss[displayLoss.length - 1]?.toFixed(4)}
              </span>
            </div>
            <svg viewBox="0 0 200 40" className="w-full h-10">
              <polyline
                fill="none"
                stroke="#53c2ff"
                strokeWidth="1.5"
                points={displayLoss.map((l, i) => {
                  const x = (i / Math.max(displayLoss.length - 1, 1)) * 200;
                  const y = 40 - ((l - minLoss) / (maxLoss - minLoss || 1)) * 36 - 2;
                  return `${x},${y}`;
                }).join(' ')}
              />
              <polyline
                fill="url(#lossGradient)"
                stroke="none"
                points={[
                  `0,40`,
                  ...displayLoss.map((l, i) => {
                    const x = (i / Math.max(displayLoss.length - 1, 1)) * 200;
                    const y = 40 - ((l - minLoss) / (maxLoss - minLoss || 1)) * 36 - 2;
                    return `${x},${y}`;
                  }),
                  `200,40`,
                ].join(' ')}
              />
              <defs>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#53c2ff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#53c2ff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}

        <button
          type="submit"
          disabled={isTraining || !domain || !dataPath}
          className={`w-full py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-colors ${
            isTraining
              ? 'bg-[#232a38] text-[#4a5568] cursor-not-allowed'
              : 'bg-[#53c2ff] text-[#0b0e14] hover:bg-[#6dd0ff] disabled:bg-[#232a38] disabled:text-[#4a5568] disabled:cursor-not-allowed'
          }`}
        >
          {isTraining ? 'Training...' : 'Train Adapter'}
        </button>
      </form>
    </div>
  );
}
