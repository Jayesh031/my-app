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

export const useDroneStore = create(
  temporal(
    (set, get) => ({
      parts: [],
      activePartId: null,
      isCarrying: false,

      spawnPart: (partType) => {
        const uniqueId = `${partType}_${Date.now()}`;
        
        // 1. We do NOT pause here. We want the "Spawn" to be in history.
        // The user spawns it, and it immediately starts following (carrying).
        
        set((state) => ({
          parts: [...state.parts, {
            id: uniqueId,
            type: partType,
            position: [-2, 0.5, -2], 
            rotation: [0, 0, 0],
            isLocked: false,
          }],
          activePartId: null,
          isCarrying: false 
        }));

        // 2. NOW we pause, because the very next thing the user does is drag it.
        useDroneStore.temporal.getState().pause();
      },

      selectPart: (id) => {
        const part = get().parts.find(p => p.id === id);
        if (part && !get().isCarrying) {
          set({ activePartId: id });
        }
      },

      startCarrying: () => {
        // Pause history so we don't save 1000 movement steps
        useDroneStore.temporal.getState().pause();
        set({ isCarrying: true });
      },

      stopCarrying: () => {
        // 1. Resume history tracking
        useDroneStore.temporal.getState().resume();
        
        // 2. Update state. Since history is active, this saves the FINAL position.
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
        // Locking is just a state change, history is already running so it will be saved.
        set((state) => ({
          parts: state.parts.map(p => 
            p.id === state.activePartId ? { ...p, isLocked: true } : p
          ),
          activePartId: null,
          isCarrying: false
        }));
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