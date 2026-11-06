import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Book, PageContent } from '../types/book';
import { soundEngine } from '../utils/audio';
import {
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ThreeBookViewerProps {
  book: Book;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export const ThreeBookViewer: React.FC<ThreeBookViewerProps> = ({
  book,
  currentPage,
  onPageChange,
  isOpen,
  onToggleOpen,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [openProgress, setOpenProgress] = useState<number>(isOpen ? 1 : 0);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Three.js instance references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const frontCoverGroupRef = useRef<THREE.Group | null>(null);
  const pagesBlockRef = useRef<THREE.Mesh | null>(null);
  const leftPageMeshRef = useRef<THREE.Mesh | null>(null);
  const rightPageMeshRef = useRef<THREE.Mesh | null>(null);
  const frontCoverMeshRef = useRef<THREE.Mesh | null>(null);
  const ribbonMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);
  const targetOpenProgressRef = useRef<number>(isOpen ? 1 : 0);
  const currentOpenProgressRef = useRef<number>(isOpen ? 1 : 0);

  // Sync open state
  useEffect(() => {
    targetOpenProgressRef.current = isOpen ? 1 : 0;
  }, [isOpen]);

  // Update textures when page changes
  const updatePageTextures = useCallback(() => {
    if (!leftPageMeshRef.current || !rightPageMeshRef.current || !frontCoverMeshRef.current) return;

    const leftIdx = Math.max(0, currentPage - 1);
    const rightIdx = Math.min(book.pages.length - 1, currentPage);

    const leftPage = book.pages[leftIdx];
    const rightPage = book.pages[rightIdx];
    const coverPage = book.pages[0];

    // Texture helper
    const createTex = (page?: PageContent) => {
      let tex: THREE.Texture;
      if (page?.renderedCanvas) {
        tex = new THREE.CanvasTexture(page.renderedCanvas);
      } else {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 512;
        dummyCanvas.height = 700;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#faf7f2';
          ctx.fillRect(0, 0, 512, 700);
          ctx.fillStyle = '#1c1b18';
          ctx.font = '24px serif';
          ctx.fillText(`Halaman ${page?.pageNumber || 1}`, 50, 100);
        }
        tex = new THREE.CanvasTexture(dummyCanvas);
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      if (rendererRef.current) {
        tex.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
      }
      return tex;
    };

    const leftTex = createTex(leftPage);
    const rightTex = createTex(rightPage);
    const coverTex = createTex(coverPage);

    // Apply to materials
    if (leftPageMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
      leftPageMeshRef.current.material.map = leftTex;
      leftPageMeshRef.current.material.needsUpdate = true;
    }
    if (rightPageMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
      rightPageMeshRef.current.material.map = rightTex;
      rightPageMeshRef.current.material.needsUpdate = true;
    }
    if (frontCoverMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
      frontCoverMeshRef.current.material.map = coverTex;
      frontCoverMeshRef.current.material.needsUpdate = true;
    }
  }, [book, currentPage]);

  useEffect(() => {
    updatePageTextures();
  }, [updatePageTextures]);

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

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.04);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 8.5, 12);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (3-Point balanced studio lighting)
    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    keyLight.position.set(6, 12, 7);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 8;
      keyLight.shadow.camera.bottom = -8;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool fill light
    const hemiLight = new THREE.HemisphereLight(0xe8f0ff, 0x181c20, 1.2);
    scene.add(hemiLight);

    // Subtle rim light
    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.4);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // 5. Reading Desk Surface & Radial Contact Shadow
    // Rich dark mahogany wood table top
    const deskGeo = new THREE.CylinderGeometry(14, 14, 0.4, 48);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x15161a,
      roughness: 0.75,
      metalness: 0.1,
    });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.position.y = -0.22;
    deskMesh.receiveShadow = !isSoftwareGl;
    scene.add(deskMesh);

    // Soft radial contact shadow plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(10, 8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // 6. Realistic 3D Composite Book Assembly (3-12 parts)
    const bookGroup = new THREE.Group();
    bookGroupRef.current = bookGroup;
    bookGroup.position.set(0, 0.15, 0);
    scene.add(bookGroup);

    // Book dimensions
    const bookWidth = 3.6;
    const bookHeight = 4.8;
    const bookThickness = 0.55;
    const coverThickness = 0.06;

    // A. Back Cover (hard base)
    const backCoverGeo = new THREE.BoxGeometry(bookWidth, coverThickness, bookHeight);
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x1f2421,
      roughness: 0.55,
      metalness: 0.2,
    });
    const backCover = new THREE.Mesh(backCoverGeo, leatherMat);
    backCover.position.set(bookWidth / 2, coverThickness / 2, 0);
    backCover.castShadow = !isSoftwareGl;
    backCover.receiveShadow = !isSoftwareGl;
    bookGroup.add(backCover);

    // B. Spine (curved cylinder quadrant)
    const spineGeo = new THREE.CylinderGeometry(
      bookThickness / 2,
      bookThickness / 2,
      bookHeight,
      16,
      1,
      false,
      Math.PI / 2,
      Math.PI
    );
    const spineMesh = new THREE.Mesh(spineGeo, leatherMat);
    spineMesh.rotation.z = Math.PI / 2;
    spineMesh.position.set(0, bookThickness / 2, 0);
    bookGroup.add(spineMesh);

    // C. Paper Page Block (layered cream pages)
    const pagesGeo = new THREE.BoxGeometry(bookWidth - 0.12, bookThickness - coverThickness * 1.5, bookHeight - 0.18);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf6f1e7,
      roughness: 0.85,
      metalness: 0.05,
    });
    const pagesBlock = new THREE.Mesh(pagesGeo, paperMat);
    pagesBlock.position.set((bookWidth - 0.12) / 2 + 0.06, bookThickness / 2, 0);
    pagesBlock.castShadow = !isSoftwareGl;
    pagesBlock.receiveShadow = !isSoftwareGl;
    pagesBlockRef.current = pagesBlock;
    bookGroup.add(pagesBlock);

    // D. Inside Right Page (open book reading spread)
    const pageSpreadGeo = new THREE.PlaneGeometry(bookWidth - 0.15, bookHeight - 0.2);
    const rightPageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.05,
    });
    const rightPageMesh = new THREE.Mesh(pageSpreadGeo, rightPageMat);
    rightPageMesh.rotation.x = -Math.PI / 2;
    rightPageMesh.position.set((bookWidth - 0.15) / 2 + 0.06, bookThickness + 0.002, 0);
    rightPageMesh.receiveShadow = !isSoftwareGl;
    rightPageMeshRef.current = rightPageMesh;
    bookGroup.add(rightPageMesh);

    // E. Front Cover Hinge Group (rotates from 0 to -Math.PI)
    const frontCoverGroup = new THREE.Group();
    frontCoverGroupRef.current = frontCoverGroup;
    frontCoverGroup.position.set(0, bookThickness, 0); // hinge at spine top
    bookGroup.add(frontCoverGroup);

    // Front Cover Mesh
    const frontCoverGeo = new THREE.BoxGeometry(bookWidth, coverThickness, bookHeight);
    const frontCoverMesh = new THREE.Mesh(frontCoverGeo, leatherMat.clone());
    frontCoverMesh.position.set(bookWidth / 2, coverThickness / 2, 0);
    frontCoverMesh.castShadow = !isSoftwareGl;
    frontCoverMeshRef.current = frontCoverMesh;
    frontCoverGroup.add(frontCoverMesh);

    // Inside Left Page (attached to the underside of the front cover)
    const leftPageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.05,
    });
    const leftPageMesh = new THREE.Mesh(pageSpreadGeo, leftPageMat);
    leftPageMesh.rotation.x = Math.PI / 2;
    leftPageMesh.position.set(bookWidth / 2, -coverThickness / 2 - 0.001, 0);
    leftPageMeshRef.current = leftPageMesh;
    frontCoverGroup.add(leftPageMesh);

    // F. Silk Bookmark Ribbon
    const ribbonGeo = new THREE.PlaneGeometry(0.18, bookHeight + 0.9);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xa82020,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.rotation.x = -Math.PI / 2;
    ribbonMesh.position.set(0.8, bookThickness + 0.01, 0.4);
    ribbonMeshRef.current = ribbonMesh;
    bookGroup.add(ribbonMesh);

    // Gold decorative foil frame on cover
    const goldLineMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
    });
    const goldFrameGeo = new THREE.RingGeometry(0.5, 0.55, 32);
    const goldFrame = new THREE.Mesh(goldFrameGeo, goldLineMat);
    goldFrame.rotation.x = -Math.PI / 2;
    goldFrame.position.set(bookWidth / 2, coverThickness + 0.002, 0);
    frontCoverGroup.add(goldFrame);

    // Initial textures
    updatePageTextures();

    // Mouse drag interaction for orbiting camera
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let sphericalTheta = 0;
    let sphericalPhi = Math.PI / 3.8;
    let sphericalRadius = 13.5;

    const onMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking buttons
      if ((e.target as HTMLElement).closest('button, input, a')) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= deltaX * 0.006;
      sphericalPhi = Math.max(0.2, Math.min(Math.PI / 2.1, sphericalPhi - deltaY * 0.006));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      sphericalRadius = Math.max(7, Math.min(22, sphericalRadius + e.deltaY * 0.01));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Paced Software WebGL / 60fps Loop
    let lastTime = performance.now();

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth cover opening spring kinematics
      const target = targetOpenProgressRef.current;
      currentOpenProgressRef.current = THREE.MathUtils.damp(
        currentOpenProgressRef.current,
        target,
        6.5,
        dt
      );
      setOpenProgress(currentOpenProgressRef.current);

      if (frontCoverGroupRef.current) {
        // Rotate cover open from 0 to -Math.PI (-180 degrees)
        const openAngle = -currentOpenProgressRef.current * (Math.PI * 0.98);
        frontCoverGroupRef.current.rotation.z = openAngle;

        // Dynamic book centering: when opened flat, center book between left and right pages
        if (bookGroupRef.current) {
          const shiftX = -currentOpenProgressRef.current * (bookWidth / 2);
          bookGroupRef.current.position.x = shiftX;
        }
      }

      // Auto rotation if enabled
      if (autoRotate && !isDragging) {
        sphericalTheta += dt * 0.25;
      }

      // Update camera position from spherical coords
      const camX = sphericalRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      const camY = sphericalRadius * Math.cos(sphericalPhi);
      const camZ = sphericalRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camZ, 8, dt);
      camera.lookAt(0, 0.3, 0);

      renderer.render(scene, camera);

      animFrameRef.current = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once on mount

  const handleToggleBook = () => {
    const nextState = !isOpen;
    onToggleOpen(nextState);
    if (soundOn) {
      if (nextState) {
        soundEngine.playBookOpen();
      } else {
        soundEngine.playBookClose();
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 2));
      if (soundOn) soundEngine.playPageFlip();
    }
  };

  const handleNextPage = () => {
    if (currentPage < book.totalPages) {
      onPageChange(Math.min(book.totalPages, currentPage + 2));
      if (soundOn) soundEngine.playPageFlip();
    }
  };

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 8.5, 12);
      cameraRef.current.lookAt(0, 0.2, 0);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-neutral-950">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Badge */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3 pointer-events-auto">
        <div className="bg-neutral-900/90 border border-neutral-700/60 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-100 font-title-custom">
              {book.title}
            </h2>
            <p className="text-xs text-neutral-400">
              {isOpen ? `Terbuka • Halaman ${currentPage} - ${Math.min(book.totalPages, currentPage + 1)} dari ${book.totalPages}` : 'Buku Tertutup • Klik Buka Buku'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Right Quick Actions */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            soundEngine.enabled = next;
          }}
          className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-neutral-700/60 transition shadow-lg"
          title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
        >
          {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-neutral-700/60 transition shadow-lg"
          title="Reset Sudut Kamera"
        >
          <RotateCcw size={17} />
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-2 text-xs font-medium rounded-xl border transition shadow-lg flex items-center gap-1.5 ${
            autoRotate
              ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
              : 'bg-neutral-900/90 text-neutral-300 border-neutral-700/60 hover:bg-neutral-800'
          }`}
          title="Rotasi Otomatis 3D"
        >
          <Sparkles size={14} />
          {autoRotate ? 'Orbit Aktif' : 'Orbit 3D'}
        </button>
      </div>

      {/* Viewport Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-neutral-400/70 pointer-events-none text-center">
        Tahan & geser mouse untuk memutar sudut pandang 3D • Scroll untuk zoom
      </div>

      {/* Unified Bottom Control Dock (Consolidated, <= 15% footprint per Three.js skill) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-out max-w-[min(920px,94vw)] w-full ${
          hudCollapsed ? 'translate-y-[calc(100%-12px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle HUD Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setHudCollapsed(!hudCollapsed)}
            className="px-4 py-1 text-[11px] font-medium tracking-wide uppercase bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/70 rounded-full transition shadow-md flex items-center gap-1.5 pointer-events-auto"
          >
            {hudCollapsed ? '▲ Tampilkan Kontrol 3D' : '▼ Sembunyikan Panel'}
          </button>
        </div>

        {/* Main Dock Container (solid surface per guidelines, no heavy backdrop-filter over WebGL) */}
        <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
          {/* Left: Book Cover Open/Close Slider & Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleBook}
              className={`px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-2 transition shadow ${
                isOpen
                  ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold'
                  : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-600'
              }`}
            >
              <BookOpen size={16} />
              {isOpen ? 'Tutup Buku 3D' : 'Buka Sampul Buku'}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-300">
              <span className="text-[11px] text-neutral-400">Derajat Buka:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={openProgress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  targetOpenProgressRef.current = val;
                  if (val > 0.05 && !isOpen) onToggleOpen(true);
                  if (val <= 0.05 && isOpen) onToggleOpen(false);
                }}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="w-8 font-mono text-[11px] text-amber-400">
                {Math.round(openProgress * 100)}%
              </span>
            </div>
          </div>

          {/* Center: Page Turn Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!isOpen || currentPage <= 1}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-200 rounded-xl border border-neutral-700 transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="font-mono text-xs px-2.5 py-1 bg-neutral-950/70 rounded-lg border border-neutral-800 text-neutral-200">
              {currentPage} / {book.totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!isOpen || currentPage >= book.totalPages}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-200 rounded-xl border border-neutral-700 transition"
              title="Halaman Berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: Quick view mode message */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Eye size={14} className="text-amber-500" />
            <span>Mode Studio 3D</span>
          </div>
        </div>
      </div>
    </div>
  );
};
