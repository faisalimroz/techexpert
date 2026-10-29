'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Interactive Three.js panel: drag to orbit, slide the time of day,
 * watch the incidence angle change the panel's relative output.
 * Three.js is loaded on demand so it never blocks first paint.
 */
export function SolarPanel3D({ stage }: { stage: number }) {
  const host = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [hour, setHour] = useState(11);
  const [tilt, setTilt] = useState(23);
  const [ok, setOk] = useState(true);
  const state = useRef({ hour, tilt });
  state.current = { hour, tilt };

  // Sun direction for ~24°N latitude (Dhaka), simplified: azimuth sweeps E→S→W, elevation peaks at solar noon
  const sunVec = (h: number) => {
    const t = (h - 6) / 12; // 0 at 6:00, 1 at 18:00
    const az = Math.PI * (1 - t); // east → west
    const el = Math.max(0.02, Math.sin(Math.PI * t) * (Math.PI / 2 - 0.42));
    return { x: Math.cos(az) * Math.cos(el), y: Math.sin(el), z: Math.sin(az) * Math.cos(el) * 0.6 + Math.cos(el) * 0.55 };
  };
  const output = (() => {
    const s = sunVec(hour);
    const tr = (tilt * Math.PI) / 180;
    // panel faces south (+z) tilted up by `tilt`
    const n = { x: 0, y: Math.cos(tr), z: Math.sin(tr) };
    const len = Math.hypot(s.x, s.y, s.z);
    const cos = (s.x * n.x + s.y * n.y + s.z * n.z) / len;
    const airMass = Math.max(0, Math.sin(Math.PI * ((hour - 6) / 12)));
    return Math.max(0, Math.round(cos * Math.pow(airMass, 0.35) * 100));
  })();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import('three'), import('three/examples/jsm/environments/RoomEnvironment.js')])
      .then(([THREE, { RoomEnvironment }]) => {
        if (disposed) return;
        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          setOk(false);
          return;
        }
        renderer.setPixelRatio(Math.min(2, devicePixelRatio));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.shadowMap.enabled = true;
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.18;
        scene.fog = new THREE.Fog(0xcfe9dc, 14, 34);
        const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

        scene.add(new THREE.HemisphereLight(0xdff3ff, 0x2f6b4f, 0.9));
        const sun = new THREE.DirectionalLight(0xffe2a6, 2.6);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        scene.add(sun);
        const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
        scene.add(sunBall);

        const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x5fa86f, roughness: 1 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // cell texture
        const cv = document.createElement('canvas');
        cv.width = 512;
        cv.height = 1024;
        const g = cv.getContext('2d')!;
        g.fillStyle = '#0b1f3d';
        g.fillRect(0, 0, 512, 1024);
        for (let y = 0; y < 12; y++)
          for (let x = 0; x < 6; x++) {
            const grd = g.createLinearGradient(0, y * 85, 0, y * 85 + 80);
            grd.addColorStop(0, '#1b3f78');
            grd.addColorStop(1, '#10284f');
            g.fillStyle = grd;
            g.fillRect(x * 85 + 4, y * 85 + 4, 79, 79);
            g.strokeStyle = 'rgba(160,200,255,.35)';
            g.beginPath();
            g.moveTo(x * 85 + 30, y * 85 + 4);
            g.lineTo(x * 85 + 30, y * 85 + 83);
            g.moveTo(x * 85 + 56, y * 85 + 4);
            g.lineTo(x * 85 + 56, y * 85 + 83);
            g.stroke();
          }
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;

        const rig = new THREE.Group();
        scene.add(rig);
        const pivot = new THREE.Group();
        pivot.position.y = 1.25;
        rig.add(pivot);
        const glass = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.22, metalness: 0.1, clearcoat: 0.55, clearcoatRoughness: 0.08, emissive: 0x0a1c3a, emissiveIntensity: 0.35 });
        const frame = new THREE.MeshStandardMaterial({ color: 0xc9d2d8, metalness: 0.8, roughness: 0.3 });
        const panels: InstanceType<typeof THREE.Mesh>[] = [];
        for (let i = -1; i <= 1; i++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 3.3), [frame, frame, glass, frame, frame, frame]);
          m.position.x = i * 1.8;
          m.castShadow = true;
          pivot.add(m);
          panels.push(m);
        }
        const legMat = new THREE.MeshStandardMaterial({ color: 0x8a959c, metalness: 0.6, roughness: 0.4 });
        for (const x of [-2.4, 0, 2.4]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.22), legMat);
          post.position.set(x, 0.61, 0);
          post.castShadow = true;
          rig.add(post);
        }
        const beam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.08), legMat);
        beam.position.set(0, 1.21, 0);
        rig.add(beam);

        let yaw = -0.5, pitch = 0.36, drag = false, lx = 0, ly = 0, raf = 0;
        const onDown = (e: PointerEvent) => {
          drag = true;
          lx = e.clientX;
          ly = e.clientY;
          el.setPointerCapture(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!drag) return;
          yaw -= (e.clientX - lx) * 0.006;
          pitch = Math.min(1.2, Math.max(0.12, pitch + (e.clientY - ly) * 0.004));
          lx = e.clientX;
          ly = e.clientY;
        };
        const onUp = () => (drag = false);
        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);

        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          renderer.domElement.style.width = '100%';
          renderer.domElement.style.height = '100%';
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        const frameLoop = () => {
          const { hour: h, tilt: t } = state.current;
          const s = sunVec(h);
          sun.position.set(s.x * 12, s.y * 12, s.z * 12);
          sunBall.position.copy(sun.position).multiplyScalar(0.85);
          const warm = Math.max(0, Math.min(1, s.y * 2.2));
          sun.color.setHSL(0.1 - warm * 0.02, 0.9, 0.55 + warm * 0.2);
          sun.intensity = 0.6 + warm * 2.4;
          pivot.rotation.x = (t * Math.PI) / 180;
          if (!drag && !reduce) yaw += 0.0012;
          cam.position.set(Math.sin(yaw) * 7.6 * Math.cos(pitch), 1.3 + Math.sin(pitch) * 7.6, Math.cos(yaw) * 7.6 * Math.cos(pitch));
          cam.lookAt(0, 1, 0);
          renderer.render(scene, cam);
          raf = requestAnimationFrame(frameLoop);
        };
        frameLoop();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          el.removeEventListener('pointerdown', onDown);
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          pmrem.dispose();
          renderer.dispose();
          tex.dispose();
          el.contains(renderer.domElement) && el.removeChild(renderer.domElement);
        };
      })
      .catch(() => setOk(false));

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);

  return (
    <div className="card overflow-hidden lg:sticky lg:top-28">
      <div className="relative aspect-[4/3] w-full max-w-full cursor-grab touch-none bg-gradient-to-b from-[#bfe3ff] via-[#e8f4ee] to-[#cfe9dc] active:cursor-grabbing dark:from-[#123a52] dark:via-[#16384a] dark:to-[#0f2b35]" ref={host}>
        {!ok && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-tech/70">3D view needs WebGL. The controls below still show how sun angle changes output.</p>}
        <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-tech backdrop-blur dark:bg-tech/70 dark:text-white">Drag to rotate</span>
        <span className="absolute right-4 top-4 rounded-2xl bg-tech/85 px-4 py-2 text-right text-white backdrop-blur">
          <span className="block font-mono text-[10.5px] uppercase tracking-widest text-white/60">Relative output</span>
          <span className="tnum font-display text-3xl font-extrabold text-sun">{output}%</span>
        </span>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="block">
          <span className="label flex justify-between">Time of day <output className="tnum font-mono text-nature">{String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}</output></span>
          <input id="p3d-hour" type="range" min={6.25} max={17.75} step={0.25} value={hour} onChange={(e) => setHour(+e.target.value)} className="w-full accent-nature" />
        </label>
        <label className="block">
          <span className="label flex justify-between">Panel tilt <output className="tnum font-mono text-nature">{tilt}°</output></span>
          <input id="p3d-tilt" type="range" min={0} max={45} step={1} value={tilt} onChange={(e) => setTilt(+e.target.value)} className="w-full accent-nature" />
        </label>
        <p className="muted text-[13px] sm:col-span-2">
          Illustrative geometry for a south-facing array near 24°N. Output is relative to a panel facing the sun directly; real yield also depends on temperature, soiling and shading.
          {stage === 1 && ' This is the stage where light becomes DC power.'}
        </p>
      </div>
    </div>
  );
}
