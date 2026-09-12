import { type BaseLockState } from '../types';

interface Props {
  baseLock: BaseLockState;
  onVerify: () => void;
}

export function BaseLockPanel({ baseLock, onVerify }: Props) {
  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Base Lock</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold ${
          baseLock.isFrozen 
            ? 'bg-[#3ddc84]/10 text-[#3ddc84] border border-[#3ddc84]/30' 
            : 'bg-[#ff6060]/10 text-[#ff6060] border border-[#ff6060]/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${baseLock.isFrozen ? 'bg-[#3ddc84]' : 'bg-[#ff6060]'}`} />
          {baseLock.isFrozen ? 'FROZEN' : 'UNLOCKED'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8a92a6]">Model Path</span>
          <span className="font-mono text-xs text-[#e0e0e0] truncate max-w-[240px]">{baseLock.modelPath}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8a92a6]">Precision</span>
          <span className={`font-mono text-xs font-bold ${
            baseLock.precision === 'bf16' ? 'text-[#3ddc84]' : 'text-[#ff6060]'
          }`}>
            {baseLock.precision.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8a92a6]">Checksum</span>
          <span className="font-mono text-xs text-[#53c2ff]">{baseLock.checksum.slice(0, 16)}...</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8a92a6]">Last Verified</span>
          <span className="font-mono text-xs text-[#8a92a6]">
            {new Date(baseLock.lastVerified).toLocaleTimeString()}
          </span>
        </div>

        <div className="pt-2 border-t border-[#232a38]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8a92a6]">R1 Enforcement</span>
            <span className="text-xs font-mono text-[#3ddc84]">✓ ACTIVE</span>
          </div>
          <button
            onClick={onVerify}
            className="w-full py-2 px-3 bg-[#232a38] hover:bg-[#2d3548] border border-[#3a4255] rounded text-xs font-mono text-[#53c2ff] transition-colors"
          >
            Verify Checksum
          </button>
        </div>
      </div>
    </div>
  );
}
