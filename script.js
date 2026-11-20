import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020611, 0.028);

const isMobile = matchMedia('(max-width: 700px)').matches;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.12, isMobile ? 14 : 12);

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);

const heart = new THREE.Group();
scene.add(heart);

const PARTICLE_COUNT = isMobile ? 3200 : 6200;
const positions = new Float32Array(PARTICLE_COUNT * 3);
const targets = new Float32Array(PARTICLE_COUNT * 3);
const velocity = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);
const sizes = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const angle = Math.random() * Math.PI * 2;
  const depth = (Math.random() - 0.5) * 1.75;
  const shell = 0.78 + Math.random() * 0.22;
  const x = 16 * Math.pow(Math.sin(angle), 3) * 0.19 * shell;
  const y = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) -
    2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * 0.19 * shell;
  const k = i * 3;
  targets[k] = x;
  targets[k + 1] = y;
  targets[k + 2] = depth;
  positions[k] = x + (Math.random() - 0.5) * 0.12;
  positions[k + 1] = y + (Math.random() - 0.5) * 0.12;
  positions[k + 2] = depth + (Math.random() - 0.5) * 0.12;

  const blue = Math.random();
  colors[k] = 0.16 + blue * 0.26;
  colors[k + 1] = 0.58 + blue * 0.36;
  colors[k + 2] = 0.92 + blue * 0.08;
  sizes[i] = 0.5 + Math.random() * 0.9;
}

const heartGeometry = new THREE.BufferGeometry();
heartGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
heartGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
heartGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

const heartMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: { uTime: { value: 0 }, uGlow: { value: 1 } },
  vertexShader: `
    attribute float aSize;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uGlow;
    void main() {
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float twinkle = 0.72 + 0.28 * sin(uTime * 2.4 + aSize * 34.0);
      gl_PointSize = (1.0 + aSize * 2.1) * twinkle * uGlow * (245.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float alpha = 1.0 - smoothstep(0.08, 0.5, d);
      gl_FragColor = vec4(vColor, alpha * 0.94);
    }`
});
heart.add(new THREE.Points(heartGeometry, heartMaterial));

// Floating embers and the bright outward burst.
const EMBER_COUNT = isMobile ? 420 : 850;
const emberPositions = new Float32Array(EMBER_COUNT * 3);
const emberVelocity = new Float32Array(EMBER_COUNT * 3);
const emberColors = new Float32Array(EMBER_COUNT * 3);
const emberSizes = new Float32Array(EMBER_COUNT);
for (let i = 0; i < EMBER_COUNT; i++) {
  const k = i * 3;
  emberPositions[k] = 0;
  emberPositions[k + 1] = -20;
  emberPositions[k + 2] = 0;
  emberColors[k] = 0.25;
  emberColors[k + 1] = 0.72 + Math.random() * 0.25;
  emberColors[k + 2] = 1;
  emberSizes[i] = 0.6 + Math.random() * 1.4;
}
const emberGeometry = new THREE.BufferGeometry();
emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
emberGeometry.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));
emberGeometry.setAttribute('aSize', new THREE.BufferAttribute(emberSizes, 1));
const emberMaterial = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexColors: true,
  vertexShader: `
    attribute float aSize; varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (190.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = 1.0 - smoothstep(0.12, 0.5, d);
      gl_FragColor = vec4(vColor, a * 0.9);
    }`
});
scene.add(new THREE.Points(emberGeometry, emberMaterial));

const platform = new THREE.Group();
platform.position.y = -3.15;
scene.add(platform);
const rings = [];
for (let i = 0; i < 6; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45 + i * 0.43, i === 0 ? 0.018 : 0.009, 6, 160),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0x087cff : 0x48dfff,
      transparent: true, opacity: 0.48 - i * 0.045
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = i * 0.012;
  platform.add(ring);
  rings.push(ring);
}
const baseLight = new THREE.PointLight(0x168dff, 18, 9);
baseLight.position.set(0, 0.5, 0);
platform.add(baseLight);

const starPositions = new Float32Array(950 * 3);
for (let i = 0; i < 950; i++) {
  const k = i * 3;
  starPositions[k] = (Math.random() - 0.5) * 27;
  starPositions[k + 1] = (Math.random() - 0.5) * 17;
  starPositions[k + 2] = (Math.random() - 0.5) * 13 - 3;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
  color: 0x4a9edb, size: 0.022, transparent: true, opacity: 0.62
}));
scene.add(stars);

let paused = false;
let exploded = false;
let soundEnabled = false;
let pointerX = 0;
let pointerY = 0;
let audioContext;
let previousPhase = 0;
let manualUntil = 0;

function playTone(frequency) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.16);
  } catch (_) {}
}

function spawnHeartBurst() {
  exploded = true;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const k = i * 3;
    const x = positions[k];
    const y = positions[k + 1];
    const z = positions[k + 2];
    const length = Math.hypot(x, y, z) || 1;
    const force = 1.6 + Math.random() * 3.5;
    velocity[k] = (x / length) * force + (Math.random() - 0.5) * 1.1;
    velocity[k + 1] = (y / length) * force + (Math.random() - 0.5) * 1.1;
    velocity[k + 2] = (z / length) * force + (Math.random() - 0.5) * 1.1;
  }
  for (let i = 0; i < EMBER_COUNT; i++) {
    const k = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const lift = Math.random() * Math.PI - Math.PI / 2;
    const speed = 1.5 + Math.random() * 5.5;
    emberPositions[k] = (Math.random() - 0.5) * 0.7;
    emberPositions[k + 1] = (Math.random() - 0.5) * 0.7;
    emberPositions[k + 2] = (Math.random() - 0.5) * 0.7;
    emberVelocity[k] = Math.cos(angle) * Math.cos(lift) * speed;
    emberVelocity[k + 1] = Math.sin(lift) * speed + 0.5;
    emberVelocity[k + 2] = Math.sin(angle) * Math.cos(lift) * speed;
  }
  emberGeometry.attributes.position.needsUpdate = true;
  if (soundEnabled) playTone(510);
}

function reformHeart() {
  exploded = false;
  if (soundEnabled) playTone(760);
}

canvas.addEventListener('pointermove', event => {
  pointerX = (event.clientX / innerWidth - 0.5) * 0.42;
  pointerY = (event.clientY / innerHeight - 0.5) * 0.22;
});
canvas.addEventListener('pointerdown', () => {
  manualUntil = elapsed + 5;
  exploded ? reformHeart() : spawnHeartBurst();
});

document.querySelector('#explodeBtn').addEventListener('click', () => {
  manualUntil = clock.getElapsedTime() + 5;
  exploded ? reformHeart() : spawnHeartBurst();
});
document.querySelector('#pauseBtn').addEventListener('click', event => {
  paused = !paused;
  event.currentTarget.textContent = paused ? '▶ RESUME' : 'Ⅱ PAUSE';
});
document.querySelector('#soundBtn').addEventListener('click', event => {
  soundEnabled = !soundEnabled;
  event.currentTarget.textContent = soundEnabled ? '♪ SOUND ON' : '♪ SOUND OFF';
  if (soundEnabled) playTone(660);
});

let elapsed = 0;
let lastFrameTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  if (paused) return;
  elapsed += delta;
  const cycleTime = elapsed % 13;
  const phase = cycleTime < 4 ? 0 : cycleTime < 8 ? 1 : cycleTime < 9 ? 2 : 3;

  if (elapsed > manualUntil && phase !== previousPhase) {
    if (phase === 1) spawnHeartBurst();
    if (phase === 3 || phase === 0) reformHeart();
    previousPhase = phase;
  }

  heartMaterial.uniforms.uTime.value = elapsed;
  heartMaterial.uniforms.uGlow.value = phase === 1 || phase === 2 ? 1.22 : 1;
  const pulse = 1 + Math.sin(elapsed * 2.25) * 0.026;
  heart.scale.setScalar(pulse);
  heart.rotation.y += (pointerX * 0.6 + Math.sin(elapsed * 0.2) * 0.1 - heart.rotation.y) * 0.025;
  heart.rotation.x += (-pointerY * 0.45 - heart.rotation.x) * 0.025;
  heart.position.y = 0.14 + Math.sin(elapsed * 0.8) * 0.065;

  const p = heartGeometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const k = i * 3;
    if (exploded) {
      p[k] += velocity[k] * 0.016;
      p[k + 1] += velocity[k + 1] * 0.016;
      p[k + 2] += velocity[k + 2] * 0.016;
      velocity[k] *= 0.987;
      velocity[k + 1] *= 0.987;
      velocity[k + 2] *= 0.987;
    } else {
      const ease = phase === 3 ? 0.035 : 0.055;
      p[k] += (targets[k] - p[k]) * ease;
      p[k + 1] += (targets[k + 1] - p[k + 1]) * ease;
      p[k + 2] += (targets[k + 2] - p[k + 2]) * ease;
    }
  }
  heartGeometry.attributes.position.needsUpdate = true;

  for (let i = 0; i < EMBER_COUNT; i++) {
    const k = i * 3;
    emberPositions[k] += emberVelocity[k] * 0.016;
    emberPositions[k + 1] += emberVelocity[k + 1] * 0.016;
    emberPositions[k + 2] += emberVelocity[k + 2] * 0.016;
    emberVelocity[k] *= 0.986;
    emberVelocity[k + 1] = emberVelocity[k + 1] * 0.986 - 0.002;
    emberVelocity[k + 2] *= 0.986;
    if (!exploded && Math.abs(emberPositions[k]) + Math.abs(emberPositions[k + 1]) > 17) {
      emberPositions[k + 1] = -20;
    }
  }
  emberGeometry.attributes.position.needsUpdate = true;

  rings.forEach((ring, index) => {
    ring.rotation.z = elapsed * (index % 2 ? 0.09 : -0.065);
    ring.material.opacity = (0.42 - index * 0.043) * (1 + Math.sin(elapsed * 2 + index) * 0.12);
  });
  baseLight.intensity = phase === 1 ? 26 : 17 + Math.sin(elapsed * 2) * 2;
  stars.rotation.y = elapsed * 0.006;
  renderer.render(scene, camera);
}

animate();
setTimeout(() => loading?.classList.add('done'), 650);

function resize() {
  const width = innerWidth;
  const height = innerHeight;
  camera.aspect = width / height;
  camera.position.z = width < 700 ? 14 : 12;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(width, height);
}
addEventListener('resize', resize, { passive: true });
