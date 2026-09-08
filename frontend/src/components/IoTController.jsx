import React, { useState } from 'react';
import { 
  Cpu, 
  Radio, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  AlertTriangle, 
  RotateCcw, 
  Terminal, 
  ToggleLeft, 
  ToggleRight,
  Wifi
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';

export const IoTController = () => {
  const { 
    craneState, 
    mqttStatus, 
    esp32Connected, 
    simulatorActive, 
    toggleSimulator, 
    jogCrane, 
    homeCrane, 
    emergencyStop, 
    resetEmergencyStop,
    mqttLogs 
  } = useWarehouse();

  const [jogDelta, setJogDelta] = useState(0.5);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-emerald">Hardware & Telemetry Station</span>
            <span className="badge badge-cyan">MQTT Protocol v5.0</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            ศูนย์ควบคุมฮาร์ดแวร์ IoT & มอนิเตอร์ MQTT (IoT Control Center)
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600 }}>
            ควบคุมการเคลื่อนที่ของเครน AS/RS แบบ Manual Jog, ทดสอบสัญญาณ Ping ESP32, และดูข้อมูล MQTT แบบ Real-time
          </p>
        </div>

        {/* Simulator Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.95rem', color: '#0f172a', textAlign: 'right' }}>
            <div style={{ fontWeight: 800 }}>ตัวจำลองฮาร์ดแวร์ (ESP32 Simulator)</div>
            <div style={{ fontSize: '0.85rem', color: simulatorActive ? '#059669' : '#64748b', fontWeight: 700 }}>
              {simulatorActive ? '🟢 ใช้งานโหมดจำลอง (Active)' : '⚪ โหมดฮาร์ดแวร์จริง (Real ESP32)'}
            </div>
          </div>
          <button
            onClick={toggleSimulator}
            className={`btn ${simulatorActive ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '10px 18px', fontWeight: 800 }}
          >
            {simulatorActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            {simulatorActive ? 'เปิด Simulator อยู่' : 'สลับใช้ Simulator'}
          </button>
        </div>
      </div>

      {/* Grid: Manual Jog Controller & MQTT Stream Console */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '28px'
      }}>
        {/* Left Column: Manual Crane Jog Control Pad */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={24} color="#0284c7" />
              แผงควบคุมเครน AS/RS ด้วยมือ (Manual Jog Pad)
            </h3>
            <span className={`badge ${craneState.status === 'IDLE' ? 'badge-emerald' : 'badge-amber'}`}>
              {craneState.status}
            </span>
          </div>

          {/* Current Coordinates Gauge */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ background: '#f0f7ff', padding: '14px', borderRadius: '12px', border: '1.5px solid #bae6fd' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 800 }}>แกน X (รางเลื่อน)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                {craneState.currentX.toFixed(2)} m
              </div>
            </div>
            <div style={{ background: '#f0f7ff', padding: '14px', borderRadius: '12px', border: '1.5px solid #bae6fd' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 800 }}>แกน Y (เสายก)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                {craneState.currentY.toFixed(2)} m
              </div>
            </div>
            <div style={{ background: '#f0f7ff', padding: '14px', borderRadius: '12px', border: '1.5px solid #bae6fd' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 800 }}>แกน Z (ก้ามปู)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                {craneState.forkExtended ? 'EXTEND' : 'RETRACT'}
              </div>
            </div>
          </div>

          {/* Step Size Selector */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>ระยะเลื่อนต่อครั้ง (Step Delta):</span>
            {[0.2, 0.5, 1.0].map(val => (
              <button
                key={val}
                onClick={() => setJogDelta(val)}
                className={`btn ${jogDelta === val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 800 }}
              >
                {val} m
              </button>
            ))}
          </div>

          {/* D-Pad Controller */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 90px)',
            gridTemplateRows: 'repeat(3, 80px)',
            gap: '14px',
            justifyContent: 'center',
            margin: '26px 0'
          }}>
            <div />
            <button 
              onClick={() => jogCrane('Y', jogDelta)}
              disabled={craneState.emergencyStop}
              className="btn btn-secondary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="ยกเสาขึ้น (Y+)"
            >
              <ArrowUp size={24} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Y+ (ขึ้น)</span>
            </button>
            <div />

            <button 
              onClick={() => jogCrane('X', -jogDelta)}
              disabled={craneState.emergencyStop}
              className="btn btn-secondary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="เลื่อนไปทางซ้าย (X-)"
            >
              <ArrowLeft size={24} color="#0284c7" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>X- (ซ้าย)</span>
            </button>

            <button 
              onClick={homeCrane}
              disabled={craneState.emergencyStop}
              className="btn btn-primary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="กลับสู่จุดโฮม (0, 0, 0)"
            >
              <Home size={24} />
              <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>HOME</span>
            </button>

            <button 
              onClick={() => jogCrane('X', jogDelta)}
              disabled={craneState.emergencyStop}
              className="btn btn-secondary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="เลื่อนไปทางขวา (X+)"
            >
              <ArrowRight size={24} color="#0284c7" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>X+ (ขวา)</span>
            </button>

            <div />
            <button 
              onClick={() => jogCrane('Y', -jogDelta)}
              disabled={craneState.emergencyStop}
              className="btn btn-secondary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="ลดเสาลง (Y-)"
            >
              <ArrowDown size={24} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Y- (ลง)</span>
            </button>
            <div />
          </div>

          {/* Emergency Stop Controls */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
            {craneState.emergencyStop ? (
              <button 
                onClick={resetEmergencyStop}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 900 }}
              >
                <RotateCcw size={22} /> ปลดล็อคระบบหยุดฉุกเฉิน (Reset E-Stop)
              </button>
            ) : (
              <button 
                onClick={emergencyStop}
                className="btn btn-danger"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 900 }}
              >
                <AlertTriangle size={22} /> สั่งหยุดฉุกเฉิน (EMERGENCY STOP)
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live MQTT Feed */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={24} color="#0284c7" />
              มอนิเตอร์ MQTT Live Stream
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#059669', fontWeight: 800 }}>
              <Radio size={16} /> Connected: {mqttStatus.broker}
            </div>
          </div>

          {/* MQTT Active Topics List */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem'
          }}>
            <span className="badge badge-emerald">warehouse/asrs/telemetry</span>
            <span className="badge badge-cyan">warehouse/asrs/cmd</span>
            <span className="badge badge-purple">warehouse/esp32/ping</span>
          </div>

          {/* Terminal Console */}
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            height: '410px',
            overflowY: 'auto',
            border: '1.5px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {mqttLogs.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '140px', fontWeight: 700, fontSize: '1rem' }}>
                กำลังรอรับข้อความ MQTT Message Payload...
              </div>
            ) : (
              mqttLogs.map((log, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 800 }}>
                    <span>[{log.topic}]</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#f8fafc', wordBreak: 'break-all', marginTop: '4px', fontWeight: 600 }}>
                    {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
