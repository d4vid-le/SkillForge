import { useState } from 'react';
import { DataStage } from './components/DataStage';
import { ForgeStage } from './components/ForgeStage';

type Stage = 'data' | 'forge';

function App() {
  const [stage, setStage] = useState<Stage>('data');

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      {/* Navigation */}
      <nav className="border-b border-[#3a3a3a] bg-[#2d2d2d]">
        <div className="max-w-[1400px] mx-auto px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" stroke="#0a84ff" strokeWidth="1.2" fill="none" />
                <circle cx="9" cy="9" r="2" fill="#0a84ff" />
              </svg>
              <span className="text-sm font-semibold text-white tracking-tight">SkillForge</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => setStage('data')}
                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                  stage === 'data'
                    ? 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                Data
              </button>
              <button
                onClick={() => setStage('forge')}
                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                  stage === 'forge'
                    ? 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/30'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                Forge
              </button>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[#636366]">
            {stage === 'data' ? 'Stage 1: Data Pipeline' : 'Stage 2: Training Engine'}
          </div>
        </div>
      </nav>

      {/* Stage Content */}
      {stage === 'data' ? <DataStage /> : <ForgeStage />}
    </div>
  );
}

export default App;
