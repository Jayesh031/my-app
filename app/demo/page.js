// app/simulation/page.jsx
"use client";

import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial, Float } from "@react-three/drei";
import { useDroneControls } from "./useDroneControls";
import { Drone } from "../../components/Drone";
import { HUD } from "../../components/HUD";

// --- MODERN WORLD COMPONENT ---
const ModernWorld = () => {
    return (
        <group>
            {/* 1. REFLECTIVE FLOOR (Showroom look) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[500, 500]} />
                <MeshReflectorMaterial
                    blur={[300, 100]} // Blur ground reflections (width, height)
                    resolution={1024} // Texture resolution
                    mixBlur={1}       // How much blur mixes with surface
                    mixStrength={40}  // Strength of the reflection
                    roughness={1}     // Surface roughness
                    depthScale={1.2}  // Depth factor
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#1a1a1a"   // Dark Grey Floor
                    metalness={0.5}
                />
            </mesh>
            
            {/* 2. MINIMALIST OBSTACLES (Glass Pillars) */}
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                <group position={[10, 5, -15]}>
                     <mesh>
                        <boxGeometry args={[4, 10, 4]} />
                        <meshPhysicalMaterial 
                            roughness={0.1} 
                            transmission={0.9} // Glass
                            thickness={2}
                            color="#ffffff" 
                        />
                     </mesh>
                     {/* Inner Light */}
                     <pointLight intensity={2} color="#00e0ff" distance={15} />
                </group>
            </Float>

            {/* 3. LANDING ZONE (Projected Hologram look) */}
            <group position={[10, 0.01, 10]}>
                <mesh rotation={[-Math.PI/2,0,0]}>
                    <ringGeometry args={[3, 3.2, 64]} />
                    <meshBasicMaterial color="#00ff88" toneMapped={false} />
                </mesh>
                <mesh rotation={[-Math.PI/2,0,0]}>
                    <circleGeometry args={[3, 64]} />
                    <meshBasicMaterial color="#00ff88" transparent opacity={0.1} />
                </mesh>
            </group>
        </group>
    );
};

// --- MAIN PAGE ---
export default function SimulationPage() {
  const controls = useDroneControls();
  const [gameState, setGameState] = useState("FLYING");
  const [battery, setBattery] = useState(100);
  const droneRef = useRef(null);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#050505", overflow: 'hidden' }}>
      
      {/* ALERT OVERLAYS (Clean & Modern) */}
      {gameState === "CRASHED" && (
        <div style={overlayStyle}>
            <h1 style={{fontSize:'80px', margin:0, color:'#ff4d4d'}}>CRITICAL FAILURE</h1>
            <p style={{letterSpacing:'4px', color:'rgba(255,255,255,0.5)'}}>SYSTEM REBOOT REQUIRED</p>
        </div>
      )}
      
      {gameState === "LANDED" && (
        <div style={overlayStyle}>
            <h1 style={{fontSize:'80px', margin:0, color:'#00ff88'}}>SEQUENCE COMPLETE</h1>
            <p style={{letterSpacing:'4px', color:'rgba(255,255,255,0.5)'}}>SAFE TOUCHDOWN</p>
        </div>
      )}

      {/* 3D SCENE */}
      <Canvas shadows camera={{ position: [0, 4, 10], fov: 50 }} dpr={[1, 2]}>
        
        {/* Realistic Lighting Environment */}
        <Environment preset="city" background={false} />
        {/* Adds a nice gradient background instead of black */}
        <color attach="background" args={['#101015']} /> 
        <fog attach="fog" args={['#101015', 10, 50]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />

        <ModernWorld />

        <HUD droneRef={droneRef} battery={battery} />

        <Drone 
            ref={droneRef} 
            controls={controls} 
            setGameState={setGameState} 
            updateBattery={setBattery}
            battery={battery}
        />

      </Canvas>
    </div>
  );
}

const overlayStyle = {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 100,
    fontFamily: "-apple-system, sans-serif", color: "white"
};