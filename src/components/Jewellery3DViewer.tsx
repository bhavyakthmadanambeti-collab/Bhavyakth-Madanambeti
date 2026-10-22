import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sparkles, Eye, RotateCw, ZoomIn, Layers, X, ShoppingBag } from 'lucide-react';

interface Jewellery3DViewerProps {
  onClose?: () => void;
  onSelectProduct?: (productName: string) => void;
  initialModel?: 'ring' | 'pendant' | 'bangle';
}

type MetalType = 'gold22k' | 'gold18kRose' | 'platinum' | 'silver925';
type GemstoneType = 'diamond' | 'ruby' | 'emerald' | 'sapphire';

export const Jewellery3DViewer: React.FC<Jewellery3DViewerProps> = ({
  onClose,
  onSelectProduct,
  initialModel = 'ring',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeModel, setActiveModel] = useState<'ring' | 'pendant' | 'bangle'>(initialModel);
  const [activeMetal, setActiveMetal] = useState<MetalType>('gold22k');
  const [activeGem, setActiveGem] = useState<GemstoneType>('diamond');
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References for render loop mutable state
  const stateRef = useRef({
    activeModel,
    activeMetal,
    activeGem,
    explodedFactor,
    autoRotate,
    rotX: 0.35,
    rotY: 0.6,
    targetRotX: 0.35,
    targetRotY: 0.6,
    zoom: 1.0,
    targetZoom: 1.0,
    isInteracting: false,
    prevPointerX: 0,
    prevPointerY: 0,
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.activeModel = activeModel;
    stateRef.current.activeMetal = activeMetal;
    stateRef.current.activeGem = activeGem;
    stateRef.current.explodedFactor = explodedFactor;
    stateRef.current.autoRotate = autoRotate;
  }, [activeModel, activeMetal, activeGem, explodedFactor, autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x180D07); // Deep luxury dark chocolate studio background
    scene.fog = new THREE.FogExp2(0x180D07, 0.05);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 5.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xFFF1D8, 2.8);
    keyLight.position.set(3.5, 5.0, 3.0);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xD6E8FF, 1.2);
    fillLight.position.set(-3.5, 2.5, -2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xF8D794, 2.0);
    rimLight.position.set(0, -3.0, -3.0);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xFFF9E6, 0x2A180E, 0.85);
    scene.add(hemiLight);

    // Contact Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.1;
    scene.add(shadowMesh);

    // Dynamic Procedural Sparkle Particles
    const sparkleCount = 60;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount * 3; i += 3) {
      sparklePos[i] = (Math.random() - 0.5) * 4;
      sparklePos[i + 1] = (Math.random() - 0.5) * 3 + 0.5;
      sparklePos[i + 2] = (Math.random() - 0.5) * 4;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xFFF3C4,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const sparkleMesh = new THREE.Points(sparkleGeo, sparkleMat);
    scene.add(sparkleMesh);

    // Metal & Gemstone Materials Palette
    const metalMaterials: Record<MetalType, THREE.MeshStandardMaterial> = {
      gold22k: new THREE.MeshStandardMaterial({
        color: 0xE8B84B, // Rich 22K Indian Yellow Gold
        metalness: 0.96,
        roughness: 0.16,
      }),
      gold18kRose: new THREE.MeshStandardMaterial({
        color: 0xE69F8B, // 18K Rose Gold
        metalness: 0.94,
        roughness: 0.18,
      }),
      platinum: new THREE.MeshStandardMaterial({
        color: 0xF2F5F8, // Pure Platinum / 18K White Gold
        metalness: 0.98,
        roughness: 0.12,
      }),
      silver925: new THREE.MeshStandardMaterial({
        color: 0xDCE0E4, // 925 Sterling Silver
        metalness: 0.92,
        roughness: 0.22,
      }),
    };

    const gemMaterials: Record<GemstoneType, THREE.MeshPhysicalMaterial> = {
      diamond: new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF,
        metalness: 0.0,
        roughness: 0.02,
        transmission: isSoftwareGl ? 0 : 0.95,
        transparent: true,
        opacity: isSoftwareGl ? 0.6 : 1.0,
        ior: 2.417, // Natural diamond refraction index
        reflectivity: 0.9,
        clearcoat: 1.0,
      }),
      ruby: new THREE.MeshPhysicalMaterial({
        color: 0x9B0924, // Royal Pigeon Blood Ruby
        metalness: 0.05,
        roughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.85,
        transparent: true,
        opacity: isSoftwareGl ? 0.8 : 1.0,
        ior: 1.77,
        clearcoat: 1.0,
      }),
      emerald: new THREE.MeshPhysicalMaterial({
        color: 0x097A44, // Zambian Deep Emerald
        metalness: 0.05,
        roughness: 0.06,
        transmission: isSoftwareGl ? 0 : 0.82,
        transparent: true,
        opacity: isSoftwareGl ? 0.8 : 1.0,
        ior: 1.58,
        clearcoat: 1.0,
      }),
      sapphire: new THREE.MeshPhysicalMaterial({
        color: 0x0E2C7D, // Royal Ceylon Blue Sapphire
        metalness: 0.05,
        roughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.85,
        transparent: true,
        opacity: isSoftwareGl ? 0.8 : 1.0,
        ior: 1.76,
        clearcoat: 1.0,
      }),
    };

    // -------------------------------------------------------------
    // Procedural Composite 3D Models
    // -------------------------------------------------------------
    const rootJewelGroup = new THREE.Group();
    scene.add(rootJewelGroup);

    // --- Model 1: Handcrafted Diamond Solitaire Ring (6-part group) ---
    const ringGroup = new THREE.Group();
    ringGroup.name = 'ringGroup';

    // 1. Ring Shank / Band (comfort fit)
    const bandGeo = new THREE.TorusGeometry(1.0, 0.14, 32, 64);
    const bandMesh = new THREE.Mesh(bandGeo, metalMaterials.gold22k);
    bandMesh.rotation.x = Math.PI / 2;
    bandMesh.castShadow = !isSoftwareGl;
    bandMesh.receiveShadow = !isSoftwareGl;
    ringGroup.add(bandMesh);

    // 2. Head / Prongs Crown Group (Explodable)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 1.0, 0);

    // Prongs (6 radial platinum claws)
    const prongMat = metalMaterials.platinum;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const prongGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.45, 16);
      const prongMesh = new THREE.Mesh(prongGeo, prongMat);
      prongMesh.position.set(Math.cos(angle) * 0.32, 0.22, Math.sin(angle) * 0.32);
      prongMesh.rotation.z = -Math.cos(angle) * 0.18;
      prongMesh.rotation.x = Math.sin(angle) * 0.18;
      crownGroup.add(prongMesh);
    }

    // 3. Faceted Center Solitaire Diamond Gem
    const gemGeo = new THREE.OctahedronGeometry(0.42, 2);
    // Scale slightly to brilliant cut proportions
    gemGeo.scale(1.0, 1.25, 1.0);
    const gemMesh = new THREE.Mesh(gemGeo, gemMaterials.diamond);
    gemMesh.position.set(0, 0.32, 0);
    gemMesh.castShadow = !isSoftwareGl;
    crownGroup.add(gemMesh);

    // 4. Accent Shoulder Pavé Diamonds (4 subtle micro diamonds)
    for (let side of [-1, 1]) {
      const accentGeo = new THREE.SphereGeometry(0.055, 16, 16);
      const accentMesh = new THREE.Mesh(accentGeo, gemMaterials.diamond);
      accentMesh.position.set(side * 0.45, 0.92, 0);
      ringGroup.add(accentMesh);
    }

    ringGroup.add(crownGroup);
    rootJewelGroup.add(ringGroup);

    // --- Model 2: Royal Kundan & Gemstone Pendant (8-part group) ---
    const pendantGroup = new THREE.Group();
    pendantGroup.name = 'pendantGroup';
    pendantGroup.visible = false;

    // 1. Gold Medallion Base
    const medallionGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.15, 36);
    const medallionMesh = new THREE.Mesh(medallionGeo, metalMaterials.gold22k);
    medallionMesh.rotation.x = Math.PI / 2;
    pendantGroup.add(medallionMesh);

    // 2. Bezel Edge Filigree Ring
    const filigreeGeo = new THREE.TorusGeometry(1.25, 0.08, 16, 48);
    const filigreeMesh = new THREE.Mesh(filigreeGeo, metalMaterials.gold22k);
    pendantGroup.add(filigreeMesh);

    // 3. Center Oval Gemstone
    const centerGemGeo = new THREE.DodecahedronGeometry(0.55, 1);
    centerGemGeo.scale(1.1, 1.4, 0.6);
    const centerGemMesh = new THREE.Mesh(centerGemGeo, gemMaterials.ruby);
    centerGemMesh.position.set(0, 0, 0.15);
    pendantGroup.add(centerGemMesh);

    // 4. Halo of 8 Kundan Polki stones
    const kundanPoles = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const kundanGeo = new THREE.SphereGeometry(0.16, 16, 16);
      kundanGeo.scale(1.0, 1.2, 0.5);
      const kundanMesh = new THREE.Mesh(kundanGeo, gemMaterials.diamond);
      kundanMesh.position.set(Math.cos(angle) * 0.88, Math.sin(angle) * 0.88, 0.12);
      kundanPoles.add(kundanMesh);
    }
    pendantGroup.add(kundanPoles);

    // 5. Hanging South Sea Pearl Drop
    const pearlGeo = new THREE.SphereGeometry(0.32, 32, 32);
    pearlGeo.scale(0.85, 1.25, 0.85);
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xFDFBF7,
      metalness: 0.1,
      roughness: 0.25,
    });
    const pearlMesh = new THREE.Mesh(pearlGeo, pearlMat);
    pearlMesh.position.set(0, -1.6, 0);
    pendantGroup.add(pearlMesh);

    // 6. Top Hanging Gold Bail Loop
    const bailGeo = new THREE.TorusGeometry(0.28, 0.06, 16, 32);
    const bailMesh = new THREE.Mesh(bailGeo, metalMaterials.gold22k);
    bailMesh.position.set(0, 1.45, 0);
    pendantGroup.add(bailMesh);

    rootJewelGroup.add(pendantGroup);

    // --- Model 3: Traditional Temple Kada Bangle (5-part group) ---
    const bangleGroup = new THREE.Group();
    bangleGroup.name = 'bangleGroup';
    bangleGroup.visible = false;

    // 1. Main Gold Kada Band
    const bangleGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.7, 48, 1, true);
    const bangleMesh = new THREE.Mesh(bangleGeo, metalMaterials.gold22k);
    bangleGroup.add(bangleMesh);

    // 2. Beveled Top & Bottom Rim Toruses
    const topRimGeo = new THREE.TorusGeometry(1.4, 0.08, 16, 48);
    const topRimMesh = new THREE.Mesh(topRimGeo, metalMaterials.gold22k);
    topRimMesh.position.y = 0.35;
    topRimMesh.rotation.x = Math.PI / 2;
    bangleGroup.add(topRimMesh);

    const botRimMesh = new THREE.Mesh(topRimGeo, metalMaterials.gold22k);
    botRimMesh.position.y = -0.35;
    botRimMesh.rotation.x = Math.PI / 2;
    bangleGroup.add(botRimMesh);

    // 3. Gemstones Encrusted Center Line
    const bangleGems = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const bGemGeo = new THREE.SphereGeometry(0.1, 16, 16);
      bGemGeo.scale(1, 0.6, 1);
      const bGem = new THREE.Mesh(bGemGeo, i % 2 === 0 ? gemMaterials.ruby : gemMaterials.diamond);
      bGem.position.set(Math.cos(angle) * 1.42, 0, Math.sin(angle) * 1.42);
      bangleGems.add(bGem);
    }
    bangleGroup.add(bangleGems);

    // 4. Clasp Finial Pin
    const claspGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16);
    const claspMesh = new THREE.Mesh(claspGeo, metalMaterials.gold22k);
    claspMesh.position.set(1.4, 0, 0);
    bangleGroup.add(claspMesh);

    rootJewelGroup.add(bangleGroup);

    // -------------------------------------------------------------
    // Mouse & Touch Orbit Controls (No external library required)
    // -------------------------------------------------------------
    const handlePointerDown = (e: PointerEvent) => {
      stateRef.current.isInteracting = true;
      stateRef.current.prevPointerX = e.clientX;
      stateRef.current.prevPointerY = e.clientY;
      setIsDragging(true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!stateRef.current.isInteracting) return;
      const dx = e.clientX - stateRef.current.prevPointerX;
      const dy = e.clientY - stateRef.current.prevPointerY;
      stateRef.current.prevPointerX = e.clientX;
      stateRef.current.prevPointerY = e.clientY;

      stateRef.current.targetRotY += dx * 0.008;
      stateRef.current.targetRotX = Math.max(-0.6, Math.min(1.2, stateRef.current.targetRotX + dy * 0.008));
    };

    const handlePointerUp = () => {
      stateRef.current.isInteracting = false;
      setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0015;
      stateRef.current.targetZoom = Math.max(0.6, Math.min(1.8, stateRef.current.targetZoom + delta));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // Lossless Animation Loop with Exponential Damping
    // -------------------------------------------------------------
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Exponential damping for silky smooth rotation and zoom
      const dampFactor = 1 - Math.exp(-8 * delta);

      if (stateRef.current.autoRotate && !stateRef.current.isInteracting) {
        stateRef.current.targetRotY += 0.4 * delta;
      }

      stateRef.current.rotX += (stateRef.current.targetRotX - stateRef.current.rotX) * dampFactor;
      stateRef.current.rotY += (stateRef.current.targetRotY - stateRef.current.rotY) * dampFactor;
      stateRef.current.zoom += (stateRef.current.targetZoom - stateRef.current.zoom) * dampFactor;

      rootJewelGroup.rotation.x = stateRef.current.rotX;
      rootJewelGroup.rotation.y = stateRef.current.rotY;
      camera.position.z = 4.2 * stateRef.current.zoom;

      // Model visibility switch
      ringGroup.visible = stateRef.current.activeModel === 'ring';
      pendantGroup.visible = stateRef.current.activeModel === 'pendant';
      bangleGroup.visible = stateRef.current.activeModel === 'bangle';

      // Update active materials
      const selectedMetalMat = metalMaterials[stateRef.current.activeMetal];
      const selectedGemMat = gemMaterials[stateRef.current.activeGem];

      // Update ring materials
      bandMesh.material = selectedMetalMat;
      gemMesh.material = selectedGemMat;

      // Update exploded view separation smoothly
      const expTarget = stateRef.current.explodedFactor;
      crownGroup.position.y = 1.0 + expTarget * 0.8;
      gemMesh.position.y = 0.32 + expTarget * 0.6;
      kundanPoles.position.z = 0.12 + expTarget * 0.5;
      pearlMesh.position.y = -1.6 - expTarget * 0.6;

      // Subtle sparkle rotation
      sparkleMesh.rotation.y += 0.05 * delta;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('wheel', handleWheel);
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      renderer.dispose();
    };
  }, []);

  const resetCamera = (type: 'front' | 'top' | 'macro') => {
    if (type === 'front') {
      stateRef.current.targetRotX = 0.1;
      stateRef.current.targetRotY = 0;
      stateRef.current.targetZoom = 1.0;
    } else if (type === 'top') {
      stateRef.current.targetRotX = 0.9;
      stateRef.current.targetRotY = 0.7;
      stateRef.current.targetZoom = 1.1;
    } else if (type === 'macro') {
      stateRef.current.targetRotX = 0.3;
      stateRef.current.targetRotY = 0.4;
      stateRef.current.targetZoom = 0.65;
    }
  };

  const getModelTitle = () => {
    switch (activeModel) {
      case 'ring':
        return 'Eternal Solitaire Diamond Ring (1.20 Carat)';
      case 'pendant':
        return 'Royal Kundan & Ruby Heritage Medallion';
      case 'bangle':
        return 'Imperial Peacock Enamel Temple Kada';
    }
  };

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-[#170B05] rounded-2xl overflow-hidden border border-[#C69A39]/30 shadow-2xl select-none">
      {/* Top Header Badge & Close Button */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-[#23140C]/85 border border-[#C69A39]/40 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-sm pointer-events-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E5B348]" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#E7C979] font-semibold">
              3D Interactive Masterpiece
            </div>
            <div className="text-sm font-serif font-bold text-[#FDFBF7]">
              {getModelTitle()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onSelectProduct && (
            <button
              onClick={() => onSelectProduct(getModelTitle())}
              className="bg-gradient-to-r from-[#D4AF37] to-[#AA7A1E] text-[#170B05] font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Inquire & Shop</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#23140C]/90 border border-[#C69A39]/30 text-[#FDFBF7] flex items-center justify-center hover:bg-[#3D2214] transition cursor-pointer"
              title="Close 3D View"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* Floating View Angle Quick Pills (Top-Right under header) */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => resetCamera('front')}
          className="bg-[#23140C]/80 border border-[#C69A39]/30 text-[#FDFBF7] text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#3D2214] transition cursor-pointer flex items-center gap-1.5"
        >
          <Eye className="w-3 h-3 text-[#E5B348]" />
          <span>Front</span>
        </button>
        <button
          onClick={() => resetCamera('top')}
          className="bg-[#23140C]/80 border border-[#C69A39]/30 text-[#FDFBF7] text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#3D2214] transition cursor-pointer flex items-center gap-1.5"
        >
          <Layers className="w-3 h-3 text-[#E5B348]" />
          <span>Top Angle</span>
        </button>
        <button
          onClick={() => resetCamera('macro')}
          className="bg-[#23140C]/80 border border-[#C69A39]/30 text-[#FDFBF7] text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#3D2214] transition cursor-pointer flex items-center gap-1.5"
        >
          <ZoomIn className="w-3 h-3 text-[#E5B348]" />
          <span>Macro 4X</span>
        </button>
      </div>

      {/* Ergonomic Unified Collapsible Bottom Dock (Zero Center Occlusion!) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[880px] pointer-events-auto">
        {/* Toggle Collapse Pill */}
        <div className="flex justify-center mb-1.5">
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="bg-[#23140C]/90 border border-[#C69A39]/40 text-[#E7C979] text-[11px] font-medium px-4 py-1 rounded-full shadow-md hover:bg-[#3D2214] transition cursor-pointer"
          >
            {isHudCollapsed ? '▴ Show Craft Controls' : '▾ Collapse Controls (Zen Mode)'}
          </button>
        </div>

        {/* Control Dock Panel */}
        {!isHudCollapsed && (
          <div className="bg-[#1F1209]/95 border border-[#C69A39]/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white text-xs space-y-3">
            {/* Row 1: Model Selector & Auto Rotate */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C69A39]/20 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[#E7C979] font-medium text-[11px] uppercase tracking-wider mr-1">
                  Masterpiece:
                </span>
                <button
                  onClick={() => setActiveModel('ring')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeModel === 'ring'
                      ? 'bg-[#C69A39] text-[#170B05] font-semibold'
                      : 'bg-[#2A180E] text-[#FDFBF7]/80 hover:bg-[#3D2214]'
                  }`}
                >
                  💍 Solitaire Ring
                </button>
                <button
                  onClick={() => setActiveModel('pendant')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeModel === 'pendant'
                      ? 'bg-[#C69A39] text-[#170B05] font-semibold'
                      : 'bg-[#2A180E] text-[#FDFBF7]/80 hover:bg-[#3D2214]'
                  }`}
                >
                  ✨ Kundan Medallion
                </button>
                <button
                  onClick={() => setActiveModel('bangle')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeModel === 'bangle'
                      ? 'bg-[#C69A39] text-[#170B05] font-semibold'
                      : 'bg-[#2A180E] text-[#FDFBF7]/80 hover:bg-[#3D2214]'
                  }`}
                >
                  👑 Temple Kada
                </button>
              </div>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  autoRotate
                    ? 'bg-[#C69A39]/30 text-[#E7C979] border border-[#C69A39]/60'
                    : 'bg-[#2A180E] text-stone-400 border border-stone-700'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Auto-Spin</span>
              </button>
            </div>

            {/* Row 2: Precious Metal Swatches & Gemstone Swatches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Precious Metal Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[#E7C979] font-medium text-[11px] uppercase tracking-wider shrink-0">
                  Precious Metal:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveMetal('gold22k')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeMetal === 'gold22k'
                        ? 'border-[#C69A39] bg-[#C69A39]/20 text-[#E7C979]'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#E8B84B] border border-amber-300 inline-block" />
                    <span>22K Gold</span>
                  </button>

                  <button
                    onClick={() => setActiveMetal('gold18kRose')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeMetal === 'gold18kRose'
                        ? 'border-[#E69F8B] bg-[#E69F8B]/20 text-[#E69F8B]'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#E69F8B] border border-rose-300 inline-block" />
                    <span>18K Rose</span>
                  </button>

                  <button
                    onClick={() => setActiveMetal('platinum')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeMetal === 'platinum'
                        ? 'border-[#F2F5F8] bg-white/20 text-[#F2F5F8]'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#F2F5F8] border border-stone-200 inline-block" />
                    <span>Platinum</span>
                  </button>

                  <button
                    onClick={() => setActiveMetal('silver925')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeMetal === 'silver925'
                        ? 'border-[#DCE0E4] bg-stone-300/20 text-[#DCE0E4]'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#DCE0E4] border border-stone-400 inline-block" />
                    <span>925 Silver</span>
                  </button>
                </div>
              </div>

              {/* Gemstone Finishes */}
              <div className="flex items-center gap-2">
                <span className="text-[#E7C979] font-medium text-[11px] uppercase tracking-wider shrink-0">
                  Gemstone:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveGem('diamond')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeGem === 'diamond'
                        ? 'border-white bg-white/20 text-white font-semibold'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-cyan-200" />
                    <span>Diamond</span>
                  </button>

                  <button
                    onClick={() => setActiveGem('ruby')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeGem === 'ruby'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-semibold'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                    <span>Ruby</span>
                  </button>

                  <button
                    onClick={() => setActiveGem('emerald')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeGem === 'emerald'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Emerald</span>
                  </button>

                  <button
                    onClick={() => setActiveGem('sapphire')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition cursor-pointer ${
                      activeGem === 'sapphire'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-semibold'
                        : 'border-stone-800 bg-[#2A180E] text-stone-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>Sapphire</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Exploded View Anatomy Slider */}
            <div className="flex items-center gap-3 pt-1 border-t border-[#C69A39]/15">
              <span className="text-[#E7C979] font-medium text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#E5B348]" />
                <span>Exploded Anatomy:</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedFactor}
                onChange={e => setExplodedFactor(parseFloat(e.target.value))}
                className="w-full accent-[#C69A39] cursor-pointer"
              />
              <span className="text-stone-300 font-mono text-[11px] w-10 text-right">
                {Math.round(explodedFactor * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
