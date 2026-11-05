import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface CyberScene3DProps {
  isScanning: boolean;
  scanProgress: number; // 0 - 100
  threatCount: number;
}

// Module-level pre-allocated scratch objects for Zero-GC render loop
const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _color = new THREE.Color();

export const CyberScene3D: React.FC<CyberScene3DProps> = ({
  isScanning,
  scanProgress,
  threatCount
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isScanning, scanProgress, threatCount });

  // Keep stateRef up to date without tearing down the WebGL canvas
  useEffect(() => {
    stateRef.current = { isScanning, scanProgress, threatCount };
  }, [isScanning, scanProgress, threatCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard (checking GPU renderer string)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050814');
    scene.fog = new THREE.FogExp2('#050814', 0.05);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm Directional Key + Cool Fill + Rim)
    const keyLight = new THREE.DirectionalLight('#38bdf8', 3.0);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight('#60a5fa', '#030712', 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight('#a855f7', 2.5, 15);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 5. Composite 3-12 Part Procedural Sentinel & Defense Core (THREE.Group)
    const sentinelGroup = new THREE.Group();
    sentinelGroup.position.set(0, 0.2, 0);
    scene.add(sentinelGroup);

    // Procedural glowing canvas texture for the central quantum core
    const createCoreCanvasTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#38bdf8');
      gradient.addColorStop(0.7, '#0284c7');
      gradient.addColorStop(1, '#082f49');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      // Add circuit-style grid accents
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 88, 88);
      ctx.beginPath();
      ctx.arc(64, 64, 40, 0, Math.PI * 2);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };
    const coreTexture = createCoreCanvasTexture();

    // Part 1: Primary Silhouette - Central Faceted Core (Icosahedron)
    const innerCoreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const innerCoreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0284c7'),
      emissive: new THREE.Color('#0369a1'),
      emissiveIntensity: 0.8,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      map: coreTexture
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    sentinelGroup.add(innerCoreMesh);

    // Part 2: Exoskeleton Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#38bdf8'),
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    sentinelGroup.add(cageMesh);

    // Part 3: Inner Pulsing Singularity
    const singularityGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const singularityMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffffff'),
      wireframe: false
    });
    const singularityMesh = new THREE.Mesh(singularityGeo, singularityMat);
    sentinelGroup.add(singularityMesh);

    // Part 4 & 5: Magnetic Containment Gimbal Rings
    const ring1Geo = new THREE.TorusGeometry(2.1, 0.04, 16, 64);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38bdf8'),
      metalness: 0.95,
      roughness: 0.2
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ringMat1);
    sentinelGroup.add(ring1Mesh);

    const ring2Geo = new THREE.TorusGeometry(2.4, 0.035, 16, 64);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#818cf8'),
      metalness: 0.95,
      roughness: 0.25
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ringMat2);
    ring2Mesh.rotation.x = Math.PI / 3;
    sentinelGroup.add(ring2Mesh);

    // Part 6, 7, 8, 9: 4 Orbital Defense Nodes (Satellites)
    const satelliteGroup = new THREE.Group();
    sentinelGroup.add(satelliteGroup);

    const createSatellite = (colorHex: string) => {
      const sat = new THREE.Group();
      
      // Central sensor box
      const boxGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
      const boxMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9, roughness: 0.2 });
      sat.add(new THREE.Mesh(boxGeo, boxMat));

      // Sensor emitter tip
      const coneGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.z = 0.25;
      sat.add(cone);

      // Solar wing panels
      const wingGeo = new THREE.BoxGeometry(0.8, 0.02, 0.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: '#0369a1', metalness: 0.8, roughness: 0.3 });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.x = 0;
      sat.add(wing);

      return sat;
    };

    const satellites: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const sat = createSatellite(i % 2 === 0 ? '#38bdf8' : '#a855f7');
      satellites.push(sat);
      satelliteGroup.add(sat);
    }

    // Part 10: Ground Contact Radial Shadow Disc (Flush with ground, no floating look)
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const createShadowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      rad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      rad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(canvas);
    };
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.65
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.2;
    scene.add(shadowMesh);

    // Part 11: Instanced Telemetry Particles (Data Nodes)
    const particleCount = 100;
    const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const instancedParticles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    instancedParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Pre-calculate circular orbit radii and speeds
    const particleData = Array.from({ length: particleCount }, () => ({
      radius: 2.8 + Math.random() * 2.5,
      angle: Math.random() * Math.PI * 2,
      speed: (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
      yOffset: (Math.random() - 0.5) * 2.2
    }));

    scene.add(instancedParticles);

    // 6. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 7. Lossless 60fps Animation Loop with Exponential Damping
    let animId = 0;
    let prevTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - prevTime) / 1000, 0.1);
      prevTime = currentTime;

      const { isScanning: scanning, threatCount: threats } = stateRef.current;

      // Spin multiplier accelerates during active scanning
      const speedMult = scanning ? 2.5 : 1.0;

      // Rotate primary sentinel core
      sentinelGroup.rotation.y += 0.3 * dt * speedMult;
      innerCoreMesh.rotation.x += 0.4 * dt * speedMult;
      innerCoreMesh.rotation.z += 0.2 * dt * speedMult;
      cageMesh.rotation.y -= 0.5 * dt * speedMult;

      // Pulsing singularity
      const pulse = 1.0 + Math.sin(currentTime * 0.005 * speedMult) * 0.15;
      singularityMesh.scale.set(pulse, pulse, pulse);

      // Rotate gimbal containment rings
      ring1Mesh.rotation.x += 0.6 * dt * speedMult;
      ring1Mesh.rotation.y += 0.3 * dt * speedMult;
      ring2Mesh.rotation.y -= 0.5 * dt * speedMult;
      ring2Mesh.rotation.z += 0.4 * dt * speedMult;

      // Color tint reacts to detected threats
      if (threats > 0) {
        _color.set('#f43f5e'); // Rose alert
        innerCoreMat.color.lerp(_color, 0.08);
        innerCoreMat.emissive.lerp(_color, 0.08);
        cageMat.color.lerp(_color, 0.08);
        ringMat1.color.lerp(_color, 0.08);
      } else if (scanning) {
        _color.set('#06b6d4'); // Cyan active
        innerCoreMat.color.lerp(_color, 0.08);
        innerCoreMat.emissive.lerp(_color, 0.08);
        cageMat.color.lerp(_color, 0.08);
      } else {
        _color.set('#0284c7'); // Deep safe blue
        innerCoreMat.color.lerp(_color, 0.08);
        innerCoreMat.emissive.lerp(_color, 0.08);
        cageMat.color.lerp(_color, 0.08);
      }

      // Position satellites along orbital rings
      const timeSec = currentTime * 0.001;
      satellites.forEach((sat, i) => {
        const offset = (i * Math.PI) / 2;
        const satRadius = 3.6;
        const orbitAngle = timeSec * 0.8 * speedMult + offset;
        sat.position.set(
          Math.cos(orbitAngle) * satRadius,
          Math.sin(orbitAngle * 1.5) * 0.6,
          Math.sin(orbitAngle) * satRadius
        );
        sat.lookAt(0, 0, 0);
      });

      // Update instanced particles (telemetry network)
      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i];
        p.angle += p.speed * dt * speedMult;
        const px = Math.cos(p.angle) * p.radius;
        const pz = Math.sin(p.angle) * p.radius;
        const py = p.yOffset + Math.sin(p.angle * 2) * 0.3;

        _vec3.set(px, py, pz);
        _mat4.compose(_vec3, _quat, _scale);
        instancedParticles.setMatrixAt(i, _mat4);
      }
      instancedParticles.instanceMatrix.needsUpdate = true;

      // Smooth camera parallax using exponential damping
      const dampingFactor = 1 - Math.exp(-4 * dt);
      targetX += (mouseX * 1.5 - targetX) * dampingFactor;
      targetY += (mouseY * 0.8 - targetY) * dampingFactor;
      camera.position.x = targetX;
      camera.position.y = 2.5 + targetY;
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Cleanup & Memory Disposal
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);

      // Dispose Three.js objects
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      singularityGeo.dispose();
      singularityMat.dispose();
      ring1Geo.dispose();
      ringMat1.dispose();
      ring2Geo.dispose();
      ringMat2.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      coreTexture.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto"
      style={{ touchAction: 'none' }}
    />
  );
};
