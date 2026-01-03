import { create } from 'zustand';

export const useDroneStore = create((set, get) => ({
  parts: [], // Array of: { id, type, position, rotation, isLocked }
  currentStep: 0,
  activePartId: null, // The ID of the part currently being moved

  // SEQUENCE: The order in which parts appear
  buildSequence: [
    { id: 'bottom_plate', type: 'bottom_plate', label: 'Bottom Plate' },
    { id: 'arm_fr', type: 'arm', label: 'Front Right Arm' },
    { id: 'arm_fl', type: 'arm', label: 'Front Left Arm' },
    { id: 'arm_br', type: 'arm', label: 'Back Right Arm' },
    { id: 'arm_bl', type: 'arm', label: 'Back Left Arm' },
    { id: 'top_plate', type: 'top_plate', label: 'Top Plate' },
    { id: 'motor_fr', type: 'motor', label: 'Motor FR' },
    { id: 'motor_fl', type: 'motor', label: 'Motor FL' },
    { id: 'motor_br', type: 'motor', label: 'Motor BR' },
    { id: 'motor_bl', type: 'motor', label: 'Motor BL' },
  ],

  // 1. SPAWN: Adds the part to the center of the scene
  spawnPart: () => {
    const { parts, currentStep, buildSequence } = get();
    if (currentStep >= buildSequence.length) return;

    const nextPartData = buildSequence[currentStep];

    // Prevent duplicates
    if (parts.find(p => p.id === nextPartData.id)) return;

    const newPart = {
      id: nextPartData.id,
      type: nextPartData.type,
      position: [0, 0, 0], // Spawn at center
      rotation: [0, 0, 0],
      isLocked: false
    };

    set({ 
      parts: [...parts, newPart], 
      activePartId: newPart.id // Auto-select the new part
    });
  },

  // 2. SELECT: Enable controls for a specific part (if not locked)
  selectPart: (id) => {
    const part = get().parts.find(p => p.id === id);
    if (part && !part.isLocked) {
      set({ activePartId: id });
    }
  },

  // 3. UPDATE: Syncs position while dragging
  updatePart: (id, pos, rot) => set((state) => ({
    parts: state.parts.map(p => 
      p.id === id ? { ...p, position: pos, rotation: rot } : p
    )
  })),

  // 4. LOCK: Finalizes position and unlocks the next step
  lockPart: () => {
    const { activePartId, parts, currentStep } = get();
    if (!activePartId) return;

    const updatedParts = parts.map(p => 
      p.id === activePartId ? { ...p, isLocked: true } : p
    );

    set({
      parts: updatedParts,
      activePartId: null, // Deselect
      currentStep: currentStep + 1 // Advance step
    });
  },

  reset: () => set({ parts: [], currentStep: 0, activePartId: null })
}));