import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Box, PackageOpen, Truck } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useTheme } from '../context/ThemeContext';

// หน่วยในฉาก 1 = 1 เมตร ใช้พิกัดเดียวกับ craneState
// X = ตำแหน่งตามแนวราง, Y = ความสูงของงา (ช่องชั้น n อยู่ที่ Y = n), งายื่นเข้าหาชั้นวางทางแกน -Z
const FLOOR_Y = -1.0;
const RACK_Z = -1.1;            // แนวกึ่งกลางชั้นวาง (และจุดรับสินค้าบนสายพาน)
const RACK_DEPTH = 0.8;
const RACK_FRONT = RACK_Z + RACK_DEPTH / 2;
const CRANE_Z = 0.15;           // แนวเสาเครน
const FORK_REACH = 0.91;        // ระยะยื่นงาเมื่อยื่นสุด (ถึงกึ่งกลางช่อง)
const TINE_Y = -0.38;           // ระดับงาเทียบกับแคร่ (อยู่เหนือพื้นชั้นวางเล็กน้อย)
const SHELF_TOP = -0.4;         // ผิวบนพื้นชั้นวางเทียบกับระดับชั้น
const CRATE = { w: 0.5, h: 0.4, d: 0.5 };
const CONVEYOR = { start: 0.35, end: -2.6, width: 0.62, top: -0.42, speed: 0.45 };

const CATEGORY_COLORS = {
  Beverages: 0x0ea5e9,
  Electronics: 0x8b5cf6,
  Snacks: 0xf59e0b,
  Parts: 0x10b981,
};
const DEFAULT_LABEL = 0x64748b;

const STATUS_TEXT = {
  IDLE: 'พร้อมทำงาน',
  STORING: 'กำลังจัดเก็บ',
  RETRIEVING: 'กำลังเบิกจ่าย',
  HOMING: 'กำลังกลับจุดเริ่มต้น',
  EMERGENCY_STOP: 'หยุดฉุกเฉิน',
};

const statusColor = (state) => {
  if (state.emergencyStop) return 0xef4444;
  if (state.status === 'IDLE') return 0x22c55e;
  return 0xf59e0b;
};

const slotX = (s) => Number(s.x_axis) || Number(s.bay) || 1;
const slotY = (s) => Number(s.y_axis) || Number(s.level) || 1;
const categoryColor = (category) => CATEGORY_COLORS[category] || DEFAULT_LABEL;

// ---------- ตัวช่วยสร้าง texture จาก canvas ----------
const canvasTexture = (width, height, draw) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

const labelTexture = (text, { bg = '#ffffff', fg = '#0f172a', border = '#0f172a', font = 'bold 44px sans-serif' } = {}) =>
  canvasTexture(256, 80, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = fg;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });

const meshDeckTexture = () => {
  const texture = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    for (let i = 0; i <= w; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const beltTexture = () => {
  const texture = canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 10;
    for (let x = -h; x < w + h; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, h / 2);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

// กล่องลูกฟูก + เทปปิด + ป้ายสีตามหมวดสินค้า
const makeCrate = (labelColor) => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(CRATE.w, CRATE.h, CRATE.d, 2, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xc89f74, roughness: 0.92 })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const tape = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.004, CRATE.d + 0.004),
    new THREE.MeshStandardMaterial({ color: 0xa47a52, roughness: 0.6 })
  );
  tape.position.y = CRATE.h / 2;
  group.add(tape);

  const labelMat = new THREE.MeshStandardMaterial({ color: labelColor, roughness: 0.5 });
  [1, -1].forEach(side => {
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.13), labelMat);
    label.position.set(0, 0.02, side * (CRATE.d / 2 + 0.002));
    if (side < 0) label.rotation.y = Math.PI;
    group.add(label);
  });
  group.userData.labelMat = labelMat;
  return group;
};

const disposeObject = (root) => {
  root.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    materials.forEach(m => {
      if (m.map) m.map.dispose();
      if (m.alphaMap) m.alphaMap.dispose();
      m.dispose();
    });
  });
};

export const Crane3DSimulator = () => {
  const { craneState, slots = [], storeOut } = useWarehouse();
  const { isDark } = useTheme();

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const craneRef = useRef(craneState);
  const lastKnownRef = useRef({});      // จำหมวดสินค้าของแต่ละช่องไว้ ใช้ตอนช่องถูกล้างก่อนเครนหยิบจริง
  const payloadColorRef = useRef(DEFAULT_LABEL);
  const selectRef = useRef(() => {});
  const pickedRef = useRef(null);       // ช่องที่เครนหยิบสินค้าออกมาแล้วในรอบเบิกจ่ายนี้

  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [message, setMessage] = useState(null);
  const [hover, setHover] = useState(null);     // { id, x, y } กล่องที่เมาส์ชี้อยู่
  // สถานะ "มีของบนงา" ตามภาพ 3D (สลับตอนงาถึงช่องจริง ไม่ใช่ตอน backend สั่ง)
  const [visualPayload, setVisualPayload] = useState(Boolean(craneState.hasPayload));
  const hoverRef = useRef(() => {});
  hoverRef.current = (id, x, y) => setHover(id == null ? null : { id, x, y });

  craneRef.current = craneState;
  slots.forEach(s => {
    if (s.is_occupied) lastKnownRef.current[s.slot_id] = { category: s.category, name: s.product_name };
  });

  if (craneState.status !== 'RETRIEVING') pickedRef.current = null;
  else if (visualPayload) pickedRef.current = craneState.targetSlotId;

  const targetSlot = slots.find(s => s.slot_id === craneState.targetSlotId);
  if (craneState.status === 'STORING' && targetSlot) {
    payloadColorRef.current = categoryColor(targetSlot.category);
  } else if (craneState.status === 'RETRIEVING' && craneState.targetSlotId != null) {
    payloadColorRef.current = categoryColor(lastKnownRef.current[craneState.targetSlotId]?.category);
  }

  const maxBay = Math.max(3, ...slots.map(slotX));
  const maxLevel = Math.max(3, ...slots.map(slotY));
  const occupiedSlots = useMemo(
    () => slots.filter(s => s.is_occupied).sort((a, b) => String(a.slot_code).localeCompare(String(b.slot_code))),
    [slots]
  );
  const labelKey = slots.map(s => `${s.slot_id}:${s.slot_code}:${slotX(s)}:${slotY(s)}`).join('|');

  selectRef.current = (slotId) => {
    setSelectedSlotId(slotId);
    setMessage(null);
  };

  // ล้างการเลือกเมื่อช่องที่เลือกไม่มีสินค้าแล้ว
  useEffect(() => {
    if (selectedSlotId != null && !occupiedSlots.some(s => s.slot_id === selectedSlotId)) {
      setSelectedSlotId(null);
    }
  }, [occupiedSlots, selectedSlotId]);

  // ---------- สร้างฉาก ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const rackCenterX = (maxBay + 1) / 2;
    const sceneCenterX = (CONVEYOR.end + maxBay + 0.5) / 2;
    const rackTop = maxLevel + 0.6;

    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(sceneCenterX - 0.6, rackTop + 1.5, 7.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(sceneCenterX + 0.35, (FLOOR_Y + rackTop) / 2 - 0.15, -0.7);
    // กล้องอิสระ: ลากซ้ายหมุน, ลากขวา/Shift+ลาก/สองนิ้วเลื่อน, ล้อเมาส์/บีบนิ้วซูม
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 0.8;
    controls.maxDistance = 40;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    let userMovedCamera = false;
    controls.addEventListener('start', () => { userMovedCamera = true; });
    // จอแคบ (มือถือ) ถอยกล้องออกให้เห็นทั้งสายพานและชั้นวาง
    const baseOffset = camera.position.clone().sub(controls.target);
    const fitCamera = () => {
      const scale = Math.max(1, 1.3 / camera.aspect);
      camera.position.copy(controls.target).addScaledVector(baseOffset, scale);
    };
    fitCamera();
    controls.update();

    // แสง
    scene.add(new THREE.HemisphereLight(0xf1f5f9, 0x64748b, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(sceneCenterX + 4, rackTop + 6, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30 });
    sun.target.position.set(sceneCenterX, 0, -0.6);
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xbfdbfe, 0.45);
    fill.position.set(sceneCenterX - 6, 3, 4);
    scene.add(fill);

    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...extra });
    const addBox = (parent, [w, h, d], material, [x, y, z], { cast = true, receive = true } = {}) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      parent.add(mesh);
      return mesh;
    };
    const addCylinder = (parent, radius, length, material, [x, y, z], axis = 'y', segments = 20) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
      if (axis === 'x') mesh.rotation.z = Math.PI / 2;
      if (axis === 'z') mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // ---------- พื้นโรงงาน ----------
    const floorW = maxBay - CONVEYOR.end + 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorW, 7), std(0xcfd6df, { roughness: 0.85, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(sceneCenterX, FLOOR_Y, -0.6);
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(Math.ceil(floorW), Math.ceil(floorW), 0x94a3b8, 0xb6c0cc);
    grid.position.set(sceneCenterX, FLOOR_Y + 0.002, -0.6);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);

    // เส้นเหลืองกั้นทางเดินเครน
    const stripeMat = std(0xfacc15, { roughness: 0.6, metalness: 0 });
    const aisleStartX = -0.7;
    const aisleLen = maxBay + 1.4 - aisleStartX;
    [RACK_FRONT + 0.06, CRANE_Z + 0.42].forEach(z => {
      addBox(scene, [aisleLen, 0.004, 0.05], stripeMat, [aisleStartX + aisleLen / 2, FLOOR_Y + 0.003, z], { cast: false });
    });

    // ---------- ชั้นวาง (Selective pallet rack) ----------
    const uprightMat = std(0x1d4ed8, { metalness: 0.45 });
    const beamMat = std(0xf97316, { metalness: 0.35, roughness: 0.45 });
    const braceMat = std(0x2563eb, { metalness: 0.45 });
    const rackHeight = rackTop - FLOOR_Y;
    const backZ = RACK_Z - RACK_DEPTH / 2;

    for (let b = 0; b <= maxBay; b += 1) {
      const x = b + 0.5;
      [RACK_FRONT, backZ].forEach(z => {
        addBox(scene, [0.07, rackHeight, 0.07], uprightMat, [x, FLOOR_Y + rackHeight / 2, z]);
        addBox(scene, [0.14, 0.015, 0.14], std(0x334155), [x, FLOOR_Y + 0.008, z], { cast: false });
      });
      // โครงค้ำทแยงด้านข้าง
      const braceCount = Math.ceil(rackHeight / 0.7);
      const segH = rackHeight / braceCount;
      for (let i = 0; i < braceCount; i += 1) {
        const len = Math.hypot(RACK_DEPTH, segH);
        const brace = addBox(scene, [0.025, len, 0.025], braceMat, [x, FLOOR_Y + segH * (i + 0.5), RACK_Z]);
        brace.rotation.x = (i % 2 === 0 ? 1 : -1) * Math.atan2(RACK_DEPTH, segH);
      }
    }

    const deckTex = meshDeckTexture();
    deckTex.repeat.set(maxBay * 4, RACK_DEPTH * 4);
    const deckMat = new THREE.MeshStandardMaterial({
      map: deckTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4,
    });
    const addShelfLevel = (y) => {
      [RACK_FRONT, backZ].forEach(z => {
        addBox(scene, [maxBay, 0.1, 0.05], beamMat, [rackCenterX, y - 0.05, z]);
      });
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(maxBay, RACK_DEPTH), deckMat);
      deck.rotation.x = -Math.PI / 2;
      deck.position.set(rackCenterX, y + 0.002, RACK_Z);
      deck.receiveShadow = true;
      scene.add(deck);
    };
    for (let l = 1; l <= maxLevel; l += 1) addShelfLevel(l + SHELF_TOP);
    [RACK_FRONT, backZ].forEach(z => addBox(scene, [maxBay, 0.08, 0.05], beamMat, [rackCenterX, rackTop, z]));

    const slotGroup = new THREE.Group();
    const labelGroup = new THREE.Group();
    scene.add(slotGroup, labelGroup);

    // ---------- รางเครน ----------
    const railMat = std(0x4b5563, { metalness: 0.8, roughness: 0.3 });
    const railStart = -0.9;
    const railLen = maxBay + 1.5 - railStart;
    const railCenter = railStart + railLen / 2;
    addBox(scene, [railLen, 0.05, 0.16], railMat, [railCenter, FLOOR_Y + 0.025, CRANE_Z]);
    addBox(scene, [railLen, 0.04, 0.05], std(0x9ca3af, { metalness: 0.9, roughness: 0.2 }), [railCenter, FLOOR_Y + 0.07, CRANE_Z]);
    const topRailY = rackTop + 0.3;
    addBox(scene, [railLen, 0.06, 0.1], railMat, [railCenter, topRailY, CRANE_Z]);
    for (let b = 0; b <= maxBay; b += 1) {
      // ขายึดรางบนกับหัวชั้นวาง
      const len = CRANE_Z - RACK_FRONT;
      addBox(scene, [0.04, 0.04, len], railMat, [b + 0.5, topRailY, RACK_FRONT + len / 2]);
    }
    [railStart + 0.05, railStart + railLen - 0.05].forEach(x => {
      addBox(scene, [0.12, 0.16, 0.24], std(0xdc2626), [x, FLOOR_Y + 0.08, CRANE_Z]); // กันชนปลายราง
    });

    // ---------- เครน Stacker ----------
    const mast = new THREE.Group();
    scene.add(mast);
    const mastHeight = topRailY - FLOOR_Y - 0.1;
    const yellow = std(0xfacc15, { metalness: 0.35, roughness: 0.45 });
    const dark = std(0x1f2937, { metalness: 0.5 });
    const steel = std(0x9ca3af, { metalness: 0.85, roughness: 0.25 });

    addBox(mast, [0.95, 0.2, 0.42], dark, [0, FLOOR_Y + 0.18, CRANE_Z]);           // แคร่ล่าง
    [-0.36, 0.36].forEach(x => addCylinder(mast, 0.06, 0.08, steel, [x, FLOOR_Y + 0.11, CRANE_Z], 'z'));
    addCylinder(mast, 0.08, 0.2, std(0x334155), [0.5, FLOOR_Y + 0.22, CRANE_Z + 0.05], 'x'); // มอเตอร์ขับ
    [-0.2, 0.2].forEach(x => {
      addBox(mast, [0.14, mastHeight, 0.14], yellow, [x, FLOOR_Y + 0.28 + mastHeight / 2 - 0.1, CRANE_Z]);
    });
    for (let y = FLOOR_Y + 0.8; y < topRailY - 0.3; y += 0.9) {
      addBox(mast, [0.4, 0.04, 0.06], dark, [0, y, CRANE_Z + 0.06]);              // คานยึดเสา
    }
    addBox(mast, [0.7, 0.14, 0.3], dark, [0, topRailY - 0.12, CRANE_Z]);            // แคร่บน
    // ตู้ควบคุม
    addBox(mast, [0.32, 0.62, 0.24], std(0xe5e7eb, { metalness: 0.2 }), [-0.5, FLOOR_Y + 0.6, CRANE_Z + 0.08]);
    addBox(mast, [0.2, 0.12, 0.01], new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.6 }),
      [-0.5, FLOOR_Y + 0.74, CRANE_Z + 0.205], { cast: false });

    // ไฟสถานะ
    addCylinder(mast, 0.05, 0.06, dark, [0, topRailY + 0.01, CRANE_Z]);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 20), beaconMat);
    beacon.position.set(0, topRailY + 0.09, CRANE_Z);
    mast.add(beacon);
    const beaconLight = new THREE.PointLight(0x22c55e, 0.8, 2.5);
    beaconLight.position.copy(beacon.position);
    mast.add(beaconLight);

    // แคร่ยก (ขึ้นลงตามแกน Y)
    const carriage = new THREE.Group();
    mast.add(carriage);
    addBox(carriage, [0.62, 0.07, 0.62], dark, [0, TINE_Y - 0.06, CRANE_Z - 0.2]);
    [-0.29, 0.29].forEach(x => addBox(carriage, [0.04, 0.32, 0.5], yellow, [x, TINE_Y + 0.1, CRANE_Z - 0.2]));
    addBox(carriage, [0.5, 0.3, 0.06], dark, [0, TINE_Y + 0.1, CRANE_Z + 0.07]);

    // งายืดสองชั้น (Telescopic fork)
    const forkStage1 = new THREE.Group();
    const forkStage2 = new THREE.Group();
    carriage.add(forkStage1);
    forkStage1.add(forkStage2);
    const forkZ = CRANE_Z - 0.32;
    addBox(forkStage1, [0.42, 0.025, 0.56], std(0x6b7280, { metalness: 0.7 }), [0, TINE_Y - 0.02, forkZ]);
    [-0.14, 0.14].forEach(x => addBox(forkStage2, [0.08, 0.03, 0.62], steel, [x, TINE_Y, forkZ - 0.02]));

    const payload = makeCrate(DEFAULT_LABEL);
    payload.position.set(0, TINE_Y + 0.015 + CRATE.h / 2, forkZ - 0.02);
    payload.visible = false;
    forkStage2.add(payload);

    // ---------- สายพานนำส่ง (Outbound conveyor) ----------
    const conveyor = new THREE.Group();
    scene.add(conveyor);
    const convLen = CONVEYOR.start - CONVEYOR.end;
    const convCenter = (CONVEYOR.start + CONVEYOR.end) / 2;
    const frameMat = std(0x475569, { metalness: 0.6 });
    [RACK_Z - CONVEYOR.width / 2 - 0.03, RACK_Z + CONVEYOR.width / 2 + 0.03].forEach(z => {
      addBox(conveyor, [convLen, 0.12, 0.05], frameMat, [convCenter, CONVEYOR.top - 0.04, z]);
    });
    for (let x = CONVEYOR.start - 0.15; x > CONVEYOR.end; x -= 0.75) {
      [RACK_Z - CONVEYOR.width / 2, RACK_Z + CONVEYOR.width / 2].forEach(z => {
        const legH = CONVEYOR.top - 0.1 - FLOOR_Y;
        addBox(conveyor, [0.05, legH, 0.05], frameMat, [x, FLOOR_Y + legH / 2, z]);
      });
      addBox(conveyor, [0.04, 0.04, CONVEYOR.width], frameMat, [x, FLOOR_Y + 0.2, RACK_Z]);
    }
    const belt = beltTexture();
    belt.repeat.set(convLen / 0.5, 1);
    const beltMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(convLen, CONVEYOR.width - 0.02),
      new THREE.MeshStandardMaterial({ map: belt, roughness: 0.9 })
    );
    beltMesh.rotation.x = -Math.PI / 2;
    beltMesh.position.set(convCenter, CONVEYOR.top, RACK_Z);
    beltMesh.receiveShadow = true;
    conveyor.add(beltMesh);
    [CONVEYOR.start, CONVEYOR.end].forEach(x => addCylinder(conveyor, 0.05, CONVEYOR.width, steel, [x, CONVEYOR.top - 0.05, RACK_Z], 'z'));
    addBox(conveyor, [0.05, 0.14, CONVEYOR.width + 0.1], std(0xdc2626), [CONVEYOR.end - 0.06, CONVEYOR.top + 0.04, RACK_Z]); // ตัวกันปลาย

    // เสาเซนเซอร์และป้าย
    [RACK_Z - CONVEYOR.width / 2 - 0.08, RACK_Z + CONVEYOR.width / 2 + 0.08].forEach(z => {
      addBox(conveyor, [0.03, 0.3, 0.03], dark, [-0.35, CONVEYOR.top + 0.12, z]);
    });
    const signHeight = 1.0;
    addBox(conveyor, [0.04, signHeight, 0.04], dark, [CONVEYOR.end + 0.2, CONVEYOR.top + signHeight / 2, RACK_Z - CONVEYOR.width / 2 - 0.12]);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.28),
      new THREE.MeshBasicMaterial({ map: labelTexture('สายพานนำส่ง', { bg: '#0284c7', fg: '#ffffff', border: '#e0f2fe', font: 'bold 40px sans-serif' }), toneMapped: false })
    );
    sign.position.set(CONVEYOR.end + 0.2 + 0.47, CONVEYOR.top + signHeight - 0.1, RACK_Z - CONVEYOR.width / 2 - 0.12);
    conveyor.add(sign);

    // ---------- กรอบไฮไลต์ ----------
    const makeOutline = (color) => {
      const outline = new THREE.Group();
      const size = new THREE.BoxGeometry(0.92, 0.84, RACK_DEPTH + 0.04);
      const fillMesh = new THREE.Mesh(size, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(size), new THREE.LineBasicMaterial({ color, transparent: true }));
      outline.add(fillMesh, edges);
      outline.userData = { fill: fillMesh.material, edges: edges.material };
      outline.visible = false;
      scene.add(outline);
      return outline;
    };
    const targetOutline = makeOutline(0xf59e0b);
    const selectOutline = makeOutline(0x06b6d4);

    const conveyorCrates = [];
    sceneRef.current = { slotGroup, labelGroup, targetOutline, selectOutline };

    // ---------- คลิกเลือกกล่องในฉาก ----------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickSlotAt = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(slotGroup.children, true)[0];
      let obj = hit?.object;
      while (obj && obj.userData.slotId == null) obj = obj.parent;
      return obj && obj.userData.occupied ? obj.userData.slotId : null;
    };
    const setCrateGlow = (slotId) => {
      slotGroup.children.forEach(crate => {
        const body = crate.children[0];
        if (body?.material?.emissive) body.material.emissive.setHex(crate.userData.slotId === slotId ? 0x3b3b3b : 0x000000);
      });
    };

    let downAt = null;
    const onPointerDown = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
    const onPointerUp = (e) => {
      if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
      const slotId = pickSlotAt(e.clientX, e.clientY);
      if (slotId != null) selectRef.current(slotId);
    };

    // ชี้เมาส์ที่กล่อง → แสดงรายละเอียดสินค้า
    let hoverFrame = null;
    let lastMove = null;
    let hoveredId = null;
    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      lastMove = e;
      if (hoverFrame) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = null;
        const ev = lastMove;
        const dragging = ev.buttons !== 0;
        const slotId = dragging ? null : pickSlotAt(ev.clientX, ev.clientY);
        if (slotId !== hoveredId) {
          hoveredId = slotId;
          setCrateGlow(slotId);
        }
        renderer.domElement.style.cursor = slotId != null ? 'pointer' : (dragging ? 'grabbing' : 'grab');
        const rect = renderer.domElement.getBoundingClientRect();
        hoverRef.current(slotId, ev.clientX - rect.left, ev.clientY - rect.top);
      });
    };
    const onPointerLeave = () => {
      hoveredId = null;
      setCrateGlow(null);
      hoverRef.current(null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // ---------- วนเรนเดอร์ ----------
    const shown = { x: craneRef.current.currentX || 0, y: craneRef.current.currentY || 0, z: 0 };
    const vel = { x: 0, y: 0, z: 0 };
    // ความเร็วสูงสุด (m/s) และอัตราเร่ง (m/s²) ของแต่ละแกน ใช้โปรไฟล์เร่ง-วิ่ง-ชะลอ แบบเครนจริง
    const AXIS = { x: { vmax: 1.6, acc: 1.8 }, y: { vmax: 1.2, acc: 1.5 }, z: { vmax: 1.6, acc: 4.0 } };
    const moveAxis = (axis, target, dt) => {
      const { vmax, acc } = AXIS[axis];
      const err = target - shown[axis];
      const desired = Math.sign(err) * Math.min(vmax, Math.sqrt(2 * acc * Math.abs(err)));
      const dv = THREE.MathUtils.clamp(desired - vel[axis], -acc * dt * 1.5, acc * dt * 1.5);
      vel[axis] += dv;
      shown[axis] += vel[axis] * dt;
      const errAfter = target - shown[axis];
      if (Math.abs(errAfter) < 0.001 || Math.sign(errAfter) !== Math.sign(err)) {
        shown[axis] = target;
        vel[axis] = 0;
      }
    };
    const brakeAxis = (axis, dt) => {
      const { acc } = AXIS[axis];
      const dv = Math.min(Math.abs(vel[axis]), acc * 2 * dt);
      vel[axis] -= Math.sign(vel[axis]) * dv;
      shown[axis] += vel[axis] * dt;
    };

    // backend ส่งพิกัดเป็นช่วง ๆ ระหว่างงานอัตโนมัติ ภาพจะวิ่งตรงไปยังปลายทางของช่วงนั้นรวดเดียว
    // (ไปช่องเป้าหมาย หรือกลับจุดเริ่มต้น) จึงไม่กระตุกตามจังหวะที่ backend ส่งมา
    const goal = { x: shown.x, y: shown.y };
    const lastBackend = { x: shown.x, y: shown.y };
    const updateGoal = (axis, s) => {
      const value = Number(axis === 'x' ? s.currentX : s.currentY) || 0;
      const target = Number(axis === 'x' ? s.targetX : s.targetY);
      const autoTask = s.status === 'STORING' || s.status === 'RETRIEVING';
      if (!autoTask || Number.isNaN(target)) {
        goal[axis] = value;
      } else if (value !== lastBackend[axis]) {
        goal[axis] = value > lastBackend[axis] ? target : 0;
      }
      lastBackend[axis] = value;
    };

    let visPayload = Boolean(craneRef.current.hasPayload);
    let pendingTransfer = null;      // { x, y } ตำแหน่งที่ต้องยื่นงาไปวาง/หยิบให้เสร็จก่อน
    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      const s = craneRef.current;

      // การวาง/หยิบสินค้าจะเกิดเมื่องายื่นถึงช่องจริงในภาพ ถ้าภาพยังไปไม่ถึงให้รอจนครบขั้น
      if (Boolean(s.hasPayload) !== visPayload && !pendingTransfer) {
        if (s.forkExtended) {
          pendingTransfer = { x: s.currentX || 0, y: s.currentY || 0 };
        } else {
          visPayload = Boolean(s.hasPayload);
          setVisualPayload(visPayload);
        }
      }

      updateGoal('x', s);
      updateGoal('y', s);
      const tx = pendingTransfer ? pendingTransfer.x : goal.x;
      const ty = pendingTransfer ? pendingTransfer.y : goal.y;
      let wantZ = s.forkExtended && !(s.currentZ > 0) ? 1 : Math.min(s.currentZ || 0, 1.25);
      if (pendingTransfer) wantZ = 1;

      if (s.emergencyStop) {
        brakeAxis('x', dt); brakeAxis('y', dt); brakeAxis('z', dt);
      } else {
        const atXY = Math.abs(tx - shown.x) < 0.004 && Math.abs(ty - shown.y) < 0.004
          && Math.abs(vel.x) < 0.03 && Math.abs(vel.y) < 0.03;
        const forkHome = shown.z < 0.01;
        // ลำดับเหมือนเครนจริง: หดงาให้สุดก่อนจึงเคลื่อน X/Y, ถึงตำแหน่งก่อนจึงยื่นงา
        if (forkHome) {
          moveAxis('x', tx, dt);
          moveAxis('y', ty, dt);
        } else {
          brakeAxis('x', dt);
          brakeAxis('y', dt);
        }
        moveAxis('z', atXY ? wantZ : 0, dt);
      }

      if (pendingTransfer && shown.z > 0.97) {
        visPayload = !visPayload;
        setVisualPayload(visPayload);
        // วางสินค้าที่จุดเริ่มต้น = ลงสายพานนำส่ง → ปล่อยกล่องให้วิ่งไปตามสายพาน
        if (!visPayload && pendingTransfer.x < 0.3 && pendingTransfer.y < 0.3) {
          const crate = makeCrate(payloadColorRef.current);
          crate.position.set(shown.x, CONVEYOR.top + CRATE.h / 2 + 0.002, RACK_Z);
          crate.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
          conveyor.add(crate);
          conveyorCrates.push(crate);
        }
        pendingTransfer = null;
      }

      mast.position.x = shown.x;
      carriage.position.y = shown.y;
      forkStage1.position.z = -shown.z * FORK_REACH * 0.5;
      forkStage2.position.z = -shown.z * FORK_REACH * 0.5;

      payload.visible = visPayload;
      payload.userData.labelMat.color.setHex(payloadColorRef.current);

      if (conveyorCrates.length > 0) {
        belt.offset.x += dt * CONVEYOR.speed / 0.5;
        for (let i = conveyorCrates.length - 1; i >= 0; i -= 1) {
          const crate = conveyorCrates[i];
          crate.position.x = Math.max(CONVEYOR.end + CRATE.w / 2 + 0.05, crate.position.x - dt * CONVEYOR.speed);
          if (crate.position.x <= CONVEYOR.end + CRATE.w / 2 + 0.05) {
            crate.userData.fade = (crate.userData.fade || 0) + dt;
            const opacity = Math.max(0, 1 - crate.userData.fade / 1.2);
            crate.traverse(o => { if (o.material) o.material.opacity = opacity; });
            if (opacity === 0) {
              conveyor.remove(crate);
              disposeObject(crate);
              conveyorCrates.splice(i, 1);
            }
          }
        }
      }

      const color = statusColor(s);
      beaconMat.color.setHex(color);
      beaconMat.emissive.setHex(color);
      beaconLight.color.setHex(color);
      const blinking = s.emergencyStop || s.status !== 'IDLE';
      beaconMat.emissiveIntensity = blinking ? 0.6 + 0.8 * Math.abs(Math.sin(t * 5)) : 1.0;
      beaconLight.intensity = blinking ? 0.4 + 0.8 * Math.abs(Math.sin(t * 5)) : 0.6;

      const pulse = Math.abs(Math.sin(t * 4));
      targetOutline.userData.edges.opacity = 0.55 + 0.45 * pulse;
      targetOutline.userData.fill.opacity = 0.08 + 0.14 * pulse;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      const narrowChanged = (camera.aspect < 1.3) !== (w / h < 1.3);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // ถ้าผู้ใช้ปรับมุมกล้องเองแล้ว ไม่รีเซ็ตกลับตอนขนาดจอเปลี่ยน
      if (!userMovedCamera && (narrowChanged || w / h < 1.3)) fitCamera();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [maxBay, maxLevel]);

  // ---------- ป้ายรหัสช่องบนคานหน้า ----------
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    const { labelGroup } = ref;
    disposeObject(labelGroup);
    labelGroup.clear();
    slots.forEach(s => {
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.094),
        new THREE.MeshBasicMaterial({ map: labelTexture(s.slot_code || `#${s.slot_id}`), toneMapped: false })
      );
      label.position.set(slotX(s), slotY(s) + SHELF_TOP - 0.05, RACK_FRONT + 0.027);
      labelGroup.add(label);
    });
  }, [labelKey, maxBay, maxLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- กล่องสินค้าในชั้นวาง ----------
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    const { slotGroup } = ref;
    disposeObject(slotGroup);
    slotGroup.clear();

    // ข้อมูลช่องอัปเดตทันทีที่สั่งงาน แต่ของจริงจะถูกวาง/หยิบตอนงายื่นเข้าไป
    // ระหว่างเครนทำงานจึงแสดงกล่องในช่องเป้าหมายตามสิ่งที่อยู่บนงาแทน
    const { status, targetSlotId } = craneState;
    const hasPayload = visualPayload;
    const isStoring = status === 'STORING' && hasPayload;
    const isRetrieving = status === 'RETRIEVING' && !hasPayload && pickedRef.current !== targetSlotId;

    slots.forEach(s => {
      const isTarget = s.slot_id === targetSlotId;
      let visible = s.is_occupied;
      if (isTarget && isStoring) visible = false;     // สินค้ายังอยู่บนงา
      if (isTarget && isRetrieving) visible = true;   // ยังไม่ได้หยิบออก
      if (!visible) return;

      const category = s.is_occupied ? s.category : lastKnownRef.current[s.slot_id]?.category;
      const crate = makeCrate(categoryColor(category));
      crate.position.set(slotX(s), slotY(s) + SHELF_TOP + CRATE.h / 2 + 0.004, RACK_Z);
      crate.userData = { ...crate.userData, slotId: s.slot_id, occupied: Boolean(s.is_occupied) };
      slotGroup.add(crate);
    });
  }, [slots, maxBay, maxLevel, craneState.status, craneState.targetSlotId, visualPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- กรอบช่องเป้าหมาย / ช่องที่เลือก ----------
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    const place = (outline, slot) => {
      if (slot) {
        outline.position.set(slotX(slot), slotY(slot) + SHELF_TOP + 0.42, RACK_Z);
        outline.visible = true;
      } else {
        outline.visible = false;
      }
    };
    place(ref.targetOutline, slots.find(s => s.slot_id === craneState.targetSlotId));
    place(ref.selectOutline, craneState.targetSlotId == null ? slots.find(s => s.slot_id === selectedSlotId) : null);
  }, [craneState.targetSlotId, selectedSlotId, slots, maxBay, maxLevel]);

  // ---------- สั่งหยิบสินค้าส่งสายพาน ----------
  const busy = craneState.status !== 'IDLE' || craneState.emergencyStop;
  const selectedSlot = occupiedSlots.find(s => s.slot_id === selectedSlotId);

  const handleDispatch = async () => {
    if (!selectedSlot || busy || dispatching) return;
    setDispatching(true);
    setMessage(null);
    try {
      const res = await storeOut(selectedSlot.slot_id);
      setMessage({ ok: res?.success !== false, text: res?.message || `ส่งคำสั่งหยิบสินค้าจากช่อง ${selectedSlot.slot_code} แล้ว` });
      setSelectedSlotId(null);
    } catch (err) {
      setMessage({ ok: false, text: 'ส่งคำสั่งไม่สำเร็จ กรุณาลองใหม่' });
    } finally {
      setDispatching(false);
    }
  };

  const hoverSlot = hover ? slots.find(s => s.slot_id === hover.id && s.is_occupied) : null;
  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const tooltipStyle = (() => {
    if (!hover) return {};
    const width = mountRef.current?.clientWidth || 600;
    const height = mountRef.current?.clientHeight || 400;
    const flipX = hover.x > width - 270;
    const flipY = hover.y > height - 190;
    return {
      left: flipX ? undefined : hover.x + 16,
      right: flipX ? width - hover.x + 16 : undefined,
      top: flipY ? undefined : hover.y + 16,
      bottom: flipY ? height - hover.y + 16 : undefined,
    };
  })();

  const statusLabel = craneState.emergencyStop ? STATUS_TEXT.EMERGENCY_STOP : (STATUS_TEXT[craneState.status] || craneState.status);
  const statusHex = `#${statusColor(craneState).toString(16).padStart(6, '0')}`;
  const progress = craneState.status === 'IDLE' ? 0 : Number(craneState.stepProgress || 0);

  return (
    <div className="glass-panel" style={{ padding: '28px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Box size={24} color="var(--accent-sky)" />
          จำลองเครนและชั้นวาง 3D
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          ลากหมุน · คลิกขวาลากเพื่อเลื่อน · ล้อเมาส์ซูม · คลิกกล่องเพื่อเลือก
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: 'clamp(340px, 50vw, 500px)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1.5px solid var(--border-color)',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 20%, #1e293b 0%, #0b1220 100%)'
              : 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #e2e8f0 100%)',
            cursor: 'grab'
          }}
        />
        <div style={{
          position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
          background: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.9)', color: 'var(--text-main)',
          border: '1px solid var(--border-color)', pointerEvents: 'none'
        }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: statusHex, boxShadow: `0 0 8px ${statusHex}` }} />
          {statusLabel}
          {craneState.targetSlotCode && craneState.status !== 'IDLE' && <span style={{ color: 'var(--text-dim)' }}>· {craneState.targetSlotCode}</span>}
        </div>
        {hoverSlot && (
          <div style={{
            position: 'absolute', ...tooltipStyle, width: '250px', padding: '12px 14px', borderRadius: '12px',
            background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.97)', color: 'var(--text-main)',
            border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
            pointerEvents: 'none', fontSize: '0.8rem', zIndex: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', flexShrink: 0, background: `#${categoryColor(hoverSlot.category).toString(16).padStart(6, '0')}` }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{hoverSlot.product_name || 'ไม่ระบุชื่อสินค้า'}</span>
            </div>
            {[
              ['ช่องจัดเก็บ', hoverSlot.slot_code],
              ['หมวดหมู่', hoverSlot.category || '-'],
              ['Lot', hoverSlot.lot_number || '-'],
              ['รหัสสินค้า', hoverSlot.qr_code || '-'],
              ['จัดเก็บเมื่อ', formatDate(hoverSlot.stored_at)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '3px 0' }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.74rem', fontWeight: 600 }}>
              คลิกเพื่อเลือกช่องนี้
            </div>
          </div>
        )}
        {progress > 0 && (
          <div style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', height: '5px', borderRadius: '99px', background: 'rgba(148,163,184,0.35)', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: statusHex, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        <span>X {Number(craneState.currentX || 0).toFixed(2)} m</span>
        <span>Y {Number(craneState.currentY || 0).toFixed(2)} m</span>
        <span>งา {craneState.forkExtended ? 'ยื่นออก' : 'หดเข้า'}</span>
        <span>{craneState.stepDescription}</span>
      </div>

      {/* หยิบสินค้าส่งสายพาน */}
      <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1.5px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
          <Truck size={20} color="var(--accent-sky)" />
          หยิบสินค้าส่งไปสายพานนำส่ง
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <select
            value={selectedSlotId ?? ''}
            onChange={(e) => selectRef.current(e.target.value === '' ? null : Number(e.target.value))}
            disabled={busy || dispatching || occupiedSlots.length === 0}
            style={{
              flex: '1 1 220px', minWidth: 0, padding: '10px 12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
              border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)'
            }}
          >
            <option value="">{occupiedSlots.length === 0 ? 'ไม่มีสินค้าในชั้นวาง' : 'เลือกช่องที่มีสินค้า'}</option>
            {occupiedSlots.map(s => (
              <option key={s.slot_id} value={s.slot_id}>{s.slot_code} · {s.product_name}</option>
            ))}
          </select>
          <button
            onClick={handleDispatch}
            disabled={!selectedSlot || busy || dispatching}
            className="btn btn-primary"
            style={{ flex: '0 0 auto', padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PackageOpen size={18} />
            {dispatching ? 'กำลังส่งคำสั่ง...' : 'หยิบส่งสายพาน'}
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', marginTop: '8px', fontWeight: 600, color: message ? (message.ok ? '#059669' : '#dc2626') : 'var(--text-dim)' }}>
          {message
            ? message.text
            : craneState.emergencyStop
              ? 'ปลดล็อคหยุดฉุกเฉินก่อนจึงจะสั่งงานได้'
              : busy
                ? 'รอเครนทำงานให้เสร็จก่อน'
                : 'เครนจะไปหยิบสินค้าจากช่อง ยกออก แล้วนำไปวางบนสายพานนำส่ง (ตัดสต็อกจริง)'}
        </div>
      </div>
    </div>
  );
};

export default Crane3DSimulator;
