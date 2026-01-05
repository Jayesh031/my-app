"use client";
import DroneScene from '../components/DroneScene';
import { useDroneStore, INVENTORY } from '../components/store';
import { useStore } from 'zustand';

export default function BuilderPage() {
  const parts = useDroneStore((s) => s.parts);
  const activePartId = useDroneStore((s) => s.activePartId);
  const isCarrying = useDroneStore((s) => s.isCarrying);
  
  // NEW: Get the Drag Action
  const setDraggedPartType = useDroneStore((s) => s.setDraggedPartType);

  const lockActivePart = useDroneStore((s) => s.lockActivePart);
  const setPartHeight = useDroneStore((s) => s.setPartHeight);
  const rotateActivePart = useDroneStore((s) => s.rotateActivePart);

  // Undo/Redo
  const { undo, redo, pastStates, futureStates } = useStore(useDroneStore.temporal, (state) => state);
  const historyDepth = pastStates.length;
  const futureDepth = futureStates.length;

  const activePart = parts.find(p => p.id === activePartId);
  const currentHeight = activePart ? activePart.position[1] : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans relative">
      
      {/* SIDEBAR INVENTORY */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-10 relative shadow-xl">
        <div className="p-4 border-b border-gray-800">
          <h1 className="font-bold text-xl tracking-wider">DRONE LAB <span className="text-blue-500 text-xs align-top">PRO</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Loop through Categories */}
          {Object.entries(INVENTORY).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    // 1. MAKE DRAGGABLE
                    draggable={true}
                    // 2. SET STORE ON DRAG START
                    onDragStart={(e) => {
                      setDraggedPartType(item.type);
                      // Optional: Set a drag image if you want
                    }}
                    onDragEnd={() => setDraggedPartType(null)}
                    className="cursor-grab active:cursor-grabbing bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-xs text-center border border-transparent hover:border-blue-500 transition-all group"
                  >
                    <div className="w-full h-10 bg-gray-900/50 rounded mb-1 flex items-center justify-center text-xl">
                      {item.type === 'motor' ? '⚡' : '⬜'}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-2 bg-gray-900">
          <button onClick={() => undo()} disabled={historyDepth === 0} className="bg-gray-800 py-2 rounded text-xs hover:bg-gray-700 disabled:opacity-30">↩ Undo</button>
          <button onClick={() => redo()} disabled={futureDepth === 0} className="bg-gray-800 py-2 rounded text-xs hover:bg-gray-700 disabled:opacity-30">Redo ↪</button>
        </div>
      </div>

      {/* MAIN 3D AREA */}
      <div className="flex-1 relative bg-slate-900">
        <DroneScene />
        
        {parts.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-center">
            <div className="text-4xl mb-2">✥</div>
            <p className="text-sm">Drag parts from the sidebar to build</p>
          </div>
        )}

        {/* CONTROL BAR (Only visible when active) */}
        {activePartId && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-[600px] max-w-full">
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 shadow-2xl flex items-center gap-6">
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
              <button onClick={rotateActivePart} className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center transition-all active:scale-95 text-lg">⟳</button>
              <button onClick={lockActivePart} disabled={isCarrying} className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${isCarrying ? "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600" : "bg-green-600 hover:bg-green-500 text-white"}`}>
                ✓ Lock
              </button>
            </div>
            <div className="text-center mt-3 text-xs text-white/50 text-shadow-sm">
              {isCarrying ? "Right-Click to Drop" : "Part Placed. Lock to finish."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}