import { create } from 'zustand';
import { temporal } from 'zundo';

export const INVENTORY = {
  frames: [
    { id: 'bottom_plate', label: 'Bottom Plate', type: 'bottom_plate' },
    { id: 'top_plate', label: 'Top Plate', type: 'top_plate' },
    { id: 'arm', label: 'Standard Arm', type: 'arm' },
  ],
  propulsion: [
    { id: 'motor', label: 'Brushless Motor', type: 'motor' },
    { id: 'propellor', label: '5" Propellor', type: 'propellor' },
  ],
  electronics: []
};

// --- MAGNET DATABASE ---
// Coordinates derived from your Coordinate Hunter findings
export const SNAP_POINTS = {
  'arm': [
    // Top-Right (Original Blender numbers)
    { x: 45,  y: 0, z: -35, rotation: [0, -0.785, 0] }, 

    // Top-Left (Flip X)
    { x: -45, y: 0, z: -35, rotation: [0, 0.785, 0] },  

    // Bottom-Right (Flip Z)
    { x: 45,  y: 0, z: 35,  rotation: [0, -2.356, 0] }, 

    // Bottom-Left (Flip X and Z)
    { x: -45, y: 0, z: 35,  rotation: [0, 2.356, 0] },  
  ],
  'motor': []
};

export const useDroneStore = create(
  temporal(
    (set, get) => ({
      parts: [],
      activePartId: null,
      isCarrying: false,
      draggedPartType: null, // Tracks drag-and-drop state
      
      // MAGNET TOGGLE
      snapEnabled: true, 
      toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

      setDraggedPartType: (type) => set({ draggedPartType: type }),

      spawnPart: (partType, position, rotation = [0, 0, 0]) => { 
        const uniqueId = `${partType}_${Date.now()}`;
        set((state) => ({
          parts: [...state.parts, {
            id: uniqueId,
            type: partType,
            position: position, 
            rotation: rotation, // Auto-rotation from snap
            isLocked: false,
          }],
          activePartId: uniqueId,
          isCarrying: false // Drop immediately after drag
        }));
      },

      selectPart: (id) => {
        const part = get().parts.find(p => p.id === id);
        if (part && !get().isCarrying) {
          set({ activePartId: id });
        }
      },
      
      startCarrying: () => {
        useDroneStore.temporal.getState().pause();
        set({ isCarrying: true });
      },

      stopCarrying: () => {
         useDroneStore.temporal.getState().resume();
         set({ isCarrying: false });
      },

      updatePartPosition: (id, pos, rot) => set((state) => ({
        parts: state.parts.map(p => 
          p.id === id ? { ...p, position: pos, rotation: rot } : p
        )
      })),

      setPartHeight: (id, height) => set((state) => {
        const part = state.parts.find(p => p.id === id);
        if (!part) return {};
        return {
          parts: state.parts.map(p => 
            p.id === id ? { ...p, position: [part.position[0], height, part.position[2]] } : p
          )
        };
      }),

      rotateActivePart: () => {
        const { activePartId, parts } = get();
        if (!activePartId) return;
        const part = parts.find(p => p.id === activePartId);
        set((state) => ({
          parts: state.parts.map(p => 
            p.id === activePartId ? { ...p, rotation: [0, part.rotation[1] + (Math.PI / 4), 0] } : p
          )
        }));
      },

      lockActivePart: () => {
        set((state) => ({
          parts: state.parts.map(p => 
            p.id === state.activePartId ? { ...p, isLocked: true } : p
          ),
          activePartId: null,
          isCarrying: false
        }));
        const temporal = useDroneStore.temporal.getState();
        temporal.resume();
      },

      deletePart: (id) => set((state) => ({
        parts: state.parts.filter(p => p.id !== id),
        activePartId: null,
        isCarrying: false
      })),
    }),
    {
      limit: 20,
      partialize: (state) => ({ parts: state.parts }),
    }
  )
);