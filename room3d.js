/* Çamdibi Dekorasyon — 3D oda: asma tavan + gizli LED + gerçek iş dokuları */
(function () {
  const canvas = document.getElementById('room3d');
  const loaderBar = document.getElementById('loaderBar');
  const setProgress = (p) => { if (loaderBar) loaderBar.style.width = Math.round(p * 100) + '%'; };
  const finishLoading = () => { setProgress(1); setTimeout(() => document.getElementById('loader').classList.add('done'), 250); };

  if (!window.THREE || !canvas) { fail(); return; }
  try { init(); } catch (e) { console.error(e); fail(); }

  function fail() {
    document.getElementById('fallback').hidden = false;
    document.getElementById('studio').hidden = true;
    finishLoading();
  }

  function init() {
    const T = THREE;
    const W = 10, D = 8, H = 3.2;            // oda ölçüleri (m)
    const DROP = 2.9;                        // asma tavan alt kotu
    const OPEN = { x: 3.4, z: 2.4 };         // kaset açıklığı yarı ölçüleri
    const isMobile = matchMedia('(max-width: 640px)').matches;

    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    scene.background = new T.Color('#050706');
    scene.fog = new T.Fog('#050706', 9, 18);

    const camera = new T.PerspectiveCamera(isMobile ? 70 : 58, 1, 0.05, 60);
    camera.position.set(1.8, 1.55, 3.3);

    const controls = new T.OrbitControls(camera, canvas);
    controls.target.set(0, 1.55, -0.6);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 3.4;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.85;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.6;

    /* ---------- Dokular ---------- */
    const manager = new T.LoadingManager();
    manager.onProgress = (_, l, t) => setProgress(0.2 + 0.7 * (l / t));
    manager.onLoad = () => finishLoading();
    const loader = new T.TextureLoader(manager);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const photo = (key) => {
      const t = loader.load(window.CAMDIBI_TEX && window.CAMDIBI_TEX[key] ? window.CAMDIBI_TEX[key] : 'assets/' + key + '.jpg');
      t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso; return t;
    };
    setProgress(0.15);

    function canvasTex(size, draw, repeat) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      draw(c.getContext('2d'), size);
      const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso;
      if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
      return t;
    }
    // Mermer zemin
    const marble = canvasTex(1024, (g, s) => {
      g.fillStyle = '#5d6163'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${Math.random() * .05})`; g.fillRect(Math.random() * s, Math.random() * s, 3, 3); }
      for (let v = 0; v < 26; v++) {
        g.strokeStyle = `rgba(${210 + Math.random() * 40},${210 + Math.random() * 40},${215 + Math.random() * 40},${.08 + Math.random() * .25})`;
        g.lineWidth = .5 + Math.random() * 2.2; g.beginPath();
        let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y);
        for (let k = 0; k < 30; k++) { x += (Math.random() - .3) * 50; y += (Math.random() - .5) * 50; g.lineTo(x, y); }
        g.stroke();
      }
      g.strokeStyle = 'rgba(20,22,24,.55)'; g.lineWidth = 3;           // derz çizgileri (60x120 karo)
      g.strokeRect(0, 0, s, s); g.beginPath(); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke();
    }, [W / 1.2, D / 1.2]);
    // İnce sıva duvar
    const plaster = canvasTex(512, (g, s) => {
      g.fillStyle = '#d9d4cc'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 14000; i++) { const a = Math.random() * .06; g.fillStyle = Math.random() < .5 ? `rgba(255,255,255,${a})` : `rgba(80,70,60,${a})`; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); }
    }, [3, 1]);
    // Kaset tavana vuran LED ışığı (kenarlarda parlak, ortaya doğru sönen)
    const glowTex = (() => {
      const c = document.createElement('canvas'); const s = 512; c.width = c.height = s;
      const g = c.getContext('2d'); const img = g.createImageData(s, s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const u = x / (s - 1), v = y / (s - 1);
        const d = Math.min(u, 1 - u, v, 1 - v);       // kenara uzaklık
        const val = Math.pow(Math.max(0, 1 - d / 0.22), 2.4);
        const i = (y * s + x) * 4; const c8 = Math.round(val * 255);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c8; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return new T.CanvasTexture(c);
    })();

    /* ---------- Malzemeler ---------- */
    const M = {
      floor: new T.MeshStandardMaterial({ map: marble, roughness: .22, metalness: .05 }),
      wall: new T.MeshStandardMaterial({ map: plaster, color: '#ece6dc', roughness: .95 }),
      ceil: new T.MeshStandardMaterial({ color: '#f4f4f2', roughness: .9 }),
      gypsum: new T.MeshStandardMaterial({ color: '#f7f7f5', roughness: .85 }),
      frame: new T.MeshStandardMaterial({ color: '#3b2318', roughness: .45, metalness: .1 }),
      black: new T.MeshStandardMaterial({ color: '#121212', roughness: .4, metalness: .6 }),
      fabric: new T.MeshStandardMaterial({ color: '#2a2f2c', roughness: 1 }),
      fabric2: new T.MeshStandardMaterial({ color: '#cfc6b6', roughness: 1 }),
      wood: new T.MeshStandardMaterial({ color: '#6b4a33', roughness: .55 }),
      leaf: new T.MeshStandardMaterial({ color: '#2f5a2a', roughness: .8 }),
      pot: new T.MeshStandardMaterial({ color: '#1d1d1d', roughness: .5 }),
      rug: new T.MeshStandardMaterial({ color: '#8a8173', roughness: 1 }),
    };
    const LED = new T.Color('#9dff1f');
    const ledMat = new T.MeshBasicMaterial({ color: LED.clone().multiplyScalar(4) });
    const coveMat = new T.MeshStandardMaterial({ color: '#f2f2f0', roughness: .9, emissive: LED.clone(), emissiveMap: glowTex, emissiveIntensity: 1.6 });
    const downlightMat = new T.MeshBasicMaterial({ color: new T.Color('#fff4e0').multiplyScalar(3) });

    const box = (w, h, d, mat, x, y, z, cast = true) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m;
    };
    const plane = (w, h, mat, pos, rot) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      m.position.set(...pos); if (rot) m.rotation.set(...rot); m.receiveShadow = true; scene.add(m); return m;
    };

    /* ---------- Oda kabuğu ---------- */
    plane(W, D, M.floor, [0, 0, 0], [-Math.PI / 2, 0, 0]);
    plane(W, H, M.wall, [0, H / 2, -D / 2]);                                   // arka
    plane(W, H, M.wall, [0, H / 2, D / 2], [0, Math.PI, 0]);                   // ön
    plane(D, H, M.wall, [-W / 2, H / 2, 0], [0, Math.PI / 2, 0]);              // sol
    plane(D, H, M.wall, [W / 2, H / 2, 0], [0, -Math.PI / 2, 0]);              // sağ

    // Asıl tavan (kaset bölümü LED ışığını alır)
    plane(OPEN.x * 2 + .6, OPEN.z * 2 + .6, coveMat, [0, H - .001, 0], [Math.PI / 2, 0, 0]);
    plane(W, D, M.ceil, [0, H, 0], [Math.PI / 2, 0, 0]);

    /* ---------- ASMA TAVAN ---------- */
    const bandT = .1;                                  // asma tavan kalınlığı
    const by = DROP + bandT / 2;
    // dört kenar bant
    box(W, bandT, D / 2 - OPEN.z, M.gypsum, 0, by, -(OPEN.z + (D / 2 - OPEN.z) / 2), false);
    box(W, bandT, D / 2 - OPEN.z, M.gypsum, 0, by, (OPEN.z + (D / 2 - OPEN.z) / 2), false);
    box(W / 2 - OPEN.x, bandT, OPEN.z * 2, M.gypsum, -(OPEN.x + (W / 2 - OPEN.x) / 2), by, 0, false);
    box(W / 2 - OPEN.x, bandT, OPEN.z * 2, M.gypsum, (OPEN.x + (W / 2 - OPEN.x) / 2), by, 0, false);
    // bantın üstünden tavana kadar kapalı alın (arka taraf görünmesin)
    const soffitH = H - DROP - bandT;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([sx, sz]) => {
      const w = sx ? .02 : (OPEN.x + .35) * 2, d = sz ? .02 : (OPEN.z + .35) * 2;
      box(w, soffitH, d, M.gypsum, sx * (OPEN.x + .35), DROP + bandT + soffitH / 2, sz * (OPEN.z + .35), false);
    });
    // açıklık kenarında LED'i gizleyen dudak + LED şerit
    const lipH = .06;
    const edges = [
      { w: OPEN.x * 2, d: .03, x: 0, z: -OPEN.z }, { w: OPEN.x * 2, d: .03, x: 0, z: OPEN.z },
      { w: .03, d: OPEN.z * 2, x: -OPEN.x, z: 0 }, { w: .03, d: OPEN.z * 2, x: OPEN.x, z: 0 },
    ];
    edges.forEach(e => {
      box(e.w + .03, lipH, e.d, M.gypsum, e.x, DROP + bandT + lipH / 2, e.z, false);
      const sx = Math.sign(e.x), sz = Math.sign(e.z);
      const strip = new T.Mesh(new T.BoxGeometry(e.w === .03 ? .02 : e.w, .015, e.d === .03 ? .02 : e.d), ledMat);
      strip.position.set(e.x + sx * .12, DROP + bandT + .01, e.z + sz * .12);
      scene.add(strip);
    });
    // LED'in odaya yansıması (renkli dolgu ışık)
    const ledFill = [];
    [[-OPEN.x * .6, -OPEN.z * .6], [OPEN.x * .6, -OPEN.z * .6], [-OPEN.x * .6, OPEN.z * .6], [OPEN.x * .6, OPEN.z * .6]].forEach(([x, z]) => {
      const p = new T.PointLight(LED, .35, 6, 1.5); p.position.set(x, H - .15, z); scene.add(p); ledFill.push(p);
    });

    // Kartonpiyer (duvar–asma tavan birleşimi)
    const cornice = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .7 });
    const corn = (w, d, x, z) => { box(w, .09, d, cornice, x, DROP - .045, z, false); box(w === .09 ? .05 : w, .03, d === .09 ? .05 : d, cornice, x - Math.sign(x) * (w === .09 ? .04 : 0), DROP - .11, z - Math.sign(z) * (d === .09 ? .04 : 0), false); };
    corn(W, .09, 0, -D / 2 + .045); corn(W, .09, 0, D / 2 - .045);
    corn(.09, D, -W / 2 + .045, 0); corn(.09, D, W / 2 - .045, 0);

    // Gömme spotlar
    const spotRing = new T.CylinderGeometry(.07, .07, .02, 24);
    const spotDisc = new T.CircleGeometry(.045, 24);
    const addDownlight = (x, z) => {
      const r = new T.Mesh(spotRing, M.black); r.position.set(x, DROP - .005, z); scene.add(r);
      const d = new T.Mesh(spotDisc, downlightMat); d.rotation.x = Math.PI / 2; d.position.set(x, DROP - .016, z); scene.add(d);
    };
    const bandMidZ = OPEN.z + (D / 2 - OPEN.z) / 2, bandMidX = OPEN.x + (W / 2 - OPEN.x) / 2;
    [-3.6, -1.8, 0, 1.8, 3.6].forEach(x => { addDownlight(x, -bandMidZ); addDownlight(x, bandMidZ); });
    [-1.2, 1.2].forEach(z => { addDownlight(-bandMidX, z); addDownlight(bandMidX, z); });

    /* ---------- Gerçek işler: çerçeveli rölyef panolar ---------- */
    // crop: fotoğrafta kullanılacak bölge [x0, y0(üst), x1, y1] (0–1). Panoya bozulmadan oturtulur.
    function framedPanel(key, h, crop, pos, rotY) {
      const g = new T.Group();
      const tex = photo(key);
      const [x0, y0, x1, y1] = crop;
      const w = h * ((x1 - x0) * 1200) / ((y1 - y0) * 1600);
      tex.repeat.set(x1 - x0, y1 - y0); tex.offset.set(x0, 1 - y1);
      const mat = new T.MeshStandardMaterial({ map: tex, roughness: .75, metalness: .08 });
      const p = new T.Mesh(new T.PlaneGeometry(w, h), mat); p.position.z = .012; p.receiveShadow = true; g.add(p);
      const f = .07, fd = .05;
      const parts = [[w + 2 * f, f, 0, h / 2 + f / 2], [w + 2 * f, f, 0, -h / 2 - f / 2], [f, h, -w / 2 - f / 2, 0], [f, h, w / 2 + f / 2, 0]];
      parts.forEach(([pw, ph, px, py]) => { const m = new T.Mesh(new T.BoxGeometry(pw, ph, fd), M.frame); m.position.set(px, py, fd / 2); m.castShadow = true; g.add(m); });
      g.position.set(...pos); g.rotation.y = rotY || 0; scene.add(g); return g;
    }
    framedPanel('is1', 2.2, [.11, .04, .94, .91], [-2.1, 1.45, -D / 2 + .001]);
    framedPanel('is2', 2.0, [.04, .17, .97, .78], [1.35, 1.45, -D / 2 + .001]);

    // Sağ duvar: bronz dekoratif boya aksan duvar (gerçek işten kırpılmış)
    {
      const tex = photo('is4');
      tex.repeat.set(.6, .3); tex.offset.set(.08, .46);
      const mat = new T.MeshStandardMaterial({ map: tex, roughness: .6, metalness: .2 });
      plane(4.2, DROP - .14, mat, [W / 2 - .005, (DROP - .14) / 2, -.6], [0, -Math.PI / 2, 0]);
      // ray spotlar
      [-2.1, -1.1, -.1, .9].forEach(z => {
        const c = new T.Mesh(new T.CylinderGeometry(.035, .035, .16, 16), M.black);
        c.rotation.z = -.7; c.position.set(W / 2 - .3, DROP - .13, z); scene.add(c);
      });
    }

    /* ---------- Mobilya ---------- */
    // Halı
    box(3.6, .012, 2.4, M.rug, -.4, .006, .2, false);
    // Koltuk (sol duvara yaslı)
    const sofa = new T.Group();
    const sb = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; sofa.add(m); };
    sb(2.6, .42, .95, M.fabric, 0, .21, 0);
    sb(2.6, .45, .22, M.fabric, 0, .64, -.37);
    sb(.22, .3, .95, M.fabric, -1.19, .57, 0); sb(.22, .3, .95, M.fabric, 1.19, .57, 0);
    sb(1.1, .14, .7, M.fabric2, -.58, .49, .08); sb(1.1, .14, .7, M.fabric2, .58, .49, .08);
    sb(.45, .4, .14, new T.MeshStandardMaterial({ color: '#9dff1f', roughness: .9 }), -.75, .72, -.22);
    sofa.position.set(-W / 2 + .55, 0, .2); sofa.rotation.y = Math.PI / 2; scene.add(sofa);
    // Sehpa
    box(1.1, .05, .6, M.wood, -.6, .38, .2);
    [[-.5, -.25], [.5, -.25], [-.5, .25], [.5, .25]].forEach(([x, z]) => box(.04, .36, .04, M.black, -.6 + x, .18, .2 + z));
    // TV ünitesi (sağ duvar önü)
    box(.42, .38, 2.4, M.wood, W / 2 - .25, .32, -.6);
    box(.06, .9, 1.6, M.black, W / 2 - .06, 1.45, -.6);
    // Saksı bitkiler
    function plant(x, z, s = 1) {
      const pot = new T.Mesh(new T.CylinderGeometry(.22 * s, .17 * s, .5 * s, 24), M.pot); pot.position.set(x, .25 * s, z); pot.castShadow = true; scene.add(pot);
      for (let i = 0; i < 14; i++) {
        const l = new T.Mesh(new T.SphereGeometry(.12 * s, 10, 8), M.leaf);
        l.scale.set(1, 2.4, .35);
        const a = i / 14 * Math.PI * 2, r = .12 * s;
        l.position.set(x + Math.cos(a) * r, (.62 + Math.random() * .55) * s, z + Math.sin(a) * r);
        l.rotation.set(Math.sin(a) * .6, a, Math.cos(a) * .6);
        l.castShadow = true; scene.add(l);
      }
    }
    plant(-W / 2 + .45, -D / 2 + .45, 1.3);
    plant(-.35, -D / 2 + .4, 1);
    // Sarkıt lineer armatür
    const pend = new T.Mesh(new T.BoxGeometry(1.4, .04, .06), new T.MeshBasicMaterial({ color: new T.Color('#fff2d8').multiplyScalar(2.6) }));
    pend.position.set(-.6, 2.25, .2); scene.add(pend);
    [-0.6, 0.6].forEach(dx => { const w = new T.Mesh(new T.CylinderGeometry(.004, .004, H - 2.25, 4), M.black); w.position.set(-.6 + dx, (H + 2.25) / 2, .2); scene.add(w); });

    /* ---------- Işıklar ---------- */
    const hemi = new T.HemisphereLight('#fff7ec', '#3a3530', .45); scene.add(hemi);
    const amb = new T.AmbientLight('#ffffff', .12); scene.add(amb);
    const spots = [];
    [[-2.1], [1.35]].forEach(([x]) => {
      const s = new T.SpotLight('#ffe9cc', 1.6, 5.5, .62, .55, 1.6);
      s.position.set(x, DROP - .03, -bandMidZ);
      s.target.position.set(x, 1.1, -D / 2); scene.add(s, s.target); spots.push(s);
      s.castShadow = !isMobile; s.shadow.mapSize.set(512, 512); s.shadow.bias = -.0005;
    });
    const wash = new T.SpotLight('#ffd9a8', 1.3, 6, .7, .6, 1.6);   // bronz duvar yalayıcı
    wash.position.set(W / 2 - .6, DROP - .1, .5); wash.target.position.set(W / 2, 1.0, -1.2); scene.add(wash, wash.target); spots.push(wash);
    const key = new T.PointLight('#fff2dc', .35, 5, 1.5); key.position.set(-.6, 1.9, .2); key.castShadow = !isMobile;
    key.shadow.mapSize.set(512, 512); scene.add(key);

    /* ---------- Bloom ---------- */
    let composer = null, bloom = null;
    if (T.EffectComposer && T.UnrealBloomPass && T.GammaCorrectionShader) {
      composer = new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), .85, .55, .82);
      composer.addPass(bloom);
      composer.addPass(new T.ShaderPass(T.GammaCorrectionShader));
    }

    /* ---------- Etkileşim API ---------- */
    let night = false;
    const state = { led: LED.clone(), ledTarget: LED.clone(), nightK: 0, nightTarget: 0 };
    window.Room3D = {
      setLed(hex) { state.ledTarget.set(hex); },
      setNight(on) { night = on; state.nightTarget = on ? 1 : 0; },
      setRotate(on) { controls.autoRotate = on; },
      controls,
    };

    /* ---------- Hotspotlar ---------- */
    const hsData = [
      { p: [0, DROP + .12, -OPEN.z], t: 'Asma Tavan + Gizli LED', d: 'Kademeli alçıpan asma tavan, kenarlarda gizli LED şerit. Rengini sağ alttan değiştirin.' },
      { p: [-2.1, 2.1, -D / 2 + .05], t: 'Turkuaz Mandala Rölyef', d: 'Gerçek işimiz: turkuaz zemin üzeri bakır patina mandala rölyef sıva.' },
      { p: [1.35, .9, -D / 2 + .05], t: 'Gümüş Rölyef Sıva', d: 'Gerçek işimiz: gümüş tonlarda el işçiliği mandala desenli duvar.', left: true },
      { p: [W / 2 - .02, 2.2, .9], t: 'Bronz Dekoratif Boya', d: 'Gerçek işimiz: fırça efektli bronz–bakır dekoratif boya ve ray spotlar.', left: true },
      { p: [-W / 2 + .1, DROP - .08, -2.2], t: 'Kartonpiyer', d: 'Duvar–tavan birleşiminde klasik ya da modern kartonpiyer.' },
      { p: [1.8, DROP - .02, -bandMidZ], t: 'Gömme Spot', d: 'Sıva altı spotlarla duvar dokusunu öne çıkaran vurgu aydınlatma.', left: true },
    ];
    const hsRoot = document.getElementById('hotspots');
    const hsEls = hsData.map(h => {
      const el = document.createElement('div'); el.className = 'hs' + (h.left ? ' left' : '');
      el.innerHTML = `<button class="hs__dot" aria-label="${h.t}"></button><div class="hs__card"><b>${h.t}</b>${h.d}</div>`;
      el.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation(); const was = el.classList.contains('open');
        hsEls.forEach(x => x.el.classList.remove('open')); if (!was) el.classList.add('open');
      });
      hsRoot.appendChild(el);
      return { el, v: new T.Vector3(...h.p) };
    });
    document.addEventListener('click', () => hsEls.forEach(x => x.el.classList.remove('open')));
    const tmp = new T.Vector3(), camDir = new T.Vector3();
    function updateHotspots() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.getWorldDirection(camDir);
      hsEls.forEach(({ el, v }) => {
        tmp.copy(v).sub(camera.position);
        const facing = tmp.normalize().dot(camDir) > .35;
        tmp.copy(v).project(camera);
        const inView = facing && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
        el.style.opacity = inView ? 1 : 0;
        el.style.pointerEvents = inView ? 'auto' : 'none';
        el.style.transform = `translate(${(tmp.x * .5 + .5) * w}px, ${(-tmp.y * .5 + .5) * h}px)`;
      });
    }

    /* ---------- Döngü ---------- */
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // dar ekranda kamerayı biraz geri al
      camera.fov = w / h < .8 ? 74 : 58; camera.updateProjectionMatrix();
      if (composer) { composer.setSize(w, h); composer.setPixelRatio && composer.setPixelRatio(renderer.getPixelRatio()); }
    }
    window.addEventListener('resize', resize); resize();

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

    const clock = new T.Clock();
    const tmpC = new T.Color();
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), .05);
      const t = clock.elapsedTime;

      // LED renk ve gece modu geçişleri
      state.led.lerp(state.ledTarget, 1 - Math.pow(.002, dt));
      state.nightK += (state.nightTarget - state.nightK) * (1 - Math.pow(.01, dt));
      const n = state.nightK;
      const pulse = 1 + Math.sin(t * 1.4) * .04;
      ledMat.color.copy(state.led).multiplyScalar(4 + n * 3);
      coveMat.emissive.copy(state.led);
      coveMat.emissiveIntensity = (1.9 + n * 1.6) * pulse;
      ledFill.forEach(p => { p.color.copy(state.led); p.intensity = (.3 + n * .7) * pulse; });
      hemi.intensity = .45 * (1 - n * .85);
      amb.intensity = .12 * (1 - n * .7);
      spots.forEach(s => s.intensity = (s === wash ? 1.3 : 1.6) * (1 - n * .35));
      key.intensity = .35 * (1 - n * .6);
      scene.background.copy(tmpC.set('#050706'));
      renderer.toneMappingExposure = 1.05 - n * .15;
      if (bloom) bloom.strength = .8 + n * .5;

      controls.update();
      if (composer) composer.render(); else renderer.render(scene, camera);
      updateHotspots();
    }
    tick();

    // ilk etkileşimde ipucu kaybolsun
    const hint = document.getElementById('hint');
    controls.addEventListener('start', () => hint && hint.classList.add('gone'));
  }
})();
