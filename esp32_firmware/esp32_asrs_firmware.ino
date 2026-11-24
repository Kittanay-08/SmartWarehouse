/**
 * ==============================================================================
 * SMART WAREHOUSE AS/RS - ESP32 IOT FIRMWARE (C++ ARDUINO)
 * ==============================================================================
 * Features:
 *  - Wi-Fi & REST/WebSocket Telemetry Engine
 *  - AS/RS 3-Axis Stepper Motor Control (X-Axis, Y-Axis, Z-Fork Extension)
 *  - Limit Switch Endstop Homing & Calibration
 *  - 2D QR Barcode Scanner (Hardware Serial2: GM65 / Barcode Engine)
 *  - Realtime Telemetry Telecasting & Heartbeat Ping to Web Dashboard
 *  - Emergency Stop Handling
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- 1. NETWORK & TELEMETRY CONFIGURATION ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST   = "http://192.168.1.100:5000"; // Backend API host

// Telemetry Endpoints
const char* API_TELEMETRY = "http://192.168.1.100:5000/api/asrs/telemetry";
const char* API_PING      = "http://192.168.1.100:5000/api/asrs/ping";
const char* API_QR        = "http://192.168.1.100:5000/api/asrs/scan";

WiFiClient espClient;

// --- 2. STEPPER MOTOR PINOUTS (A4988 / DRV8825 / TMC2209) ---
// X-Axis (Horizontal Carriage)
#define PIN_STEP_X    18
#define PIN_DIR_X     19
#define PIN_LIMIT_X   34

// Y-Axis (Vertical Lifter / Mast)
#define PIN_STEP_Y    21
#define PIN_DIR_Y     22
#define PIN_LIMIT_Y   35

// Z-Axis (Fork In/Out Mechanism)
#define PIN_STEP_Z    25
#define PIN_DIR_Z     26
#define PIN_LIMIT_Z   32

// Gripper / Relay / Status LED
#define PIN_STATUS_LED 2
#define PIN_ESTOP_BTN  4

// Hardware Serial for QR Scanner Module (GM65: RX=16, TX=17)
#define RXD2 16
#define TXD2 17

// --- 3. GLOBAL VARIABLES ---
float currentX = 0.0;
float currentY = 0.0;
float currentZ = 0.0;
bool isEmergencyStop = false;
bool hasPayload = false;
unsigned long lastPingTime = 0;

// Coordinate Steps Multiplier (Adjust according to pulley/leadscrew pitch)
const int STEPS_PER_UNIT_X = 1000;
const int STEPS_PER_UNIT_Y = 1000;
const int STEPS_PER_UNIT_Z = 500;

// Function Prototypes
void setupWiFi();
void moveMotor(int stepPin, int dirPin, int steps, bool dir, int speedDelay);
void moveToCoordinates(float targetX, float targetY, float targetZ);
void extendFork();
void retractFork();
void homeAllAxes();
void publishTelemetry(const char* statusStr, const char* desc);

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2); // QR Code Scanner

  pinMode(PIN_STEP_X, OUTPUT);
  pinMode(PIN_DIR_X, OUTPUT);
  pinMode(PIN_LIMIT_X, INPUT_PULLUP);

  pinMode(PIN_STEP_Y, OUTPUT);
  pinMode(PIN_DIR_Y, OUTPUT);
  pinMode(PIN_LIMIT_Y, INPUT_PULLUP);

  pinMode(PIN_STEP_Z, OUTPUT);
  pinMode(PIN_DIR_Z, OUTPUT);
  pinMode(PIN_LIMIT_Z, INPUT_PULLUP);

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_ESTOP_BTN, INPUT_PULLUP);

  digitalWrite(PIN_STATUS_LED, HIGH);

  Serial.println("\n🚀 Initializing Smart Warehouse AS/RS ESP32 Master Node...");
  setupWiFi();

  publishTelemetry("ONLINE", "ESP32 AS/RS Master Online via REST API");
  homeAllAxes();
}

void loop() {
  // Read QR Scanner Serial Data
  if (Serial2.available()) {
    String scannedQR = Serial2.readStringUntil('\n');
    scannedQR.trim();
    if (scannedQR.length() > 0) {
      Serial.print("📷 Scanned QR Code: ");
      Serial.println(scannedQR);

      // Post QR scan event to Backend API
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(API_QR);
        http.addHeader("Content-Type", "application/json");
        StaticJsonDocument<200> doc;
        doc["device"] = "ESP32_ASRS_MASTER";
        doc["scanned_qr"] = scannedQR;
        doc["timestamp"] = millis();
        char buffer[256];
        serializeJson(doc, buffer);
        http.POST(buffer);
        http.end();
      }
    }
  }

  // Periodic Telemetry / Heartbeat Ping (Every 5 seconds)
  if (millis() - lastPingTime > 5000) {
    lastPingTime = millis();
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(API_PING);
      http.addHeader("Content-Type", "application/json");
      StaticJsonDocument<200> pingDoc;
      pingDoc["device"] = "ESP32_ASRS_MASTER";
      pingDoc["uptime_s"] = millis() / 1000;
      pingDoc["status"] = isEmergencyStop ? "EMERGENCY_STOP" : "ONLINE";
      pingDoc["x"] = currentX;
      pingDoc["y"] = currentY;
      pingDoc["z"] = currentZ;
      char pingBuf[256];
      serializeJson(pingDoc, pingBuf);
      http.POST(pingBuf);
      http.end();
    }
  }
}

// --- 4. STEPPER MOTOR PRIMITIVES ---
void moveMotor(int stepPin, int dirPin, int steps, bool dir, int speedDelay = 800) {
  if (isEmergencyStop) return;
  digitalWrite(dirPin, dir ? HIGH : LOW);
  for (int i = 0; i < steps; i++) {
    if (digitalRead(PIN_ESTOP_BTN) == LOW) {
      isEmergencyStop = true;
      Serial.println("🚨 EMERGENCY STOP PRESSED!");
      publishTelemetry("EMERGENCY_STOP", "Emergency Stop Triggered");
      return;
    }
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(speedDelay);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(speedDelay);
  }
}

void homeAllAxes() {
  Serial.println("🏠 Homing all axes...");
  publishTelemetry("HOMING", "Calibrating AS/RS Home position");

  // Home Z (Retract fork first for safety)
  while (digitalRead(PIN_LIMIT_Z) == HIGH && !isEmergencyStop) {
    moveMotor(PIN_STEP_Z, PIN_DIR_Z, 10, false, 600);
  }
  currentZ = 0.0;

  // Home Y
  while (digitalRead(PIN_LIMIT_Y) == HIGH && !isEmergencyStop) {
    moveMotor(PIN_STEP_Y, PIN_DIR_Y, 10, false, 600);
  }
  currentY = 0.0;

  // Home X
  while (digitalRead(PIN_LIMIT_X) == HIGH && !isEmergencyStop) {
    moveMotor(PIN_STEP_X, PIN_DIR_X, 10, false, 600);
  }
  currentX = 0.0;

  publishTelemetry("IDLE", "Crane at Home position (0, 0, 0)");
  Serial.println("✅ Homing Complete.");
}

void moveToCoordinates(float targetX, float targetY, float targetZ) {
  float deltaX = targetX - currentX;
  float deltaY = targetY - currentY;
  float deltaZ = targetZ - currentZ;

  int stepsX = abs(deltaX * STEPS_PER_UNIT_X);
  int stepsY = abs(deltaY * STEPS_PER_UNIT_Y);
  int stepsZ = abs(deltaZ * STEPS_PER_UNIT_Z);

  publishTelemetry("MOVING", "Moving to target slot coordinates");

  // Move X and Y concurrently or sequentially
  if (stepsX > 0) moveMotor(PIN_STEP_X, PIN_DIR_X, stepsX, deltaX > 0);
  currentX = targetX;

  if (stepsY > 0) moveMotor(PIN_STEP_Y, PIN_DIR_Y, stepsY, deltaY > 0);
  currentY = targetY;

  if (stepsZ > 0) moveMotor(PIN_STEP_Z, PIN_DIR_Z, stepsZ, deltaZ > 0);
  currentZ = targetZ;
}

void extendFork() {
  Serial.println("👉 Extending Fork...");
  moveMotor(PIN_STEP_Z, PIN_DIR_Z, 500, true, 800);
}

void retractFork() {
  Serial.println("👈 Retracting Fork...");
  moveMotor(PIN_STEP_Z, PIN_DIR_Z, 500, false, 800);
}

// --- 5. MQTT CALLBACK DISPATCHER ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("📨 MQTT Message Received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.println("❌ JSON Parse Failed");
    return;
  }

  const char* cmd = doc["cmd"];
  if (!cmd) return;

  if (strcmp(cmd, "STORE") == 0) {
    float x = doc["x"] | 1.0;
    float y = doc["y"] | 1.0;
    float z = doc["z"] | 1.0;
    const char* product = doc["product"] | "Unknown";

    Serial.printf("📥 Storing Product: %s to Slot (X:%.1f, Y:%.1f, Z:%.1f)\n", product, x, y, z);
    
    // Sequence: Pick from Inbound -> Move to Rack Slot -> Place -> Retract -> Return Home
    hasPayload = true;
    moveToCoordinates(x, y, z);
    extendFork();
    delay(500);
    hasPayload = false;
    retractFork();
    homeAllAxes();

    publishTelemetry("IDLE", "Store-In Operation Completed");
  } 
  else if (strcmp(cmd, "RETRIEVE") == 0) {
    float x = doc["x"] | 1.0;
    float y = doc["y"] | 1.0;
    float z = doc["z"] | 1.0;

    Serial.printf("📤 Retrieving Product from Slot (X:%.1f, Y:%.1f, Z:%.1f)\n", x, y, z);

    // Sequence: Move to Slot -> Extend Fork -> Pick -> Retract -> Move to Outbound Delivery Bay -> Release
    moveToCoordinates(x, y, z);
    extendFork();
    delay(500);
    hasPayload = true;
    retractFork();
    moveToCoordinates(0.0, 0.0, 0.0); // Delivery bay
    hasPayload = false;

    publishTelemetry("IDLE", "Retrieve-Out Operation Completed");
  }
  else if (strcmp(cmd, "HOME") == 0) {
    homeAllAxes();
  }
  else if (strcmp(cmd, "ESTOP") == 0) {
    isEmergencyStop = true;
    publishTelemetry("EMERGENCY_STOP", "🚨 Emergency Stop Activated via Web UI");
  }
  else if (strcmp(cmd, "RESET") == 0) {
    isEmergencyStop = false;
    publishTelemetry("IDLE", "System Reset to Normal");
  }
}

void publishTelemetry(const char* statusStr, const char* desc) {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<300> doc;
  doc["status"] = statusStr;
  doc["currentX"] = currentX;
  doc["currentY"] = currentY;
  doc["currentZ"] = currentZ;
  doc["hasPayload"] = hasPayload;
  doc["emergencyStop"] = isEmergencyStop;
  doc["stepDescription"] = desc;
  doc["timestamp"] = millis();

  char buffer[350];
  serializeJson(doc, buffer);

  HTTPClient http;
  http.begin(API_TELEMETRY);
  http.addHeader("Content-Type", "application/json");
  http.POST(buffer);
  http.end();
}

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected. IP: " + WiFi.localIP().toString());
}
