import { useState } from 'react';
import type { RouteEntry, RouterMode, HotSwapResult } from '../types';

interface Props {
  routes: RouteEntry[];
  routerMode: RouterMode;
  hotSwapResult: HotSwapResult | null;
  onUpdateGate: (adapterId: string, gate: number) => void;
  onSetRouterMode: (mode: RouterMode) => void;
  onTestHotSwap: (query: string) => void;
}

export function RoutePanel({
  routes, routerMode, hotSwapResult,
  onUpdateGate, onSetRouterMode, onTestHotSwap,
}: Props) {
  const [hotSwapQuery, setHotSwapQuery] = useState('');
  const gateSum = routes.reduce((sum, r) => sum + r.gate, 0);
  const isViolated = gateSum > 1.0 + 0.001; // floating point tolerance

  const handleHotSwap = (e: React.FormEvent) => {
    e.preventDefault();
    onTestHotSwap(hotSwapQuery);
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">Route</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8e8e93]">Σ</span>
          <span className={`text-[11px] font-mono font-semibold ${
            isViolated ? 'text-[#ff453a]' : gateSum > 0.9 ? 'text-[#ffd60a]' : 'text-white'
          }`}>
            {gateSum.toFixed(2)}
          </span>
          <span className="text-[10px] font-mono text-[#636366]">/ 1.00</span>
        </div>
      </div>

      {/* Gate budget bar */}
      <div className="mb-3">
        <div className="w-full h-1 bg-[#3a3a3a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isViolated ? 'bg-[#ff453a]' : gateSum > 0.9 ? 'bg-[#ffd60a]' : 'bg-[#0a84ff]'
            }`}
            style={{ width: `${Math.min(gateSum * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Router mode */}
      <div className="mb-3">
        <label className="block text-[9px] text-[#636366] mb-1">router</label>
        <div className="flex gap-1">
          {(['keyword_v3', 'v3q_diagnostic', 'oracle'] as RouterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onSetRouterMode(mode)}
              className={`flex-1 py-1 rounded text-[9px] font-mono transition-colors ${
                routerMode === mode
                  ? 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30'
                  : 'bg-[#1e1e1e] text-[#636366] border border-[#3a3a3a] hover:text-[#8e8e93]'
              }`}
            >
              {mode === 'keyword_v3' ? 'kw-v3' : mode === 'v3q_diagnostic' ? 'v3q' : 'oracle'}
            </button>
          ))}
        </div>
      </div>

      {/* Gate sliders */}
      <div className="space-y-2.5 flex-1 mb-3">
        {routes.map(route => (
          <div key={route.adapterId} className={`${route.status === 'quarantined' ? 'quarantined' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-white">{route.domain}</span>
              <span className={`text-[11px] font-mono ${
                route.gate === 0 ? 'text-[#636366]' : 'text-white'
              }`}>
                {route.gate.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={route.gate * 100}
              onChange={e => onUpdateGate(route.adapterId, parseInt(e.target.value) / 100)}
              disabled={route.status === 'quarantined'}
            />
          </div>
        ))}
      </div>

      {/* Hot-swap test */}
      <div className="border-t border-[#3a3a3a] pt-2.5">
        <label className="block text-[9px] text-[#636366] mb-1">hot-swap test</label>
        <form onSubmit={handleHotSwap} className="flex gap-1.5">
          <input
            type="text"
            value={hotSwapQuery}
            onChange={e => setHotSwapQuery(e.target.value)}
            placeholder="paste a query..."
            className="flex-1 bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1 text-[10px] font-mono text-white placeholder-[#636366] focus:outline-none focus:border-[#0a84ff]"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded text-[10px] font-mono text-[#8e8e93] transition-colors"
          >
            test
          </button>
        </form>
        {hotSwapResult && (
          <div className="mt-1.5 bg-[#1e1e1e] rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#636366]">matched</span>
              <span className="text-[10px] font-mono text-white">
                {hotSwapResult.matchedDomain || 'none'}
              </span>
            </div>
            {hotSwapResult.gateValues.map(gv => (
              <div key={gv.domain} className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-[#8e8e93]">{gv.domain}</span>
                <span className="text-[9px] font-mono text-[#636366]">{gv.gate.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
