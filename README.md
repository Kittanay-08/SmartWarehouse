[ลิ้งเข้าหน้าเว็บ Smartwarehouse](https://warehouse.ceksu.site/)



ทำอะไรไปบ้าง 

ผังสถาปัตยกรรม: frontend คุยกับ backend ผ่าน HTTP REST และ WebSocket (port 80 / 5000) และ backend ต่อฐานข้อมูลที่ port 5432 ส่วนบอร์ด ESP32 ส่งข้อมูลเข้า backend ผ่าน REST หรือ WebSocket

Tech Stack: ฝั่ง frontend ใช้ Socket.IO Client กับ Axios ฝั่ง backend ใช้ Express กับ Socket.IO และฝั่ง DevOps ใช้ Docker, Nginx และ Cloudflare Tunnel (cloudflared)

ตาราง Port Mapping: frontend 80, backend 5000 (REST API และ WebSocket), PostgreSQL 5432

วิธีรัน Docker: บอกให้เช็กว่ามี container 4 ตัว รวมถึง asrs_tunnel (Cloudflare Tunnel) และให้เข้าเว็บที่ http://localhost ส่วน health check ที่ http://localhost:5000/api/health

ตั้งค่า ESP32: ให้ใส่ชื่อ Wi-Fi และ IP เครื่อง server เช่น http://192.168.1.XXX:5000

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
