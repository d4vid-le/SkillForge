import type { EvalResult } from '../types';

interface Props {
  currentEval: EvalResult | null;
  onRunEval: () => void;
  isEvaluating?: boolean;
}

export function EvalPanel({ currentEval, onRunEval }: Props) {
  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Eval</h2>
        <button
          onClick={onRunEval}
          className="px-3 py-1 bg-[#232a38] hover:bg-[#2d3548] border border-[#3a4255] rounded text-xs font-mono text-[#53c2ff] transition-colors"
        >
          Run Eval
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Greedy Score */}
        <div className="bg-[#0b0e14] border border-[#232a38] rounded p-4 text-center">
          <div className="text-[10px] text-[#8a92a6] uppercase tracking-wider mb-2">Greedy Score</div>
          <div className={`text-2xl font-mono font-bold ${
            currentEval ? (currentEval.greedyScore > 0.75 ? 'text-[#3ddc84]' : 'text-[#ffb454]') : 'text-[#4a5568]'
          }`}>
            {currentEval ? currentEval.greedyScore.toFixed(3) : '—'}
          </div>
          {currentEval && (
            <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
              currentEval.greedyScore > 0.75 
                ? 'bg-[#3ddc84]/10 text-[#3ddc84]' 
                : 'bg-[#ffb454]/10 text-[#ffb454]'
            }`}>
              {currentEval.greedyScore > 0.75 ? 'PASS' : 'WARN'}
            </div>
          )}
        </div>

        {/* Robust Score */}
        <div className="bg-[#0b0e14] border border-[#232a38] rounded p-4 text-center">
          <div className="text-[10px] text-[#8a92a6] uppercase tracking-wider mb-2">Robust Score</div>
          <div className={`text-2xl font-mono font-bold ${
            currentEval ? (currentEval.pass ? 'text-[#3ddc84]' : 'text-[#ff6060]') : 'text-[#4a5568]'
          }`}>
            {currentEval ? currentEval.robustScore.toFixed(3) : '—'}
          </div>
          {currentEval && (
            <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
              currentEval.pass 
                ? 'bg-[#3ddc84]/10 text-[#3ddc84]' 
                : 'bg-[#ff6060]/10 text-[#ff6060]'
            }`}>
              {currentEval.pass ? 'PASS' : 'FAIL'}
            </div>
          )}
        </div>
      </div>

      {/* Confidence Band */}
      {currentEval && (
        <div className="bg-[#0b0e14] border border-[#232a38] rounded p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#8a92a6]">95% BINOMIAL BAND</span>
            <span className="text-[10px] font-mono text-[#53c2ff]">
              [{currentEval.robustLower.toFixed(3)}, {currentEval.robustUpper.toFixed(3)}]
            </span>
          </div>
          <div className="relative h-3 bg-[#232a38] rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-[#53c2ff]/30 rounded-full"
              style={{
                left: `${currentEval.robustLower * 100}%`,
                width: `${(currentEval.robustUpper - currentEval.robustLower) * 100}%`,
              }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-[#53c2ff]"
              style={{ left: `${currentEval.robustScore * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Eval Config */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#0b0e14] border border-[#232a38] rounded">
          <span className="text-[10px] text-[#8a92a6]">TEMP</span>
          <span className="text-[10px] font-mono text-[#e0e0e0]">
            {currentEval ? currentEval.temp : 0.3}
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#0b0e14] border border-[#232a38] rounded">
          <span className="text-[10px] text-[#8a92a6]">N SAMPLES</span>
          <span className="text-[10px] font-mono text-[#e0e0e0]">
            {currentEval ? currentEval.n : 6}
          </span>
        </div>
      </div>

      {/* R3 Badge */}
      <div className="mt-3 flex items-center justify-between px-2 py-1.5 bg-[#0b0e14] border border-[#232a38] rounded">
        <span className="text-[10px] text-[#8a92a6]">R3 ROBUSTNESS</span>
        <span className="text-[10px] font-mono text-[#3ddc84]">✓ ENFORCED</span>
      </div>
    </div>
  );
}
