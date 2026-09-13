import { HeaderBar } from './HeaderBar';
import { TrainPanel } from './TrainPanel';
import { RoutePanel } from './RoutePanel';
import { EvalPanel } from './EvalPanel';
import { RegistryPanel } from './RegistryPanel';
import { LogPanel } from './LogPanel';
import { useSkillForge } from '../store';

export function ForgeStage() {
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

  const trainingAdapter = adapters.find(a => a.status === 'training');
  const checksumVerified = baseLock.lastVerified !== '';

  return (
    <div className="px-5 py-4 max-w-[1400px] mx-auto">
      <HeaderBar baseLock={baseLock} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <TrainPanel
          isTraining={isTraining}
          lossHistory={trainingAdapter?.lossHistory || []}
          trainingProgress={trainingAdapter?.trainingProgress || null}
          bestCheckpoint={trainingAdapter?.bestCheckpoint || null}
          checksumVerified={checksumVerified}
          onStartTraining={startTraining}
        />
        <RoutePanel
          routes={routes}
          routerMode={routerMode}
          hotSwapResult={hotSwapResult}
          onUpdateGate={updateGate}
          onSetRouterMode={setRouterMode}
          onTestHotSwap={testHotSwap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <EvalPanel currentEval={currentEval} onRunEval={runEval} />
        <RegistryPanel adapters={adapters} onQuarantine={quarantineAdapter} />
      </div>

      <LogPanel logs={logs} />
    </div>
  );
}
