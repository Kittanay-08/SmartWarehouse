const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access Denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission Denied: Insufficient role' });
    }
    next();
  };
};

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [username, hashedPassword, role || 'user']
    );
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.get('/api/slots', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM slots ORDER BY slot_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("🔴 DB ERROR DETECTED:", err.message); // สั่งพิมพ์ Error ออกมา
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/slots', authenticateToken, authorizeRole('admin', 'teacher'), async (req, res) => {
  const { x_axis, y_axis, z_axis } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO slots (x_axis, y_axis, z_axis, is_occupied) VALUES ($1, $2, $3, FALSE) RETURNING *',
      [x_axis, y_axis, z_axis]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/slots/:id', authenticateToken, authorizeRole('admin', 'teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM slots WHERE slot_id = $1', [id]);
    res.json({ message: 'Slot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store-in', authenticateToken, async (req, res) => {
  const { qrCode, productName, slotId } = req.body;
  try {
    await pool.query(
      'UPDATE slots SET is_occupied = TRUE, product_name = $1, qr_code = $2, updated_at = NOW() WHERE slot_id = $3',
      [productName, qrCode, slotId]
    );
    res.json({ message: 'Store-In Successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store-out', authenticateToken, async (req, res) => {
  const { slotId } = req.body;
  try {
    await pool.query(
      'UPDATE slots SET is_occupied = FALSE, product_name = NULL, qr_code = NULL, updated_at = NOW() WHERE slot_id = $1',
      [slotId]
    );
    res.json({ message: 'Store-Out Successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

// 📌 API สำหรับสร้าง Hybrid Label (Barcode + QR Code JSON)
app.post('/api/generate-hybrid-label', authenticateToken, async (req, res) => {
  const { barcode, productName } = req.body;
  if (!barcode || !productName) {
    return res.status(400).json({ error: 'กรุณาระบุบาร์โค้ดและชื่อสินค้า' });
  }

  // สร้าง payload JSON ที่รวมทั้งบาร์โค้ดและชื่อสินค้า
  const payload = JSON.stringify({
    qrCode: barcode,  // รหัสสินค้า
    name: productName // ชื่อสินค้า
  });

  try {
    res.json({
      barcode: barcode,
      productName: productName,
      qrData: payload
    });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง Hybrid Label' });
  }
});