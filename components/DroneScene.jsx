import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import { useDroneStore, SNAP_POINTS } from './store';
import * as THREE from 'three';

// --- 1. MODEL COMPONENT ---
function Model({ type, isGhost, ...props }) {
  const { globalScale } = useControls({ 
    globalScale: { value: 0.1, min: 0.01, max: 2, step: 0.01 } 
  });

  const fileMap = {
    'bottom_plate': '/bottom_plate.glb',
    'arm': '/new.glb',
    'top_plate': '/top_plate.glb',
    'motor': '/motor.glb',
    'propellor': '/new.glb'
  };

  const gltf = useGLTF(fileMap[type]);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useMemo(() => {
    if (isGhost) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5;
          child.material.color.set('#4da6ff');
        }
      });
    }
  }, [scene, isGhost]);

  return (
    <group 
      position={props.position} 
      rotation={props.rotation}
      scale={globalScale} 
      onClick={(e) => { if(!isGhost) { e.stopPropagation(); props.onSelect(); } }}
      onDoubleClick={(e) => { if(!isGhost) { e.stopPropagation(); props.onPickup(); } }}
    >
      <primitive object={scene} />
      {props.isActive && !isGhost && (
        <mesh position={[0, -props.position[1] + 0.02, 0]}>
           <ringGeometry args={[0.8, 0.9, 32]} />
           <meshBasicMaterial color="cyan" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// --- 2. THE DOT TUNER (Visual Calibration Tool) ---
function DotTuner() {
  const parts = useDroneStore(s => s.parts);
  const bottomPlate = parts.find(p => p.type === 'bottom_plate');

  // SLIDERS: Adjust these until red dots match holes!
  const { x, z, y } = useControls('🔴 Red Dot Tuner', {
    x: { value: 4.5, min: 0, max: 15, step: 0.01 },
    z: { value: 3.5, min: 0, max: 15, step: 0.01 },
    y: { value: 0.2, min: 0, max: 2, step: 0.01 },
  });

  if (!bottomPlate) return null;

  // We automatically mirror the points for you
  // NOTE: We divide by 0.1 (multiply by 10) to visualize where they will land relative to the plate
  const scaleFactor = 0.1; 
  
  const dynamicPoints = [
    { x: -x * scaleFactor, y: y, z: z * scaleFactor },  // Front Left
    { x: x * scaleFactor,  y: y, z: z * scaleFactor },  // Front Right
    { x: x * scaleFactor,  y: y, z: -z * scaleFactor }, // Back Right
    { x: -x * scaleFactor, y: y, z: -z * scaleFactor }, // Back Left
  ];

  return (
    <group position={bottomPlate.position}> 
      {dynamicPoints.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ff0000" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// --- 3. DRAG MANAGER (Restored) ---
function DragManager() {
  const { camera, gl } = useThree();
  const draggedPartType = useDroneStore((s) => s.draggedPartType);
  const spawnPart = useDroneStore((s) => s.spawnPart);
  const snapEnabled = useDroneStore((s) => s.snapEnabled);
  
  const ghostRef = useRef();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleDragOver = (e) => {
      e.preventDefault(); 
      if (!draggedPartType || !ghostRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      if (target) {
        ghostRef.current.position.copy(target);
        ghostRef.current.visible = true;
      }
    };
    const handleDrop = (e) => {
      e.preventDefault();
      if (draggedPartType && ghostRef.current?.visible) {
        spawnPart(draggedPartType, ghostRef.current.position.toArray(), [0,0,0]);
      }
      if (ghostRef.current) ghostRef.current.visible = false;
    };
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    return () => { canvas.removeEventListener('dragover', handleDragOver); canvas.removeEventListener('drop', handleDrop); };
  }, [camera, gl.domElement, draggedPartType, plane, raycaster, spawnPart]);

  if (draggedPartType) {
    return (
      <group ref={ghostRef} visible={false}>
        <Model type={draggedPartType} isGhost={true} position={[0,0,0]} rotation={[0,0,0]} />
      </group>
    );
  }
  return null;
}

export default function DroneScene() {
  const parts = useDroneStore((state) => state.parts);
  const activePartId = useDroneStore((state) => state.activePartId);
  const isCarrying = useDroneStore((state) => state.isCarrying);
  const selectPart = useDroneStore((state) => state.selectPart);
  const updatePartPosition = useDroneStore((state) => state.updatePartPosition);
  
  const handlePlaneMove = (e) => {
    if (activePartId && isCarrying) {
      e.stopPropagation();
      const part = parts.find(p => p.id === activePartId);
      if(part) updatePartPosition(activePartId, [e.point.x, part.position[1], e.point.z], part.rotation);
    }
  };

  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
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
              onPickup={() => { selectPart(part.id); useDroneStore.setState({ isCarrying: true }); }}
            />
          ))}
          <DragManager />
          
          {/* THE TUNER IS HERE */}
          <DotTuner /> 
        </Suspense>
        
        <OrbitControls makeDefault />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} scale={100} visible={false} onPointerMove={handlePlaneMove}>
          <planeGeometry />
        </mesh>
      </Canvas>
    </div>
  );
}