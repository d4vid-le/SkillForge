import { useRef } from 'react';
import type { ProcessingConfig, ProcessingStats } from '../types';

interface Props {
  isProcessing: boolean;
  fileName: string;
  config: ProcessingConfig;
  stats: ProcessingStats | null;
  onProcess: (file: File) => void;
  onConfigChange: (config: ProcessingConfig) => void;
}

export function UploadPanel({
  isProcessing, fileName, config, stats, onProcess, onConfigChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onProcess(file);
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">
          Ingest
        </h2>
        {fileName && (
          <span className="text-[10px] font-mono text-[#8e8e93]">{fileName}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Upload zone */}
        <div className="lg:col-span-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jsonl,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-6 border border-dashed border-[#3a3a3a] hover:border-[#0a84ff] rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] text-[#8e8e93]">Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#636366] group-hover:text-[#0a84ff] transition-colors">
                  <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 16.7428C21.3763 15.7566 22.25 14.1549 22.25 12.3856C22.25 9.3801 19.8999 7 17 7H16.7276C16.3614 4.73728 14.3894 3 12 3C9.61063 3 7.63863 4.73728 7.27243 7H7C4.1001 7 1.75 9.3801 1.75 12.3856C1.75 14.1549 2.62371 15.7566 4 16.7428" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] text-[#8e8e93]">Upload JSONL</span>
              </div>
            )}
          </button>
        </div>

        {/* Config */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-[#636366] mb-1">domain</label>
              <input
                type="text"
                value={config.domain}
                onChange={e => onConfigChange({ ...config, domain: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#0a84ff]"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#636366] mb-1">max_seq_length</label>
              <input
                type="number"
                value={config.maxSeqLength}
                onChange={e => onConfigChange({ ...config, maxSeqLength: parseInt(e.target.value) || 1024 })}
                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#0a84ff]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.deduplicate}
                onChange={e => onConfigChange({ ...config, deduplicate: e.target.checked })}
                className="w-3 h-3 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-[#0a84ff]"
              />
              <span className="text-[10px] text-[#8e8e93]">deduplicate</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoFormat}
                onChange={e => onConfigChange({ ...config, autoFormat: e.target.checked })}
                className="w-3 h-3 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-[#0a84ff]"
              />
              <span className="text-[10px] text-[#8e8e93]">auto-format</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.domainPurityCheck}
                onChange={e => onConfigChange({ ...config, domainPurityCheck: e.target.checked })}
                className="w-3 h-3 rounded border-[#3a3a3a] bg-[#1e1e1e] accent-[#0a84ff]"
              />
              <span className="text-[10px] text-[#8e8e93]">purity check</span>
            </label>
          </div>

          {/* Stats summary */}
          {stats && (
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#3a3a3a]">
              <div className="text-center">
                <div className="text-[9px] text-[#636366]">total</div>
                <div className="text-[12px] font-mono text-white">{stats.totalRows}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-[#636366]">dupes</div>
                <div className="text-[12px] font-mono text-[#ffd60a]">{stats.duplicates}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-[#636366]">over-len</div>
                <div className="text-[12px] font-mono text-[#ffd60a]">{stats.overLength}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-[#636366]">format</div>
                <div className="text-[12px] font-mono text-[#ffd60a]">{stats.formatInvalid}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-[#636366]">domain</div>
                <div className="text-[12px] font-mono text-[#ffd60a]">{stats.domainFlagged}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
