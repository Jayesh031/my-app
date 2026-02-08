// components/Drone.jsx
import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export const Drone = forwardRef(({ controls, setGameState, updateBattery, battery }, ref) => {
  const localGroup = useRef();
  const { camera } = useThree();
  
  // Expose the internal group ref to the parent (for HUD)
  useImperativeHandle(ref, () => localGroup.current);

  // Physics State
  const velocity = useRef(new THREE.Vector3(0, 0, 0)); // X, Y, Z velocity
  const isCrashed = useRef(false);
  const padPos = new THREE.Vector3(10, 0, 10); // Target Landing Zone

  // Propeller Refs
  const propFL = useRef(); const propFR = useRef();
  const propBL = useRef(); const propBR = useRef();

  useFrame((state) => {
    if (!localGroup.current || isCrashed.current) return;
    
    const { throttle, yaw, pitch, roll } = controls;

    // --- 1. BATTERY FIX (Much Slower Drain) ---
    if (throttle > 0 && battery > 0) {
        // Reduced drain rate: 0.005 instead of 0.05
        updateBattery((prev) => Math.max(0, prev - (0.005 + throttle * 0.0001)));
    }
    
    // If battery is dead, force throttle to 0 (freefall)
    const effectiveThrottle = battery > 0 ? throttle : 0;

    // --- 2. STABILITY FIX (Velocity-Based Logic) ---
    
    // Y AXIS (Altitude): 
    // Instead of F=ma, we map Throttle % directly to Vertical Speed.
    // 50% Throttle = 0 Speed (Hover). 
    // Deadzone between 45-55% for easy hovering.
    let targetYVel = 0;
    if (effectiveThrottle > 55) {
        targetYVel = (effectiveThrottle - 55) * 0.005; // Go Up
    } else if (effectiveThrottle < 45 && localGroup.current.position.y > 0) {
        targetYVel = (effectiveThrottle - 45) * 0.005; // Go Down
    }
    // If between 45-55, targetYVel remains 0 (Hover Lock)

    // X/Z AXIS (Movement):
    // Pitch/Roll determines horizontal speed
    const SPEED_LIMIT = 0.3;
    const targetXVel = roll * SPEED_LIMIT;  // Right/Left speed
    const targetZVel = pitch * SPEED_LIMIT; // Forward/Back speed

    // Apply "Inertia" (Lerp) - makes it feel like a drone, not a cursor
    velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, targetYVel, 0.1);
    
    // Rotate velocity vectors based on Drone's Facing Direction (Yaw)
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), localGroup.current.rotation.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), localGroup.current.rotation.y);
    
    // Calculate final horizontal movement
    const moveVector = new THREE.Vector3()
        .add(forward.multiplyScalar(targetZVel))
        .add(right.multiplyScalar(targetXVel));

    // Apply Position Updates
    localGroup.current.position.y += velocity.current.y;
    localGroup.current.position.x += moveVector.x;
    localGroup.current.position.z += moveVector.z;

    // --- 3. GROUND & LANDING LOGIC ---
    if (localGroup.current.position.y <= 0) {
        localGroup.current.position.y = 0;
        
        // If we hit the ground moving down faster than -0.15, CRASH
        if (velocity.current.y < -0.15) {
             isCrashed.current = true;
             setGameState("CRASHED");
             // Visual crash tumble
             localGroup.current.rotation.z = Math.PI / 4; 
             localGroup.current.rotation.x = Math.PI / 4; 
        } else {
            // Safe Landing Check
            const distToPad = localGroup.current.position.distanceTo(padPos);
            if (distToPad < 3 && effectiveThrottle < 10) {
                // Only count as landed if near pad AND throttle is cut
                setGameState("LANDED");
            }
        }
        velocity.current.y = 0;
    }

    // --- 4. ROTATION (Yaw) ---
    localGroup.current.rotation.y -= yaw * 0.03;

    // --- 5. VISUAL TILT (Banking) ---
    // Smoothly tilt the drone body based on speed
    localGroup.current.rotation.x = THREE.MathUtils.lerp(localGroup.current.rotation.x, pitch * 0.2, 0.1);
    localGroup.current.rotation.z = THREE.MathUtils.lerp(localGroup.current.rotation.z, -roll * 0.2, 0.1);

    // --- 6. PROPELLER ANIMATION ---
    if (effectiveThrottle > 10) {
        const s = 0.5; // Constant high speed spin when active
        propFL.current.rotation.y += s; propFR.current.rotation.y -= s;
        propBL.current.rotation.y -= s; propBR.current.rotation.y += s;
    }

    // --- 7. CAMERA CHASE ---
    const targetCamPos = new THREE.Vector3(0, 5, 8).applyMatrix4(localGroup.current.matrixWorld);
    state.camera.position.lerp(targetCamPos, 0.05); // Smooth follow
    state.camera.lookAt(localGroup.current.position);
  });

  return (
    <group ref={localGroup}>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.2, 1]} />
        <meshStandardMaterial color={isCrashed.current ? "red" : "#222"} roughness={0.4} />
      </mesh>
      {/* Arms */}
      <mesh position={[0,0.2,0]} rotation={[0,0.78,0]}><boxGeometry args={[2.5,0.05,0.1]} /><meshStandardMaterial color="#444"/></mesh>
      <mesh position={[0,0.2,0]} rotation={[0,-0.78,0]}><boxGeometry args={[2.5,0.05,0.1]} /><meshStandardMaterial color="#444"/></mesh>
      
      {/* Propellers */}
      <mesh ref={propFL} position={[-0.8, 0.35, -0.8]}><boxGeometry args={[1.2, 0.02, 0.1]} /><meshStandardMaterial color="#00e0ff" emissive="#00e0ff" emissiveIntensity={0.5} /></mesh>
      <mesh ref={propFR} position={[0.8, 0.35, -0.8]}><boxGeometry args={[1.2, 0.02, 0.1]} /><meshStandardMaterial color="#00e0ff" emissive="#00e0ff" emissiveIntensity={0.5} /></mesh>
      <mesh ref={propBL} position={[-0.8, 0.35, 0.8]}><boxGeometry args={[1.2, 0.02, 0.1]} /><meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={0.5} /></mesh>
      <mesh ref={propBR} position={[0.8, 0.35, 0.8]}><boxGeometry args={[1.2, 0.02, 0.1]} /><meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={0.5} /></mesh>
    </group>
  );
});
Drone.displayName = "Drone";