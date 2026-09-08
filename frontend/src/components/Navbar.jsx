import React, { useState } from 'react';
import { 
  Boxes, 
  Box,
  LayoutDashboard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Cpu, 
  FileCode2, 
  User, 
  AlertTriangle,
  Radio,
  Wifi,
  Activity,
  LogOut,
  X,
  Check,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, setIsLoginModalOpen, setIsProfileModalOpen, getDepartmentInfo, canControlHardware, canPerformOutbound } = useAuth();
  const { mqttStatus, esp32Connected, craneState, emergencyStop, resetEmergencyStop } = useWarehouse();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;
  const isSafetyAdmin = canControlHardware ? canControlHardware(user) : true;
  const isOutboundAllowed = canPerformOutbound ? canPerformOutbound(user) : true;

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'store-in', label: 'นำเข้าสินค้า & ผังชั้นวาง', icon: ArrowDownToLine },
    { id: 'store-out', label: 'เบิกจ่ายสินค้า', icon: ArrowUpFromLine },
    { id: 'history', label: 'ประวัติบันทึก', icon: History },
  ];

  const handlePerformLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('asrs_user');
    localStorage.removeItem('role');
    logout();
    window.location.href = '/login?logout=true';
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1.5px solid #bae6fd',
      boxShadow: '0 4px 15px rgba(2, 132, 199, 0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Top Telemetry & Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #e0f2fe',
        fontSize: '0.95rem',
        background: '#f8fafc'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}>
            <Boxes size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.02em', color: '#0f172a' }}>
              SMART WAREHOUSE AS/RS  
            </div>
          </div>
        </div>

        {/* Live Hardware Telemetry Pills & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* MQTT Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: mqttStatus.connected ? '#dcfce7' : '#fee2e2',
            border: `1.5px solid ${mqttStatus.connected ? '#86efac' : '#fecdd3'}`,
            color: mqttStatus.connected ? '#15803d' : '#b91c1c',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            <Radio size={15} />
            <span>MQTT: {mqttStatus.connected ? 'ONLINE' : 'DISCONNECTED'}</span>
          </div>

          {/* ESP32 Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: esp32Connected ? '#e0f2fe' : '#fef3c7',
            border: `1.5px solid ${esp32Connected ? '#7dd3fc' : '#fde68a'}`,
            color: esp32Connected ? '#0369a1' : '#b45309',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            <Wifi size={15} />
            <span>ESP32: {esp32Connected ? 'READY' : 'STANDBY'}</span>
          </div>

          {/* Crane Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: craneState.status === 'EMERGENCY_STOP' 
              ? '#fee2e2' 
              : craneState.status === 'IDLE' 
              ? '#dcfce7' 
              : '#fef3c7',
            border: `1.5px solid ${craneState.status === 'EMERGENCY_STOP' ? '#fecdd3' : craneState.status === 'IDLE' ? '#86efac' : '#fde68a'}`,
            color: craneState.status === 'EMERGENCY_STOP' ? '#b91c1c' : craneState.status === 'IDLE' ? '#15803d' : '#b45309',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            <Activity size={15} />
            <span>CRANE: {craneState.status}</span>
          </div>

          {/* Emergency Stop Button */}
          {craneState.emergencyStop ? (
            isSafetyAdmin ? (
              <button 
                onClick={resetEmergencyStop}
                className="btn btn-primary"
                style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800 }}
              >
                🔄 ปลดล็อค E-Stop
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => alert(`สิทธิ์การใช้งานของ [${deptInfo?.name || 'พนักงานปฏิบัติการ'}]: เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่มีสิทธิ์ปลดล็อคระบบฉุกเฉิน E-Stop`)}
                className="btn btn-secondary"
                style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800, background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }}
                title="เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่ปลดล็อคได้"
              >
                🔒 E-Stop ค้าง (จำกัดสิทธิ์)
              </button>
            )
          ) : (
            <button 
              onClick={emergencyStop}
              className="btn btn-danger"
              style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800, animation: craneState.status !== 'IDLE' ? 'pulse-ring 2s infinite' : 'none' }}
              title="กดหยุดการทำงานของเครน AS/RS ฉุกเฉินทันที"
            >
              <AlertTriangle size={15} /> E-STOP
            </button>
          )}

          {/* User Profile Badge (Click to Edit Profile) */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: '#f0f7ff',
              border: '1.5px solid #bae6fd',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
            }}
            title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว"
          >
            <span style={{ fontSize: '1.35rem' }}>{user?.avatar || '👨‍💼'}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{user?.name || 'ผู้ใช้งาน'}</span>
                <Edit3 size={12} color="#0284c7" />
              </div>
              <div style={{ fontSize: '0.72rem', color: deptInfo?.color || '#0284c7', fontWeight: 800 }}>
                {deptInfo?.badge || user?.roleLabel || user?.role || 'OPERATOR'}
              </div>
            </div>
          </div>

          {/* Switch Account Button */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.85rem', fontWeight: 800 }}
            title="สลับบัญชีผู้ใช้งาน"
          >
            <User size={15} /> สลับบัญชี
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="btn btn-outline"
            style={{
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderColor: '#fca5a5',
              color: '#dc2626 !important',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="ออกจากระบบ"
          >
            <LogOut size={15} color="#dc2626" />
            <span>ออก</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 20px',
        overflowX: 'auto',
        background: '#ffffff'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: isActive 
                  ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' 
                  : 'transparent',
                color: isActive ? '#0369a1' : '#334155',
                fontWeight: isActive ? 800 : 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent'
              }}
            >
              <Icon size={20} color={isActive ? '#0284c7' : '#64748b'} />
              <span>{item.label}</span>
              {item.id === 'store-out' && !isOutboundAllowed && (
                <span style={{
                  fontSize: '0.7rem',
                  background: '#faf5ff',
                  border: '1px solid #d8b4fe',
                  color: '#7c3aed',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  🔒 ดูอย่างเดียว
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '430px',
            width: '100%',
            padding: '34px',
            background: '#ffffff',
            border: '2px solid #fecdd3',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '18px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              marginBottom: '18px'
            }}>
              <LogOut size={38} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
              ยืนยันการออกจากระบบ?
            </h3>
            <p style={{ fontSize: '1.05rem', color: '#334155', marginBottom: '26px', fontWeight: 600 }}>
              คุณต้องการออกจากระบบและกลับสู่หน้าเข้าสู่ระบบใช่หรือไม่?
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '13px', fontSize: '1rem', fontWeight: 700 }}
              >
                <X size={20} /> ยกเลิก
              </button>
              <button
                onClick={handlePerformLogout}
                className="btn btn-danger"
                style={{ flex: 1, padding: '13px', fontSize: '1rem', fontWeight: 700 }}
              >
                <Check size={20} /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
