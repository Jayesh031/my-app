import { create } from 'zustand';

export const useDroneStore = create((set, get) => ({
  parts: [], 
  currentStep: 0,
  activePartId: null, 
  isCarrying: false,

  buildSequence: [
    { id: 'bottom_plate', type: 'bottom_plate', label: 'Bottom Plate', defaultHeight: 0 },
    { id: 'arm_fr', type: 'arm', label: 'Front Right Arm', defaultHeight: 0.15 },
    { id: 'arm_fl', type: 'arm', label: 'Front Left Arm', defaultHeight: 0.15 },
    { id: 'arm_br', type: 'arm', label: 'Back Right Arm', defaultHeight: 0.15 },
    { id: 'arm_bl', type: 'arm', label: 'Back Left Arm', defaultHeight: 0.15 },
    { id: 'top_plate', type: 'top_plate', label: 'Top Plate', defaultHeight: 0.30 },
    { id: 'motor_fr', type: 'motor', label: 'Motor FR', defaultHeight: 0.35 },
    { id: 'motor_fl', type: 'motor', label: 'Motor FL', defaultHeight: 0.35 },
    { id: 'motor_br', type: 'motor', label: 'Motor BR', defaultHeight: 0.35 },
    { id: 'motor_bl', type: 'motor', label: 'Motor BL', defaultHeight: 0.35 },
  ],

  spawnPart: () => {
    const { parts, currentStep, buildSequence } = get();
    if (currentStep >= buildSequence.length) return;

    const nextPartData = buildSequence[currentStep];
    if (parts.find(p => p.id === nextPartData.id)) return;

    const newPart = {
      id: nextPartData.id,
      type: nextPartData.type,
      position: [0, nextPartData.defaultHeight, 0], 
      rotation: [0, 0, 0],
      isLocked: false
    };

    set({ 
      parts: [...parts, newPart], 
      activePartId: newPart.id,
      isCarrying: false 
    });
  },

  selectPart: (id) => {
    const part = get().parts.find(p => p.id === id);
    if (part && !part.isLocked) {
      set({ activePartId: id, isCarrying: false });
    }
  },

  startCarrying: () => set({ isCarrying: true }),
  stopCarrying: () => set({ isCarrying: false }),

  // Standard Update (Full Position)
  updatePart: (id, pos, rot) => set((state) => ({
    parts: state.parts.map(p => 
      p.id === id ? { ...p, position: pos, rotation: rot } : p
    )
  })),

  // Specific Action: Lift Only (Preserve X/Z)
  setPartHeight: (id, height) => set((state) => {
    const part = state.parts.find(p => p.id === id);
    if (!part) return {};
    return {
      parts: state.parts.map(p => 
        p.id === id ? { ...p, position: [part.position[0], height, part.position[2]] } : p
      )
    };
  }),

  // Specific Action: Rotate Only
  rotateActivePart: () => {
    const { activePartId, parts } = get();
    if (!activePartId) return;
    
    const part = parts.find(p => p.id === activePartId);
    const currentY = part.rotation[1];
    set((state) => ({
      parts: state.parts.map(p => 
        p.id === activePartId ? { ...p, rotation: [0, currentY + (Math.PI / 4), 0] } : p
      )
    }));
  },

  lockPart: () => {
    const { activePartId, parts, currentStep } = get();
    if (!activePartId) return;

    const updatedParts = parts.map(p => 
      p.id === activePartId ? { ...p, isLocked: true } : p
    );

    set({
      parts: updatedParts,
      activePartId: null, 
      isCarrying: false,
      currentStep: currentStep + 1 
    });
  },

  reset: () => set({ parts: [], currentStep: 0, activePartId: null, isCarrying: false })
}));