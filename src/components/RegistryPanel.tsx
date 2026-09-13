import type { AdapterConfig } from '../types';

interface Props {
  adapters: AdapterConfig[];
  onQuarantine: (adapterId: string) => void;
}

export function RegistryPanel({ adapters, onQuarantine }: Props) {
  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">Registry</h2>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-[#636366]">
            {adapters.filter(a => a.status === 'keeper').length} active
          </span>
          <span className="text-[9px] font-mono text-[#636366]">
            {adapters.filter(a => a.status === 'quarantined').length} disabled
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 px-2 py-1 border-b border-[#3a3a3a] mb-0.5">
        <div className="col-span-2 text-[9px] text-[#636366]">domain</div>
        <div className="col-span-2 text-[9px] text-[#636366]">status</div>
        <div className="col-span-1 text-[9px] text-[#636366]">rank</div>
        <div className="col-span-1 text-[9px] text-[#636366]">size</div>
        <div className="col-span-2 text-[9px] text-[#636366]">greedy</div>
        <div className="col-span-2 text-[9px] text-[#636366]">robust</div>
        <div className="col-span-2 text-[9px] text-[#636366] text-right">action</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-0.5 flex-1 overflow-y-auto max-h-[220px]">
        {adapters.map(adapter => {
          const isQuarantined = adapter.status === 'quarantined';
          const isTraining = adapter.status === 'training';

          return (
            <div
              key={adapter.id}
              className={`grid grid-cols-12 gap-1 px-2 py-1.5 rounded items-center row-hover transition-opacity ${
                isQuarantined ? 'quarantined' : ''
              }`}
            >
              {/* Domain */}
              <div className="col-span-2">
                <span className="text-[10px] font-mono text-white truncate">
                  {adapter.domain}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono ${
                  adapter.status === 'keeper'
                    ? 'text-[#8e8e93] bg-[#3a3a3a]/50'
                    : adapter.status === 'quarantined'
                    ? 'text-[#636366] bg-[#3a3a3a]/30 line-through'
                    : adapter.status === 'training'
                    ? 'text-[#0a84ff] bg-[#0a84ff]/10'
                    : 'text-[#8e8e93] bg-[#3a3a3a]/50'
                }`}>
                  {adapter.status === 'keeper' ? 'keeper' :
                   adapter.status === 'quarantined' ? 'disabled' :
                   adapter.status === 'training' ? 'training' : 'archived'}
                </span>
              </div>

              {/* Rank */}
              <div className="col-span-1">
                <span className="text-[10px] font-mono text-[#8e8e93]">{adapter.rank}</span>
              </div>

              {/* Size */}
              <div className="col-span-1">
                <span className="text-[10px] font-mono text-[#8e8e93]">
                  {adapter.sizeMB > 0 ? `${adapter.sizeMB}M` : '—'}
                </span>
              </div>

              {/* Greedy (vs base) */}
              <div className="col-span-2">
                {adapter.greedyScore !== null ? (
                  <div>
                    <span className="text-[10px] font-mono text-white">{adapter.greedyScore.toFixed(3)}</span>
                    <span className="text-[9px] font-mono text-[#636366] ml-1">
                      ({adapter.baseGreedy.toFixed(2)})
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-[#636366]">—</span>
                )}
              </div>

              {/* Robust (vs base) */}
              <div className="col-span-2">
                {adapter.robustScore !== null ? (
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-mono ${
                      adapter.robustPass ? 'text-white' : 'text-[#ff453a]'
                    }`}>
                      {adapter.robustScore.toFixed(3)}
                    </span>
                    <span className="text-[9px] font-mono text-[#636366]">
                      ({adapter.baseRobust.toFixed(2)})
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-[#636366]">—</span>
                )}
              </div>

              {/* Action */}
              <div className="col-span-2 text-right">
                {adapter.status === 'keeper' && (
                  <button
                    onClick={() => onQuarantine(adapter.id)}
                    className="px-2 py-0.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded text-[9px] font-mono text-[#8e8e93] transition-colors"
                  >
                    disable
                  </button>
                )}
                {adapter.status === 'quarantined' && (
                  <span className="text-[9px] font-mono text-[#636366]">gate → 0.0</span>
                )}
                {isTraining && (
                  <span className="text-[9px] font-mono text-[#0a84ff]">
                    {adapter.trainingProgress
                      ? `${adapter.trainingProgress.step}/${adapter.trainingProgress.total}`
                      : '...'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {adapters.length === 0 && (
        <div className="text-center py-8 flex-1 flex items-center justify-center">
          <span className="text-[11px] text-[#636366] font-mono">no adapters</span>
        </div>
      )}
    </div>
  );
}
