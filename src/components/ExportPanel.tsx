interface Props {
  keptCount: number;
  isExporting: boolean;
  onExport: () => void;
}

export function ExportPanel({ keptCount, isExporting, onExport }: Props) {
  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase mb-1">
            Export
          </h2>
          <p className="text-[10px] text-[#636366]">
            {keptCount} rows ready for MLX/Unsloth SFT training
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 bg-[#0a84ff] text-white rounded text-[11px] font-semibold hover:bg-[#0a75e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 20H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Clean Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}
