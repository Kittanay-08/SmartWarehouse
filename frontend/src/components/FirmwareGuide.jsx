import React, { useState } from 'react';
import { 
  FileCode2, 
  Cpu, 
  Copy, 
  Check, 
  Layers, 
  Zap, 
  Download, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const FirmwareGuide = () => {
  const [copied, setCopied] = useState(false);

  const pinouts = [
    { peripheral: 'X-Axis Stepper Driver (A4988)', stepPin: 'GPIO 18', dirPin: 'GPIO 19', enablePin: 'GPIO 21', note: 'ควบคุมการเคลื่อนที่แกน X (แนวนอน/ความยาวชั้นวาง)' },
    { peripheral: 'Y-Axis Stepper Driver (A4988)', stepPin: 'GPIO 22', dirPin: 'GPIO 23', enablePin: 'GPIO 21', note: 'ควบคุมการเคลื่อนที่แกน Y (แนวตั้ง/ความสูงชั้นวาง)' },
    { peripheral: 'Z-Axis Telescopic Fork (A4988)', stepPin: 'GPIO 25', dirPin: 'GPIO 26', enablePin: 'GPIO 21', note: 'ควบคุมการยืด-หดก้ามปูดึงกล่องสินค้า (แกน Z)' },
    { peripheral: 'X-Axis Home Limit Switch', stepPin: 'GPIO 32 (PULLUP)', dirPin: '-', enablePin: '-', note: 'สวิตช์ตรวจจับจุดเริ่มต้นแกน X' },
    { peripheral: 'Y-Axis Home Limit Switch', stepPin: 'GPIO 33 (PULLUP)', dirPin: '-', enablePin: '-', note: 'สวิตช์ตรวจจับจุดเริ่มต้นแกน Y' },
    { peripheral: 'Z-Axis Home Limit Switch', stepPin: 'GPIO 34 (PULLUP)', dirPin: '-', enablePin: '-', note: 'สวิตช์ตรวจจับจุดเริ่มต้นแกน Z' },
    { peripheral: 'Emergency Stop (E-Stop)', stepPin: 'GPIO 35 (PULLUP)', dirPin: '-', enablePin: '-', note: 'ปุ่มหยุดฉุกเฉินระดับฮาร์ดแวร์ (Active LOW)' },
    { peripheral: 'GM65 Barcode / QR Scanner', stepPin: 'RX2: GPIO 16', dirPin: 'TX2: GPIO 17', enablePin: '-', note: 'โมดูลสแกนเนอร์บาร์โค้ดผ่าน UART Serial 9600' }
  ];

  const firmwareCodeSnippet = `/*
 * ESP32 Smart Warehouse AS/RS Firmware
 * MQTT Protocol + Step-Interpolation Driver + QR Scanner
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <HardwareSerial.h>

const char* ssid        = "YOUR_WIFI_SSID";
const char* password    = "YOUR_WIFI_PASSWORD";
const char* mqtt_broker = "192.168.1.100";
const int   mqtt_port   = 1883;

// Pin Definitions
#define PIN_STEP_X  18
#define PIN_DIR_X   19
#define PIN_STEP_Y  22
#define PIN_DIR_Y   23
#define PIN_STEP_Z  25
#define PIN_DIR_Z   26
#define PIN_ENABLE  21

#define PIN_LIMIT_X 32
#define PIN_LIMIT_Y 33
#define PIN_LIMIT_Z 34
#define PIN_ESTOP   35

WiFiClient espClient;
PubSubClient client(espClient);
HardwareSerial qrSerial(2); // UART2 (RX: 16, TX: 17)

void setup() {
  Serial.begin(115200);
  qrSerial.begin(9600, SERIAL_8N1, 16, 17);
  
  pinMode(PIN_STEP_X, OUTPUT);
  pinMode(PIN_DIR_X, OUTPUT);
  pinMode(PIN_STEP_Y, OUTPUT);
  pinMode(PIN_DIR_Y, OUTPUT);
  pinMode(PIN_STEP_Z, OUTPUT);
  pinMode(PIN_DIR_Z, OUTPUT);
  pinMode(PIN_ENABLE, OUTPUT);
  
  pinMode(PIN_LIMIT_X, INPUT_PULLUP);
  pinMode(PIN_LIMIT_Y, INPUT_PULLUP);
  pinMode(PIN_LIMIT_Z, INPUT_PULLUP);
  pinMode(PIN_ESTOP, INPUT_PULLUP);

  connectWiFi();
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();
  
  // Check E-Stop button
  if (digitalRead(PIN_ESTOP) == LOW) {
    client.publish("warehouse/asrs/telemetry", "{\\"status\\":\\"EMERGENCY_STOP\\"}");
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(firmwareCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-cyan">ESP32 C++ Architecture</span>
            <span className="badge badge-emerald">Hardware Schematics</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            คู่มือการต่อวงจรและเฟิร์มแวร์ ESP32 (Hardware & Firmware Guide)
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600 }}>
            เอกสารกำหนดขาพิน (Pinout Map) สำหรับบอร์ด ESP32, A4988 Stepper Drivers, GM65 QR Scanner และโค้ด Arduino C++
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-primary"
          style={{ padding: '13px 24px', fontSize: '1rem', fontWeight: 800 }}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
          {copied ? 'คัดลอกโค้ดสำเร็จ' : 'คัดลอกซอร์สโค้ด ESP32'}
        </button>
      </div>

      {/* Pinout Table Card */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={24} color="#0284c7" />
          ตารางการเชื่อมต่อขาพินฮาร์ดแวร์ (ESP32 GPIO Pinout Table)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                <th style={{ padding: '14px 18px', fontWeight: 800 }}>อุปกรณ์ / เซนเซอร์</th>
                <th style={{ padding: '14px 18px', fontWeight: 800 }}>ขา Step / Signal</th>
                <th style={{ padding: '14px 18px', fontWeight: 800 }}>ขา Direction</th>
                <th style={{ padding: '14px 18px', fontWeight: 800 }}>ขา Enable</th>
                <th style={{ padding: '14px 18px', fontWeight: 800 }}>หน้าที่การทำงานในระบบ AS/RS</th>
              </tr>
            </thead>
            <tbody>
              {pinouts.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                    {p.peripheral}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 800 }}>
                    {p.stepPin}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#334155', fontWeight: 700 }}>
                    {p.dirPin}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#334155', fontWeight: 700 }}>
                    {p.enablePin}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 600 }}>
                    {p.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* C++ Code Snippet Box */}
      <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode2 size={24} color="#059669" />
            ซอร์สโค้ดภาษา C++ สำหรับแฟลชลง ESP32 (`esp32_asrs_firmware.ino`)
          </h3>
          <span className="badge badge-emerald">Arduino IDE Ready</span>
        </div>

        <pre style={{
          background: '#0f172a',
          padding: '22px',
          borderRadius: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          color: '#38bdf8',
          overflowX: 'auto',
          lineHeight: 1.65,
          border: '1.5px solid #334155',
          fontWeight: 700
        }}>
          {firmwareCodeSnippet}
        </pre>
      </div>
    </div>
  );
};
