ทำอะไรไปบ้าง 

1. นำระบบและฟังก์ชัน 3D ออกทั้งหมด (Complete 3D Removal)
App.jsx
:
ลบ Route เส้นทาง URL /3d ออก
ลบการ Import Standalone3DPage ออกจากระบบ Routing
Dashboard.jsx
:
ลบ State selectedProductFor3D และฟังก์ชัน handleViewProduct3D
ลบแท็บแสดงผล product-3d และการ Import Product3DViewer
Navbar.jsx
:
ลบปุ่มไอคอน 3 ขีด (Hamburger Menu ☰) และเมนู Slide-out Drawer ที่มุมบนขวา
ลบแท็บ "ผังชั้นวาง 3D" ออกจากแถบเมนูด้านบน คงเหลือเฉพาะแท็บมาตรฐาน (แดชบอร์ด, นำเข้าสินค้า & ผังชั้นวาง, เบิกจ่ายสินค้า, ประวัติบันทึก)
DashboardOverview.jsx
:
ลบปุ่ม "ผังชั้นวาง 3D" ที่อยู่ด้านขวาบนของหน้าแดชบอร์ดออก
นำ Property onViewProduct3D ออก
StoreOutPanel.jsx
:
ลบปุ่ม "ดู 3D" ออกจากการ์ดแสดงรายการสินค้าในช่องแต่ละช่อง
ลบไฟล์ Component 3D ออกจากโปรเจกต์:
ลบไฟล์ frontend/src/components/Standalone3DPage.jsx
ลบไฟล์ frontend/src/components/Product3DViewer.jsx
2. ผลลัพธ์และประสิทธิภาพของระบบ
ขนาดเว็บเล็กลงและโหลดเร็วขึ้น: เนื่องจากไม่มีการดึงไลบรารี Three.js เข้ามาในหน้าเว็บ ทำให้ขนาด JavaScript Bundle ลดลงจาก 1,367 kB เหลือเพียง 832 kB (ลดลงไปกว่า 40%)
ความเสถียรของระบบหลัก: ระบบนำเข้าสินค้า (Store-In), ผังชั้นวางแบบ 2D, เบิกจ่ายสินค้า (Store-Out), สิทธิ์ผู้ใช้งาน (RBAC), เซ็นเซอร์ฮาร์ดแวร์ (ESP32/WebSocket/เครน AS/RS) และฐานข้อมูล ยังคงทำงานได้ครบถ้วนสมบูรณ์ 100%
3. การ Build และ Deploy ขึ้นระบบจริง
Rebuild Docker Image: คอมไพล์และสร้าง Docker Image ของ Frontend ใหม่เสร็จสมบูรณ์
Restart Container: อัปเดตและเริ่มการทำงานคอนเทนเนอร์ asrs_frontend ใหม่ (ทดสอบแล้วตอบสนอง HTTP 200 OK)
Docker Hub: แท็กและพุช Image เวอร์ชันคลีนล่าสุดขึ้น Docker Hub เรียบร้อยแล้ว:
kittanay/smartwarehouse-frontend:latest

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

1. **Digital Twin & 3D/2D Matrix Visualization:**
   - แสดงผลสถานะคลังสินค้า 9 ช่อง (3x3 Matrix) แบบเรียลไทม์
2. **ระบบนำเข้าและเบิกจ่ายสินค้า (Store-In / Retrieve-Out):**
   - รองรับการสแกน Barcode / QR Code ผ่านกล้องเว็บแคม หรือเครื่องอ่านบาร์โค้ด
   - ระบบค้นหาและแนะนำช่องเก็บสินค้าที่ว่างอัตโนมัติ (Smart Slot Allocation)
   - เครื่องมือสร้างและพิมพ์ฉลาก QR Code (Label Maker)
3. **การควบคุมฮาร์ดแวร์ & IoT Telemetry:**
   - ควบคุมการเคลื่อนที่ของเครน 3 แกน (X, Y, Z) แบบ Manual และ Auto
   - เชื่อมต่อบอร์ด ESP32 ผ่าน Real-time WebSocket & REST Telemetry API
   - ระบบ Homing, Endstop Calibration, และ Emergency Stop (E-Stop)
4. **ระบบความปลอดภัยและการจัดการสิทธิ์ (Role-Based Access):**
   - **Admin:** ดูภาพรวม Dashboard สถิติ สต็อกสินค้า และประวัติทั้งหมด
   - **Operator:** สแกนรับสินค้าเข้า และจัดจ่ายสินค้าออก
   - **Engineer:** เข้าโหมด Manual ควบคุมแกนมอเตอร์ X, Y, Z และทดสอบระบบ
5. **เก็บบันทึกประวัติการทำงาน (Audit Trail):**
   - บันทึกทุกธุรกรรมการนำเข้า/เบิกจ่าย พร้อมเวลา ผู้ปฏิบัติงาน และระยะเวลาที่ใช้

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
                       +-------------------------------+
                       |  Web Browser / Mobile Client  |
                       |      (React 18 + Vite)        |
                       +---------------+---------------+
                                       |
                     HTTP REST / WS    | (Port 80 / 5000)
                                       v
                       +---------------+---------------+
                       |      Backend API Server       |
                       |    (Node.js + Socket.IO)      |
                       +-------+---------------+-------+
                               |               |
                   Postgres    |               | Real-time Telemetry
                   (Port 5432) |               | (HTTP REST / WebSocket)
                               v               v
             +--------------------+     +--------------------+
             | PostgreSQL 15 DB   |     | ESP32 AS/RS Crane  |
             | (asrs_db)          |     | Stepper Motors X,Y,Z|
             +--------------------+     | GM65 QR Scanner    |
                                        +--------------------+
```

---

## 💻 Tech Stack & เครื่องมือที่ใช้

| ส่วนประกอบ | เทคโนโลยี / ไลบรารี |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons, Socket.IO Client, Axios, HTML5-QRCode, QRCode.react |
| **Backend** | Node.js, Express.js, Socket.IO, PostgreSQL Client (`pg`), JWT, Bcrypt |
| **Database** | PostgreSQL 15 Alpine |
| **DevOps** | Docker, Docker Compose, Nginx, Cloudflare Tunnel (`cloudflared`) |

---

## 📋 สิ่งที่ต้องติดตั้งในเครื่อง (Prerequisites)

ก่อนเริ่มรันโปรเจกต์ ตรวจสอบว่าเครื่องมีโปรแกรมดังนี้:
1. **[Git](https://git-scm.com/)**
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (เปิดใช้งาน WSL2 backend บน Windows)

*(หากต้องการแก้ไขโค้ดโดยตรง แนะนำติดตั้ง [Node.js v18+](https://nodejs.org/) และ [VS Code](https://code.visualstudio.com/))*

---

## 🚀 วิธีเปิดใช้งานผ่าน Docker (สำหรับเครื่องเพื่อน / เครื่องใหม่)

### ขั้นตอนที่ 1: Clone Repository
เปิด Terminal (หรือ PowerShell) แล้วรันคำสั่ง:
```bash
git clone https://github.com/Kittanay-08/SmartWarehouse.git
cd SmartWarehouse
```

### ขั้นตอนที่ 2: สั่งรัน Docker Containers
สั่ง Build และ Start คอนเทนเนอร์ทั้งหมดขึ้นมาทำงานพร้อมกัน:
```bash
docker-compose up -d --build
```

### ขั้นตอนที่ 3: ตรวจสอบสถานะการทำงาน
```bash
docker ps
```
คุณควรจะเห็น Container เหล่านี้ทำงานอยู่ในสถานะ `Up`:
* `asrs_frontend` (Port 80)
* `asrs_backend` (Port 5000)
* `asrs_db` (Port 5432)
* `asrs_tunnel` (Cloudflare Tunnel)

### ขั้นตอนที่ 4: เข้าใช้งานระบบ
เปิด Web Browser แล้วเข้าไปที่:
* **Frontend Web App:** [http://localhost](http://localhost) (หรือ `http://localhost:80`)
* **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 บัญชีผู้ใช้เริ่มต้น (Default Login Credentials)

รหัสผ่านเริ่มต้นของทุกบัญชีคือ: **`123456`**

| บทบาท (Role) | Username | Password | สิทธิ์การใช้งาน |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `123456` | สิทธิ์สูงสุด ควบคุมและดูทุกเมนู |
| **Operator** | `operator` | `123456` | สแกนรับสินค้า (Store In) และเบิกจ่าย (Store Out) |
| **Engineer** | `engineer` | `123456` | โหมด Manual ควบคุมแกนมอเตอร์ X, Y, Z |

---

## 🔌 พอร์ตสำคัญของระบบ (Port Mapping)

| Service | Port ภายนอก (Host) | Port ภายใน (Container) | หน้าที่ |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | `80` | `80` | หน้าเว็บ React UI (Nginx) |
| **Backend API** | `5000` | `5000` | REST API & WebSockets |
| **PostgreSQL DB** | `5432` | `5432` | ฐานข้อมูลคลังสินค้า |

---

## 🤖 การตั้งค่าบอร์ด ESP32 (Firmware Setup)

ไฟล์เฟิร์มแวร์อยู่ที่ `esp32_firmware/esp32_asrs_firmware.ino`

1. เปิดไฟล์ด้วย **Arduino IDE**
2. ติดตั้ง Library ที่จำเป็น:
   - `ArduinoJson` โดย Benoit Blanchon
   - `HTTPClient` (มีมาพร้อมกับ ESP32 Board package อยู่แล้ว)
3. ตั้งค่า Wi-Fi และ IP ของเครื่องคอมพิวเตอร์ Server:
   ```cpp
   const char* WIFI_SSID     = "ชื่อไวไฟของคุณ";
   const char* WIFI_PASSWORD = "รหัสผ่านไวไฟ";
   const char* SERVER_HOST   = "http://192.168.1.XXX:5000"; // ใส่ IP เครื่อง Server ที่รัน Backend
   ```
4. อัปโหลดลงบอร์ด ESP32

---

## 🛠️ คำสั่งที่มีประโยชน์ในการดูแลระบบ (Useful Commands)

```bash
# ดู Log การทำงานแบบ Realtime ของทั้งระบบ
docker-compose logs -f

# ดู Log เฉพาะ Backend
docker-compose logs -f backend

# สั่งหยุดการทำงานทั้งหมด
docker-compose stop

# สั่งเริ่มการทำงานใหม่
docker-compose start

# สั่งปิดระบบและลบ Container
docker-compose down

# สั่งปิดระบบและล้าง Volume ฐานข้อมูลเพื่อเริ่มใหม่ทั้งหมด (ระวังข้อมูลหาย)
docker-compose down -v
```
