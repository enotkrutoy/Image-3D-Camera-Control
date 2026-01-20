
import React, { useEffect, useRef } from 'react';
import { CameraParams, CameraAction } from '../types';
import { 
  AZIMUTH_STEPS, 
  ELEVATION_STEPS, 
  DISTANCE_STEPS, 
  AZIMUTH_MAP, 
  ELEVATION_MAP, 
  DISTANCE_MAP 
} from '../constants';

declare const THREE: any;

interface Camera3DProps {
  value: CameraParams;
  imageUrl: string | null;
  onChange: (value: CameraParams) => void;
}

const Camera3D: React.FC<Camera3DProps> = ({ value, imageUrl, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const stateRef = useRef<CameraParams>(value);
  const promptOverlayRef = useRef<HTMLDivElement>(null);

  // Sync internal state ref when prop changes (from external sliders)
  useEffect(() => {
    stateRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup ---
    const width = containerRef.current.clientWidth;
    const height = 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // tailwind gray-900
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(4.5, 3, 4.5);
    camera.lookAt(0, 0.75, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Grid
    scene.add(new THREE.GridHelper(8, 16, 0x374151, 0x1f2937));

    // Constants
    const CENTER = new THREE.Vector3(0, 0.75, 0);
    const BASE_DISTANCE = 1.6;
    const AZIMUTH_RADIUS = 2.4;
    const ELEVATION_RADIUS = 1.8;

    // Helpers
    const snapToNearest = (val: number, steps: number[]) => {
      return steps.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
    };

    // --- Objects ---
    const createPlaceholderTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#4b5563'; ctx.beginPath();
      ctx.arc(128, 128, 80, 0, Math.PI * 2); ctx.fill();
      return new THREE.CanvasTexture(canvas);
    };

    const planeMaterial = new THREE.MeshBasicMaterial({ 
      map: createPlaceholderTexture(), 
      side: THREE.DoubleSide,
      transparent: true 
    });
    const targetPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), planeMaterial);
    targetPlane.position.copy(CENTER);
    scene.add(targetPlane);

    // Camera Avatar
    const cameraGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.38), bodyMat);
    cameraGroup.add(body);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.5, roughness: 0.3 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.26;
    cameraGroup.add(lens);
    scene.add(cameraGroup);

    // Rings & Handles
    const createHandle = (color: number, type: CameraAction) => {
      const h = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
      );
      h.userData.type = type;
      scene.add(h);
      return h;
    };

    const azRing = new THREE.Mesh(
      new THREE.TorusGeometry(AZIMUTH_RADIUS, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.3 })
    );
    azRing.rotation.x = Math.PI / 2;
    azRing.position.y = 0.05;
    scene.add(azRing);

    const azHandle = createHandle(0x10b981, CameraAction.AZIMUTH);
    const elHandle = createHandle(0xec4899, CameraAction.ELEVATION);
    const distHandle = createHandle(0xf59e0b, CameraAction.DISTANCE);

    const distanceLineGeo = new THREE.BufferGeometry();
    const distanceLine = new THREE.Line(distanceLineGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
    scene.add(distanceLine);

    // --- State & Updates ---
    const updatePositions = () => {
      const { azimuth, elevation, distance } = stateRef.current;
      const d = BASE_DISTANCE * distance;
      const azRad = THREE.MathUtils.degToRad(azimuth);
      const elRad = THREE.MathUtils.degToRad(elevation);

      const camX = d * Math.sin(azRad) * Math.cos(elRad);
      const camY = d * Math.sin(elRad) + CENTER.y;
      const camZ = d * Math.cos(azRad) * Math.cos(elRad);

      cameraGroup.position.set(camX, camY, camZ);
      cameraGroup.lookAt(CENTER);

      azHandle.position.set(AZIMUTH_RADIUS * Math.sin(azRad), 0.05, AZIMUTH_RADIUS * Math.cos(azRad));
      elHandle.position.set(-0.8, ELEVATION_RADIUS * Math.sin(elRad) + CENTER.y, ELEVATION_RADIUS * Math.cos(elRad));

      const orangeDist = d - 0.5;
      distHandle.position.set(
        orangeDist * Math.sin(azRad) * Math.cos(elRad),
        orangeDist * Math.sin(elRad) + CENTER.y,
        orangeDist * Math.cos(azRad) * Math.cos(elRad)
      );
      distanceLineGeo.setFromPoints([cameraGroup.position.clone(), CENTER.clone()]);

      if (promptOverlayRef.current) {
        const azSnap = snapToNearest(azimuth, AZIMUTH_STEPS);
        const elSnap = snapToNearest(elevation, ELEVATION_STEPS);
        const distSnap = snapToNearest(distance, DISTANCE_STEPS);
        promptOverlayRef.current.textContent = `<sks> ${AZIMUTH_MAP[azSnap]} ${ELEVATION_MAP[elSnap]} ${DISTANCE_MAP[distSnap]}`;
      }
    };

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let dragTarget: any = null;
    let dragStartMouse = new THREE.Vector2();
    let dragStartDistance = 1.0;

    // Use proper EventListener signatures to satisfy TS overloads and fix line 260 error
    const onMouseDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([azHandle, elHandle, distHandle]);
      if (intersects.length > 0) {
        isDragging = true;
        dragTarget = intersects[0].object;
        dragStartMouse.copy(mouse);
        dragStartDistance = stateRef.current.distance;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      if (isDragging && dragTarget) {
        raycaster.setFromCamera(mouse, camera);
        const intersection = new THREE.Vector3();
        if (dragTarget.userData.type === CameraAction.AZIMUTH) {
          const p = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
          if (raycaster.ray.intersectPlane(p, intersection)) {
            let az = THREE.MathUtils.radToDeg(Math.atan2(intersection.x, intersection.z));
            if (az < 0) az += 360;
            stateRef.current = { ...stateRef.current, azimuth: az };
          }
        } else if (dragTarget.userData.type === CameraAction.ELEVATION) {
          const p = new THREE.Plane(new THREE.Vector3(1, 0, 0), -0.8);
          if (raycaster.ray.intersectPlane(p, intersection)) {
            let el = THREE.MathUtils.radToDeg(Math.atan2(intersection.y - CENTER.y, intersection.z));
            stateRef.current = { ...stateRef.current, elevation: THREE.MathUtils.clamp(el, -30, 60) };
          }
        } else if (dragTarget.userData.type === CameraAction.DISTANCE) {
          const deltaY = mouse.y - dragStartMouse.y;
          stateRef.current = { ...stateRef.current, distance: THREE.MathUtils.clamp(dragStartDistance - deltaY * 1.5, 0.6, 1.4) };
        }
        updatePositions();
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        // Snap result
        const final = {
          azimuth: snapToNearest(stateRef.current.azimuth, AZIMUTH_STEPS),
          elevation: snapToNearest(stateRef.current.elevation, ELEVATION_STEPS),
          distance: snapToNearest(stateRef.current.distance, DISTANCE_STEPS)
        };
        onChange(final);
      }
      isDragging = false;
      dragTarget = null;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Render loop
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);
      if (!isDragging) updatePositions();
      renderer.render(scene, camera);
    };
    render();

    // Texture update observer
    const textureLoader = new THREE.TextureLoader();
    if (imageUrl) {
      textureLoader.load(imageUrl, (tex: any) => {
        planeMaterial.map = tex;
        planeMaterial.needsUpdate = true;
      });
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [imageUrl, onChange]);

  return (
    <div className="relative w-full h-[450px] bg-gray-950 rounded-xl overflow-hidden shadow-2xl border border-gray-800" ref={containerRef}>
      <div 
        ref={promptOverlayRef}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-emerald-500/30 font-mono text-emerald-400 text-sm whitespace-nowrap z-10"
      >
        &lt;sks&gt; front view eye-level shot medium shot
      </div>
    </div>
  );
};

export default Camera3D;
