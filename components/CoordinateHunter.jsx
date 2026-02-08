import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function CoordinateHunter() {
  const { camera, raycaster, scene } = useThree();

  useEffect(() => {
    const handleDebugClick = (e) => {
      // USAGE: Hold SHIFT + Click to log coordinates
      if (!e.shiftKey) return; 

      e.stopPropagation(); 
      
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        console.log(`%c🎯 SNAP POINT FOUND:`, "color: #00ff00; font-weight: bold; font-size: 12px;");
        console.log(`{ x: ${point.x.toFixed(3)}, y: ${point.y.toFixed(3)}, z: ${point.z.toFixed(3)} }`);
        
        const markerGroup = new THREE.Group();
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 8, 8), 
            new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false })
        );
        dot.renderOrder = 999;
        
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0.1, 0)
        ]);
        const line = new THREE.Line(
            lineGeo, 
            new THREE.LineBasicMaterial({ color: 0xff0000, depthTest: false })
        );
        
        markerGroup.add(dot);
        markerGroup.add(line);
        markerGroup.position.copy(point);
        
        scene.add(markerGroup);
      }
    };

    window.addEventListener('click', handleDebugClick);
    return () => window.removeEventListener('click', handleDebugClick);
  }, [camera, raycaster, scene]);

  return null;
}