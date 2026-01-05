import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import { useDroneStore } from './store';
import * as THREE from 'three';

function Model({ type, ...props }) {
  const { globalScale } = useControls({ 
    globalScale: { value: 0.1, min: 0.01, max: 2, step: 0.01 } 
  });

  const fileMap = {
    'bottom_plate': '/bottom_plate.glb',
    'arm': '/arm.glb',
    'top_plate': '/top_plate.glb',
    'motor': '/motor.glb',
    'propellor': '/propellor.glb'
  };

  const gltf = useGLTF(fileMap[type]);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  return (
    <group 
      position={props.position} 
      rotation={props.rotation}
      scale={globalScale}
      onClick={(e) => { e.stopPropagation(); props.onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); props.onPickup(); }}
    >
      <primitive object={scene} />
      
      {props.isActive && (
        <group>
          <mesh position={[0, -props.position[1] + 0.02, 0]}>
             <ringGeometry args={[0.8, 0.9, 32]} />
             <meshBasicMaterial color={props.isCarrying ? "cyan" : "yellow"} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -props.position[1]/2, 0]}>
             <cylinderGeometry args={[0.02, 0.02, props.position[1]]} />
             <meshBasicMaterial color="cyan" opacity={0.5} transparent />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function DroneScene() {
  const parts = useDroneStore((state) => state.parts);
  const activePartId = useDroneStore((state) => state.activePartId);
  const isCarrying = useDroneStore((state) => state.isCarrying);
  
  const selectPart = useDroneStore((state) => state.selectPart);
  const startCarrying = useDroneStore((state) => state.startCarrying);
  const stopCarrying = useDroneStore((state) => state.stopCarrying);
  const updatePartPosition = useDroneStore((state) => state.updatePartPosition);
  
  const handlePlaneMove = (e) => {
    if (activePartId && isCarrying) {
      e.stopPropagation();
      const currentParts = useDroneStore.getState().parts;
      const part = currentParts.find(p => p.id === activePartId);
      
      if(part) {
        const newX = Math.round(e.point.x * 100) / 100; 
        const newZ = Math.round(e.point.z * 100) / 100;
        updatePartPosition(activePartId, [newX, part.position[1], newZ], part.rotation);
      }
    }
  };

  // NEW: Right-Click Handler
  const handleRightClick = (e) => {
    // Prevent the browser menu from opening
    e.nativeEvent.preventDefault(); 
    if (isCarrying) {
      stopCarrying(); // This drops the part
    } else {
        // Optional: If not carrying, right click could deselect
        useDroneStore.getState().selectPart(null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-900" onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        {/* Invisible Floor Plane with Right Click Listener */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          scale={100} 
          visible={false} 
          onPointerMove={handlePlaneMove}
          onContextMenu={handleRightClick} // <--- Right Click Added Here
          onClick={() => { if(isCarrying) stopCarrying(); }} // Left click still drops too
        >
          <planeGeometry />
        </mesh>

        <Grid infiniteGrid fadeDistance={25} sectionColor="#4d4d4d" cellColor="#222" cellSize={0.5} sectionSize={2.5} />

        <Suspense fallback={null}>
          {parts.map((part) => (
            <Model 
              key={part.id}
              type={part.type}
              position={part.position}
              rotation={part.rotation}
              isActive={part.id === activePartId}
              isCarrying={part.id === activePartId && isCarrying}
              onSelect={() => selectPart(part.id)}
              onPickup={() => { selectPart(part.id); startCarrying(); }}
            />
          ))}
        </Suspense>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}