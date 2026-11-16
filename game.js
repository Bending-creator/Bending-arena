// === ELEMENTAL BENDING ARENA: AGNI KAI (3D Three.js Engine + Adaptive Web Audio) ===
const state = {
  element: 'earth',
  outfit: 'bare',
  arena: 'stadium',
  diff: 'master',
  musicOn: true,
  playing: false,
  round: 1,
  pWins: 0,
  aiWins: 0,
  shake: 0,
  hitStop: 0
};

// === ADAPTIVE WEB AUDIO SYNTHESIZER (TAIKO DRUMS, GONG, AGNI KAI STRINGS & SFX) ===
const AudioEngine = {
  ctx: null,
  bgmTimer: null,
  beat: 0,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playGong() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [130.81, 196.0, 261.63].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, now + 2.4);
      gain.gain.setValueAtTime(0.18 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 2.5);
    });
  },
  playSFX(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (type === 'earth' || type === 'clash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(type === 'clash' ? 140 : 95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
      gain.gain.setValueAtTime(0.28, now);
    } else if (type === 'water') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.22, now);
    } else if (type === 'fire') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.3);
      gain.gain.setValueAtTime(0.22, now);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.36);
  },
  startMusic() {
    this.stopMusic();
    if (!state.musicOn) return;
    this.init();
    this.beat = 0;
    const isAgni = state.arena === 'agni_kai';
    const interval = isAgni ? 520 : 340;
    const scale = isAgni ? [146.83, 174.61, 196.0, 220.0, 261.63] : [196.0, 220.0, 261.63, 293.66, 329.63];

    this.bgmTimer = setInterval(() => {
      if (!state.musicOn || !state.playing) return;
      const now = this.ctx.currentTime;
      if (this.beat % 2 === 0 || (!isAgni && this.beat % 4 === 3)) {
        const drum = this.ctx.createOscillator();
        const dGain = this.ctx.createGain();
        drum.type = 'sine';
        drum.frequency.setValueAtTime(isAgni ? 82 : 105, now);
        drum.frequency.exponentialRampToValueAtTime(34, now + 0.28);
        dGain.gain.setValueAtTime(isAgni ? 0.24 : 0.18, now);
        dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        drum.connect(dGain).connect(this.ctx.destination);
        drum.start(now); drum.stop(now + 0.3);
      }
      if (this.beat % (isAgni ? 4 : 2) === 0) {
        const note = scale[(this.beat / 2) % scale.length | 0];
        const pad = this.ctx.createOscillator();
        const pGain = this.ctx.createGain();
        pad.type = isAgni ? 'sawtooth' : 'triangle';
        pad.frequency.setValueAtTime(note, now);
        pGain.gain.setValueAtTime(0.001, now);
        pGain.gain.linearRampToValueAtTime(isAgni ? 0.045 : 0.055, now + 0.12);
        pGain.gain.exponentialRampToValueAtTime(0.0008, now + (isAgni ? 1.6 : 0.65));
        pad.connect(pGain).connect(this.ctx.destination);
        pad.start(now); pad.stop(now + (isAgni ? 1.65 : 0.7));
      }
      this.beat++;
    }, interval);
  },
  stopMusic() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = null;
  }
};

// === THREE.JS 3D SCENE & REALISTIC ARENA SETUP ===
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x27272a, 0.7);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
sunLight.position.set(18, 28, 16);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 2;
sunLight.shadow.camera.far = 80;
const d = 24;
sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// Build Divided Yin-Yang Elemental Stadium
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);

const ARENA_RADIUS = 19;
const earthHalf = new THREE.Mesh(
  new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 0.6, 1.2, 48, 1, false, 0, Math.PI),
  new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85, metalness: 0.08 })
);
earthHalf.position.y = -0.6; earthHalf.receiveShadow = true;
arenaGroup.add(earthHalf);

const waterHalf = new THREE.Mesh(
  new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 0.6, 1.2, 48, 1, false, Math.PI, Math.PI),
  new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75, metalness: 0.15 })
);
waterHalf.position.y = -0.6; waterHalf.receiveShadow = true;
arenaGroup.add(waterHalf);

const centerDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(4.2, 4.2, 0.06, 36),
  new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
);
centerDisc.position.y = 0.02; centerDisc.receiveShadow = true;
arenaGroup.add(centerDisc);

const waterChannel = new THREE.Mesh(
  new THREE.RingGeometry(ARENA_RADIUS - 1.1, ARENA_RADIUS - 0.15, 48),
  new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.4 })
);
waterChannel.rotation.x = -Math.PI / 2; waterChannel.position.y = 0.03;
arenaGroup.add(waterChannel);

const wallColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706];
const brazierLights = [];
for (let i = 0; i < 12; i++) {
  const ang = (i / 12) * Math.PI * 2;
  const dist = ARENA_RADIUS + 4.5;
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 9, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 })
  );
  pillar.position.set(Math.cos(ang) * dist, 4.5, Math.sin(ang) * dist);
  pillar.lookAt(0, 4.5, 0);
  arenaGroup.add(pillar);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 5.2),
    new THREE.MeshStandardMaterial({ color: wallColors[i % 4], side: THREE.DoubleSide, roughness: 0.7 })
  );
  banner.position.set(Math.cos(ang) * (dist - 1.3), 5.2, Math.sin(ang) * (dist - 1.3));
  banner.lookAt(0, 5.2, 0);
  arenaGroup.add(banner);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.3, 8),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flame.position.set(Math.cos(ang) * (ARENA_RADIUS + 0.6), 0.7, Math.sin(ang) * (ARENA_RADIUS + 0.6));
  arenaGroup.add(flame);
  brazierLights.push(flame);
}

let coverBlocks = [];
function spawnCoverBlocks() {
  coverBlocks.forEach(b => scene.remove(b.mesh));
  coverBlocks = [];
  const coords = [[-6, -5], [6, -5], [-6, 5], [6, 5], [0, -9], [0, 9]];
  coords.forEach(([x, z]) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.2, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 })
    );
    mesh.position.set(x, 1.1, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    coverBlocks.push({ mesh, hp: 45 });
  });
}

function applyArenaTheme() {
  const isAgni = state.arena === 'agni_kai';
  scene.background = new THREE.Color(isAgni ? 0x180907 : 0x7dd3fc);
  scene.fog = new THREE.FogExp2(isAgni ? 0x1f0a06 : 0xbae6fd, isAgni ? 0.022 : 0.012);
  sunLight.color.setHex(isAgni ? 0xfb7185 : 0xfff7ed);
  sunLight.intensity = isAgni ? 0.85 : 1.4;
  hemiLight.intensity = isAgni ? 0.45 : 0.75;
  brazierLights.forEach(f => { f.visible = isAgni; });
}

// === ATHLETIC WARRIOR BUILDER (BARE-CHESTED SPARRING OR TRADITIONAL TUNIC) ===
const ELEMENT_META = {
  earth: { primary: 0x15803d, accent: 0xfacc15, proj: 0x78350f, label: 'EARTH' },
  fire:  { primary: 0xb91c1c, accent: 0x18181b, proj: 0xf97316, label: 'FIRE' },
  water: { primary: 0x1d4ed8, accent: 0xe2e8f0, proj: 0x38bdf8, label: 'WATER' },
  air:   { primary: 0xd97706, accent: 0xfef08a, proj: 0xe0f2fe, label: 'AIR' }
};

function createWarrior(element, outfit, isPlayer) {
  const meta = ELEMENT_META[element];
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.55 });
  const clothMat = new THREE.MeshStandardMaterial({ color: meta.primary, roughness: 0.75 });
  const sashMat = new THREE.MeshStandardMaterial({ color: meta.accent, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.34, 1.05, 14),
    outfit === 'bare' ? skinMat : clothMat
  );
  torso.position.y = 1.45; torso.castShadow = true;
  group.add(torso);

  if (element === 'air' && outfit === 'bare') {
    const arrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.65, 0.72),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
      
