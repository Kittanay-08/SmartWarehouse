import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  AlertTriangle, 
  RotateCcw, 
  ToggleLeft, 
  ToggleRight,
  Wifi
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { Crane3DSimulator } from './Crane3DSimulator';

export const IoTController = () => {
  const { 
    craneState, 
    esp32Connected, 
    simulatorActive, 
    toggleSimulator, 
    jogCrane, 
    homeCrane, 
    emergencyStop, 
    resetEmergencyStop
  } = useWarehouse();

  const [jogDelta, setJogDelta] = useState(0.5);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-emerald">Hardware & Telemetry Station</span>
            <span className="badge badge-cyan">AS/RS Hardware Telemetry</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ศูนย์ควบคุม IoT & เครน AS/RS
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 600 }}>
            ควบคุมการเคลื่อนที่ของเครน AS/RS แบบ Manual Jog, ทดสอบสัญญาณ Ping ESP32, และดูข้อมูลสถานะการทำงานแบบ Real-time
          </p>
        </div>

        {/* Simulator Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>จำลองฮาร์ดแวร์ ESP32</div>
            <div style={{ fontSize: '0.85rem', color: simulatorActive ? '#059669' : 'var(--text-dim)', fontWeight: 700 }}>
              {simulatorActive ? '🟢 โหมดจำลอง' : '⚪ ฮาร์ดแวร์จริง'}
            </div>
          </div>
          <button
            onClick={toggleSimulator}
            className={`btn ${simulatorActive ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '10px 18px', fontWeight: 600 }}
          >
            {simulatorActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            {simulatorActive ? 'เปิด Simulator อยู่' : 'สลับใช้ Simulator'}
          </button>
        </div>
      </div>

      {/* Grid: Manual Jog Controller & 3D Simulator */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Manual Crane Jog Control Pad */}
        <div className="glass-panel" style={{ padding: '28px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={24} color="var(--accent-sky)" />
              แผงควบคุมเครน AS/RS
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
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>แกน X (รางเลื่อน)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>
                {craneState.currentX.toFixed(2)} m
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>แกน Y (เสายก)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                {craneState.currentY.toFixed(2)} m
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>แกน Z (ก้ามปู)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                {craneState.forkExtended ? 'EXTEND' : 'RETRACT'}
              </div>
            </div>
          </div>

          {/* Step Size Selector */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>ระยะเลื่อนต่อครั้ง:</span>
            {[0.2, 0.5, 1.0].map(val => (
              <button
                key={val}
                onClick={() => setJogDelta(val)}
                className={`btn ${jogDelta === val ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600 }}
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Y+ (ขึ้น)</span>
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>X- (ซ้าย)</span>
            </button>

            <button 
              onClick={homeCrane}
              disabled={craneState.emergencyStop}
              className="btn btn-primary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="กลับสู่จุดโฮม (0, 0, 0)"
            >
              <Home size={24} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>HOME</span>
            </button>

            <button 
              onClick={() => jogCrane('X', jogDelta)}
              disabled={craneState.emergencyStop}
              className="btn btn-secondary" 
              style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
              title="เลื่อนไปทางขวา (X+)"
            >
              <ArrowRight size={24} color="#0284c7" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>X+ (ขวา)</span>
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Y- (ลง)</span>
            </button>
            <div />
          </div>

          {/* Emergency Stop Controls */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
            {craneState.emergencyStop ? (
              <button 
                onClick={resetEmergencyStop}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 700 }}
              >
                <RotateCcw size={22} /> ปลดล็อคระบบหยุดฉุกเฉิน
              </button>
            ) : (
              <button 
                onClick={emergencyStop}
                className="btn btn-danger"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 700 }}
              >
                <AlertTriangle size={22} /> สั่งหยุดฉุกเฉิน
              </button>
            )}
          </div>
        </div>

        {/* Right Column: 3D Crane & Rack Simulator */}
        <Crane3DSimulator />
      </div>
    </div>
  );
};
