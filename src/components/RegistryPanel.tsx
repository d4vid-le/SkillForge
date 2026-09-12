import type { AdapterConfig } from '../types';

interface Props {
  adapters: AdapterConfig[];
  onQuarantine: (adapterId: string) => void;
}

export function RegistryPanel({ adapters, onQuarantine }: Props) {
  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Registry</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#8a92a6]">
            {adapters.filter(a => a.status === 'keeper').length} keeper
          </span>
          <span className="text-[10px] font-mono text-[#ff6060]">
            {adapters.filter(a => a.status === 'quarantined').length} quarantined
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-2 py-1.5 border-b border-[#232a38] mb-1">
        <div className="col-span-3 text-[10px] text-[#8a92a6] uppercase">Domain</div>
        <div className="col-span-2 text-[10px] text-[#8a92a6] uppercase">Status</div>
        <div className="col-span-2 text-[10px] text-[#8a92a6] uppercase">Greedy</div>
        <div className="col-span-2 text-[10px] text-[#8a92a6] uppercase">Robust</div>
        <div className="col-span-3 text-[10px] text-[#8a92a6] uppercase text-right">Action</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
        {adapters.map(adapter => (
          <div
            key={adapter.id}
            className={`grid grid-cols-12 gap-2 px-2 py-2 rounded items-center transition-colors ${
              adapter.status === 'quarantined' 
                ? 'bg-[#ff6060]/5 hover:bg-[#ff6060]/10' 
                : 'hover:bg-[#232a38]/50'
            }`}
          >
            <div className="col-span-3">
              <span className="text-xs font-mono text-[#e0e0e0] truncate">{adapter.domain}</span>
            </div>
            <div className="col-span-2">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                adapter.status === 'keeper' 
                  ? 'bg-[#3ddc84]/10 text-[#3ddc84]' 
                  : adapter.status === 'quarantined'
                  ? 'bg-[#ff6060]/10 text-[#ff6060]'
                  : adapter.status === 'training'
                  ? 'bg-[#53c2ff]/10 text-[#53c2ff]'
                  : 'bg-[#ffb454]/10 text-[#ffb454]'
              }`}>
                {adapter.status === 'keeper' ? 'KEEPER' : 
                 adapter.status === 'quarantined' ? 'QUAR' :
                 adapter.status === 'training' ? 'TRAIN' : 'EVAL'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-mono text-[#8a92a6]">
                {adapter.greedyScore !== null ? adapter.greedyScore.toFixed(3) : '—'}
              </span>
            </div>
            <div className="col-span-2">
              <span className={`text-xs font-mono ${
                adapter.robustPass === true ? 'text-[#3ddc84]' :
                adapter.robustPass === false ? 'text-[#ff6060]' : 'text-[#8a92a6]'
              }`}>
                {adapter.robustScore !== null ? adapter.robustScore.toFixed(3) : '—'}
              </span>
            </div>
            <div className="col-span-3 text-right">
              {adapter.status === 'keeper' && (
                <button
                  onClick={() => onQuarantine(adapter.id)}
                  className="px-2 py-1 bg-[#ff6060]/10 hover:bg-[#ff6060]/20 border border-[#ff6060]/30 rounded text-[10px] font-mono text-[#ff6060] transition-colors"
                >
                  Quarantine
                </button>
              )}
              {adapter.status === 'quarantined' && (
                <span className="text-[10px] font-mono text-[#4a5568]">GATED → 0.0</span>
              )}
              {adapter.status === 'training' && (
                <span className="text-[10px] font-mono text-[#53c2ff] animate-pulse-cyan">●●●</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {adapters.length === 0 && (
        <div className="text-center py-8">
          <span className="text-xs text-[#4a5568] font-mono">No adapters in registry</span>
        </div>
      )}

      {/* R4 Badge */}
      <div className="mt-3 flex items-center justify-between px-2 py-1.5 bg-[#0b0e14] border border-[#232a38] rounded">
        <span className="text-[10px] text-[#8a92a6]">R4 QUARANTINE</span>
        <span className="text-[10px] font-mono text-[#3ddc84]">✓ ENFORCED</span>
      </div>
    </div>
  );
}
