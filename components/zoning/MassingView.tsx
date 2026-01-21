import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Tower {
  name: string;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  floors: Array<{ floor_number: number; units_by_size: Record<string, number> }>;
}

interface MassingAlternative {
  id: string;
  name: string;
  description: string;
  height_m: number;
  coverage_percent: number;
  setback_front_m: number;
  setback_sides_m: number;
  towers: Tower[];
  key_metrics: {
    total_floors: number;
    fsi: number;
    density_units_per_hectare: number;
  };
  design_rationale: string;
}

interface MassingViewProps {
  alternative: MassingAlternative;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const MassingView: React.FC<MassingViewProps> = ({ alternative, isSelected, onSelect }) => {
  const localRef = useRef<HTMLDivElement>(null);
  const containerRef = localRef;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width === 0 || height === 0) {
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(50, 40, 60);
      camera.lookAt(0, 0, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 50, 50);
      scene.add(directionalLight);

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(200, 200);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.5;
      scene.add(ground);

      // Grid
      const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x333333);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // Build towers
      alternative.towers.forEach((tower, idx) => {
        const colors = [0xf59e0b, 0xd97706, 0xb45309];
        const color = colors[idx % colors.length];
        const floorHeight = tower.dimensions.height / alternative.key_metrics.total_floors;

        for (let floor = 0; floor < alternative.key_metrics.total_floors; floor++) {
          const floorGeometry = new THREE.BoxGeometry(
            tower.dimensions.width,
            floorHeight * 0.9,
            tower.dimensions.depth
          );

          const opacity = 0.8 + (floor % 2) * 0.15;
          const floorMaterial = new THREE.MeshPhongMaterial({
            color,
            transparent: true,
            opacity,
            emissive: new THREE.Color(color).multiplyScalar(0.2),
          });

          const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
          floorMesh.position.set(tower.position.x, floor * floorHeight, tower.position.y);

          // Edge lines
          const edges = new THREE.EdgesGeometry(floorGeometry);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 1 })
          );
          floorMesh.add(line);

          scene.add(floorMesh);
        }
      });

      // Mouse controls
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let sphericalCoords = {
        radius: camera.position.length(),
        theta: Math.atan2(camera.position.z, camera.position.x),
        phi: Math.acos(Math.max(-1, Math.min(1, camera.position.y / camera.position.length())))
      };

      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        // Update spherical coordinates when starting drag
        sphericalCoords.radius = camera.position.length();
        sphericalCoords.theta = Math.atan2(camera.position.z, camera.position.x);
        sphericalCoords.phi = Math.acos(Math.max(-1, Math.min(1, camera.position.y / sphericalCoords.radius)));
      });

      renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        // Adjust angles based on mouse movement
        sphericalCoords.theta -= (deltaX * Math.PI) / 500;
        sphericalCoords.phi += (deltaY * Math.PI) / 500;

        // Clamp phi to prevent flipping through the top/bottom
        sphericalCoords.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalCoords.phi));

        // Convert back to Cartesian coordinates using the stored radius
        camera.position.x = sphericalCoords.radius * Math.sin(sphericalCoords.phi) * Math.cos(sphericalCoords.theta);
        camera.position.y = sphericalCoords.radius * Math.cos(sphericalCoords.phi);
        camera.position.z = sphericalCoords.radius * Math.sin(sphericalCoords.phi) * Math.sin(sphericalCoords.theta);
        camera.lookAt(0, 0, 0);

        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
      });

      renderer.domElement.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          const direction = camera.position.clone().normalize();
          const distance = camera.position.length();
          // Keep camera distance between 40 and 150 to prevent disappearing
          const newDistance = Math.max(40, Math.min(150, distance + e.deltaY * 0.1));
          camera.position.copy(direction.multiplyScalar(newDistance));
          camera.lookAt(0, 0, 0);
        },
        { passive: false }
      );

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('mousedown', () => {});
        renderer.domElement.removeEventListener('mousemove', () => {});
        renderer.domElement.removeEventListener('mouseup', () => {});
        try {
          container.removeChild(renderer.domElement);
        } catch (e) {
          // Already removed
        }
        renderer.dispose();
      };
    } catch (error) {
      // Silent error handling - don't expose details
    }
  }, [alternative]);

  return (
    <div
      ref={localRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onDoubleClick={() => onSelect(alternative.id)}
      className={`cursor-pointer transition-all border rounded-xl overflow-hidden ${
        isSelected ? 'border-amber-500 ring-2 ring-amber-500' : 'border-white/10 hover:border-amber-500/50'
      }`}
    />
  );
};

export default MassingView;
