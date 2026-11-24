#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ESP32QRCodeReader.h>

// ใส่ชื่อและรหัสผ่าน Wi-Fi ของคุณ
const char* ssid = "vivo Y35";
const char* password = "00000000";

// --- ข้อมูล Server ของเว็บ Smart Warehouse ---
const String scanServerUrl = "https://warehouse.ceksu.site/api/esp32/scan";
const String frameServerUrl = "https://warehouse.ceksu.site/api/esp32/frame";

// Onboard Flash LED (GPIO 4 บน AI-Thinker ESP32-CAM)
#define FLASH_LED_PIN 4

// บอร์ด AI Thinker ESP32-CAM (ใช้ Core 1 สำหรับประมวลผลกล้อง & QR)
ESP32QRCodeReader reader(CAMERA_MODEL_AI_THINKER);
struct QRCodeData qrCodeData;

// Local Web Server (Port 80)
WebServer localServer(80);

// Queue สำหรับส่ง QR Code ขึ้น Cloud แบบ Non-blocking
QueueHandle_t qrSendQueue = NULL;

// Multipart MJPEG Boundary
const char* STREAM_BOUNDARY = "123456789000000000000987654321";

// Task บน Core 0 สำหรับส่งข้อมูลและภาพขึ้น Cloud
void cloudUploadTask(void *pvParameters) {
  WiFiClientSecure frameClient;
  frameClient.setInsecure();
  frameClient.setTimeout(1200);

  HTTPClient httpFrame;
  httpFrame.setReuse(true); // ใช้ HTTP Keep-Alive ป้องกันการทำ TLS Handshake ซ้ำๆ
  bool frameConnected = false;

  unsigned long lastFrameSend = 0;
  const unsigned long CLOUD_FPS_INTERVAL = 250; // ส่งขึ้น Cloud ทุกๆ 250ms (~4 FPS ลื่นไหล)

  while (true) {
    if (WiFi.status() == WL_CONNECTED) {
      // 1. ตรวจสอบว่ามี QR Code ที่ต้องส่งขึ้น Cloud หรือไม่ (Priority สูงสุด)
      char pendingQr[512];
      if (qrSendQueue != NULL && xQueueReceive(qrSendQueue, &pendingQr, 0) == pdTRUE) {
        WiFiClientSecure scanClient;
        scanClient.setInsecure();
        scanClient.setTimeout(2500);

        HTTPClient httpScan;
        if (httpScan.begin(scanClient, scanServerUrl)) {
          httpScan.addHeader("Content-Type", "application/x-www-form-urlencoded");
          String payload = "qrcode_data=" + String(pendingQr);
          int code = httpScan.POST(payload);
          Serial.printf("📡 QR Sent to Cloud: [%s] -> Code %d\n", pendingQr, code);
          httpScan.end();
        }
      }

      // 2. ส่งเฟรมภาพสดขึ้น Cloud แบบต่อเนื่อง
      unsigned long now = millis();
      if (now - lastFrameSend >= CLOUD_FPS_INTERVAL) {
        lastFrameSend = now;
        uint8_t *jpgBuf = NULL;
        size_t jpgLen = 0;

        if (reader.getLatestJpeg(&jpgBuf, &jpgLen)) {
          if (jpgBuf && jpgLen > 0) {
            if (!frameConnected) {
              frameConnected = httpFrame.begin(frameClient, frameServerUrl);
              httpFrame.addHeader("Content-Type", "image/jpeg");
              httpFrame.addHeader("Connection", "keep-alive");
            }

            if (frameConnected) {
              int res = httpFrame.POST(jpgBuf, jpgLen);
              if (res <= 0) {
                // Connection หลุด ให้เริ่มใหม่รอบหน้า
                httpFrame.end();
                frameConnected = false;
              }
            }
          }
          free(jpgBuf);
        }
      }
    } else {
      frameConnected = false;
    }

    vTaskDelay(15 / portTICK_PERIOD_MS);
  }
}

// MJPEG Stream Handler สำหรับดูภาพสดแบบเรียลไทม์ 15-20 FPS ผ่าน Local Network
void handleMjpegStream() {
  WiFiClient client = localServer.client();
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=" + String(STREAM_BOUNDARY) + "\r\n";
  response += "Access-Control-Allow-Origin: *\r\n\r\n";
  client.print(response);

  while (client.connected()) {
    uint8_t *jpgBuf = NULL;
    size_t jpgLen = 0;
    if (reader.getLatestJpeg(&jpgBuf, &jpgLen)) {
      client.printf("--%s\r\n", STREAM_BOUNDARY);
      client.print("Content-Type: image/jpeg\r\n");
      client.printf("Content-Length: %d\r\n\r\n", jpgLen);
      client.write((const char *)jpgBuf, jpgLen);
      client.print("\r\n");
      free(jpgBuf);
    }
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

// Handler สำหรับดึงภาพเดี่ยวผ่าน Local IP (http://<IP>/cam.jpg)
void handleCamJpg() {
  uint8_t *jpgBuf = NULL;
  size_t jpgLen = 0;
  if (reader.getLatestJpeg(&jpgBuf, &jpgLen)) {
    localServer.sendHeader("Access-Control-Allow-Origin", "*");
    localServer.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    localServer.send_P(200, "image/jpeg", (const char *)jpgBuf, jpgLen);
    free(jpgBuf);
  } else {
    localServer.send(503, "text/plain", "Busy");
  }
}

// Handler เปิด/ปิด ไฟแฟลช LED (http://<IP>/flash?state=1 หรือ 0)
void handleFlash() {
  if (localServer.hasArg("state")) {
    int state = localServer.arg("state").toInt();
    digitalWrite(FLASH_LED_PIN, state ? HIGH : LOW);
    localServer.sendHeader("Access-Control-Allow-Origin", "*");
    localServer.send(200, "text/plain", state ? "FLASH ON" : "FLASH OFF");
  } else {
    localServer.send(400, "text/plain", "Missing state param");
  }
}

// Handler สำหรับหน้าแรก (http://<IP>/)
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>ESP32-CAM Smart Warehouse</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:system-ui,-apple-system,sans-serif;text-align:center;background:#090d16;color:#fff;padding:20px;}";
  html += "img{max-width:100%;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.6);border:2px solid #38bdf8;}";
  html += ".badge{display:inline-block;padding:6px 18px;border-radius:20px;background:#10b981;font-weight:800;margin:12px;letter-spacing:1px;}";
  html += ".btn{padding:8px 16px;margin:5px;border-radius:8px;border:none;background:#0284c7;color:#fff;font-weight:700;cursor:pointer;}";
  html += "</style></head><body>";
  html += "<h2>📷 ESP32-CAM High-Speed Scanner</h2>";
  html += "<div class='badge'>🟢 ONLINE ULTRA FAST</div>";
  html += "<p style='color:#94a3b8;'>IP Address: <b style='color:#38bdf8;'>" + WiFi.localIP().toString() + "</b></p>";
  html += "<div style='margin-bottom:15px;'>";
  html += "<button class='btn' onclick='fetch(\"/flash?state=1\")'>💡 เปิดไฟแฟลช</button>";
  html += "<button class='btn' style='background:#475569;' onclick='fetch(\"/flash?state=0\")'>🌑 ปิดไฟแฟลช</button>";
  html += "</div>";
  html += "<img src='/stream' />";
  html += "</body></html>";
  localServer.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n🚀 Booting Ultra-Fast ESP32-CAM QR Scanner...");

  // กำหนดขาไฟแฟลช
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  // สร้าง Queue สำหรับพักข้อมูล QR Code
  qrSendQueue = xQueueCreate(10, 512);

  // 1. เชื่อมต่อ WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // 2. ตั้งค่ากล้อง (ตั้งค่าความคมชัดสูงและ Contrast สำหรับสแกน QR)
  reader.setup();
  Serial.println("Setup QRCode Reader finished.");

  // 3. เริ่มต้นงานประมวลผลภาพและสแกน QR บน Core 1 แบบ 100%
  reader.beginOnCore(1);
  Serial.println("Started scanning on Core 1 (Dedicated)...");

  // 4. เริ่มต้น Local Web Server (Port 80)
  localServer.on("/", handleRoot);
  localServer.on("/cam.jpg", handleCamJpg);
  localServer.on("/stream", handleMjpegStream);
  localServer.on("/flash", handleFlash);
  localServer.enableCORS(true);
  localServer.begin();
  Serial.println("Local HTTP server: http://" + WiFi.localIP().toString() + "/");

  // 5. แยกงานส่งภาพและข้อมูลขึ้น Cloud ไปรันบน Core 0 แบบ Non-blocking
  xTaskCreatePinnedToCore(
    cloudUploadTask,
    "cloudUpload",
    8192,
    NULL,
    1,
    NULL,
    0 // Core 0
  );
  Serial.println("Cloud streaming task started on Core 0.");
}

void loop() {
  localServer.handleClient();

  // ตรวจสอบ QR Code (บน Core 1 ทำงานเร็วมาก ไม่มีอะไรบล็อก)
  if (reader.receiveQrCode(&qrCodeData, 50)) {
    if (qrCodeData.valid) {
      String qrPayload = (const char *)qrCodeData.payload;
      Serial.println("============================");
      Serial.print("🎯 QR Code Detected: ");
      Serial.println(qrPayload);

      // ใส่ข้อมูลลงใน Queue เพื่อให้ Core 0 ส่งขึ้น Cloud ทันที
      char buf[512];
      strncpy(buf, qrPayload.c_str(), sizeof(buf) - 1);
      buf[sizeof(buf) - 1] = '\0';
      if (qrSendQueue != NULL) {
        xQueueSend(qrSendQueue, &buf, 0);
      }

      // ไฟกระพริบยืนยันสแกนสำเร็จ
      digitalWrite(FLASH_LED_PIN, HIGH);
      delay(80);
      digitalWrite(FLASH_LED_PIN, LOW);

      // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ยิงรหัสเดิมซ้ำซ้อน
      delay(1500);
    }
  }

  vTaskDelay(5 / portTICK_PERIOD_MS);
}
