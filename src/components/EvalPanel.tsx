import type { EvalResult } from '../types';

interface Props {
  currentEval: EvalResult | null;
  onRunEval: () => void;
}

const GREEDY_THRESHOLD = 0.75;
const ROBUST_THRESHOLD = 0.65;
const HOLDOUT_THRESHOLD = 5;

export function EvalPanel({ currentEval, onRunEval }: Props) {
  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">Eval</h2>
        <button
          onClick={onRunEval}
          className="px-2.5 py-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded text-[10px] font-mono text-[#8e8e93] transition-colors"
        >
          run
        </button>
      </div>

      {/* Scores with base baseline */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Greedy */}
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-3">
          <div className="text-[9px] text-[#636366] uppercase tracking-wider mb-1.5">greedy</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-mono font-semibold ${
              !currentEval ? 'text-[#636366]' :
              currentEval.greedyScore >= GREEDY_THRESHOLD ? 'text-white' : 'text-[#ffd60a]'
            }`}>
              {currentEval ? currentEval.greedyScore.toFixed(3) : '—'}
            </span>
          </div>
          {currentEval && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#636366]">
                base {currentEval.baseGreedy.toFixed(3)}
              </span>
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                currentEval.greedyScore >= GREEDY_THRESHOLD
                  ? 'bg-[#30d158]/10 text-[#30d158]'
                  : 'bg-[#ffd60a]/10 text-[#ffd60a]'
              }`}>
                {currentEval.greedyScore >= GREEDY_THRESHOLD ? `≥${GREEDY_THRESHOLD}` : `<${GREEDY_THRESHOLD}`}
              </span>
            </div>
          )}
        </div>

        {/* Robust */}
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-3">
          <div className="text-[9px] text-[#636366] uppercase tracking-wider mb-1.5">robust</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-mono font-semibold ${
              !currentEval ? 'text-[#636366]' :
              currentEval.pass ? 'text-white' : 'text-[#ff453a]'
            }`}>
              {currentEval ? currentEval.robustScore.toFixed(3) : '—'}
            </span>
          </div>
          {currentEval && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#636366]">
                base {currentEval.baseRobust.toFixed(3)}
              </span>
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                currentEval.pass
                  ? 'bg-[#30d158]/10 text-[#30d158]'
                  : 'bg-[#ff453a]/10 text-[#ff453a]'
              }`}>
                {currentEval.pass ? `≥${ROBUST_THRESHOLD}` : `<${ROBUST_THRESHOLD}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Δ vs Base */}
      {currentEval && (
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2.5 mb-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#636366]">Δ (separated − M1)</span>
            <span className={`text-[12px] font-mono font-semibold ${
              currentEval.delta > 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
            }`}>
              {currentEval.delta > 0 ? '+' : ''}{currentEval.delta.toFixed(3)}
            </span>
          </div>
        </div>
      )}

      {/* Confidence band */}
      {currentEval && (
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2.5 mb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-[#636366]">95% binomial band</span>
            <span className="text-[9px] font-mono text-[#8e8e93]">
              [{currentEval.robustLower.toFixed(3)}, {currentEval.robustUpper.toFixed(3)}]
            </span>
          </div>
          <div className="relative h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-[#0a84ff]/20 rounded-full"
              style={{
                left: `${currentEval.robustLower * 100}%`,
                width: `${(currentEval.robustUpper - currentEval.robustLower) * 100}%`,
              }}
            />
            <div
              className="absolute top-0 h-full w-px bg-[#0a84ff]"
              style={{ left: `${currentEval.robustScore * 100}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-full w-px bg-[#636366]"
              style={{ left: `${ROBUST_THRESHOLD * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Holdout per domain */}
      {currentEval && currentEval.domainHoldout.length > 0 && (
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2.5 mb-2.5">
          <div className="text-[9px] text-[#636366] mb-1.5">holdout per domain (≥{HOLDOUT_THRESHOLD}/6)</div>
          <div className="space-y-1">
            {currentEval.domainHoldout.map(dh => (
              <div key={dh.domain} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8e8e93]">{dh.domain}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white">{dh.score.toFixed(1)}/6</span>
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                    dh.pass ? 'bg-[#30d158]/10 text-[#30d158]' : 'bg-[#ff453a]/10 text-[#ff453a]'
                  }`}>
                    {dh.pass ? 'pass' : 'fail'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eval params */}
      <div className="flex items-center gap-3 mt-auto">
        <span className="text-[9px] font-mono text-[#636366]">
          temp {currentEval?.temp ?? 0.3}
        </span>
        <span className="text-[9px] font-mono text-[#636366]">
          n={currentEval?.n ?? 6}
        </span>
        <span className="text-[9px] font-mono text-[#636366]">
          8-bit gs=64
        </span>
      </div>
    </div>
  );
}
