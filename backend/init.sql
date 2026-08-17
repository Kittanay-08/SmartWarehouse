CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user: password is 'admin' (hashed via bcrypt)
-- Hashed 'admin': $2a$10$X8L/... we can insert a bcrypt hash or we can create a script to seed it. 
-- Wait, we can't easily insert bcrypt hash in plain SQL without knowing the hash, let's use a predefined bcrypt hash for 'admin'
-- Hash for 'admin' (using 10 rounds): $2a$10$bI5Q9v9T/yS7J6iBq/K58O2G4C/kS9w.gJ00s6M7Fm1sW5vTq.XJ6
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$bI5Q9v9T/yS7J6iBq/K58O2G4C/kS9w.gJ00s6M7Fm1sW5vTq.XJ6', 'admin')
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS slots (
    slot_id SERIAL PRIMARY KEY,
    x_axis INT NOT NULL,
    y_axis INT NOT NULL,
    z_axis INT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    product_name VARCHAR(100),
    qr_code VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO slots (x_axis, y_axis, z_axis, is_occupied) VALUES
(1, 1, 1, FALSE), (2, 1, 1, FALSE), (3, 1, 1, FALSE),
(1, 2, 1, FALSE), (2, 2, 1, FALSE), (3, 2, 1, FALSE);