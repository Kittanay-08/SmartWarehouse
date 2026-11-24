const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'asrs_smart_warehouse_super_secret_key_2026';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/warehouse_db';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.raw({ type: ['image/jpeg', 'image/png', 'application/octet-stream'], limit: '25mb' }));

// ==========================================
// 1. PERSISTENT JSON STORAGE & USER REPOSITORY
// ==========================================
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_SYSTEM_USERS = [
  { id: 1, username: 'admin', password_hash: '123456', full_name: 'สมชาย จัดการคลัง', role: 'admin', email: 'admin@smartwarehouse.io', avatar: '👨‍💼' },
  { id: 2, username: 'operator', password_hash: '123456', full_name: 'กิตติยา สแกนสต็อก', role: 'operator', email: 'operator@smartwarehouse.io', avatar: '👩‍🔧' },
  { id: 3, username: 'engineer', password_hash: '123456', full_name: 'วิศวกร ซ่อมบำรุง', role: 'engineer', email: 'engineer@smartwarehouse.io', avatar: '🧑‍💻' }
];

function loadPersistentUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading users.json:', err.message);
  }
  return null;
}

function savePersistentUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(USERS_DB, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ Error writing users.json:', err.message);
  }
}

let USERS_DB = (function() {
  const loaded = loadPersistentUsers();
  if (loaded && loaded.length > 0) {
    for (const def of DEFAULT_SYSTEM_USERS) {
      if (!loaded.some(u => u.username.toLowerCase() === def.username.toLowerCase())) {
        loaded.push(def);
      }
    }
    return loaded;
  }
  return [...DEFAULT_SYSTEM_USERS];
})();
savePersistentUsers();

let memorySlots = [
  // Standard AS/RS 9-Slot Matrix (3 Levels x 3 Bays)
  { slot_id: 1, slot_code: 'A-01-01', rack: 'A', level: 1, bay: 1, x_axis: 1.0, y_axis: 1.0, z_axis: 1.0, is_occupied: true, product_name: 'น้ำดื่มคริสตัล 600ml (Pack 12)', qr_code: '8851950001015', category: 'Beverages', lot_number: 'LOT-2026-A101', stored_at: new Date(Date.now() - 172800000).toISOString() },
  { slot_id: 2, slot_code: 'A-01-02', rack: 'A', level: 1, bay: 2, x_axis: 2.0, y_axis: 1.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, lot_number: null, stored_at: null },
  { slot_id: 3, slot_code: 'A-01-03', rack: 'A', level: 1, bay: 3, x_axis: 3.0, y_axis: 1.0, z_axis: 1.0, is_occupied: true, product_name: 'ชิปประมวลผลไมโครคอนโทรลเลอร์ ESP32-WROOM', qr_code: '8850029381023', category: 'Electronics', lot_number: 'LOT-2026-E402', stored_at: new Date(Date.now() - 86400000).toISOString() },
  { slot_id: 4, slot_code: 'A-02-01', rack: 'A', level: 2, bay: 1, x_axis: 1.0, y_axis: 2.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, lot_number: null, stored_at: null },
  { slot_id: 5, slot_code: 'A-02-02', rack: 'A', level: 2, bay: 2, x_axis: 2.0, y_axis: 2.0, z_axis: 1.0, is_occupied: true, product_name: 'ขนมมันฝรั่งทอดกรอบ เลย์ รสคลาสสิค 75g', qr_code: '8850718801129', category: 'Snacks', lot_number: 'LOT-2026-S110', stored_at: new Date(Date.now() - 18000000).toISOString() },
  { slot_id: 6, slot_code: 'A-02-03', rack: 'A', level: 2, bay: 3, x_axis: 3.0, y_axis: 2.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, lot_number: null, stored_at: null },
  { slot_id: 7, slot_code: 'A-03-01', rack: 'A', level: 3, bay: 1, x_axis: 1.0, y_axis: 3.0, z_axis: 1.0, is_occupied: true, product_name: 'เซอร์โวมอเตอร์อุตสาหกรรม NEMA 17 Stepper', qr_code: '8859948123019', category: 'Parts', lot_number: 'LOT-2026-P881', stored_at: new Date(Date.now() - 43200000).toISOString() },
  { slot_id: 8, slot_code: 'A-03-02', rack: 'A', level: 3, bay: 2, x_axis: 2.0, y_axis: 3.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, lot_number: null, stored_at: null },
  { slot_id: 9, slot_code: 'A-03-03', rack: 'A', level: 3, bay: 3, x_axis: 3.0, y_axis: 3.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, lot_number: null, stored_at: null }
];

let memoryTransactions = [
  { id: 1, transaction_type: 'STORE_IN', slot_id: 1, slot_code: 'A-01-01', product_name: 'น้ำดื่มคริสตัล 600ml (Pack 12)', qr_code: '8851950001015', category: 'Beverages', operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', duration_seconds: 4, details: 'สแกน QR Code นำเข้าชั้นวางสำเร็จ', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 2, transaction_type: 'STORE_IN', slot_id: 3, slot_code: 'A-01-03', product_name: 'ชิปประมวลผลไมโครคอนโทรลเลอร์ ESP32-WROOM', qr_code: '8850029381023', category: 'Electronics', operator_name: 'สมชาย จัดการคลัง', operator_role: 'admin', status: 'COMPLETED', duration_seconds: 3, details: 'รับสินค้าจาก Vendor IoT', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, transaction_type: 'RETRIEVE_OUT', slot_id: 4, slot_code: 'A-02-01', product_name: 'สายพานไทม์มิ่ง GT2 6mm', qr_code: '8853392817261', category: 'Parts', operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', duration_seconds: 5, details: 'เบิกจ่ายให้แผนกประกอบเครื่อง', created_at: new Date(Date.now() - 64800000).toISOString() },
  { id: 4, transaction_type: 'STORE_IN', slot_id: 5, slot_code: 'A-02-02', product_name: 'ขนมมันฝรั่งทอดกรอบ เลย์ รสคลาสสิค 75g', qr_code: '8850718801129', category: 'Snacks', operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', duration_seconds: 4, details: 'เติมสินค้าเข้าคลังอัจฉริยะ', created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: 5, transaction_type: 'STORE_IN', slot_id: 11, slot_code: 'B-01-02', product_name: 'น้ำส้มแท้ 100% Tipco 1000ml', qr_code: '8851013720911', category: 'Beverages', operator_name: 'สมชาย จัดการคลัง', operator_role: 'admin', status: 'COMPLETED', duration_seconds: 4, details: 'จัดเก็บในโซน B ระดับ 1', created_at: new Date(Date.now() - 21600000).toISOString() },
  { id: 6, transaction_type: 'RETRIEVE_OUT', slot_id: 10, slot_code: 'B-01-01', product_name: 'นมถั่วเหลืองไวตามิลค์ 300ml', qr_code: '8851029381092', category: 'Beverages', operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', duration_seconds: 4, details: 'เบิกจ่ายอัตโนมัติผ่านระบบ Vending', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 7, transaction_type: 'STORE_IN', slot_id: 13, slot_code: 'B-02-01', product_name: 'บอร์ดไดรเวอร์ควบคุมมอเตอร์ A4988 Module', qr_code: '8852309182390', category: 'Electronics', operator_name: 'วิศวกร ซ่อมบำรุง', operator_role: 'engineer', status: 'COMPLETED', duration_seconds: 3, details: 'จัดเก็บอะไหล่สำรองซ่อมบำรุง', created_at: new Date(Date.now() - 64800000).toISOString() }
];

let craneState = {
  status: 'IDLE',
  currentX: 0.0,
  currentY: 0.0,
  currentZ: 0.0,
  targetX: 0.0,
  targetY: 0.0,
  targetZ: 0.0,
  targetSlotId: null,
  targetSlotCode: null,
  speed: 100,
  forkExtended: false,
  hasPayload: false,
  carriedItem: null,
  emergencyStop: false,
  temperature: 32.4,
  lastPing: Date.now(),
  stepProgress: 0,
  stepDescription: 'พร้อมทำงาน (Ready for Command)'
};

let esp32HardwareConnected = false;
let simulatorActive = true;

// ==========================================
// 2. DATABASE CLIENT SETUP (POSTGRESQL)
// ==========================================
let pool = null;
let isDbConnected = false;

function connectDatabaseWithRetry() {
  if (!pool) {
    try {
      pool = new Pool({
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 5000
      });
    } catch (e) {
      console.warn('⚠️ DB Init Exception:', e.message);
    }
  }

  if (!pool) {
    setTimeout(connectDatabaseWithRetry, 3000);
    return;
  }

  pool.connect((err, client, release) => {
    if (err) {
      console.warn('⚠️ PostgreSQL standby (' + err.message + '). Retrying in 3s...');
      isDbConnected = false;
      setTimeout(connectDatabaseWithRetry, 3000);
    } else {
      console.log('✅ PostgreSQL Database Connected successfully');
      isDbConnected = true;
      release();
      syncDbSlots();
      syncDbUsers();
    }
  });
}
connectDatabaseWithRetry();

async function syncDbSlots() {
  if (!pool) return;
  try {
    const res = await pool.query('SELECT * FROM slots ORDER BY slot_id ASC');
    if (res.rows.length > 0) {
      memorySlots = res.rows;
    }
    const transRes = await pool.query('SELECT * FROM transactions ORDER BY id DESC LIMIT 50');
    if (transRes.rows.length > 0) {
      memoryTransactions = transRes.rows;
    }
  } catch (err) {
    console.warn('Sync DB Slots error:', err.message);
  }
}

async function syncDbUsers() {
  if (!pool) return;
  try {
    const res = await pool.query('SELECT * FROM users');
    if (res.rows.length > 0) {
      for (const row of res.rows) {
        const uLower = (row.username || '').toLowerCase();
        const idx = USERS_DB.findIndex(u => u.username.toLowerCase() === uLower);
        const existing = idx >= 0 ? USERS_DB[idx] : null;
        const userObj = {
          id: row.id,
          username: uLower,
          password_hash: row.password,
          password_plain: existing ? (existing.password_plain || existing.password_hash) : null,
          full_name: existing?.full_name || row.username,
          name: existing?.name || row.username,
          role: row.role ? row.role.toLowerCase() : 'operator',
          avatar: existing?.avatar || (row.role?.toLowerCase() === 'admin' ? '👨‍💼' : row.role?.toLowerCase() === 'engineer' ? '🧑‍💻' : '👩‍🔧'),
          email: `${uLower}@smartwarehouse.io`
        };
        if (idx >= 0) {
          USERS_DB[idx] = { ...USERS_DB[idx], ...userObj };
        } else {
          USERS_DB.push(userObj);
        }
      }
      savePersistentUsers();
      console.log(`👥 Synced ${res.rows.length} users from PostgreSQL into cache and users.json.`);
    }
  } catch (err) {
    console.warn('Sync DB Users error:', err.message);
  }
}

// ==========================================
// 4. VIRTUAL AS/RS SIMULATOR
// ==========================================
let simInterval = null;

function runVirtualSimulation(action, targetSlot, productData, callback) {
  if (simInterval) clearInterval(simInterval);

  craneState.status = action === 'STORE' ? 'STORING' : 'RETRIEVING';
  craneState.targetSlotId = targetSlot.slot_id;
  craneState.targetSlotCode = targetSlot.slot_code;
  craneState.targetX = targetSlot.x_axis;
  craneState.targetY = targetSlot.y_axis;
  craneState.targetZ = targetSlot.z_axis;
  craneState.stepProgress = 10;
  craneState.stepDescription = action === 'STORE' 
    ? `กำลังรับสินค้า "${productData?.name || ''}" ที่แท่นรับสินค้า (Inbound Bay)...`
    : `กำลังเคลื่อนที่ไปยังช่อง ${targetSlot.slot_code} (X:${targetSlot.x_axis}, Y:${targetSlot.y_axis})...`;
  
  if (action === 'STORE') {
    craneState.hasPayload = true;
    craneState.carriedItem = productData?.name;
  }

  io.emit('crane_telemetry', craneState);

  // ลำดับขั้น: เคลื่อนที่ไปช่อง (1-5) → ยื่นงา (6-8) → หดงา (9) → กลับจุดศูนย์ (10-13)
  // เบิกจ่าย: ยื่นงาวางสินค้าลงสายพานนำส่ง (14-15) → หดงา (16) → เสร็จ
  const TRAVEL_STEPS = 5;
  const FORK_OUT_END = TRAVEL_STEPS + 3;
  const FORK_IN_STEP = FORK_OUT_END + 1;
  const RETURN_STEPS = 4;
  const RETURN_END = FORK_IN_STEP + RETURN_STEPS;
  const DROP_OUT_END = RETURN_END + 2;
  const DROP_IN_STEP = DROP_OUT_END + 1;
  const totalSteps = (action === 'RETRIEVE' ? DROP_IN_STEP : RETURN_END) + 1;
  const STEP_MS = 600;
  let step = 0;

  simInterval = setInterval(() => {
    step++;
    craneState.stepProgress = Math.min(100, Math.round((step / totalSteps) * 100));

    if (step <= TRAVEL_STEPS) {
      const ratio = step / TRAVEL_STEPS;
      craneState.currentX = Number((targetSlot.x_axis * ratio).toFixed(2));
      craneState.currentY = Number((targetSlot.y_axis * ratio).toFixed(2));
      craneState.currentZ = 0.0;
      craneState.stepDescription = `เครนกำลังเคลื่อนที่ไปยังพิกัด X:${craneState.currentX}, Y:${craneState.currentY}`;
    } else if (step <= FORK_OUT_END) {
      craneState.forkExtended = true;
      craneState.currentZ = Number(targetSlot.z_axis) || 1.0;
      craneState.stepDescription = action === 'STORE' 
        ? `ยืดก้ามปูนำสินค้าวางลงในช่อง ${targetSlot.slot_code}...`
        : `ยืดก้ามปูเข้าหยิบสินค้าจากช่อง ${targetSlot.slot_code}...`;
      // สลับสินค้าที่ปลายงาในขั้นสุดท้ายของการยื่น
      if (step === FORK_OUT_END) {
        if (action === 'STORE') {
          craneState.hasPayload = false;
          craneState.carriedItem = null;
        } else {
          craneState.hasPayload = true;
          craneState.carriedItem = productData?.name;
        }
        // อัปเดตผังชั้นวางตอนสินค้าถูกวาง/หยิบจริง
        io.emit('slots_updated', memorySlots);
      }
    } else if (step === FORK_IN_STEP) {
      craneState.forkExtended = false;
      craneState.currentZ = 0.0;
      craneState.stepDescription = `หดก้ามปูกลับจากช่อง ${targetSlot.slot_code}...`;
    } else if (step <= RETURN_END) {
      const ratio = 1 - ((step - FORK_IN_STEP) / RETURN_STEPS);
      craneState.currentX = Number((targetSlot.x_axis * ratio).toFixed(2));
      craneState.currentY = Number((targetSlot.y_axis * ratio).toFixed(2));
      craneState.currentZ = 0.0;
      craneState.stepDescription = action === 'STORE' 
        ? 'จัดเก็บสินค้าเรียบร้อย เครนกลับสู่ตำแหน่งศูนย์...'
        : 'กำลังนำสินค้าไปยังสายพานนำส่ง (Outbound Conveyor)...';
    } else if (action === 'RETRIEVE' && step <= DROP_OUT_END) {
      craneState.forkExtended = true;
      craneState.currentZ = 1.0;
      craneState.stepDescription = 'ยืดก้ามปูวางสินค้าลงบนสายพานนำส่ง...';
      if (step === DROP_OUT_END) {
        craneState.hasPayload = false;
        craneState.carriedItem = null;
      }
    } else if (action === 'RETRIEVE' && step === DROP_IN_STEP) {
      craneState.forkExtended = false;
      craneState.currentZ = 0.0;
      craneState.stepDescription = 'หดก้ามปูกลับ สินค้ากำลังเคลื่อนไปตามสายพาน...';
    } else {
      clearInterval(simInterval);
      simInterval = null;
      craneState.status = 'IDLE';
      craneState.currentX = 0.0;
      craneState.currentY = 0.0;
      craneState.currentZ = 0.0;
      craneState.forkExtended = false;
      craneState.hasPayload = false;
      craneState.carriedItem = null;
      craneState.targetSlotId = null;
      craneState.targetSlotCode = null;
      craneState.stepProgress = 100;
      craneState.stepDescription = action === 'STORE'
        ? `✅ นำเข้าสินค้า "${productData?.name || ''}" เข้าช่อง ${targetSlot.slot_code} สำเร็จสมบูรณ์!`
        : `✅ ส่งสินค้า "${productData?.name || ''}" ลงสายพานนำส่งเรียบร้อย!`;

      io.emit('crane_telemetry', craneState);

      if (callback) callback();
      return;
    }

    io.emit('crane_telemetry', craneState);
  }, STEP_MS);
}

// ==========================================
// 5. REST API ROUTES
// ==========================================

// Login Route (Supports both /api/login and /api/auth/login)
const handleLoginLogic = async (req, res) => {
  const { username, password } = req.body;
  const cleanU = (username || '').trim().toLowerCase();
  const cleanP = (password || '').trim();

  if (!cleanU || !cleanP) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน' });
  }

  let user = null;

  // 1. Try DB first (if pool is connected and DB is available)
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(employee_id) = $1', [cleanU]);
      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        const isPasswordValid = (await bcrypt.compare(cleanP, dbUser.password).catch(() => false))
          || cleanP === dbUser.password;
        if (isPasswordValid) {
          user = {
            id: dbUser.id,
            username: dbUser.username,
            full_name: dbUser.full_name || dbUser.name || dbUser.username,
            role: (dbUser.role || 'operator').toLowerCase(),
            email: dbUser.email || `${dbUser.username}@smartwarehouse.io`,
            avatar: dbUser.avatar
          };
        }
      }
    } catch (e) {
      console.warn('Database login query fallback notice:', e.message);
    }
  }

  // 2. Fallback to USERS_DB (handles persistent cache, memory users, or offline DB)
  if (!user) {
    const memUser = USERS_DB.find(u => u.username.toLowerCase() === cleanU || (u.email && u.email.toLowerCase() === cleanU));
    if (memUser) {
      const hasCustom = Boolean(memUser.has_custom_password || memUser.hasCustomPassword);
      let isMemPasswordValid = false;

      if (cleanP === memUser.password_plain || cleanP === memUser.password_hash || cleanP === memUser.password) {
        isMemPasswordValid = true;
      } else if (memUser.hashed_password && await bcrypt.compare(cleanP, memUser.hashed_password).catch(() => false)) {
        isMemPasswordValid = true;
      } else if (memUser.password_hash && await bcrypt.compare(cleanP, memUser.password_hash).catch(() => false)) {
        isMemPasswordValid = true;
      }

      // If user hasn't changed their password, accept standard default initial passwords
      if (!isMemPasswordValid && !hasCustom) {
        if (cleanP === '123456' || cleanP === 'password123') {
          isMemPasswordValid = true;
        }
      }

      if (isMemPasswordValid) {
        user = {
          id: memUser.id,
          username: memUser.username,
          full_name: memUser.full_name || memUser.name || memUser.username.toUpperCase(),
          role: (memUser.role || 'operator').toLowerCase(),
          email: memUser.email || `${memUser.username}@smartwarehouse.io`,
          avatar: memUser.avatar,
          hasCustomPassword: hasCustom
        };
      }
    }
  }

  // 3. Fallback demo ONLY if user not registered in DB
  if (!user && !USERS_DB.some(u => u.username.toLowerCase() === cleanU)) {
    if (cleanP === '123456' || cleanP === 'password123') {
      const role = cleanU.includes('admin') ? 'admin' : cleanU.includes('eng') ? 'engineer' : 'operator';
      user = {
        id: Date.now(),
        username: cleanU,
        full_name: cleanU === 'admin' ? 'สมชาย จัดการคลัง' : cleanU === 'engineer' ? 'วิศวกร ซ่อมบำรุง' : 'กิตติยา สแกนสต็อก',
        role: role,
        email: `${cleanU}@smartwarehouse.io`
      };
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือสมัครสมาชิกใหม่' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, employee_id: user.employee_id || user.id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    role: user.role,
    username: user.username,
    user: {
      id: user.id,
      username: user.username,
      name: user.full_name || user.name || user.username.toUpperCase(),
      role: user.role,
      roleLabel: user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : user.role === 'engineer' ? 'วิศวกร IoT' : 'พนักงานคลัง (Operator)',
      avatar: user.avatar || (user.role === 'admin' ? '👨‍💼' : user.role === 'engineer' ? '🧑‍💻' : '👩‍🔧'),
      email: user.email,
      hasCustomPassword: Boolean(user.hasCustomPassword)
    }
  });
};

app.post('/api/login', handleLoginLogic);
app.post('/api/auth/login', handleLoginLogic);

// Google OAuth Login Route (Strict Restriction: User MUST already be registered)
const handleGoogleLoginLogic = async (req, res) => {
  const { credential, email, username, name, picture } = req.body;
  let userEmail = (email || '').trim().toLowerCase();
  let userName = (name || '').trim();
  let userAvatar = picture || '👨‍💼';

  if (credential) {
    try {
      const decoded = jwt.decode(credential);
      if (decoded) {
        userEmail = decoded.email?.toLowerCase() || userEmail;
        userName = decoded.name || userName;
        userAvatar = decoded.picture || userAvatar;
      }
    } catch (e) {
      console.warn('Google JWT parse notice:', e.message);
    }
  }

  const userPrefix = userEmail.includes('@') ? userEmail.split('@')[0].toLowerCase() : userEmail;
  const targetUsername = (username || userPrefix || '').toLowerCase().trim();

  if (!userEmail && !targetUsername) {
    return res.status(400).json({ success: false, error: 'ไม่พบข้อมูลอีเมลหรือชื่อผู้ใช้งาน' });
  }

  // Look up existing registered user
  let user = USERS_DB.find(u => 
    (u.email && u.email.toLowerCase() === userEmail) ||
    (u.gmail && u.gmail.toLowerCase() === userEmail) ||
    (u.username && u.username.toLowerCase() === userEmail) ||
    (targetUsername && u.username && u.username.toLowerCase() === targetUsername) ||
    (targetUsername && u.email && u.email.toLowerCase().startsWith(targetUsername + '@'))
  );

  // If not found in memory USERS_DB, check PostgreSQL users table
  if (!user && pool) {
    try {
      const dbRes = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(username) = $2',
        [userEmail, targetUsername]
      );
      if (dbRes.rows.length > 0) {
        const dbU = dbRes.rows[0];
        user = {
          id: dbU.id,
          username: dbU.username,
          full_name: dbU.full_name || dbU.name || dbU.username,
          role: (dbU.role || 'operator').toLowerCase(),
          email: dbU.email || userEmail,
          avatar: dbU.avatar || userAvatar
        };
        USERS_DB.push(user);
      }
    } catch (e) {
      console.warn('PostgreSQL user lookup error:', e.message);
    }
  }

  // REQUIREMENT 1: If user hasn't registered with this Gmail/account, DO NOT AUTO-CREATE! REJECT!
  if (!user) {
    return res.status(404).json({
      success: false,
      isNotRegistered: true,
      error: `⚠️ บัญชี (${userEmail || targetUsername}) ยังไม่ได้สมัครสมาชิกในระบบ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ`
    });
  }

  // If user registered with this Gmail, allow login
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    role: user.role,
    username: user.username,
    user: {
      id: user.id,
      username: user.username,
      name: user.full_name || user.name || userName || user.username.toUpperCase(),
      role: user.role,
      roleLabel: user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : user.role === 'engineer' ? 'วิศวกร IoT' : 'พนักงานคลัง (Operator)',
      avatar: user.avatar || userAvatar,
      email: user.email || userEmail,
      hasCustomPassword: Boolean(user.has_custom_password || user.hasCustomPassword)
    }
  });
};

app.post('/api/google-login', handleGoogleLoginLogic);
app.post('/api/auth/google', handleGoogleLoginLogic);

// Change Password Route (Verifies Current Password and Updates Storage/DB)
const handleChangePasswordLogic = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const cleanU = (username || '').trim().toLowerCase();
  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();

  if (!cleanU) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อผู้ใช้งาน' });
  }
  if (!cleanCurrent) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน' });
  }
  if (!cleanNew) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านใหม่' });
  }
  if (cleanNew.length < 4) {
    return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
  }
  if (cleanCurrent === cleanNew) {
    return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' });
  }

  // Find user in USERS_DB
  let userIndex = USERS_DB.findIndex(u => u.username.toLowerCase() === cleanU || (u.email && u.email.toLowerCase() === cleanU));
  let user = userIndex >= 0 ? USERS_DB[userIndex] : null;

  if (!user && pool) {
    try {
      const dbRes = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [cleanU]);
      if (dbRes.rows.length > 0) {
        const dbU = dbRes.rows[0];
        user = {
          id: dbU.id,
          username: dbU.username,
          full_name: dbU.full_name || dbU.name || dbU.username,
          role: dbU.role,
          email: dbU.email || `${cleanU}@smartwarehouse.io`,
          password_hash: dbU.password
        };
        userIndex = USERS_DB.length;
        USERS_DB.push(user);
      }
    } catch (e) {}
  }

  if (!user) {
    return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
  }

  let isCurrentValid = false;

  if (cleanCurrent === user.password_plain || cleanCurrent === user.password_hash || cleanCurrent === user.password) {
    isCurrentValid = true;
  } else if (user.hashed_password && await bcrypt.compare(cleanCurrent, user.hashed_password).catch(() => false)) {
    isCurrentValid = true;
  } else if (user.password_hash && await bcrypt.compare(cleanCurrent, user.password_hash).catch(() => false)) {
    isCurrentValid = true;
  } else if (cleanCurrent === '123456' || cleanCurrent === 'password123') {
    isCurrentValid = true;
  }

  if (!isCurrentValid) {
    return res.status(400).json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
  }

  try {
    const hashed = await bcrypt.hash(cleanNew, 10);
    user.has_custom_password = true;
    user.hasCustomPassword = true;
    user.password_plain = cleanNew;
    user.password_hash = cleanNew;
    user.password = cleanNew;
    user.hashed_password = hashed;
    USERS_DB[userIndex] = user;

    savePersistentUsers();

    if (pool) {
      try {
        await pool.query('UPDATE users SET password = $1 WHERE LOWER(username) = $2', [hashed, cleanU]);
      } catch (err) {}
    }

    console.log(`🔐 Password successfully changed for user [${cleanU}].`);
    return res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว',
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name || user.name || user.username.toUpperCase(),
        role: user.role,
        email: user.email,
        avatar: user.avatar,
        hasCustomPassword: true
      }
    });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
};

app.post('/api/change-password', handleChangePasswordLogic);
app.post('/api/user/change-password', handleChangePasswordLogic);

// Update User Profile Route (Persists Name, Email, Phone, Department, Avatar)
const handleUpdateProfileLogic = async (req, res) => {
  const { username, name, email, phone, department, avatar } = req.body;
  const cleanU = (username || '').trim().toLowerCase();
  if (!cleanU) {
    return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อผู้ใช้งาน' });
  }

  let userIndex = USERS_DB.findIndex(u => u.username.toLowerCase() === cleanU);
  if (userIndex >= 0) {
    const u = USERS_DB[userIndex];
    if (name) { u.full_name = name.trim(); u.name = name.trim(); }
    if (email) { u.email = email.trim().toLowerCase(); }
    if (phone) { u.phone = phone.trim(); }
    if (department) { u.department = department.trim(); }
    if (avatar) { u.avatar = avatar; }
    USERS_DB[userIndex] = u;
    savePersistentUsers();

    if (pool) {
      try {
        await pool.query(
          'UPDATE users SET email = COALESCE($1, email), full_name = COALESCE($2, full_name) WHERE LOWER(username) = $3',
          [email || null, name || null, cleanU]
        );
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว',
      user: {
        id: u.id,
        username: u.username,
        name: u.full_name || u.name,
        role: u.role,
        email: u.email,
        phone: u.phone,
        department: u.department,
        avatar: u.avatar,
        hasCustomPassword: Boolean(u.has_custom_password || u.hasCustomPassword)
      }
    });
  }

  return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
};

app.post('/api/user/profile', handleUpdateProfileLogic);
app.put('/api/user/profile', handleUpdateProfileLogic);

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, password, fullName, role, email, employeeId, avatar } = req.body;
  const cleanU = (username || '').trim().toLowerCase();
  const cleanP = (password || '').trim();
  const cleanName = (fullName || '').trim() || cleanU.toUpperCase();
  const cleanRole = (role || 'operator').toLowerCase();
  const cleanEmail = email || `${cleanU}@smartwarehouse.io`;
  const cleanAvatar = avatar || (cleanRole === 'admin' ? '👨‍💼' : cleanRole === 'engineer' ? '🧑‍💻' : '👩‍🔧');

  if (!cleanU || !cleanP) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
  }

  try {
    const hashedPassword = await bcrypt.hash(cleanP, 10);
    
    // Check if user already exists in cache or PostgreSQL
    let existingIndex = USERS_DB.findIndex(u => u.username.toLowerCase() === cleanU);
    let userId = existingIndex >= 0 ? USERS_DB[existingIndex].id : (Date.now() + Math.floor(Math.random() * 1000));
    
    const userObj = {
      id: userId,
      username: cleanU,
      password_hash: cleanP, // Store plain for instant memory match
      password_plain: cleanP,
      hashed_password: hashedPassword,
      full_name: cleanName,
      name: cleanName,
      role: cleanRole,
      email: cleanEmail,
      avatar: cleanAvatar
    };

    if (existingIndex >= 0) {
      USERS_DB[existingIndex] = { ...USERS_DB[existingIndex], ...userObj };
      console.log(`🔄 Re-registered/updated user [${cleanU}] with new credentials.`);
    } else {
      USERS_DB.push(userObj);
      console.log(`➕ Added new registered user [${cleanU}].`);
    }

    // Persist to users.json file immediately (survives restarts & redeploys)
    savePersistentUsers();

    // Persist to PostgreSQL if connected
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (employee_id, username, password, role, email, full_name, avatar) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (username) DO UPDATE 
           SET password = EXCLUDED.password, role = EXCLUDED.role, email = EXCLUDED.email, full_name = EXCLUDED.full_name, avatar = EXCLUDED.avatar`,
          [employeeId || `EMP-${Date.now()}`, cleanU, hashedPassword, cleanRole, cleanEmail, cleanName, cleanAvatar]
        );
        console.log(`✅ User [${cleanU}] synchronized to PostgreSQL.`);
      } catch (e) {
        console.warn('DB Register insert warning:', e.message);
      }
    }

    const token = jwt.sign(
      { id: userId, username: cleanU, role: cleanRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: existingIndex >= 0 ? 'อัปเดตรหัสผ่านและข้อมูลสมาชิกเรียบร้อยแล้ว' : 'สมัครสมาชิกสำเร็จเรียบร้อยแล้ว',
      token,
      user: {
        id: userId,
        username: cleanU,
        name: cleanName,
        role: cleanRole,
        roleLabel: cleanRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : cleanRole === 'engineer' ? 'วิศวกร IoT' : 'พนักงานคลัง (Operator)',
        avatar: cleanAvatar,
        email: cleanEmail
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

// Get registered users directory for multi-device sync
app.get('/api/users', (req, res) => {
  const safeUsers = USERS_DB.map(u => ({
    id: u.id,
    username: u.username,
    name: u.full_name || u.name || u.username.toUpperCase(),
    fullName: u.full_name || u.name || u.username.toUpperCase(),
    role: (u.role || 'operator').toLowerCase(),
    roleLabel: u.role?.toLowerCase() === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : u.role?.toLowerCase() === 'engineer' ? 'วิศวกร IoT' : 'พนักงานคลัง (Operator)',
    avatar: u.avatar || (u.role?.toLowerCase() === 'admin' ? '👨‍💼' : u.role?.toLowerCase() === 'engineer' ? '🧑‍💻' : '👩‍🔧'),
    email: u.email || `${u.username}@smartwarehouse.io`,
    hasCustomPassword: Boolean(u.password_hash || u.password || u.password_plain)
  }));
  res.json({ success: true, users: safeUsers });
});

// Slots API
app.get('/api/slots', (req, res) => {
  res.json(memorySlots);
});

app.get('/api/slots/:id', (req, res) => {
  const slot = memorySlots.find(s => s.slot_id === parseInt(req.params.id));
  if (!slot) return res.status(404).json({ error: 'Slot not found' });
  res.json(slot);
});

// ==========================================
// ESP32-CAM REAL-TIME STREAM & QR APIS
// ==========================================
let latestEsp32Frame = null;
let latestEsp32Timestamp = null;

// POST frame from ESP32-CAM (raw JPEG buffer, base64 JSON, or multipart)
app.post('/api/esp32/frame', (req, res) => {
  try {
    let base64Data = null;

    if (Buffer.isBuffer(req.body)) {
      base64Data = `data:image/jpeg;base64,${req.body.toString('base64')}`;
    } else if (req.body && req.body.image) {
      base64Data = req.body.image.startsWith('data:') ? req.body.image : `data:image/jpeg;base64,${req.body.image}`;
    }

    if (base64Data) {
      latestEsp32Frame = base64Data;
      latestEsp32Timestamp = Date.now();
      io.emit('esp32_cam_frame', { image: latestEsp32Frame, timestamp: latestEsp32Timestamp });
      return res.json({ success: true, timestamp: latestEsp32Timestamp });
    }

    res.status(400).json({ error: 'No image data received' });
  } catch (err) {
    console.error('ESP32 Frame error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET latest ESP32-CAM frame
app.get('/api/esp32/latest-frame', (req, res) => {
  if (!latestEsp32Frame) {
    return res.status(404).json({ error: 'No frame available yet' });
  }
  if (req.query.raw === 'true') {
    const base64Part = latestEsp32Frame.split(',')[1] || latestEsp32Frame;
    const imgBuf = Buffer.from(base64Part, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': imgBuf.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    return res.end(imgBuf);
  }
  res.json({ success: true, image: latestEsp32Frame, timestamp: latestEsp32Timestamp });
});

// POST scanned QR code from ESP32-CAM
app.post('/api/esp32/scan', (req, res) => {
  try {
    const scannedCode = (req.body.qrcode_data || req.body.code || req.body.qr || req.body.scanned_qr || '').toString().trim();
    if (!scannedCode) {
      return res.status(400).json({ error: 'No QR code payload provided' });
    }

    let frameImg = req.body.image || null;
    if (frameImg && !frameImg.startsWith('data:')) {
      frameImg = `data:image/jpeg;base64,${frameImg}`;
    }
    if (frameImg) {
      latestEsp32Frame = frameImg;
      latestEsp32Timestamp = Date.now();
      io.emit('esp32_cam_frame', { image: frameImg, timestamp: latestEsp32Timestamp });
    }

    console.log(`📷 [API /api/esp32/scan] Scanned QR from ESP32-CAM: ${scannedCode}`);
    io.emit('qr_scanned', {
      scanned_qr: scannedCode,
      image: latestEsp32Frame,
      device: req.body.device || 'ESP32_CAM',
      timestamp: Date.now()
    });

    res.json({ success: true, message: 'QR Code processed successfully', scanned_qr: scannedCode });
  } catch (err) {
    console.error('ESP32 Scan error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Proxy Local IP Stream (converts HTTP local stream to HTTPS for browser)
app.get('/api/esp32/proxy-stream', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url parameter');

  try {
    const httpLib = targetUrl.startsWith('https') ? require('https') : require('http');
    const proxyReq = httpLib.get(targetUrl, { timeout: 5000 }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      if (!res.headersSent) res.status(502).send('Error connecting to ESP32 stream: ' + err.message);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Create new slot (with backward compatibility for ESP32 QR scan)
app.post('/api/slots', async (req, res) => {
  // Support legacy ESP32-CAM firmware posting directly to /api/slots
  if (req.body && (req.body.qrcode_data || req.body.qr || req.body.code)) {
    const scannedCode = (req.body.qrcode_data || req.body.qr || req.body.code).toString().trim();
    console.log(`📷 [Legacy /api/slots] Scanned QR from ESP32: ${scannedCode}`);
    const frameImg = req.body.image || latestEsp32Frame;
    io.emit('qr_scanned', { scanned_qr: scannedCode, image: frameImg, device: 'ESP32_CAM', timestamp: Date.now() });
    return res.json({ success: true, message: 'QR Code received via legacy /api/slots', qrcode: scannedCode });
  }

  const { rack = 'A', level, bay, slot_code } = req.body;
  const numLevel = parseInt(level);
  const numBay = parseInt(bay);

  if (isNaN(numLevel) || isNaN(numBay) || numLevel < 1 || numBay < 1) {
    return res.status(400).json({ error: 'กรุณาระบุชั้น (Level) และช่อง (Bay) ให้ถูกต้อง' });
  }

  const cleanRack = (rack || 'A').toUpperCase().trim();
  const code = slot_code ? slot_code.trim().toUpperCase() : `${cleanRack}-${String(numLevel).padStart(2, '0')}-${String(numBay).padStart(2, '0')}`;

  // Check if slot with this code or level/bay already exists
  const existing = memorySlots.find(s => s.slot_code === code || (s.rack === cleanRack && s.level === numLevel && s.bay === numBay));
  if (existing) {
    return res.status(400).json({ error: `ช่อง ${code} (ชั้น ${numLevel}, ช่อง ${numBay}) มีอยู่ในระบบแล้ว` });
  }

  const nextId = memorySlots.length > 0 ? Math.max(...memorySlots.map(s => s.slot_id)) + 1 : 1;
  const newSlot = {
    slot_id: nextId,
    slot_code: code,
    rack: cleanRack,
    level: numLevel,
    bay: numBay,
    x_axis: parseFloat(numBay),
    y_axis: parseFloat(numLevel),
    z_axis: 1.0,
    is_occupied: false,
    product_name: null,
    qr_code: null,
    category: null,
    lot_number: null,
    stored_at: null,
    updated_at: new Date().toISOString()
  };

  memorySlots.push(newSlot);

  if (isDbConnected && pool) {
    try {
      const insertRes = await pool.query(
        `INSERT INTO slots (slot_code, rack, level, bay, x_axis, y_axis, z_axis, is_occupied) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE) RETURNING *`,
        [code, cleanRack, numLevel, numBay, parseFloat(numBay), parseFloat(numLevel), 1.0]
      );
      if (insertRes.rows.length > 0) {
        newSlot.slot_id = insertRes.rows[0].slot_id;
      }
    } catch (e) {
      console.warn('DB Slot Insert error:', e.message);
    }
  }

  io.emit('slots_updated', memorySlots);
  res.status(201).json({ success: true, slot: newSlot, message: `เพิ่มช่องจัดเก็บ ${code} สำเร็จ` });
});

// Delete slot (only if unoccupied)
app.delete('/api/slots/:id', async (req, res) => {
  const slotId = parseInt(req.params.id);
  const targetIndex = memorySlots.findIndex(s => s.slot_id === slotId);

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'ไม่พบช่องจัดเก็บที่ต้องการลบ' });
  }

  const targetSlot = memorySlots[targetIndex];
  if (targetSlot.is_occupied) {
    return res.status(400).json({ error: `ไม่สามารถลบช่อง ${targetSlot.slot_code} ได้เนื่องจากมีสินค้าจัดเก็บอยู่` });
  }

  memorySlots.splice(targetIndex, 1);

  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM slots WHERE slot_id = $1', [slotId]);
    } catch (e) {
      console.warn('DB Slot Delete error:', e.message);
    }
  }

  io.emit('slots_updated', memorySlots);
  res.json({ success: true, message: `ลบช่อง ${targetSlot.slot_code} สำเร็จ`, slot_id: slotId });
});

// Store-In (Inbound)
app.post('/api/store-in', async (req, res) => {
  const { qrCode, productName, slotId, category, lotNumber, operatorName, operatorRole } = req.body;
  const operator = operatorName || 'กิตติยา สแกนสต็อก';
  const role = operatorRole || 'operator';

  if (!productName || !slotId) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลสินค้าและเลือกช่องจัดเก็บ' });
  }

  const targetIndex = memorySlots.findIndex(s => s.slot_id === parseInt(slotId));
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'ไม่พบช่องจัดเก็บที่ระบุ' });
  }

  const targetSlot = memorySlots[targetIndex];
  if (targetSlot.is_occupied) {
    return res.status(400).json({ error: `ช่อง ${targetSlot.slot_code} มีสินค้าอยู่แล้ว!` });
  }

  const now = new Date().toISOString();
  memorySlots[targetIndex] = {
    ...targetSlot,
    is_occupied: true,
    product_name: productName,
    qr_code: qrCode || `QR-${Date.now()}`,
    category: category || 'General',
    lot_number: lotNumber || `LOT-${new Date().getFullYear()}-${slotId}`,
    stored_at: now,
    updated_at: now
  };

  const newTransaction = {
    id: memoryTransactions.length + 1,
    transaction_type: 'STORE_IN',
    slot_id: targetSlot.slot_id,
    slot_code: targetSlot.slot_code,
    product_name: productName,
    qr_code: qrCode || `QR-${Date.now()}`,
    category: category || 'General',
    operator_name: operator,
    operator_role: role,
    status: 'COMPLETED',
    duration_seconds: 4,
    details: `นำเข้าสินค้า ${productName} จัดเก็บที่พิกัด X:${targetSlot.x_axis}, Y:${targetSlot.y_axis}, Z:${targetSlot.z_axis}`,
    created_at: now
  };
  memoryTransactions.unshift(newTransaction);

  if (isDbConnected && pool) {
    try {
      await pool.query(
        `UPDATE slots SET is_occupied = TRUE, product_name = $1, qr_code = $2, category = $3, lot_number = $4, stored_at = NOW(), updated_at = NOW() WHERE slot_id = $5`,
        [productName, qrCode, category || 'General', lotNumber || `LOT-${slotId}`, targetSlot.slot_id]
      );
      await pool.query(
        `INSERT INTO transactions (transaction_type, slot_id, slot_code, product_name, qr_code, category, operator_name, operator_role, status, duration_seconds, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        ['STORE_IN', targetSlot.slot_id, targetSlot.slot_code, productName, qrCode, category || 'General', operator, role, 'COMPLETED', 4, newTransaction.details]
      );
    } catch (err) {}
  }

  if (simulatorActive) {
    runVirtualSimulation('STORE', targetSlot, { name: productName }, () => {
      io.emit('slots_updated', memorySlots);
      io.emit('transaction_created', newTransaction);
    });
  } else {
    io.emit('slots_updated', memorySlots);
    io.emit('transaction_created', newTransaction);
  }

  res.json({
    message: `นำเข้าสินค้า "${productName}" เข้าช่อง ${targetSlot.slot_code} เรียบร้อย`,
    slot: memorySlots[targetIndex],
    transaction: newTransaction
  });
});

// Store-Out (Retrieval)
app.post('/api/store-out', async (req, res) => {
  const { slotId, operatorName, operatorRole } = req.body;
  const operator = operatorName || 'กิตติยา สแกนสต็อก';
  const role = operatorRole || 'operator';

  const targetIndex = memorySlots.findIndex(s => s.slot_id === parseInt(slotId));
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'ไม่พบช่องจัดเก็บที่ระบุ' });
  }

  const targetSlot = memorySlots[targetIndex];
  if (!targetSlot.is_occupied) {
    return res.status(400).json({ error: `ช่อง ${targetSlot.slot_code} ว่างอยู่แล้ว` });
  }

  const removedProductName = targetSlot.product_name;
  const removedQrCode = targetSlot.qr_code;
  const removedCategory = targetSlot.category;
  const now = new Date().toISOString();

  const newTransaction = {
    id: memoryTransactions.length + 1,
    transaction_type: 'RETRIEVE_OUT',
    slot_id: targetSlot.slot_id,
    slot_code: targetSlot.slot_code,
    product_name: removedProductName,
    qr_code: removedQrCode,
    category: removedCategory,
    operator_name: operator,
    operator_role: role,
    status: 'COMPLETED',
    duration_seconds: 4,
    details: `เบิกจ่ายสินค้า ${removedProductName} จากพิกัด X:${targetSlot.x_axis}, Y:${targetSlot.y_axis}, Z:${targetSlot.z_axis} ไปยังจุดรับ`,
    created_at: now
  };
  memoryTransactions.unshift(newTransaction);

  memorySlots[targetIndex] = {
    ...targetSlot,
    is_occupied: false,
    product_name: null,
    qr_code: null,
    category: null,
    lot_number: null,
    stored_at: null,
    updated_at: now
  };

  if (isDbConnected && pool) {
    try {
      await pool.query(
        `UPDATE slots SET is_occupied = FALSE, product_name = NULL, qr_code = NULL, category = NULL, lot_number = NULL, stored_at = NULL, updated_at = NOW() WHERE slot_id = $1`,
        [targetSlot.slot_id]
      );
      await pool.query(
        `INSERT INTO transactions (transaction_type, slot_id, slot_code, product_name, qr_code, category, operator_name, operator_role, status, duration_seconds, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        ['RETRIEVE_OUT', targetSlot.slot_id, targetSlot.slot_code, removedProductName, removedQrCode, removedCategory, operator, role, 'COMPLETED', 4, newTransaction.details]
      );
    } catch (err) {}
  }

  if (simulatorActive) {
    runVirtualSimulation('RETRIEVE', targetSlot, { name: removedProductName }, () => {
      io.emit('slots_updated', memorySlots);
      io.emit('transaction_created', newTransaction);
    });
  } else {
    io.emit('slots_updated', memorySlots);
    io.emit('transaction_created', newTransaction);
  }

  res.json({
    message: `เบิกจ่ายสินค้า "${removedProductName}" จากช่อง ${targetSlot.slot_code} สำเร็จ`,
    slot: memorySlots[targetIndex],
    transaction: newTransaction
  });
});

// Transactions Logs
app.get('/api/logs', (req, res) => {
  const { type, search, limit = 100 } = req.query;
  let filtered = [...memoryTransactions];

  if (type && type !== 'ALL') {
    filtered = filtered.filter(t => t.transaction_type === type);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => 
      (t.product_name && t.product_name.toLowerCase().includes(q)) ||
      (t.slot_code && t.slot_code.toLowerCase().includes(q)) ||
      (t.qr_code && t.qr_code.toLowerCase().includes(q)) ||
      (t.operator_name && t.operator_name.toLowerCase().includes(q))
    );
  }

  res.json(filtered.slice(0, parseInt(limit)));
});

// Export CSV
app.get('/api/logs/export', (req, res) => {
  const headers = 'ID,Date Time,Transaction Type,Slot Code,Product Name,QR Code,Category,Operator,Role,Status,Details\n';
  const rows = memoryTransactions.map(t => {
    return `"${t.id}","${t.created_at}","${t.transaction_type}","${t.slot_code || ''}","${(t.product_name || '').replace(/"/g, '""')}","${t.qr_code || ''}","${t.category || ''}","${t.operator_name || ''}","${t.operator_role || ''}","${t.status || ''}","${(t.details || '').replace(/"/g, '""')}"`;
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=warehouse_transactions.csv');
  res.send('\uFEFF' + headers + rows);
});

// Clear / Purge Transactions (Admin Only)
app.delete('/api/transactions', async (req, res) => {
  memoryTransactions = [];
  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM transactions');
    } catch (e) {
      console.warn('DB delete transactions error:', e.message);
    }
  }
  io.emit('transactions_cleared');
  res.json({ success: true, message: 'ล้างประวัติธุรกรรมเรียบร้อยแล้ว' });
});

// Analytics / KPIs
app.get('/api/analytics/kpis', (req, res) => {
  const totalSlots = memorySlots.length;
  const occupiedSlots = memorySlots.filter(s => s.is_occupied).length;
  const emptySlots = totalSlots - occupiedSlots;
  const occupancyRate = totalSlots > 0 ? Number(((occupiedSlots / totalSlots) * 100).toFixed(1)) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayInbound = memoryTransactions.filter(t => t.transaction_type === 'STORE_IN' && t.created_at.startsWith(today)).length;
  const todayOutbound = memoryTransactions.filter(t => t.transaction_type === 'RETRIEVE_OUT' && t.created_at.startsWith(today)).length;

  res.json({
    totalSlots,
    occupiedSlots,
    emptySlots,
    occupancyRate,
    todayInbound: todayInbound || 4,
    todayOutbound: todayOutbound || 2,
    craneStatus: craneState.status,
    esp32HardwareConnected,
    simulatorActive
  });
});

// Manual Crane Commands
app.post('/api/asrs/command', (req, res) => {
  const { command, axis, delta } = req.body;

  if (command === 'EMERGENCY_STOP') {
    craneState.emergencyStop = true;
    craneState.status = 'EMERGENCY_STOP';
    craneState.stepDescription = '🚨 หยุดฉุกเฉิน (EMERGENCY STOP ACTIVATED)';
    if (simInterval) clearInterval(simInterval);
    io.emit('crane_telemetry', craneState);
    return res.json({ message: 'Emergency Stop Triggered', craneState });
  }

  if (command === 'RESET_ESTOP') {
    craneState.emergencyStop = false;
    craneState.status = 'IDLE';
    craneState.stepDescription = 'พร้อมทำงาน (System Reset Normal)';
    io.emit('crane_telemetry', craneState);
    return res.json({ message: 'System Reset to Normal', craneState });
  }

  if (command === 'HOME') {
    craneState.status = 'HOMING';
    craneState.currentX = 0;
    craneState.currentY = 0;
    craneState.currentZ = 0;
    craneState.stepDescription = 'กำลังรีเซ็ตเครนกลับสู่จุด Home (0, 0, 0)...';
    setTimeout(() => {
      craneState.status = 'IDLE';
      craneState.stepDescription = 'เครนอยู่ที่จุด Home พร้อมทำงาน';
      io.emit('crane_telemetry', craneState);
    }, 1500);
    io.emit('crane_telemetry', craneState);
    return res.json({ message: 'Homing Crane', craneState });
  }

  if (command === 'JOG') {
    const moveDelta = parseFloat(delta) || 1.0;
    if (axis === 'X') craneState.currentX = Math.max(0, Math.min(3, craneState.currentX + moveDelta));
    if (axis === 'Y') craneState.currentY = Math.max(0, Math.min(3, craneState.currentY + moveDelta));
    if (axis === 'Z') craneState.currentZ = Math.max(0, Math.min(2, craneState.currentZ + moveDelta));
    craneState.stepDescription = `แมนนวลปรับตำแหน่งแกน ${axis} (${moveDelta > 0 ? '+' : ''}${moveDelta})`;
    io.emit('crane_telemetry', craneState);
    return res.json({ message: `Jogged ${axis}`, craneState });
  }

  res.status(400).json({ error: 'Unknown command' });
});

// Toggle Simulator
app.post('/api/simulator/toggle', (req, res) => {
  const { active } = req.body;
  simulatorActive = typeof active === 'boolean' ? active : !simulatorActive;
  res.json({ simulatorActive, message: `ESP32 Virtual Simulator is now ${simulatorActive ? 'ENABLED' : 'DISABLED'}` });
});

// AS/RS Status
app.get('/api/asrs/status', (req, res) => {
  res.json({
    crane: craneState,
    esp32HardwareConnected,
    simulatorActive
  });
});

// Hybrid Label Generator Helper
app.post('/api/generate-hybrid-label', (req, res) => {
  const { barcode, productName, category, lot } = req.body;
  if (!barcode || !productName) {
    return res.status(400).json({ error: 'กรุณาระบุบาร์โค้ดและชื่อสินค้า' });
  }

  const payload = JSON.stringify({
    qrCode: barcode,
    name: productName,
    category: category || 'General',
    lot: lot || `LOT-${new Date().getFullYear()}`,
    ts: Date.now()
  });

  res.json({
    barcode,
    productName,
    qrData: payload
  });
});

// ==========================================
// 6. WEBSOCKET REAL-TIME CONNECTION
// ==========================================
io.on('connection', (socket) => {
  socket.emit('slots_updated', memorySlots);
  socket.emit('crane_telemetry', craneState);
  socket.emit('esp32_status', { connected: esp32HardwareConnected });
});

// ==========================================
// 7. START SERVER
// ==========================================
server.listen(PORT, () => {
  console.log(`🚀 Smart Warehouse AS/RS Backend running on port ${PORT}`);
  console.log(`📡 WebSocket Real-time Hub is active`);
  console.log(`🤖 Built-in ESP32 Hardware Simulator is READY`);
});