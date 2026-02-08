import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function CoordinateHunter() {
  const { camera, raycaster, scene } = useThree();
  const markersRef = useRef([]); // To keep track of dots we draw

  useEffect(() => {
    const handleDebugClick = (e) => {
      // USAGE: Hold SHIFT + Click on the Front-Right hole
      if (!e.shiftKey) return; 
      e.stopPropagation(); 
      
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      // We explicitly check for collisions with the Grid or Meshes
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find the first hit point
        const point = intersects[0].point;
        
        // 1. Calculate the "True" Model Coordinates (undoing the 0.1 scale)
        // We use Math.abs() to ensure positive numbers, assuming you clicked Front-Right
        const trueX = Math.abs(point.x * 10).toFixed(3);
        const trueZ = Math.abs(point.z * 10).toFixed(3);
        // Force Y to be a safe height so dots don't hide inside the plate
        const trueY = 0.2; 

        console.clear(); // Clear old logs to avoid confusion
        console.log(`%c✨ SYMMETRICAL DATA GENERATED:`, "color: #00ff00; font-weight: bold; font-size: 14px;");
        console.log(`
/* PASTE THIS INTO store.js -> SNAP_POINTS['arm'] */
[
  { x: -${trueX}, y: ${trueY}, z: ${trueZ}, rotation: [0, 0.785, 0] },  // Front Left
  { x: ${trueX},  y: ${trueY}, z: ${trueZ}, rotation: [0, -0.785, 0] }, // Front Right
  { x: ${trueX},  y: ${trueY}, z: -${trueZ}, rotation: [0, -2.356, 0] }, // Back Right
  { x: -${trueX}, y: ${trueY}, z: -${trueZ}, rotation: [0, 2.356, 0] },  // Back Left
]
        `);
        
        // 2. VISUAL CONFIRMATION: Remove old dots
        markersRef.current.forEach(m => scene.remove(m));
        markersRef.current = [];

        // 3. Draw 4 Symmetrical Dots based on your ONE click
        const positions = [
          { x: -Math.abs(point.x), z: Math.abs(point.z) },
          { x: Math.abs(point.x),  z: Math.abs(point.z) },
          { x: Math.abs(point.x),  z: -Math.abs(point.z) },
          { x: -Math.abs(point.x), z: -Math.abs(point.z) },
        ];

        positions.forEach(pos => {
            const markerGroup = new THREE.Group();
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 16, 16), // Made bigger to see easily
                new THREE.MeshBasicMaterial({ color: 0x00ff00, toneMapped: false }) // Green = Good
            );
            dot.position.set(pos.x, 0.25, pos.z); // Float slightly above floor
            markerGroup.add(dot);
            scene.add(markerGroup);
            markersRef.current.push(markerGroup);
        });
      }
    };

    window.addEventListener('click', handleDebugClick);
    return () => window.removeEventListener('click', handleDebugClick);
  }, [camera, raycaster, scene]);

  return null;
}