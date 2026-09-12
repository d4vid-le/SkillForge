import { HeaderBar } from './components/HeaderBar';
import { TrainPanel } from './components/TrainPanel';
import { RoutePanel } from './components/RoutePanel';
import { EvalPanel } from './components/EvalPanel';
import { RegistryPanel } from './components/RegistryPanel';
import { LogPanel } from './components/LogPanel';
import { useSkillForge } from './store';

function App() {
  const {
    baseLock,
    adapters,
    routes,
    isTraining,
    currentEval,
    routerMode,
    hotSwapResult,
    logs,
    verifyChecksum,
    startTraining,
    updateGate,
    quarantineAdapter,
    runEval,
    setRouterMode,
    testHotSwap,
  } = useSkillForge();

  // Current training adapter data
  const trainingAdapter = adapters.find(a => a.status === 'training');

  // Auto-verify checksum on mount
  // (in a real app, this would happen in a useEffect)
  const checksumVerified = baseLock.lastVerified !== '';

  return (
    <div className="min-h-screen bg-[#1e1e1e] px-5 py-4 max-w-[1400px] mx-auto">
      {/* Top bar: model + checksum + memory + formula */}
      <HeaderBar baseLock={baseLock} />

      {/* Main grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Left: Train */}
        <TrainPanel
          isTraining={isTraining}
          lossHistory={trainingAdapter?.lossHistory || []}
          trainingProgress={trainingAdapter?.trainingProgress || null}
          bestCheckpoint={trainingAdapter?.bestCheckpoint || null}
          checksumVerified={checksumVerified}
          onStartTraining={startTraining}
        />

        {/* Right: Route */}
        <RoutePanel
          routes={routes}
          routerMode={routerMode}
          hotSwapResult={hotSwapResult}
          onUpdateGate={updateGate}
          onSetRouterMode={setRouterMode}
          onTestHotSwap={testHotSwap}
        />
      </div>

      {/* Bottom grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Bottom left: Eval */}
        <EvalPanel currentEval={currentEval} onRunEval={runEval} />

        {/* Bottom right: Registry */}
        <RegistryPanel adapters={adapters} onQuarantine={quarantineAdapter} />
      </div>

      {/* Full width: Audit log */}
      <LogPanel logs={logs} />
    </div>
  );
}

export default App;
