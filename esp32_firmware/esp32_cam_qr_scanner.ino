/**
 * ==============================================================================
 * SMART WAREHOUSE AS/RS - ESP32-CAM QR CODE & BARCODE SCANNER FIRMWARE
 * ==============================================================================
 * อุปกรณ์: บอร์ด ESP32-CAM (AI-Thinker Module with OV2640 Camera)
 * ฟังก์ชันการทำงาน:
 *  1. เปิดเลนส์กล้อง OV2640 สแกน QR Code และบาร์โค้ดสินค้าแบบ Real-time
 *  2. เชื่อมต่อ Wi-Fi และส่งผลการสแกนผ่าน MQTT Broker เข้าสู่ระบบคลังสินค้า
 *  3. ระบบ Debounce ป้องกันการสแกนซ้ำซ้อนของกล่องเดิมในระยะเวลาสั้น
 *  4. กะพริบไฟ LED สีแดง/ไฟแฟลช แจ้งเตือนเมื่อสแกนสินค้าสำเร็จ
 *  5. ส่ง Heartbeat Ping แจ้งสถานะ Online ไปยังหน้าเว็บแดชบอร์ดอัตโนมัติ
 * 
 * ไลบรารีที่จำเป็นใน Arduino IDE (Library Manager):
 *  - ESP32QRCodeReader by Álvaro Viebrantz (ค้นหา: ESP32QRCodeReader)
 *  - PubSubClient by Nick O'Leary (สำหรับ MQTT)
 *  - ArduinoJson by Benoit Blanchon (เวอร์ชัน 6 หรือ 7)
 * 
 * การตั้งค่าใน Arduino IDE:
 *  - Board: AI Thinker ESP32-CAM
 *  - Partition Scheme: Huge APP (3MB No OTA/1MB SPIFFS) *** จำเป็นต้องเลือก ***
 *  - Upload Speed: 115200
 * ==============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32QRCodeReader.h>

// --- 1. การตั้งค่าเครือข่าย Wi-Fi & MQTT BROKER ---
// กรุณาเปลี่ยนชื่อ Wi-Fi และรหัสผ่านให้ตรงกับเร้าเตอร์ที่ใช้งาน
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// IP Address ของเครื่องคอมพิวเตอร์ที่รันระบบ Smart Warehouse (Mosquitto MQTT)
// ตรวจสอบ IP เครื่องคอมได้จากคำสั่ง 'ipconfig' ใน Command Prompt (เช่น 192.168.1.50)
const char* MQTT_SERVER   = "192.168.1.100";
const int   MQTT_PORT     = 1883;

// MQTT Topics สำหรับระบบ Smart Warehouse
const char* TOPIC_QR_SCANNED = "warehouse/asrs/qr_scanned"; // ผลการสแกน QR Code
const char* TOPIC_PING       = "warehouse/esp32/ping";       // Heartbeat แจ้งสถานะ Online

// --- 2. กำหนดขา LED และโมดูลกล้อง ---
// ESP32-CAM AI-Thinker: 
// ขา 33 = Onboard Red LED (Active LOW)
// ขา 4  = Onboard High-Power Flash LED
#define PIN_STATUS_LED 33
#define PIN_FLASH_LED  4

// ประกาศอ็อบเจกต์กล้อง AI-Thinker
ESP32QRCodeReader reader(CAMERA_MODEL_AI_THINKER);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ตัวแปรสำหรับป้องกันการสแกนซ้ำ (Debounce)
String lastScannedCode = "";
unsigned long lastScanTime = 0;
const unsigned long RESCAN_DELAY_MS = 3000; // รอ 3 วินาทีก่อนจะสแกนโค้ดเดิมซ้ำได้

// ตัวแปรส่ง Ping
unsigned long lastPingTime = 0;

// ฟังก์ชันกะพริบไฟ LED แจ้งเตือนเมื่อสแกนติด
void flashSuccess() {
  digitalWrite(PIN_STATUS_LED, LOW);  // เปิดไฟ LED สีแดง (Active LOW)
  delay(100);
  digitalWrite(PIN_STATUS_LED, HIGH); // ปิดไฟ
}

// ฟังก์ชันเชื่อมต่อ Wi-Fi
void setupWiFi() {
  Serial.println();
  Serial.print("🌐 กำลังเชื่อมต่อ Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ เชื่อมต่อ Wi-Fi สำเร็จ!");
    Serial.print("📍 IP Address ของ ESP32-CAM: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ เชื่อมต่อ Wi-Fi ล้มเหลว โปรดตรวจสอบ SSID และ Password");
  }
}

// ฟังก์ชันเชื่อมต่อ MQTT Broker
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("📡 กำลังเชื่อมต่อไปยัง MQTT Broker (");
    Serial.print(MQTT_SERVER);
    Serial.print(")...");

    String clientId = "ESP32_CAM_" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" สำเร็จ!");

      // ส่งข้อความแจ้งระบบว่ากล้องพร้อมทำงาน
      StaticJsonDocument<200> doc;
      doc["device"] = "ESP32_CAM_SCANNER";
      doc["status"] = "ONLINE";
      doc["ip"] = WiFi.localIP().toString();
      char buf[256];
      serializeJson(doc, buf);
      mqttClient.publish(TOPIC_PING, buf);

    } else {
      Serial.print(" ล้มเหลว (rc=");
      Serial.print(mqttClient.state());
      Serial.println(") จะลองใหม่ใน 3 วินาที...");
      delay(3000);
    }
  }
}

// Task สแกน QR Code (รันบน Core 1 แยกอิสระเพื่อความลื่นไหล)
void onQrCodeTask(void *pvParameters) {
  struct QRCodeData qrCodeData;

  while (true) {
    if (reader.receiveQrCode(&qrCodeData, 100)) {
      if (qrCodeData.valid) {
        String scannedText = String((const char *)qrCodeData.payload);
        scannedText.trim();

        // ตรวจสอบ Debounce ป้องกันการยิงซ้ำรัวๆ
        unsigned long now = millis();
        if (scannedText != lastScannedCode || (now - lastScanTime > RESCAN_DELAY_MS)) {
          lastScannedCode = scannedText;
          lastScanTime = now;

          Serial.println("\n=================================");
          Serial.print("📷 สแกนพบ QR Code: ");
          Serial.println(scannedText);
          Serial.println("=================================");

          // กะพริบไฟ LED แสดงสถานะ
          flashSuccess();

          // ส่งข้อมูลผ่าน MQTT ไปยังระบบคลังสินค้า
          if (mqttClient.connected()) {
            StaticJsonDocument<256> doc;
            doc["device"] = "ESP32_CAM_SCANNER";
            doc["scanned_qr"] = scannedText;
            doc["timestamp"] = now;

            char jsonBuffer[256];
            serializeJson(doc, jsonBuffer);

            bool success = mqttClient.publish(TOPIC_QR_SCANNED, jsonBuffer);
            if (success) {
              Serial.println("📤 ส่งข้อมูลไปยัง Smart Warehouse สำเร็จ!");
            } else {
              Serial.println("⚠️ ส่งข้อมูล MQTT ไม่สำเร็จ");
            }
          } else {
            Serial.println("⚠️ ไม่ได้เชื่อมต่อ MQTT ไม่สามารถส่งข้อมูลได้");
          }
        }
      }
    }
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n==============================================");
  Serial.println(" SMART WAREHOUSE - ESP32-CAM SCANNER STARTING ");
  Serial.println("==============================================");

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_FLASH_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, HIGH); // ปิดไฟ (Active LOW)
  digitalWrite(PIN_FLASH_LED, LOW);   // ปิดไฟแฟลช

  // 1. เชื่อมต่อ Wi-Fi
  setupWiFi();

  // 2. กำหนดค่า MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  // 3. เริ่มต้นระบบกล้องและ QR Reader
  Serial.println("📷 กำลังตั้งค่ากล้อง OV2640...");
  reader.setup();
  reader.beginOnCore(1); // ประมวลผลภาพบน CPU Core 1
  Serial.println("✅ ระบบกล้องและ QR Decoder พร้อมทำงานบน Core 1");

  // 4. สร้าง FreeRTOS Task สำหรับตรวจจับ QR Code
  xTaskCreate(
    onQrCodeTask,
    "onQrCodeTask",
    4 * 1024,
    NULL,
    4,
    NULL
  );

  Serial.println("🚀 นำ QR Code หรือบาร์โค้ดมาจ่อหน้าเลนส์กล้องได้เลย...");
}

void loop() {
  // รักษาสถานะการเชื่อมต่อ Wi-Fi และ MQTT
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // ส่ง Heartbeat Ping ไปยังหน้าแดชบอร์ดทุกๆ 5 วินาที
  if (millis() - lastPingTime > 5000) {
    lastPingTime = millis();
    StaticJsonDocument<200> pingDoc;
    pingDoc["device"] = "ESP32_CAM_SCANNER";
    pingDoc["uptime_s"] = millis() / 1000;
    pingDoc["status"] = "ONLINE";
    pingDoc["ip"] = WiFi.localIP().toString();

    char pingBuf[256];
    serializeJson(pingDoc, pingBuf);
    mqttClient.publish(TOPIC_PING, pingBuf);
  }

  delay(10);
}
