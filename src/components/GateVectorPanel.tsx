import type { Adapter } from '../playgroundStore';

interface GateVectorPanelProps {
  adapters: Adapter[];
  onUpdateGate: (domain: string, gate: number) => void;
}

export function GateVectorPanel({ adapters, onUpdateGate }: GateVectorPanelProps) {
  const totalGate = adapters.reduce((sum, a) => sum + a.gate, 0);
  const isOverLimit = totalGate > 1.0;

  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-[#3a3a3a] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Active Gate Vector</h2>
        <div className={`text-sm font-mono ${isOverLimit ? 'text-[#ff453a]' : 'text-[#30d158]'}`}>
          Σ = {totalGate.toFixed(2)}
          {isOverLimit && ' (VIOLATION)'}
        </div>
      </div>

      <div className="space-y-3">
        {adapters.map((adapter) => (
          <div key={adapter.domain} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{adapter.domain}</span>
                {adapter.loaded && (
                  <span className="text-xs text-[#30d158]">●</span>
                )}
              </div>
              <span className="text-sm font-mono text-white">{adapter.gate.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={adapter.gate}
              onChange={(e) => onUpdateGate(adapter.domain, parseFloat(e.target.value))}
              className="w-full h-1 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        ))}
      </div>

      {isOverLimit && (
        <div className="mt-4 p-3 bg-[#ff453a]/10 border border-[#ff453a]/30 rounded-lg">
          <p className="text-xs text-[#ff453a]">
            ⚠ Gate sum exceeds 1.0. Adapters will be scaled down proportionally.
          </p>
        </div>
      )}
    </div>
  );
}
