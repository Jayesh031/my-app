import { useEffect, useState } from "react";

export const useDroneControls = () => {
  const [controls, setControls] = useState({
    throttle: 0, // 0 to 100%
    yaw: 0,      // -1 (Left) to 1 (Right)
    pitch: 0,    // -1 (Forward) to 1 (Back)
    roll: 0      // -1 (Left) to 1 (Right)
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      setControls((prev) => {
        const newControls = { ...prev };
        
        // THROTTLE (W/S) - Incremental change for smoothness
        if (e.key === "w") newControls.throttle = Math.min(prev.throttle + 5, 100);
        if (e.key === "s") newControls.throttle = Math.max(prev.throttle - 5, 0);

        // YAW (A/D)
        if (e.key === "a") newControls.yaw = -1;
        if (e.key === "d") newControls.yaw = 1;

        // PITCH (ArrowUp/ArrowDown)
        if (e.key === "ArrowUp") newControls.pitch = -1; // Forward tilt
        if (e.key === "ArrowDown") newControls.pitch = 1;

        // ROLL (ArrowLeft/ArrowRight)
        if (e.key === "ArrowLeft") newControls.roll = -1;
        if (e.key === "ArrowRight") newControls.roll = 1;

        return newControls;
      });
    };

    const handleKeyUp = (e) => {
      // Reset directional sticks to center (0) when released
      setControls((prev) => {
        const newControls = { ...prev };
        if (["a", "d"].includes(e.key)) newControls.yaw = 0;
        if (["ArrowUp", "ArrowDown"].includes(e.key)) newControls.pitch = 0;
        if (["ArrowLeft", "ArrowRight"].includes(e.key)) newControls.roll = 0;
        return newControls;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return controls;
};