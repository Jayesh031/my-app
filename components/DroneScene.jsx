import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import { useDroneStore } from './store';
import * as THREE from 'three';

// 1. REUSABLE MODEL COMPONENT (Used for both Real and Ghost)
function Model({ type, isGhost, ...props }) {
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

  // Clone material for ghost effect so we don't mess up the original
  useMemo(() => {
    if (isGhost) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5;
          child.material.color.set('#4da6ff'); // Blueish tint
          child.material.emissive.set('#4da6ff');
          child.material.emissiveIntensity = 0.2;
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

// 2. DRAG MANAGER (Handles the Ghost Logic)
function DragManager() {
  const { camera, gl, scene } = useThree();
  const draggedPartType = useDroneStore((s) => s.draggedPartType);
  const spawnPart = useDroneStore((s) => s.spawnPart);
  
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
        // 1. Update Position
        ghostRef.current.position.set(target.x, 0, target.z);
        
        // 2. FIX: Make visible ONLY when we have a valid target
        if (!ghostRef.current.visible) ghostRef.current.visible = true;
      }
    };

    // NEW: Hide ghost when mouse leaves the canvas
    const handleDragLeave = (e) => {
      e.preventDefault();
      if (ghostRef.current) {
        ghostRef.current.visible = false;
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      if (draggedPartType && ghostRef.current && ghostRef.current.visible) { // Only drop if visible
        const { x, z } = ghostRef.current.position;
        spawnPart(draggedPartType, [x, 0, z]);
      }
      // Reset visibility for next time
      if (ghostRef.current) ghostRef.current.visible = false;
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave); // Add listener
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave); // Remove listener
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [camera, gl.domElement, draggedPartType, plane, raycaster, spawnPart]);

  if (draggedPartType) {
    return (
      <group ref={ghostRef} visible={false}> {/* Default to INVISIBLE */}
        <Model type={draggedPartType} isGhost={true} position={[0,0,0]} rotation={[0,0,0]} />
      </group>
    );
  }

  return null;
}

// 3. MAIN SCENE
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

  const handleRightClick = (e) => {
    e.nativeEvent.preventDefault(); 
    if (isCarrying) stopCarrying();
    else useDroneStore.getState().selectPart(null);
  };

  return (
    <div className="w-full h-full bg-slate-900" onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        
        {/* Invisible Floor for Movement */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          scale={100} 
          visible={false} 
          onPointerMove={handlePlaneMove}
          onContextMenu={handleRightClick}
          onClick={() => { if(isCarrying) stopCarrying(); }}
        >
          <planeGeometry />
        </mesh>

        <Grid infiniteGrid fadeDistance={25} sectionColor="#4d4d4d" cellColor="#222" cellSize={0.5} sectionSize={2.5} />

        <Suspense fallback={null}>
          {/* Render All Real Parts */}
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
          
          {/* NEW: Render Drag Manager */}
          <DragManager />
        </Suspense>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}