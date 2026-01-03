import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls, TransformControls, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import { useDroneStore } from './store';
import * as THREE from 'three';

function Model({ type, ...props }) {
  // Global Scale Slider
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
  } catch (e) {
    console.warn("File failed to load:", type);
  }

  const renderFallback = () => (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  );

  return (
    <group 
      position={props.position} 
      rotation={props.rotation}
      scale={scene ? globalScale : 1} 
      onDoubleClick={props.onDoubleClick}
      onClick={(e) => e.stopPropagation()}
    >
      {scene ? <primitive object={scene} /> : renderFallback()}
      
      {/* Visual Selection Ring */}
      {props.isActive && (
        <mesh>
          <ringGeometry args={[1.5, 1.55, 32]} />
          <meshBasicMaterial color="yellow" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default function DroneScene({ controlMode }) {
  const parts = useDroneStore((state) => state.parts);
  const activePartId = useDroneStore((state) => state.activePartId);
  const selectPart = useDroneStore((state) => state.selectPart);
  const updatePart = useDroneStore((state) => state.updatePart);

  // Track if we are actively dragging the Gizmo
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);

  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        <Grid infiniteGrid fadeDistance={20} sectionColor="#4d4d4d" cellColor="#222" />
        <axesHelper args={[5]} />

        {parts.map((part) => {
          const isActive = part.id === activePartId;

          if (isActive) {
            return (
              <TransformControls
                key={part.id}
                mode={controlMode}
                position={part.position}
                rotation={part.rotation}
                
                // --- FIX IS HERE: CamelCase instead of hyphen ---
                onDraggingChange={(e) => setIsDraggingGizmo(e.value)}
                
                onObjectChange={(e) => {
                   const o = e.target.object;
                   updatePart(part.id, [o.position.x, o.position.y, o.position.z], [o.rotation.x, o.rotation.y, o.rotation.z]);
                }}
              >
                 <Model type={part.type} isActive={true} />
              </TransformControls>
            );
          }

          return (
            <Model 
              key={part.id}
              type={part.type}
              position={part.position}
              rotation={part.rotation}
              isLocked={part.isLocked}
              onDoubleClick={(e) => {
                e.stopPropagation();
                selectPart(part.id);
              }}
            />
          );
        })}
        
        <OrbitControls makeDefault enabled={!isDraggingGizmo} />
      </Canvas>
    </div>
  );
}