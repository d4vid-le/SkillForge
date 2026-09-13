import type { CleanedRow } from '../types';

interface Props {
  rows: CleanedRow[];
  filter: 'all' | 'kept' | 'rejected' | 'flagged';
  editingId: string | null;
  editBuffer: { prompt: string; target: string };
  onFilterChange: (filter: 'all' | 'kept' | 'rejected' | 'flagged') => void;
  onKeep: (id: string) => void;
  onReject: (id: string) => void;
  onStartEdit: (id: string) => void;
  onEditBufferChange: (buffer: { prompt: string; target: string }) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function highlightFormat(text: string) {
  // Split on <think> and </think> and <answer> and </answer> tags
  const parts = text.split(/(<\/?think>|<\/?answer>)/g);
  let mode: 'normal' | 'think' | 'answer' = 'normal';
  
  return parts.map((part, i) => {
    if (part === '<think>') {
      mode = 'think';
      return <span key={i} className="text-[#636366] text-[9px] font-mono">{'<think>'}</span>;
    }
    if (part === '</think>') {
      mode = 'normal';
      return <span key={i} className="text-[#636366] text-[9px] font-mono">{'</think>'}</span>;
    }
    if (part === '<answer>') {
      mode = 'answer';
      return <span key={i} className="text-[#636366] text-[9px] font-mono">{'<answer>'}</span>;
    }
    if (part === '</answer>') {
      mode = 'normal';
      return <span key={i} className="text-[#636366] text-[9px] font-mono">{'</answer>'}</span>;
    }
    if (mode === 'think') {
      return <span key={i} className="text-[#636366] italic">{part}</span>;
    }
    if (mode === 'answer') {
      return <span key={i} className="text-[#0a84ff] font-medium">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ReviewQueue({
  rows, filter, editingId, editBuffer,
  onFilterChange, onKeep, onReject, onStartEdit,
  onEditBufferChange, onSaveEdit, onCancelEdit,
}: Props) {
  const filterCounts = {
    all: rows.length,
    kept: rows.filter(r => r.status === 'kept').length,
    flagged: rows.filter(r => r.status === 'flagged').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">
          Review Queue
        </h2>
        <div className="flex items-center gap-1">
          {(['all', 'kept', 'flagged', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                filter === f
                  ? 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30'
                  : 'text-[#636366] hover:text-[#8e8e93]'
              }`}
            >
              {f}
              <span className="ml-1 text-[9px] opacity-60">
                {f === 'all' ? rows.length : filterCounts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row cards */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {rows.map(row => {
          const isEditing = editingId === row.id;
          const isRejected = row.status === 'rejected';

          return (
            <div
              key={row.id}
              className={`bg-[#1e1e1e] border rounded-lg p-3 transition-all ${
                isRejected
                  ? 'border-[#ff453a]/20 opacity-40'
                  : row.status === 'flagged'
                  ? 'border-[#ffd60a]/30'
                  : 'border-[#3a3a3a]'
              }`}
            >
              {/* Header: ID + metadata */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[#636366]">{row.id}</span>
                  <span className="text-[9px] font-mono text-[#636366]">{row.tokenCount} tok</span>
                  {row.flags.map(flag => (
                    <span
                      key={flag}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                        flag === 'duplicate' ? 'bg-[#ffd60a]/10 text-[#ffd60a]' :
                        flag === 'format-invalid' ? 'bg-[#ff453a]/10 text-[#ff453a]' :
                        flag === 'exceeds-length' ? 'bg-[#ff453a]/10 text-[#ff453a]' :
                        'bg-[#0a84ff]/10 text-[#0a84ff]'
                      }`}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {row.status === 'kept' && (
                    <span className="text-[9px] font-mono text-[#30d158]">kept</span>
                  )}
                  {row.status === 'flagged' && (
                    <span className="text-[9px] font-mono text-[#ffd60a]">flagged</span>
                  )}
                  {row.status === 'rejected' && (
                    <span className="text-[9px] font-mono text-[#ff453a]">rejected</span>
                  )}
                </div>
              </div>

              {/* Content */}
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-[#636366] mb-1">prompt</label>
                    <textarea
                      value={editBuffer.prompt}
                      onChange={e => onEditBufferChange({ ...editBuffer, prompt: e.target.value })}
                      rows={2}
                      className="w-full bg-[#2d2d2d] border border-[#3a3a3a] rounded px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#0a84ff] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#636366] mb-1">target</label>
                    <textarea
                      value={editBuffer.target}
                      onChange={e => onEditBufferChange({ ...editBuffer, target: e.target.value })}
                      rows={4}
                      className="w-full bg-[#2d2d2d] border border-[#3a3a3a] rounded px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-[#0a84ff] resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onSaveEdit}
                      className="px-3 py-1 bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 rounded text-[10px] font-mono hover:bg-[#30d158]/25 transition-colors"
                    >
                      save
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="px-3 py-1 bg-[#3a3a3a] text-[#8e8e93] rounded text-[10px] font-mono hover:bg-[#4a4a4a] transition-colors"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="text-[9px] text-[#636366] mb-0.5">prompt</div>
                    <div className="text-[11px] text-white leading-relaxed">
                      {row.editedPrompt}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#636366] mb-0.5">target</div>
                    <div className="text-[11px] text-[#8e8e93] leading-relaxed">
                      {highlightFormat(row.editedTarget)}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isEditing && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#3a3a3a]">
                  <button
                    onClick={() => onKeep(row.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                      row.status === 'kept'
                        ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30'
                        : 'bg-[#3a3a3a] text-[#8e8e93] hover:bg-[#30d158]/15 hover:text-[#30d158]'
                    }`}
                  >
                    keep
                  </button>
                  <button
                    onClick={() => onReject(row.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                      row.status === 'rejected'
                        ? 'bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30'
                        : 'bg-[#3a3a3a] text-[#8e8e93] hover:bg-[#ff453a]/15 hover:text-[#ff453a]'
                    }`}
                  >
                    reject
                  </button>
                  <button
                    onClick={() => onStartEdit(row.id)}
                    className="px-2.5 py-1 bg-[#3a3a3a] text-[#8e8e93] rounded text-[10px] font-mono hover:bg-[#0a84ff]/15 hover:text-[#0a84ff] transition-colors"
                  >
                    edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12">
          <span className="text-[11px] text-[#636366] font-mono">
            {filter === 'all' ? 'No rows to review' : `No ${filter} rows`}
          </span>
        </div>
      )}
    </div>
  );
}
