import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { StyledMassing } from '../../types';

interface VisualizationViewerProps {
  styledMassing: StyledMassing;
}

const VisualizationViewer: React.FC<VisualizationViewerProps> = ({ styledMassing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);

      // Camera
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(60, 45, 70);
      camera.lookAt(0, 0, 0);

      // Renderer with high quality
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowShadowMap;
      container.appendChild(renderer.domElement);

      // Enhanced Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(80, 80, 60);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Warm fill light
      const fillLight = new THREE.DirectionalLight(0xffa84d, 0.4);
      fillLight.position.set(-60, 40, -60);
      scene.add(fillLight);

      // Ground plane with shadow
      const groundGeometry = new THREE.PlaneGeometry(300, 300);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      ground.receiveShadow = true;
      scene.add(ground);

      // Subtle grid
      const gridHelper = new THREE.GridHelper(300, 30, 0x333333, 0x222222);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // Build towers with enhanced materials
      const massing = styledMassing.massing_geometry;
      const primaryColor = new THREE.Color(styledMassing.styled_materials.primary_material.color);
      const accentColor = new THREE.Color(styledMassing.styled_materials.accent_color);

      massing.towers.forEach((tower: any, towerIdx: number) => {
        const floorHeight = tower.dimensions.height / massing.key_metrics.total_floors;

        for (let floor = 0; floor < massing.key_metrics.total_floors; floor++) {
          const floorGeometry = new THREE.BoxGeometry(
            tower.dimensions.width,
            floorHeight * 0.85,
            tower.dimensions.depth
          );

          // Alternate between primary and accent materials
          const useAccent = floor % 4 === 3;
          const baseColor = useAccent ? accentColor : primaryColor;
          
          // Subtle color variation per floor for depth
          const colorVariation = 1 - (floor % 4) * 0.08;
          const floorColor = new THREE.Color(baseColor).multiplyScalar(colorVariation);

          const floorMaterial = new THREE.MeshStandardMaterial({
            color: floorColor,
            roughness: 0.4,
            metalness: 0.1,
            emissive: new THREE.Color(floorColor).multiplyScalar(0.1)
          });

          const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
          floorMesh.position.set(tower.position.x, floor * floorHeight, tower.position.y);
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;

          // Detailed edge lines for articulation
          const edges = new THREE.EdgesGeometry(floorGeometry);
          const edgeColor = useAccent 
            ? accentColor 
            : new THREE.Color(0xcccccc).multiplyScalar(0.8);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ 
              color: edgeColor, 
              linewidth: 2,
              transparent: true,
              opacity: 0.6
            })
          );
          floorMesh.add(line);

          scene.add(floorMesh);
        }
      });

      // Mouse controls
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const radius = 120;
        let theta = Math.atan2(camera.position.z, camera.position.x);
        let phi = Math.acos(camera.position.y / radius);

        theta -= (deltaX * Math.PI) / 500;
        phi += (deltaY * Math.PI) / 500;

        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
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
          const newDistance = Math.max(40, Math.min(250, distance + e.deltaY * 0.1));
          camera.position.copy(direction.multiplyScalar(newDistance));
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
        try {
          container.removeChild(renderer.domElement);
        } catch (e) {
          // Already removed
        }
        renderer.dispose();
      };
    } catch (err: any) {
      setError('Failed to render 3D visualization');
    }
  }, [styledMassing]);

  return (
    <div className="space-y-8">
      {/* Main Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer - Left */}
        <div className="lg:col-span-2">
          <div className="space-y-2">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Generated 3D Model</h3>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden" style={{ height: '550px' }}>
              <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>
            <p className="text-[10px] text-white/40">💡 Drag to rotate • Scroll to zoom</p>
          </div>
        </div>

        {/* Reference & Design Info - Right */}
        <div className="space-y-6">
          {/* Reference Image */}
          <div className="space-y-2">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Reference Image</h3>
            <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-white/5 ring-1 ring-amber-500/10">
              <img
                src={
                  styledMassing.reference_image_base64.includes('data:')
                    ? styledMassing.reference_image_base64
                    : `data:image/jpeg;base64,${styledMassing.reference_image_base64}`
                }
                alt="Reference"
                className="w-full h-56 object-cover"
              />
            </div>
          </div>

          {/* Design DNA Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Architectural Style</p>
              <p className="text-sm font-bold text-amber-400">{styledMassing.design_dna.architectural_style}</p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Facade Language</p>
                <p className="text-xs font-medium text-white/70 leading-relaxed">{styledMassing.design_dna.facade_language}</p>
              </div>
            </div>
          </div>

          {/* Material Palette */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-[10px] mono uppercase tracking-widest text-white/40">Material Palette</p>
            
            {/* Primary Material */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: styledMassing.styled_materials.primary_material.color }}
                />
                <div>
                  <p className="text-xs font-medium text-white">{styledMassing.styled_materials.primary_material.name}</p>
                  <p className="text-[10px] text-white/40">{styledMassing.styled_materials.primary_material.color}</p>
                </div>
              </div>
            </div>

            {/* Secondary Materials */}
            {styledMassing.styled_materials.secondary_materials.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-2">
                {styledMassing.styled_materials.secondary_materials.slice(0, 2).map((mat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-white/20"
                      style={{ backgroundColor: mat.color }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/70">{mat.name}</p>
                      <p className="text-[10px] text-white/40">{mat.area_percent}% coverage</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Accent Color */}
            <div className="flex items-center gap-3 border-t border-white/10 pt-2">
              <div
                className="w-10 h-10 rounded-lg border border-white/20"
                style={{ backgroundColor: styledMassing.styled_materials.accent_color }}
              />
              <div>
                <p className="text-xs font-medium text-white/70">Accent Details</p>
                <p className="text-[10px] text-white/40">{styledMassing.styled_materials.accent_color}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Design Application Description */}
      <div className="bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
        <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Design Application Strategy</h3>
        <p className="text-white/70 text-sm leading-relaxed">{styledMassing.design_description}</p>
      </div>

      {/* Key Characteristics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Proportional Logic</p>
          <p className="text-xs font-medium text-white/70">{styledMassing.design_dna.proportional_logic}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Vertical Rhythm</p>
          <p className="text-xs font-medium text-white/70">{styledMassing.design_dna.vertical_rhythm}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Horizontal Banding</p>
          <p className="text-xs font-medium text-white/70">{styledMassing.design_dna.horizontal_banding}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Surface Articulation</p>
          <p className="text-xs font-medium text-white/70">{styledMassing.design_dna.surface_articulation}</p>
        </div>
      </div>
    </div>
  );
};

export default VisualizationViewer;
