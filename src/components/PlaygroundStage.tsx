import { ChatPanel } from './ChatPanel';
import { GateVectorPanel } from './GateVectorPanel';
import { RobustnessPanel } from './RobustnessPanel';
import { PerformanceFooter } from './PerformanceFooter';
import { usePlayground } from '../playgroundStore';

export function PlaygroundStage() {
  const playground = usePlayground();

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 overflow-hidden">
        {/* Left: Chat + Gate Vector */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
          <ChatPanel
            messages={playground.messages}
            isStreaming={playground.isStreaming}
            systemPrompt={playground.systemPrompt}
            routerMode={playground.routerMode}
            onSendMessage={playground.sendMessage}
            onSetSystemPrompt={playground.setSystemPrompt}
            onSetRouterMode={(mode) => playground.setRouterMode(mode as 'keyword_v3' | 'v3q_diagnostic' | 'oracle')}
            onClear={playground.clearChat}
          />
          <GateVectorPanel
            adapters={playground.adapters}
            onUpdateGate={playground.updateAdapterGate}
          />
        </div>

        {/* Right: Robustness Probe */}
        <div className="flex flex-col overflow-hidden">
          <RobustnessPanel
            probeResults={playground.probeResults}
            isProbing={playground.isProbing}
            onRunProbe={playground.runProbe}
            onClear={playground.clearProbeResults}
          />
        </div>
      </div>

      {/* Bottom: Performance Metrics */}
      <PerformanceFooter metrics={playground.metrics} />
    </div>
  );
}
