CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Accounts (Password: 123456)
INSERT INTO users (employee_id, username, password, role) VALUES
('EMP001', 'admin', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Admin'),
('EMP002', 'operator', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Operator'),
('EMP003', 'engineer', '$2a$10$9wH1wBvD3j0U/4lR3F1gQuY8X1zG7R0gE0gJ0qK7uA5fU0z2yE6.S', 'Engineer')
ON CONFLICT (username) DO NOTHING;

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

-- Exactly 9 Slots (3 Levels x 3 Bays = 9 Slots)
INSERT INTO slots (slot_code, rack, level, bay, x_axis, y_axis, z_axis, is_occupied) VALUES
('A-01-01', 'A', 1, 1, 1, 1, 1, FALSE),
('A-01-02', 'A', 1, 2, 2, 1, 1, FALSE),
('A-01-03', 'A', 1, 3, 3, 1, 1, FALSE),
('A-02-01', 'A', 2, 1, 1, 2, 1, FALSE),
('A-02-02', 'A', 2, 2, 2, 2, 1, FALSE),
('A-02-03', 'A', 2, 3, 3, 2, 1, FALSE),
('A-03-01', 'A', 3, 1, 1, 3, 1, FALSE),
('A-03-02', 'A', 3, 2, 2, 3, 1, FALSE),
('A-03-03', 'A', 3, 3, 3, 3, 1, FALSE);

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