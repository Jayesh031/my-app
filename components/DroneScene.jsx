import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import { useDroneStore } from './store';
import * as THREE from 'three';

function Model({ type, ...props }) {
  const { globalScale } = useControls({ globalScale: { value: 1, min: 0.1, max: 10, step: 0.1 } });

  const fileMap = {
    'bottom_plate': '/bottom_plate.glb',
    'arm': '/arm.glb',
    'top_plate': '/top_plate.glb',
    'motor': '/motor.glb',
    'propellor': '/propellor.glb'
  };

  let scene = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gltf = useGLTF(fileMap[type]);
    scene = gltf.scene.clone();
  } catch (e) { console.warn("Load failed", type); }

  const renderFallback = () => (
    <mesh><boxGeometry args={[0.5, 0.2, 0.5]} /><meshStandardMaterial color="cyan" /></mesh>
  );

  return (
    <group 
      position={props.position} 
      rotation={props.rotation}
      scale={scene ? globalScale : 1}
      onClick={(e) => { e.stopPropagation(); props.onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); props.onPickup(); }}
    >
      {scene ? <primitive object={scene} /> : renderFallback()}
      
      {/* Visual Guides */}
      {props.isActive && (
        <group>
          {/* Floor Ring */}
          <mesh position={[0, -props.position[1] + 0.02, 0]}>
             <ringGeometry args={[0.8, 0.9, 32]} />
             <meshBasicMaterial color={props.isCarrying ? "cyan" : "yellow"} side={THREE.DoubleSide} />
          </mesh>
          {/* Height Line */}
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
  const updatePart = useDroneStore((state) => state.updatePart);
  
  const handlePlaneMove = (e) => {
    // MOUSE DRAG: Only updates X and Z. Y is preserved.
    if (activePartId && isCarrying) {
      e.stopPropagation();
      const currentParts = useDroneStore.getState().parts;
      const part = currentParts.find(p => p.id === activePartId);
      
      if(part) {
        const newX = Math.round(e.point.x * 10) / 10; 
        const newZ = Math.round(e.point.z * 10) / 10;
        
        // KEEP CURRENT HEIGHT (part.position[1])
        updatePart(activePartId, [newX, part.position[1], newZ], part.rotation);
      }
    }
  };

  const handleGlobalClick = () => {
    if (isCarrying) stopCarrying();
  };

  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        {/* Invisible Floor Plane */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          scale={100} 
          visible={false} 
          onPointerMove={handlePlaneMove}
          onClick={handleGlobalClick} 
        >
          <planeGeometry />
        </mesh>

        <Grid infiniteGrid fadeDistance={20} sectionColor="#4d4d4d" cellColor="#222" />

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
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}