import type { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

export function LogPanel({ logs }: Props) {
  const severityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-[#ff453a]';
      case 'warning': return 'text-[#ffd60a]';
      case 'doctrine': return 'text-[#0a84ff]';
      default: return 'text-[#8e8e93]';
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-semibold tracking-wider text-[#8e8e93] uppercase">Audit</h2>
        <span className="text-[9px] font-mono text-[#636366]">{logs.length} entries</span>
      </div>
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded p-2.5 h-[140px] overflow-y-auto font-mono text-[10px] leading-relaxed">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[#636366] shrink-0">{formatTime(log.timestamp)}</span>
            <span className={severityColor(log.severity)}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
