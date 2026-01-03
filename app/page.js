"use client";
import DroneScene from '../components/DroneScene';
import { useDroneStore } from '../components/store';

export default function BuilderPage() {
  const parts = useDroneStore((s) => s.parts);
  const currentStep = useDroneStore((s) => s.currentStep);
  const buildSequence = useDroneStore((s) => s.buildSequence);
  const spawnPart = useDroneStore((s) => s.spawnPart);
  const lockPart = useDroneStore((s) => s.lockPart);
  const rotateActivePart = useDroneStore((s) => s.rotateActivePart);
  const setPartHeight = useDroneStore((s) => s.setPartHeight);
  const activePartId = useDroneStore((s) => s.activePartId);
  const isCarrying = useDroneStore((s) => s.isCarrying);
  const reset = useDroneStore((s) => s.reset);

  const currentTask = buildSequence[currentStep];
  const isFinished = currentStep >= buildSequence.length;

  // Get current height for the slider
  const activePart = parts.find(p => p.id === activePartId);
  const currentHeight = activePart ? activePart.position[1] : 0;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white font-sans relative">
      
      {/* 3D SCENE (Full Screen Background) */}
      <div className="absolute inset-0 z-0">
        <DroneScene />
      </div>

      {/* --- TOP LEFT INFO PANEL --- */}
      <div className="absolute top-6 left-6 z-10 w-64">
        <div className="p-4 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Task {currentStep + 1} / {buildSequence.length}
          </div>
          <div className="text-xl font-bold text-white mb-2">{currentTask?.label || "Done"}</div>
          
          {!isFinished && !activePartId && (
            <button
              onClick={spawnPart}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all animate-pulse"
            >
              + Spawn Part
            </button>
          )}

          {isFinished && (
            <button onClick={reset} className="w-full py-2 bg-gray-700 hover:bg-white hover:text-black rounded transition-all">
              Reset Builder
            </button>
          )}
        </div>
      </div>

      {/* --- FLOATING BOTTOM CONTROL BAR --- */}
      {/* Only visible when a part is active */}
      {activePartId && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-[90%] max-w-2xl">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 shadow-2xl flex items-center gap-6">
            
            {/* 1. HEIGHT SLIDER */}
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">
                <span>Elevation (Lift)</span>
                <span className="text-blue-400 font-mono">{currentHeight.toFixed(2)}m</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5.0" 
                step="0.01"
                value={currentHeight}
                onChange={(e) => setPartHeight(activePartId, parseFloat(e.target.value))}
                className="w-full h-4 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              />
            </div>

            {/* DIVIDER */}
            <div className="w-px h-10 bg-gray-700"></div>

            {/* 2. ROTATE BUTTON */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Orientation</span>
              <button 
                onClick={rotateActivePart}
                className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center text-xl transition-all active:scale-95"
                title="Rotate 45 degrees"
              >
                ⟳
              </button>
            </div>

            {/* DIVIDER */}
            <div className="w-px h-10 bg-gray-700"></div>

            {/* 3. LOCK BUTTON */}
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Finish</span>
              <button
                onClick={lockPart}
                disabled={isCarrying} 
                className={`w-full py-3 px-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                  ${isCarrying 
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700" 
                    : "bg-green-600 hover:bg-green-500 text-white shadow-green-500/20 active:scale-95"}
                `}
              >
                {isCarrying ? "Drop First" : "✓ Lock"}
              </button>
            </div>

          </div>
          
          {/* Helper Text Below Bar */}
          <div className="text-center mt-3 text-xs text-white/50 text-shadow-sm">
            {isCarrying ? "Part follows mouse... Click to drop." : "Drag part to move X/Z. Use slider for Height."}
          </div>
        </div>
      )}

    </div>
  );
}