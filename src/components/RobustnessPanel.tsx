import { useState } from 'react';
import type { ProbeResult } from '../playgroundStore';

interface RobustnessPanelProps {
  probeResults: ProbeResult[];
  isProbing: boolean;
  onRunProbe: (prompt: string) => void;
  onClear: () => void;
}

export function RobustnessPanel({
  probeResults,
  isProbing,
  onRunProbe,
  onClear,
}: RobustnessPanelProps) {
  const [probePrompt, setProbePrompt] = useState('');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const handleRunProbe = (e: React.FormEvent) => {
    e.preventDefault();
    if (probePrompt.trim() && !isProbing) {
      onRunProbe(probePrompt.trim());
      setProbePrompt('');
    }
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-[#3a3a3a] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3a3a3a]">
        <h2 className="text-sm font-semibold text-white">Robustness Probe</h2>
        {probeResults.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-[#8e8e93] hover:text-white px-2 py-1 rounded hover:bg-[#3a3a3a] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Probe Input */}
      <div className="p-4 border-b border-[#3a3a3a]">
        <form onSubmit={handleRunProbe} className="space-y-2">
          <textarea
            value={probePrompt}
            onChange={(e) => setProbePrompt(e.target.value)}
            placeholder="Enter prompt to test robustness (6 samples at temp=0.3)..."
            disabled={isProbing}
            className="w-full bg-[#1e1e1e] text-white text-sm px-3 py-2 rounded border border-[#3a3a3a] focus:outline-none focus:border-[#0a84ff] resize-none disabled:opacity-50"
            rows={3}
          />
          <button
            type="submit"
            disabled={!probePrompt.trim() || isProbing}
            className="w-full bg-[#0a84ff] text-white text-sm px-4 py-2 rounded hover:bg-[#0a75e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProbing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running Probe...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Run Robustness Probe
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {probeResults.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#636366] text-sm">
            No probe results yet
          </div>
        ) : (
          probeResults.map((result) => (
            <div
              key={result.id}
              className="bg-[#1e1e1e] rounded-lg border border-[#3a3a3a] overflow-hidden"
            >
              {/* Result Header */}
              <div
                className="px-4 py-3 cursor-pointer hover:bg-[#2d2d2d] transition-colors"
                onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8e8e93]">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      result.robustnessPass
                        ? 'bg-[#30d158]/10 text-[#30d158]'
                        : 'bg-[#ff453a]/10 text-[#ff453a]'
                    }`}>
                      {result.robustnessScore}/6 {result.robustnessPass ? 'PASS' : 'FAIL'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-[#8e8e93] transition-transform ${
                        expandedResult === result.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-[#8e8e93] line-clamp-2">
                  {result.prompt}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedResult === result.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#3a3a3a]">
                  {/* Greedy Response */}
                  <div className="pt-3">
                    <div className="text-xs text-[#8e8e93] mb-1">Greedy (temp=0.0)</div>
                    <div className="bg-[#2d2d2d] rounded px-3 py-2 text-sm text-white">
                      {result.greedyResponse}
                    </div>
                  </div>

                  {/* Robust Samples */}
                  <div>
                    <div className="text-xs text-[#8e8e93] mb-2">Robust Samples (temp=0.3)</div>
                    <div className="space-y-2">
                      {result.robustSamples.map((sample, idx) => {
                        const matches = sample === result.greedyResponse;
                        return (
                          <div
                            key={idx}
                            className={`rounded px-3 py-2 text-sm border ${
                              matches
                                ? 'bg-[#2d2d2d] border-[#3a3a3a] text-white'
                                : 'bg-[#ff453a]/5 border-[#ff453a]/30 text-[#ff9999]'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#8e8e93]">Sample {idx + 1}</span>
                              {matches ? (
                                <span className="text-xs text-[#30d158]">✓</span>
                              ) : (
                                <span className="text-xs text-[#ff453a]">✗</span>
                              )}
                            </div>
                            <div className="text-xs">{sample}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-[#8e8e93] pt-2 border-t border-[#3a3a3a]">
                    <span>{result.ttft.toFixed(0)}ms TTFT</span>
                    <span>{result.tokensPerSec.toFixed(1)} tok/s</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
