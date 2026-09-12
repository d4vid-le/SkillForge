interface Props {
  logs: string[];
}

export function LogPanel({ logs }: Props) {
  return (
    <div className="bg-[#12161f] border border-[#232a38] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-wider text-[#8a92a6] uppercase">Audit Log</h2>
        <span className="text-[10px] font-mono text-[#8a92a6]">R8 ACTIVE</span>
      </div>
      <div className="bg-[#0b0e14] border border-[#232a38] rounded p-3 h-[160px] overflow-y-auto font-mono text-[10px] leading-relaxed">
        {logs.map((log, i) => (
          <div key={i} className={`${
            log.includes('[BLOCKED]') ? 'text-[#ff6060]' :
            log.includes('[PASS]') ? 'text-[#3ddc84]' :
            log.includes('[QUARANTINE]') || log.includes('QUARANTINED') ? 'text-[#ff6060]' :
            log.includes('[R1]') || log.includes('[R5]') || log.includes('[R6]') ? 'text-[#3ddc84]' :
            log.includes('[TRAIN]') || log.includes('[ROUTE]') ? 'text-[#53c2ff]' :
            log.includes('[EVAL]') ? 'text-[#ffb454]' :
            'text-[#8a92a6]'
          }`}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
