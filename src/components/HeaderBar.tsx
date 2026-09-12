import type { BaseLockState } from '../types';

interface Props {
  baseLock: BaseLockState;
}

export function HeaderBar({ baseLock }: Props) {
  const memPercent = (baseLock.memory.total / baseLock.memory.system) * 100;

  return (
    <header className="flex items-center justify-between py-3 px-1 mb-5">
      {/* Left: Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" stroke="#0a84ff" strokeWidth="1.2" fill="none" />
            <circle cx="9" cy="9" r="2" fill="#0a84ff" />
          </svg>
          <span className="text-sm font-semibold text-white tracking-tight">SkillForge</span>
        </div>
        <span className="text-[11px] font-mono text-[#636366]">le-gates</span>
      </div>

      {/* Center: Model + Checksum + Memory */}
      <div className="flex items-center gap-5">
        {/* Model path */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8e8e93]">base</span>
          <span className="text-[11px] font-mono text-white">{baseLock.modelPath.split('/').pop()}</span>
          <span className="text-[10px] font-mono text-[#636366]">bf16</span>
        </div>

        {/* Checksum */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8e8e93]">sha</span>
          <span className="text-[11px] font-mono text-[#8e8e93]">{baseLock.checksum}</span>
        </div>

        {/* Memory */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8e8e93]">mem</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${memPercent > 80 ? 'bg-[#ff453a]' : memPercent > 50 ? 'bg-[#ffd60a]' : 'bg-[#0a84ff]'}`}
                style={{ width: `${memPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-[#8e8e93]">
              {baseLock.memory.total.toFixed(1)}/{baseLock.memory.system} GB
            </span>
          </div>
        </div>
      </div>

      {/* Right: Formula */}
      <div className="text-[11px] font-mono text-[#636366]">
        y = W<sub>base</sub>(x) + Σ<sub>k</sub> g<sub>k</sub>·s<sub>k</sub>·(B<sub>k</sub>A<sub>k</sub>)x
      </div>
    </header>
  );
}
