CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    avatar VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Accounts (Password: 123456)
INSERT INTO users (employee_id, username, password, role, email, full_name, avatar) VALUES
('EMP001', 'admin', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Admin', 'admin@smartwarehouse.io', 'สมชาย จัดการคลัง', '👨‍💼'),
('EMP002', 'operator', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Operator', 'operator@smartwarehouse.io', 'กิตติยา สแกนสต็อก', '👩‍🔧'),
('EMP003', 'engineer', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Engineer', 'engineer@smartwarehouse.io', 'วิศวกร ซ่อมบำรุง', '🧑‍💻')
ON CONFLICT (username) DO UPDATE 
SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, avatar = EXCLUDED.avatar;

CREATE TABLE IF NOT EXISTS slots (
    slot_id SERIAL PRIMARY KEY,
    slot_code VARCHAR(20) NOT NULL,
    rack VARCHAR(10) DEFAULT 'A',
    level INT NOT NULL,
    bay INT NOT NULL,
    x_axis INT NOT NULL,
    y_axis INT NOT NULL,
    z_axis INT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    product_name VARCHAR(100),
    qr_code VARCHAR(100),
    category VARCHAR(50),
    weight_kg NUMERIC(5,2) DEFAULT 0,
    lot_number VARCHAR(50),
    stored_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard AS/RS 9-Slot Matrix (3 Levels x 3 Bays = 9 Slots)
INSERT INTO slots (slot_code, rack, level, bay, x_axis, y_axis, z_axis, is_occupied, product_name, qr_code, category, weight_kg, lot_number, stored_at) VALUES
('A-01-01', 'A', 1, 1, 1, 1, 1, TRUE, 'น้ำดื่มคริสตัล 600ml (Pack 12)', '8851950001015', 'Beverages', 7.5, 'LOT-2026-A101', NOW() - INTERVAL '2 days'),
('A-01-02', 'A', 1, 2, 2, 1, 1, FALSE, NULL, NULL, NULL, 0, NULL, NULL),
('A-01-03', 'A', 1, 3, 3, 1, 1, TRUE, 'ชิปประมวลผลไมโครคอนโทรลเลอร์ ESP32-WROOM', '8850029381023', 'Electronics', 0.8, 'LOT-2026-E402', NOW() - INTERVAL '1 day'),
('A-02-01', 'A', 2, 1, 1, 2, 1, FALSE, NULL, NULL, NULL, 0, NULL, NULL),
('A-02-02', 'A', 2, 2, 2, 2, 1, TRUE, 'ขนมมันฝรั่งทอดกรอบ เลย์ รสคลาสสิค 75g', '8850718801129', 'Snacks', 1.2, 'LOT-2026-S110', NOW() - INTERVAL '5 hours'),
('A-02-03', 'A', 2, 3, 3, 2, 1, FALSE, NULL, NULL, NULL, 0, NULL, NULL),
('A-03-01', 'A', 3, 1, 1, 3, 1, TRUE, 'เซอร์โวมอเตอร์อุตสาหกรรม NEMA 17 Stepper', '8859948123019', 'Parts', 2.4, 'LOT-2026-P881', NOW() - INTERVAL '12 hours'),
('A-03-02', 'A', 3, 2, 2, 3, 1, FALSE, NULL, NULL, NULL, 0, NULL, NULL),
('A-03-03', 'A', 3, 3, 3, 3, 1, FALSE, NULL, NULL, NULL, 0, NULL, NULL)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    slot_id INT,
    slot_code VARCHAR(20),
    product_name VARCHAR(100),
    qr_code VARCHAR(100),
    category VARCHAR(50),
    operator_name VARCHAR(100),
    operator_role VARCHAR(50),
    status VARCHAR(50),
    duration_seconds INT DEFAULT 0,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Audit Trail Sample Transactions
INSERT INTO transactions (transaction_type, slot_id, slot_code, product_name, qr_code, category, operator_name, operator_role, status, duration_seconds, details, created_at) VALUES
('STORE_IN', 1, 'A-01-01', 'น้ำดื่มคริสตัล 600ml (Pack 12)', '8851950001015', 'Beverages', 'กิตติยา สแกนสต็อก', 'operator', 'COMPLETED', 4, 'สแกน QR Code นำเข้าชั้นวางสำเร็จ', NOW() - INTERVAL '2 days'),
('STORE_IN', 3, 'A-01-03', 'ชิปประมวลผลไมโครคอนโทรลเลอร์ ESP32-WROOM', '8850029381023', 'Electronics', 'สมชาย จัดการคลัง', 'admin', 'COMPLETED', 3, 'รับสินค้าจาก Vendor IoT', NOW() - INTERVAL '1 day'),
('STORE_IN', 5, 'A-02-02', 'ขนมมันฝรั่งทอดกรอบ เลย์ รสคลาสสิค 75g', '8850718801129', 'Snacks', 'กิตติยา สแกนสต็อก', 'operator', 'COMPLETED', 4, 'เติมสินค้าเข้าคลังอัจฉริยะ', NOW() - INTERVAL '5 hours'),
('STORE_IN', 7, 'A-03-01', 'เซอร์โวมอเตอร์อุตสาหกรรม NEMA 17 Stepper', '8859948123019', 'Parts', 'วิศวกร ซ่อมบำรุง', 'engineer', 'COMPLETED', 3, 'จัดเก็บอะไหล่สำรองซ่อมบำรุง', NOW() - INTERVAL '12 hours');
