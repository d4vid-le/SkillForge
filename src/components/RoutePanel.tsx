import type { RouteEntry } from '../types';

interface Props {
  routes: RouteEntry[];
  onUpdateGate: (adapterId: string, gate: number) => void;
}

export function RoutePanel({ routes, onUpdateGate }: Props) {
  const gateSum = routes.reduce((sum, r) => sum + r.gate, 0);
  const isOverBudget = gateSum > 1.0;

  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Route</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
          isOverBudget 
            ? 'bg-[#ff6060]/10 text-[#ff6060] border-[#ff6060]/30' 
            : 'bg-[#3ddc84]/10 text-[#3ddc84] border-[#3ddc84]/30'
        }`}>
          Σ = {gateSum.toFixed(2)}
        </div>
      </div>

      {/* Gate Sum Gauge */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#8a92a6]">GATE BUDGET</span>
          <span className={`text-[10px] font-mono ${isOverBudget ? 'text-[#ff6060]' : 'text-[#3ddc84]'}`}>
            {(1.0 - gateSum).toFixed(2)} remaining
          </span>
        </div>
        <div className="w-full h-2 bg-[#0b0e14] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-[#ff6060]' : gateSum > 0.8 ? 'bg-[#ffb454]' : 'bg-[#53c2ff]'
            }`}
            style={{ width: `${Math.min(gateSum * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Route List */}
      <div className="space-y-3">
        {routes.map(route => (
          <div key={route.adapterId} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  route.status === 'quarantined' ? 'bg-[#ff6060]' : 'bg-[#3ddc84]'
                }`} />
                <span className="text-xs font-mono text-[#e0e0e0]">{route.domain}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${
                route.gate === 0 ? 'text-[#4a5568]' : 'text-[#53c2ff]'
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
              className={`w-full h-1 ${route.status === 'quarantined' ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
          </div>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="text-center py-6">
          <span className="text-xs text-[#4a5568] font-mono">No adapters registered</span>
        </div>
      )}
    </div>
  );
}
