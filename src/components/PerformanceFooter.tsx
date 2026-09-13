import type { PerformanceMetrics } from '../playgroundStore';

interface PerformanceFooterProps {
  metrics: PerformanceMetrics;
}

export function PerformanceFooter({ metrics }: PerformanceFooterProps) {
  const memoryPercent = (metrics.memoryUsage.total / metrics.memoryUsage.system) * 100;

  return (
    <div className="bg-[#2d2d2d] border-t border-[#3a3a3a] px-4 py-2">
      <div className="flex items-center justify-between text-xs">
        {/* Left: Performance metrics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#8e8e93]">TTFT:</span>
            <span className="text-white font-mono">{metrics.ttft.toFixed(0)}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8e8e93]">Speed:</span>
            <span className="text-white font-mono">{metrics.tokensPerSec.toFixed(1)} tok/s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8e8e93]">Active:</span>
            <span className="text-white font-mono">{metrics.activeAdapters} adapters</span>
          </div>
        </div>

        {/* Right: Memory usage */}
        <div className="flex items-center gap-3">
          <span className="text-[#8e8e93]">Memory:</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  memoryPercent > 90 ? 'bg-[#ff453a]' : memoryPercent > 70 ? 'bg-[#ffd60a]' : 'bg-[#30d158]'
                }`}
                style={{ width: `${memoryPercent}%` }}
              />
            </div>
            <span className="text-white font-mono">
              {metrics.memoryUsage.total.toFixed(1)} / {metrics.memoryUsage.system.toFixed(1)} GB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
