import { BaseLockPanel } from './components/BaseLockPanel';
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
    logs,
    verifyChecksum,
    startTraining,
    updateGate,
    quarantineAdapter,
    runEval,
  } = useSkillForge();

  // Get current training loss history
  const trainingAdapter = adapters.find(a => a.status === 'training');
  const lossHistory = trainingAdapter?.lossHistory || [];

  return (
    <div className="min-h-screen bg-[#0b0e14] p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#53c2ff]/10 border border-[#53c2ff]/30 rounded flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14.9282 5V11L8 15L1.07179 11V5L8 1Z" stroke="#53c2ff" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="#53c2ff"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#e0e0e0] tracking-tight">SkillForge</h1>
              <p className="text-[10px] font-mono text-[#4a5568]">Le-Gates Continual Learning Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#12161f] border border-[#232a38] rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ddc84]" />
              <span className="text-[10px] font-mono text-[#8a92a6]">MLX · Apple Silicon</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#12161f] border border-[#232a38] rounded">
              <span className="text-[10px] font-mono text-[#8a92a6]">y = W<sub>base</sub>(x) + Σ<sub>k</sub> g<sub>k</sub>·s<sub>k</sub>·(B<sub>k</sub>A<sub>k</sub>)x</span>
            </div>
          </div>
        </div>

        {/* Doctrine Bar */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'].map(rule => (
            <span
              key={rule}
              className="px-2 py-0.5 bg-[#3ddc84]/5 border border-[#3ddc84]/20 rounded text-[10px] font-mono text-[#3ddc84]"
            >
              {rule} ✓
            </span>
          ))}
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Row 1: Base Lock, Train, Route */}
        <BaseLockPanel baseLock={baseLock} onVerify={verifyChecksum} />
        <TrainPanel isTraining={isTraining} lossHistory={lossHistory} onStartTraining={startTraining} />
        <RoutePanel routes={routes} onUpdateGate={updateGate} />
      </div>

      {/* Row 2: Eval, Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <EvalPanel currentEval={currentEval} onRunEval={runEval} />
        <RegistryPanel adapters={adapters} onQuarantine={quarantineAdapter} />
      </div>

      {/* Row 3: Audit Log */}
      <LogPanel logs={logs} />

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-[#232a38] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#4a5568]">
          SkillForge v0.1.0 · Le-Gates Architecture
        </span>
        <span className="text-[10px] font-mono text-[#4a5568]">
          Forward: y = W<sub>base</sub>(x) + Σ<sub>k</sub> gate<sub>k</sub> · scale<sub>k</sub> · (B<sub>k</sub> @ A<sub>k</sub>) @ x
        </span>
      </footer>
    </div>
  );
}

export default App;
