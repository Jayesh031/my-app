"use client";
import { useState } from 'react';
import DroneScene from '../components/DroneScene';
import { useDroneStore } from '../components/store';

export default function BuilderPage() {
  const currentStep = useDroneStore((s) => s.currentStep);
  const buildSequence = useDroneStore((s) => s.buildSequence);
  const spawnPart = useDroneStore((s) => s.spawnPart);
  const lockPart = useDroneStore((s) => s.lockPart);
  const activePartId = useDroneStore((s) => s.activePartId);
  const reset = useDroneStore((s) => s.reset);

  // Toggle between Move and Rotate
  const [controlMode, setControlMode] = useState('translate'); 

  const currentTask = buildSequence[currentStep];
  const isFinished = currentStep >= buildSequence.length;

  return (
    <div className="flex h-screen w-screen flex-row overflow-hidden bg-black text-white font-sans">
      
      {/* --- SIDEBAR --- */}
      <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900/90 z-10 p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Drone Lab 2.0</h1>

        <div className="flex-1">
          {!isFinished ? (
            <div className="space-y-6">
              
              {/* Info Panel */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Current Task</div>
                <div className="text-xl font-bold text-white">{currentTask.label}</div>
                <div className="text-xs text-blue-300 mt-2">
                  Step {currentStep + 1} of {buildSequence.length}
                </div>
              </div>

              {/* CONTROLS */}
              {!activePartId ? (
                // STATE 1: Ready to Spawn
                <button
                  onClick={spawnPart}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                  + Spawn Part
                </button>
              ) : (
                // STATE 2: Part is Active (Drag/Rotate/Lock)
                <div className="space-y-3 animate-fade-in">
                  
                  {/* Mode Toggles */}
                  <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setControlMode('translate')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${controlMode === 'translate' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                    >
                      Move (T)
                    </button>
                    <button 
                      onClick={() => setControlMode('rotate')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${controlMode === 'rotate' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                    >
                      Rotate (R)
                    </button>
                  </div>

                  <div className="text-xs text-center text-gray-500 py-2">
                    Adjust position using the gizmo.<br/>
                    Double-click part if you lose selection.
                  </div>

                  {/* Lock Button */}
                  <button
                    onClick={lockPart}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔒 Lock Position</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Drone Complete!</h2>
              <button onClick={reset} className="text-gray-400 underline hover:text-white">Start Over</button>
            </div>
          )}
        </div>
      </div>

      {/* --- 3D CANVAS --- */}
      <div className="flex-1 relative">
        <DroneScene controlMode={controlMode} />
        
        {/* Helper Overlay */}
        <div className="absolute top-5 right-5 text-right pointer-events-none opacity-50">
          <div className="text-xs text-white">Left Click: Select Gizmo</div>
          <div className="text-xs text-white">Double Click: Select Part</div>
          <div className="text-xs text-white">Right Click: Pan Camera</div>
        </div>
      </div>
    </div>
  );
}