"use client";
import DroneScene from '../components/DroneScene';
import { useDroneStore, INVENTORY } from '../components/store';
import { useStore } from 'zustand';

export default function BuilderPage() {
  const parts = useDroneStore((s) => s.parts);
  const activePartId = useDroneStore((s) => s.activePartId);
  const isCarrying = useDroneStore((s) => s.isCarrying);
  
  const spawnPart = useDroneStore((s) => s.spawnPart);
  const lockActivePart = useDroneStore((s) => s.lockActivePart);
  const setPartHeight = useDroneStore((s) => s.setPartHeight);
  const rotateActivePart = useDroneStore((s) => s.rotateActivePart);

  // Undo/Redo
  const { undo, redo, pastStates, futureStates } = useStore(useDroneStore.temporal, (state) => state);
  const historyDepth = pastStates.length;
  const futureDepth = futureStates.length;

  // Active Part Data
  const activePart = parts.find(p => p.id === activePartId);
  const currentHeight = activePart ? activePart.position[1] : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans relative">
      
      {/* 1. SIDEBAR INVENTORY */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-10 relative shadow-xl">
        <div className="p-4 border-b border-gray-800">
          <h1 className="font-bold text-xl tracking-wider">DRONE LAB <span className="text-blue-500 text-xs align-top">PRO</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Frames */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Frames</h3>
            <div className="grid grid-cols-2 gap-2">
              {INVENTORY.frames.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => spawnPart(item.type)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-xs text-center border border-transparent hover:border-blue-500 transition-all group"
                >
                  <div className="w-full h-10 bg-gray-900/50 rounded mb-1 flex items-center justify-center text-xl">⬜</div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Propulsion */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Propulsion</h3>
            <div className="grid grid-cols-2 gap-2">
              {INVENTORY.propulsion.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => spawnPart(item.type)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-xs text-center border border-transparent hover:border-blue-500 transition-all group"
                >
                   <div className="w-full h-10 bg-gray-900/50 rounded mb-1 flex items-center justify-center text-xl">⚡</div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Undo Controls */}
        <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-2 bg-gray-900">
          <button onClick={() => undo()} disabled={historyDepth === 0} className="bg-gray-800 py-2 rounded text-xs hover:bg-gray-700 disabled:opacity-30">↩ Undo</button>
          <button onClick={() => redo()} disabled={futureDepth === 0} className="bg-gray-800 py-2 rounded text-xs hover:bg-gray-700 disabled:opacity-30">Redo ↪</button>
        </div>
      </div>

      {/* 2. MAIN 3D AREA */}
      <div className="flex-1 relative bg-slate-900">
        <DroneScene />
        
        {/* Helper when empty */}
        {parts.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-center">
            <div className="text-4xl mb-2">✥</div>
            <p className="text-sm">Select a part to begin assembly</p>
          </div>
        )}

        {/* 3. RESTORED BOTTOM CONTROL BAR */}
        {activePartId && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-[600px] max-w-full">
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 shadow-2xl flex items-center gap-6">
              
              {/* Height Slider */}
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                  <span>Elevation</span>
                  <span className="text-blue-400 font-mono">{currentHeight.toFixed(2)}m</span>
                </div>
                <input 
                  type="range" min="0" max="2.0" step="0.01"
                  value={currentHeight}
                  onChange={(e) => setPartHeight(activePartId, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Rotate */}
              <button 
                onClick={rotateActivePart}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center transition-all active:scale-95 text-lg"
                title="Rotate 45°"
              >
                ⟳
              </button>

              {/* LOCK BUTTON - This fixes the 'freely moving' issue */}
              <button
                onClick={lockActivePart}
                className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2
                  ${isCarrying 
                    ? "bg-blue-600 hover:bg-blue-500 text-white animate-pulse" // Blue pulsing when carrying
                    : "bg-green-600 hover:bg-green-500 text-white"} // Green when placed
                `}
              >
                {isCarrying ? "⇩ Place Part" : "✓ Done"}
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}