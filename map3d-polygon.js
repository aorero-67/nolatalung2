(function () {
  /* ═══════════════════════════════════════════════════════════════════
   * PHATTHALUNG 3D MAP — Premium Polygon Edition
   * Geographically accurate polygon shapes for all 11 districts
   * Three.js with MeshPhysicalMaterial, cinematic lighting, particles
   * ═══════════════════════════════════════════════════════════════════ */

  const DISTRICT_COLORS = {
    'pa-phayom':     0x6b5344,
    'khuan-khanun':  0x7a9e3b,
    'si-banphot':    0x9e4a2d,
    'srinagarindra': 0x7a4a9e,
    'mueang':        0xc9953a,
    'kong-ra':       0x4a7c59,
    'khao-chaison':  0x2d6a9f,
    'bang-kaeo':     0x2d4a8a,
    'tamot':         0x8b6914,
    'pa-bon':        0x3d6b3d,
    'pak-phayun':    0x1a7a6e,
  };

  const DISTRICT_SHAPES = [
    { id:'pa-phayom',     pts:[[50,44],[132,36],[150,58],[153,93],[132,113],[102,123],[70,113],[48,87]] },
    { id:'khuan-khanun',  pts:[[150,58],[244,40],[293,54],[297,100],[272,132],[232,142],[192,132],[157,117],[132,113],[153,93]] },
    { id:'si-banphot',    pts:[[48,87],[70,113],[102,123],[132,113],[157,117],[157,139],[153,172],[127,196],[90,202],[58,187],[44,157]] },
    { id:'srinagarindra', pts:[[90,202],[127,196],[153,172],[175,213],[170,267],[140,282],[104,272],[78,246],[78,222]] },
    { id:'mueang',        pts:[[157,117],[192,132],[232,142],[272,132],[297,100],[298,156],[301,202],[275,232],[235,246],[199,243],[175,213],[153,172],[157,139]] },
    { id:'kong-ra',       pts:[[78,222],[78,246],[104,272],[140,282],[170,267],[191,327],[165,341],[145,366],[108,377],[76,360],[64,326],[68,296]] },
    { id:'khao-chaison',  pts:[[175,213],[199,243],[235,246],[275,232],[301,202],[298,273],[283,295],[226,336],[191,327],[170,267]] },
    { id:'bang-kaeo',     pts:[[272,132],[344,183],[378,204],[382,247],[360,277],[326,287],[298,273],[301,202],[298,156],[297,100]] },
    { id:'tamot',         pts:[[145,366],[165,341],[191,327],[226,336],[253,441],[209,443],[175,451],[145,435],[129,403]] },
    { id:'pa-bon',        pts:[[226,336],[283,295],[298,273],[326,287],[337,373],[321,413],[285,433],[253,441]] },
    { id:'pak-phayun',    pts:[[326,287],[360,277],[382,247],[397,308],[392,358],[370,398],[340,408],[321,413],[337,373]] },
  ].map((d) => ({ ...d, color: DISTRICT_COLORS[d.id] || 0x222634 }));

  const THAI_NAMES = {
    'pa-phayom': 'ป่าพะยอม',
    'khuan-khanun': 'ควนขนุน',
    'si-banphot': 'ศรีบรรพต',
    'srinagarindra': 'ศรีนครินทร์',
    'mueang': 'เมืองพัทลุง',
    'kong-ra': 'กงหรา',
    'khao-chaison': 'เขาชัยสน',
    'bang-kaeo': 'บางแก้ว',
    'tamot': 'ตะโหมด',
    'pa-bon': 'ป่าบอน',
    'pak-phayun': 'ปากพะยูน',
  };

  window.Map3D = {
    renderer: null,
    scene: null,
    camera: null,
    raycaster: null,
    mouse: null,
    meshes: [],
    hoveredMesh: null,
    selectedMesh: null,
    labels: [],
    _raf: null,
    _resize: null,
    _cameraCenter: null,
    _targetCenter: null,
    _cameraDistance: 16.0,
    _targetDistance: 16.0,
    _cameraAngle: 0,
    _targetAngle: 0,
    _cameraPhi: 1.3,
    _targetPhi: 1.3,
    _dust: null,
    _fireflies: null,
    _ground: null,
    _ripple: null,
    _routeLineGroup: null,
    _highlightedIds: [],
    _routeAnimPhase: 0,
    _introActive: true,
    _introProgress: 0,
    _paused: false,
    _tourTimer: null,
    _io: null,
    _reduceMotion: false,
    _time: 0,
    _isDragging: false,
    _dragStart: { x: 0, y: 0 },

    _toWorld(x, y) {
      const scale = 0.018;
      return { x: (x - 215) * scale, z: (y - 255) * scale };
    },

    _centroid(points) {
      const sum = points.reduce((acc, p) => ({ x: acc.x + p[0], y: acc.y + p[1] }), { x: 0, y: 0 });
      const p = this._toWorld(sum.x / points.length, sum.y / points.length);
      return new THREE.Vector3(p.x, 0, p.z);
    },

    init() {
      const canvas = document.getElementById('map3dCanvas') || document.getElementById('webglCanvas');
      const loading = document.getElementById('webglLoading');
      if (!canvas) return;
      if (typeof THREE === 'undefined') {
        this._initSvgFallback(canvas, loading);
        return;
      }

      this.destroy();
      const container = canvas.parentElement;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._reduceMotion = reduceMotion;
      this._paused = false;

      // ── Renderer ──
      this.renderer = new THREE.WebGLRenderer({
        canvas, antialias: !isMobile && !reduceMotion, alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.1 : 2));
      this.renderer.shadowMap.enabled = !isMobile;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      if (THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      // ── Scene ──
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.04);

      // ── Camera ──
      this.camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
      this._cameraCenter = new THREE.Vector3(0.15, 0, 0.15);
      this._targetCenter = this._cameraCenter.clone();
      this._cameraAngle = 0;
      this._targetAngle = 0;
      this._cameraDistance = 16.0;
      this._targetDistance = 16.0;
      this._cameraPhi = 1.3;
      this._targetPhi = 1.3;
      this.selectedMesh = null;

      // ── Lighting — Premium cinematic setup ──
      this.scene.add(new THREE.HemisphereLight(0x8899cc, 0x1a1020, 0.55));
      this.scene.add(new THREE.AmbientLight(0xc8d8ff, 0.45));

      // Main sun (warm gold directional)
      const sun = new THREE.DirectionalLight(0xfff0d4, 2.8);
      sun.position.set(-4, 12, 4);
      sun.castShadow = !isMobile;
      if (sun.castShadow) {
        sun.shadow.mapSize.set(isMobile ? 512 : 2048, isMobile ? 512 : 2048);
      }
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 40;
      sun.shadow.camera.left = -8;
      sun.shadow.camera.right = 8;
      sun.shadow.camera.top = 8;
      sun.shadow.camera.bottom = -8;
      sun.shadow.bias = -0.0008;
      this.scene.add(sun);

      // Blue fill from opposite side
      const fill = new THREE.DirectionalLight(0x5274ff, 0.9);
      fill.position.set(6, 5, -6);
      this.scene.add(fill);

      // Gold accent point light
      const accent = new THREE.PointLight(0xc9953a, 3.0, 15);
      accent.position.set(2, 3, 2);
      this.scene.add(accent);

      // Subtle purple rim
      const rim = new THREE.PointLight(0x7c4dff, 1.2, 12);
      rim.position.set(-3, 2, -3);
      this.scene.add(rim);

      // Simulated env map — subtle sky gradient on scene
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 2;
      envCanvas.height = 128;
      const ctx = envCanvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#1a2040');
      grad.addColorStop(0.5, '#0a1028');
      grad.addColorStop(1, '#050810');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2, 128);
      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      this._envMap = envTex;

      // Reflective ground plane with grid
      const groundGeo = new THREE.PlaneGeometry(28, 28);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
        metalness: 0.65,
        transparent: true,
        opacity: 0.85,
        envMap: envTex,
        envMapIntensity: 0.6,
      });
      this._ground = new THREE.Mesh(groundGeo, groundMat);
      this._ground.rotation.x = -Math.PI / 2;
      this._ground.position.y = -0.02;
      this._ground.receiveShadow = true;
      this.scene.add(this._ground);

      const grid = new THREE.GridHelper(28, 28, 0xc9953a, 0xe2e8f0);
      grid.material.opacity = 0.18;
      grid.material.transparent = true;
      grid.position.y = -0.01;
      this.scene.add(grid);

      // Intro flyover — start from elevated wide angle
      this._introActive = true;
      this._introProgress = 0;
      this._cameraDistance = 24;
      this._targetDistance = 16.0;
      this._cameraPhi = 0.55;
      this._targetPhi = 1.3;
      this._cameraAngle = -0.4;
      this._targetAngle = 0;

      // ── Raycaster ──
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2(-99, -99);
      this.meshes = [];
      this.labels = [];

      // ── Build district meshes ──
      const GAP = 0.94; // Shrink factor to create gaps between districts
      DISTRICT_SHAPES.forEach((district) => {
        const centroid = this._centroid(district.pts);
        const shape = new THREE.Shape();
        // Compute raw local coords then shrink toward center for gap
        const rawPts = district.pts.map(([px, py]) => {
          const p = this._toWorld(px, py);
          return { x: p.x - centroid.x, y: -(p.z - centroid.z) };
        });
        rawPts.forEach((pt, idx) => {
          const sx = pt.x * GAP;
          const sy = pt.y * GAP;
          if (idx === 0) shape.moveTo(sx, sy);
          else shape.lineTo(sx, sy);
        });
        shape.closePath();

        const height = district.id === 'mueang' ? 0.52 : 0.38;
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.028,
          bevelSegments: 4,
          curveSegments: 3,
        });
        geo.rotateX(-Math.PI / 2);

        // Premium crystal/glass material for top face
        const topMat = new THREE.MeshPhysicalMaterial({
          color: district.color,
          roughness: 0.18,
          metalness: 0.18,
          clearcoat: 1.0,
          clearcoatRoughness: 0.06,
          emissive: new THREE.Color(district.color),
          emissiveIntensity: 0.08,
          envMap: this._envMap,
          envMapIntensity: 0.9,
        });

        // Darker side material
        const sideMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(district.color).multiplyScalar(0.35),
          roughness: 0.5,
          metalness: 0.25,
        });

        const mesh = new THREE.Mesh(geo, [topMat, sideMat]);
        mesh.position.set(centroid.x, 0, centroid.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
          id: district.id,
          name: THAI_NAMES[district.id] || district.id,
          color: district.color,
          height,
          center: centroid.clone(),
          baseY: 0,
        };
        this.scene.add(mesh);
        this.meshes.push(mesh);

        // Edge wireframe — subtle gold outline
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0xc9953a, transparent: true, opacity: 0.4 })
        );
        mesh.add(edges);
        mesh.userData.edges = edges;

        // Floating label
        const label = this._createLabel(mesh.userData.name);
        label.position.set(centroid.x, height + 0.22, centroid.z);
        label.scale.setScalar(district.id === 'srinagarindra' ? 0.85 : 0.95);
        this.scene.add(label);
        mesh.userData.label = label;
        this.labels.push(label);
      });

      // ── Firefly particles (varied sizes via dual layers) ──
      const buildFireflies = (count, size, opacity) => {
        if (!count) return null;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          pos[i * 3]     = (Math.random() - 0.5) * 14;
          pos[i * 3 + 1] = Math.random() * 3.5 + 0.3;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
          phases[i] = Math.random() * Math.PI * 2;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        const mat = new THREE.PointsMaterial({
          color: 0xffe4a0,
          size,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const pts = new THREE.Points(geo, mat);
        pts.userData._phases = phases;
        return pts;
      };
      this._fireflies = buildFireflies(reduceMotion ? 0 : isMobile ? 50 : 180, 0.045, 0.55);
      this._dust = buildFireflies(reduceMotion ? 0 : isMobile ? 40 : 120, 0.022, 0.3);
      if (this._fireflies) this.scene.add(this._fireflies);
      if (this._dust) this.scene.add(this._dust);

      // Hover ripple ring (reused)
      const rippleGeo = new THREE.RingGeometry(0.05, 0.12, 32);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: 0xc9953a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this._ripple = new THREE.Mesh(rippleGeo, rippleMat);
      this._ripple.rotation.x = -Math.PI / 2;
      this._ripple.visible = false;
      this.scene.add(this._ripple);

      // ── Event listeners ──
      canvas.addEventListener('mousemove', (e) => this._onPointer(e, false));
      canvas.addEventListener('click', (e) => this._onPointer(e, true));
      canvas.addEventListener('touchend', (e) => {
        if (!e.changedTouches.length) return;
        const t = e.changedTouches[0];
        this._onPointer({ clientX: t.clientX, clientY: t.clientY }, true);
      }, { passive: true });

      // Orbit drag
      canvas.addEventListener('mousedown', (e) => {
        this._isDragging = true;
        this._dragStart = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      });
      window.addEventListener('mouseup', () => {
        this._isDragging = false;
        if (canvas) canvas.style.cursor = 'grab';
      });
      window.addEventListener('mousemove', (e) => {
        if (!this._isDragging || this.selectedMesh) return;
        const dx = (e.clientX - this._dragStart.x) * 0.004;
        const dy = (e.clientY - this._dragStart.y) * 0.004;
        this._dragStart = { x: e.clientX, y: e.clientY };
        this._targetAngle -= dx;
        this._targetPhi = Math.max(0.08, Math.min(1.0, this._targetPhi + dy));
      });
      canvas.addEventListener('wheel', (e) => {
        // Zooming disabled per request
      }, { passive: true });

      // Touch orbit
      let lastTouchX = 0;
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) lastTouchX = e.touches[0].clientX;
      }, { passive: true });
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && !this.selectedMesh) {
          const dx = (e.touches[0].clientX - lastTouchX) * 0.008;
          lastTouchX = e.touches[0].clientX;
          this._targetAngle -= dx;
        }
      }, { passive: true });

      // Bind district buttons from HTML blocks
      document.querySelectorAll('[data-map-district]').forEach((btn) => {
        btn.addEventListener('mouseenter', () => this.focusDistrict(btn.dataset.mapDistrict, false));
        btn.addEventListener('focus', () => this.focusDistrict(btn.dataset.mapDistrict, false));
        btn.addEventListener('click', () => this.focusDistrict(btn.dataset.mapDistrict, true));
      });

      // ── Resize handler ──
      this._resize = () => {
        const nw = container.clientWidth || window.innerWidth;
        const nh = container.clientHeight || window.innerHeight;
        this.camera.aspect = nw / nh;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', this._resize);
      this._resize();

      if (loading) setTimeout(() => loading.classList.add('hidden'), 500);

      const mapSection = document.getElementById('districts');
      if (mapSection && 'IntersectionObserver' in window) {
        this._io = new IntersectionObserver(
          (entries) => {
            this._paused = !entries[0]?.isIntersecting;
          },
          { threshold: 0.06, rootMargin: '80px 0px' }
        );
        this._io.observe(mapSection);
      }

      this._animate();
    },

    // ── SVG Fallback for no-WebGL devices ──
    _initSvgFallback(canvas, loading) {
      const container = canvas.parentElement;
      canvas.style.display = 'none';
      if (loading) loading.classList.add('hidden');

      let fallback = container.querySelector('.map3d-svg-fallback');
      if (fallback) fallback.remove();

      fallback = document.createElement('div');
      fallback.className = 'map3d-svg-fallback';
      fallback.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:1100px;background:radial-gradient(circle at center,rgba(14, 165, 233,0.08),transparent 58%);overflow:hidden';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 430 500');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'แผนที่จังหวัดพัทลุงแบบ 3D');
      svg.style.cssText = 'width:min(72vw,520px);height:min(82vh,680px);filter:drop-shadow(0 28px 30px rgba(0,0,0,0.42));transform:rotateX(13deg) rotateZ(-2deg);transform-origin:center;transition:transform .7s cubic-bezier(.16,1,.3,1)';

      DISTRICT_SHAPES.forEach((d) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-district-id', d.id);
        g.style.cursor = 'pointer';

        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shadow.setAttribute('points', d.pts.map((p) => `${p[0]+7},${p[1]+9}`).join(' '));
        shadow.setAttribute('fill', 'rgba(0,0,0,0.28)');

        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', d.pts.map((p) => `${p[0]},${p[1]}`).join(' '));
        poly.setAttribute('fill', `#${d.color.toString(16).padStart(6,'0')}`);
        poly.setAttribute('stroke', '#0ea5e9');
        poly.setAttribute('stroke-width', '1.5');
        poly.setAttribute('stroke-linejoin', 'round');
        poly.style.transition = 'filter .25s, transform .25s';

        const c = d.pts.reduce((a,p)=>({x:a.x+p[0],y:a.y+p[1]}),{x:0,y:0});
        c.x /= d.pts.length; c.y /= d.pts.length;

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', c.x-48); bg.setAttribute('y', c.y-14);
        bg.setAttribute('width','96'); bg.setAttribute('height','28');
        bg.setAttribute('rx','14'); bg.setAttribute('fill','rgba(8,12,24,0.85)');
        bg.setAttribute('stroke','#0ea5e9'); bg.setAttribute('stroke-width','1.5');
        bg.style.pointerEvents = 'none';

        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', c.x); txt.setAttribute('y', c.y+4);
        txt.setAttribute('text-anchor','middle');
        txt.setAttribute('font-size', d.id==='srinagarindra'?'10':'11');
        txt.setAttribute('font-weight','700');
        txt.setAttribute('font-family','Sarabun, sans-serif');
        txt.setAttribute('fill','#ffffff');
        txt.textContent = THAI_NAMES[d.id] || d.id;
        txt.style.pointerEvents = 'none';

        g.append(shadow, poly, bg, txt);
        g.addEventListener('mouseenter', () => {
          poly.style.filter = 'drop-shadow(0 0 12px rgba(14, 165, 233,0.95))';
          poly.setAttribute('stroke','#ffd280');
          const name = document.getElementById('districtHoverName') || document.getElementById('hoverCardName');
          const card = document.getElementById('districtHoverCard');
          if (name) name.textContent = THAI_NAMES[d.id] || d.id;
          if (card) card.classList.add('visible');
        });
        g.addEventListener('mouseleave', () => {
          poly.style.filter = '';
          poly.setAttribute('stroke','#0ea5e9');
          const card = document.getElementById('districtHoverCard');
          if (card) card.classList.remove('visible');
        });
        g.addEventListener('click', () => {
          const dx = 215 - c.x, dy = 250 - c.y;
          svg.style.transform = `rotateX(13deg) rotateZ(-2deg) translate(${dx*0.85}px,${dy*0.85}px) scale(1.85)`;
          poly.style.filter = 'drop-shadow(0 0 18px rgba(14, 165, 233,1))';
          setTimeout(() => { if (window.Router) Router.navigate('district', d.id); }, 820);
        });
        svg.appendChild(g);
      });

      fallback.appendChild(svg);
      container.appendChild(fallback);
    },

    // ── Create floating label (DOM overlay — always pixel-perfect) ──
    _createLabel(text) {
      // Use a hidden 3D point as anchor + DOM div for text
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
      const mat = new THREE.PointsMaterial({ size: 0, transparent: true, opacity: 0 });
      const anchor = new THREE.Points(geo, mat);
      anchor.userData._labelText = text;
      return anchor;
    },

    // ── Update DOM labels each frame ──
    _updateDomLabels() {
      if (!this._labelContainer) {
        this._labelContainer = document.getElementById('map3dLabels');
        if (!this._labelContainer) {
          const c = this.renderer.domElement.parentElement;
          this._labelContainer = document.createElement('div');
          this._labelContainer.id = 'map3dLabels';
          this._labelContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:5;';
          c.appendChild(this._labelContainer);
        }
      }
      // Build divs on first call
      if (!this._labelDivs) {
        this._labelDivs = [];
        this.labels.forEach((anchor) => {
          const div = document.createElement('div');
          div.textContent = anchor.userData._labelText;
          div.className = 'map3d-label glass-pill';
          div.style.cssText = 'position:absolute;pointer-events:none;white-space:nowrap;font-family:Mitr,sans-serif;font-weight:700;font-size:11px;color:#1e293b;letter-spacing:0.03em;transform:translate(-50%,-50%);transition:opacity .25s, box-shadow .25s, color .25s, font-size .25s;';
          this._labelContainer.appendChild(div);
          this._labelDivs.push({ div, anchor });
        });
      }
      // Project 3D → 2D
      const w2 = this.renderer.domElement.clientWidth / 2;
      const h2 = this.renderer.domElement.clientHeight / 2;
      this._labelDivs.forEach(({ div, anchor }) => {
        const v = anchor.position.clone().project(this.camera);
        if (v.z > 1) { div.style.opacity = '0'; return; }
        let targetOpacity = '1';
        if (this.selectedMesh) {
          targetOpacity = '0';
        }
        div.style.opacity = targetOpacity;
        div.style.left = (v.x * w2 + w2) + 'px';
        div.style.top = (-v.y * h2 + h2) + 'px';
      });

      // --- Connection Line Logic ---
      if (!this._connSvg) {
        this._connSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._connSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;opacity:0;transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);';
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `<filter id="glow-line"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
        this._connSvg.appendChild(defs);

        this._connPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._connPath.setAttribute('fill', 'none');
        this._connPath.setAttribute('stroke', '#0ea5e9');
        this._connPath.setAttribute('stroke-width', '2');
        this._connPath.setAttribute('filter', 'url(#glow-line)');
        this._connSvg.appendChild(this._connPath);

        this._connCircle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this._connCircle1.setAttribute('r', '4');
        this._connCircle1.setAttribute('fill', '#0ea5e9');
        this._connCircle1.setAttribute('filter', 'url(#glow-line)');
        this._connSvg.appendChild(this._connCircle1);

        this._connText = document.createElement('div');
        this._connText.style.cssText = 'position:absolute;pointer-events:none;font-family:Mitr,sans-serif;font-weight:700;font-size:38px;color:#0ea5e9;text-shadow:0 0 10px rgba(14,165,233,0.4);z-index:20;opacity:0;transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);white-space:nowrap;transform:translate(0, -50%);';

        if (this._labelContainer) {
          this._labelContainer.appendChild(this._connSvg);
          this._labelContainer.appendChild(this._connText);
        }
      }

      const isFocused = document.body.classList.contains('map-is-focused');

      if (this.selectedMesh && isFocused) {
        let anchor = this.labels.find(l => l.userData._labelText === this.selectedMesh.userData.name);
        
        if (anchor && this._connSvg) {
          const v = anchor.position.clone().project(this.camera);
          const startX = (v.x * w2 + w2);
          const startY = (-v.y * h2 + h2);
          
          const midX = startX + 90;
          const midY = startY + 120;
          const endX = startX + 280;
          const endY = startY + 120;

          this._connPath.setAttribute('d', `M ${startX},${startY} L ${midX},${midY} L ${endX},${endY}`);
          this._connCircle1.setAttribute('cx', startX);
          this._connCircle1.setAttribute('cy', startY);

          this._connText.textContent = anchor.userData._labelText;
          this._connText.style.left = (endX + 15) + 'px';
          this._connText.style.top = endY + 'px';

          this._connSvg.style.opacity = '1';
          this._connText.style.opacity = '1';
        } else if (this._connSvg) {
          this._connSvg.style.opacity = '0';
          this._connText.style.opacity = '0';
        }
      } else {
        if (this._connSvg) {
          this._connSvg.style.opacity = '0';
          this._connText.style.opacity = '0';
        }
      }
    },

    // ── Pointer / hover / click ──
    _onPointer(event, shouldOpen) {
      const canvas = this.renderer && this.renderer.domElement;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
      if (!hit) {
        if (!shouldOpen) this._setHover(null);
      this._fadeDistricts(null);
        return;
      }
      this._setHover(hit.object);
      if (shouldOpen) this.focusDistrict(hit.object.userData.id, true);
    },

    _fadeDistricts(selectedId) {
      this.meshes.forEach((m) => {
        const isSelected = !selectedId || m.userData.id === selectedId;
        const mats = m.material;
        if (mats && mats[0]) mats[0].opacity = isSelected ? (selectedId ? 1 : 0.85) : 0.15;
        if (m.userData.edges) m.userData.edges.material.opacity = isSelected ? (selectedId ? 1 : 0.4) : 0.05;
      });
    },

    _setHover(mesh) {
      if (this.hoveredMesh && this.hoveredMesh !== mesh) this._styleMesh(this.hoveredMesh, false);
      this.hoveredMesh = mesh;
      if (mesh) this._styleMesh(mesh, true);

      const card = document.getElementById('districtHoverCard');
      const name = document.getElementById('districtHoverName') || document.getElementById('hoverCardName');
      const canvas = this.renderer && this.renderer.domElement;
      if (mesh) {
        if (name) name.textContent = mesh.userData.name;
        if (card) card.classList.add('visible');
        if (canvas) canvas.style.cursor = 'pointer';
      } else {
        if (card) card.classList.remove('visible');
        if (canvas) canvas.style.cursor = 'grab';
      }
    },

    _styleMesh(mesh, active) {
      if (!mesh || !mesh.material) return;
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      mat.emissive.setHex(active ? 0xc9953a : mesh.userData.color);
      mat.emissiveIntensity = active ? 0.35 : 0.06;
      if (mesh.userData.edges) {
        mesh.userData.edges.material.color.setHex(active ? 0xffd280 : 0xc9953a);
        mesh.userData.edges.material.opacity = active ? 1 : 0.4;
      }
      // Highlight corresponding DOM label
      if (this._labelDivs) {
        const entry = this._labelDivs.find(e => e.anchor === mesh.userData.label);
        if (entry) {
          entry.div.style.color = active ? '#0ea5e9' : '#1e293b';
          entry.div.style.fontSize = active ? '13px' : '11px';
          entry.div.style.boxShadow = active
            ? '0 0 20px rgba(14, 165, 233,0.7), 0 4px 16px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)';
        }
      }
      // Ripple glow at district center
      if (this._ripple) {
        if (active) {
          this._ripple.visible = true;
          this._ripple.position.set(
            mesh.userData.center.x,
            mesh.position.y + 0.05,
            mesh.userData.center.z
          );
          this._ripple.material.opacity = 0.55;
          this._ripple.scale.setScalar(1.2);
        } else {
          this._ripple.material.opacity = 0;
          this._ripple.visible = false;
        }
      }
    },

    // ── Focus on a district (click or hover from block) ──
    focusDistrict(id, shouldOpen) {
      const mesh = this.meshes.find((m) => m.userData.id === id);
      if (!mesh) return;
      this.selectedMesh = mesh;
      this._setHover(mesh);
      this._targetCenter.copy(mesh.userData.center);
      this._targetCenter.x += 1.8;
      document.body.classList.add('map-is-focused');
      this._fadeDistricts(id);
      this._targetDistance = 3.8;
      this._targetPhi = 0.45; // Tilt into 3D view upon click

      // Highlight block card
      document.querySelectorAll('[data-map-district]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.mapDistrict === id);
      });

      if (shouldOpen) {
        clearTimeout(this._openTimer);
        this._openTimer = setTimeout(() => {
          if (window.MapDistrictPanel) {
            MapDistrictPanel.open(id);
          } else if (window.Router) {
            Router.navigate('district', id);
          }
        }, 900);
      } else {
        clearTimeout(this._returnTimer);
        this._returnTimer = setTimeout(() => {
          if (!this.selectedMesh || this.selectedMesh.userData.id !== id) return;
          if (this._highlightedIds.length) return;
          this._targetCenter.set(0.15, 0, 0.15);
          this._targetDistance = 16.0;
          this._targetPhi = 1.3;
          this.selectedMesh = null;
        }, 1800);
      }
    },

    /** Dim non-route districts; glow those in the trip */
    setDistrictHighlights(ids, primaryId) {
      if (!this.meshes.length) return;
      this._highlightedIds = ids || [];
      const primary = primaryId || ids?.[0];
      this.meshes.forEach((mesh) => {
        const inRoute = this._highlightedIds.includes(mesh.userData.id);
        const isPrimary = mesh.userData.id === primary;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const topMat = mats[0];
        if (!topMat) return;
        topMat.transparent = true;
        if (inRoute) {
          topMat.opacity = 1;
          topMat.emissive.setHex(isPrimary ? 0xffd280 : 0xc9953a);
          topMat.emissiveIntensity = isPrimary ? 0.5 : 0.28;
        } else {
          topMat.opacity = this.selectedMesh ? 0.05 : 0.28;
          topMat.emissive.setHex(mesh.userData.color);
          topMat.emissiveIntensity = 0.03;
        }
        if (mesh.userData.edges) {
          mesh.userData.edges.material.opacity = inRoute ? (isPrimary ? 1 : 0.65) : (this.selectedMesh ? 0.02 : 0.12);
        }
      });
      if (primary) {
        const mesh = this.meshes.find((m) => m.userData.id === primary);
        if (mesh) {
            this.selectedMesh = mesh;
            this._targetCenter.copy(mesh.userData.center);
            this._targetCenter.x += 1.8;
            document.body.classList.add('map-is-focused');
            this._fadeDistricts(primary);
            this._targetDistance = 4.2;
            this._targetPhi = 0.42;
          }
      }
    },

    resetZoom() {
      document.body.classList.remove('map-is-focused');
      this._targetCenter.set(0.15, 0, 0.15);
      this._targetDistance = 16.0;
      this._targetPhi = 1.3;
      this.selectedMesh = null;
      this._setHover(null);
      this._fadeDistricts(null);
    },
    clearDistrictHighlights() {
      document.body.classList.remove('map-is-focused');
      this._targetCenter.set(0.15, 0, 0.15);
      this._targetDistance = 16.0;
      this._targetPhi = 1.3;
      this.selectedMesh = null;
      this._highlightedIds = [];
      this.meshes.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const topMat = mats[0];
        if (topMat) {
          topMat.opacity = 1;
          topMat.emissive.setHex(mesh.userData.color);
          topMat.emissiveIntensity = 0.08;
        }
        if (mesh.userData.edges) mesh.userData.edges.material.opacity = 0.4;
      });
      this.clearRoutePath();
    },

    animateRoutePath(districtIds) {
      this.clearRoutePath();
      if (!districtIds || districtIds.length < 2 || !this.scene) return;
      const points = [];
      districtIds.forEach((id) => {
        const mesh = this.meshes.find((m) => m.userData.id === id);
        if (mesh) {
          points.push(
            new THREE.Vector3(mesh.userData.center.x, 0.2, mesh.userData.center.z)
          );
        }
      });
      if (points.length < 2) return;

      this._routeLineGroup = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.035, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xffd280,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this._routeLineGroup.add(tube);

      const dotGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xc9953a,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      points.forEach((pt) => {
        const dot = new THREE.Mesh(dotGeo, dotMat.clone());
        dot.position.copy(pt);
        this._routeLineGroup.add(dot);
      });

      this.scene.add(this._routeLineGroup);
      this._routeAnimPhase = 0;
    },

    clearRoutePath() {
      if (this._routeLineGroup && this.scene) {
        this.scene.remove(this._routeLineGroup);
        this._routeLineGroup.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
        this._routeLineGroup = null;
      }
    },

    syncRoute(route) {
      if (!route?.districtIds?.length) return;
      const ids = route.districtIds;
      this.playRouteTour(ids);
      const mapSection = document.getElementById('districts');
      if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    playRouteTour(ids) {
      clearTimeout(this._tourTimer);
      if (!ids?.length) return;
      this.setDistrictHighlights(ids, ids[0]);
      this.animateRoutePath(ids);
      let i = 1;
      const step = () => {
        if (i >= ids.length) return;
        this.setDistrictHighlights(ids, ids[i]);
        i += 1;
        this._tourTimer = setTimeout(step, 2600);
      };
      if (ids.length > 1) this._tourTimer = setTimeout(step, 2600);
    },

    // ── Animation loop ──
    _animate() {
      this._raf = requestAnimationFrame(() => this._animate());
      if (this._paused) return;
      this._time = performance.now() * 0.001;
      const t = this._time;

      // Intro flyover camera
      if (this._introActive) {
        this._introProgress = Math.min(1, this._introProgress + 0.012);
        const ease = 1 - Math.pow(1 - this._introProgress, 3);
        this._cameraDistance = 24 + (16 - 24) * ease;
        this._cameraPhi = 0.55 + (1.3 - 0.55) * ease;
        this._cameraAngle = -0.4 + (0 - (-0.4)) * ease;
        if (this._introProgress >= 1) this._introActive = false;
      } else {
        // Smooth camera lerp
        this._cameraCenter.lerp(this._targetCenter, 0.06);
        this._cameraDistance += (this._targetDistance - this._cameraDistance) * 0.06;
        this._cameraAngle += (this._targetAngle - this._cameraAngle) * 0.06;
        this._cameraPhi += (this._targetPhi - this._cameraPhi) * 0.06;
      }

      // Slow auto-rotate when idle
      if (!this._isDragging && !this.selectedMesh) {
        this._targetAngle += 0.0006;
      }

      // Camera position from spherical coords
      const cx = this._cameraCenter.x + Math.sin(this._cameraAngle) * Math.cos(this._cameraPhi) * this._cameraDistance;
      const cy = Math.sin(this._cameraPhi) * this._cameraDistance;
      const cz = this._cameraCenter.z + Math.cos(this._cameraAngle) * Math.cos(this._cameraPhi) * this._cameraDistance;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(this._cameraCenter.x, 0, this._cameraCenter.z);

      // Animate meshes
      this.meshes.forEach((mesh, i) => {
        const isActive = mesh === this.hoveredMesh || mesh === this.selectedMesh;
        const raise = isActive ? 0.22 : 0;
        const breath = Math.sin(t * 0.8 + i * 0.5) * 0.01;
        mesh.position.y += (raise + breath - mesh.position.y) * 0.08;

        // Scale pop on hover
        const targetScale = isActive ? 1.03 : 1.0;
        mesh.scale.x += (targetScale - mesh.scale.x) * 0.1;
        mesh.scale.y += (targetScale - mesh.scale.y) * 0.1;
        mesh.scale.z += (targetScale - mesh.scale.z) * 0.1;

        if (mesh.userData.label) {
          mesh.userData.label.position.y = mesh.userData.height + 0.22 + mesh.position.y;
        }
      });

      // Animate fireflies
      if (!this._reduceMotion) {
        [this._fireflies, this._dust].forEach((layer) => {
          if (!layer) return;
          const pos = layer.geometry.attributes.position;
          const phases = layer.userData._phases;
          for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            pos.array[i * 3 + 1] += Math.sin(t * 1.2 + phase) * 0.0008;
          }
          pos.needsUpdate = true;
          layer.rotation.y = t * 0.015;
        });
      }

      // Pulse ripple ring
      if (this._ripple && this._ripple.visible) {
        const pulse = 1 + Math.sin(t * 4) * 0.15;
        this._ripple.scale.setScalar(pulse * 1.2);
        this._ripple.material.opacity = 0.35 + Math.sin(t * 3) * 0.15;
      }

      // Update DOM labels
      this._updateDomLabels();

      // Pulse route glow
      if (this._routeLineGroup) {
        this._routeAnimPhase += 0.04;
        const pulse = 0.55 + Math.sin(this._routeAnimPhase) * 0.2;
        const tube = this._routeLineGroup.children[0];
        if (tube?.material) tube.material.opacity = pulse;
      }

      this.renderer.render(this.scene, this.camera);
    },

    // ── Cleanup ──
    destroy() {
      if (this._raf) cancelAnimationFrame(this._raf);
      clearTimeout(this._openTimer);
      clearTimeout(this._returnTimer);
      clearTimeout(this._tourTimer);
      if (this._io) {
        this._io.disconnect();
        this._io = null;
      }
      this.clearRoutePath();
      this._highlightedIds = [];
      if (this._resize) window.removeEventListener('resize', this._resize);
      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
      if (this.renderer) this.renderer.dispose();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.raycaster = null;
      this.meshes = [];
      this.labels = [];
      this.hoveredMesh = null;
      this.selectedMesh = null;
      this._raf = null;
      this._dust = null;
      this._fireflies = null;
      this._ground = null;
      this._ripple = null;
      this._envMap = null;
      this._introActive = true;
      this._introProgress = 0;
      // Clean up DOM labels
      if (this._labelContainer && this._labelContainer.parentElement) {
        this._labelContainer.parentElement.removeChild(this._labelContainer);
      }
      this._labelContainer = null;
      this._labelDivs = null;
      // Reset camera to default top-down view
      this._cameraDistance = 16.0;
      this._targetDistance = 16.0;
      this._cameraPhi = 1.3;
      this._targetPhi = 1.3;
      this._cameraAngle = 0;
      this._targetAngle = 0;
    },
  };
})();
