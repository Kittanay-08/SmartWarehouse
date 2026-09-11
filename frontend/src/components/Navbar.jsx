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
  Edit3,
  Menu,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, setIsLoginModalOpen, setIsProfileModalOpen, getDepartmentInfo, canControlHardware, canPerformOutbound } = useAuth();
  const { mqttStatus, esp32Connected, craneState, emergencyStop, resetEmergencyStop } = useWarehouse();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* UNIFIED HEADER (คอมพิวเตอร์และโทรศัพท์เหมือนกัน) */}
      <div className="unified-nav-header">
        {/* Row 1: Brand Title (วงสีแดง - เอาตัวหนังสือขึ้นด้านบน) + Hamburger 3 ขีด Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#ffffff'
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)'
            }}>
              <Boxes size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.08rem', letterSpacing: '0.02em', color: '#0f172a', lineHeight: 1.2 }}>
                SMART WAREHOUSE AS/RS
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                ระบบคลังสินค้าอัตโนมัติ
              </div>
            </div>
          </div>

          {/* 3-Lines Hamburger Button (ปุ่ม 3 ขีด) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #7dd3fc',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0284c7',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)'
            }}
            title="เปิดเมนู 3 ขีด"
          >
            <Menu size={22} color="#0284c7" />
            <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>เมนู</span>
          </button>
        </div>

        {/* Row 2: Telemetry Status Pills (วงสีรุ้ง - เอาไว้ใต้ตัวหนังสือ) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px 10px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          borderBottom: '1px solid #e0f2fe',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          whiteSpace: 'nowrap'
        }}>
          {/* MQTT Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '16px',
            background: mqttStatus.connected ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${mqttStatus.connected ? '#86efac' : '#fecdd3'}`,
            color: mqttStatus.connected ? '#15803d' : '#b91c1c',
            fontWeight: 800,
            fontSize: '0.78rem',
            flexShrink: 0
          }}>
            <Radio size={13} />
            <span>MQTT: {mqttStatus.connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* ESP32 Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '16px',
            background: esp32Connected ? '#e0f2fe' : '#fef3c7',
            border: `1px solid ${esp32Connected ? '#7dd3fc' : '#fde68a'}`,
            color: esp32Connected ? '#0369a1' : '#b45309',
            fontWeight: 800,
            fontSize: '0.78rem',
            flexShrink: 0
          }}>
            <Wifi size={13} />
            <span>ESP32: {esp32Connected ? 'READY' : 'STANDBY'}</span>
          </div>

          {/* Crane Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '16px',
            background: craneState.status === 'EMERGENCY_STOP' ? '#fee2e2' : craneState.status === 'IDLE' ? '#dcfce7' : '#fef3c7',
            border: `1px solid ${craneState.status === 'EMERGENCY_STOP' ? '#fecdd3' : craneState.status === 'IDLE' ? '#86efac' : '#fde68a'}`,
            color: craneState.status === 'EMERGENCY_STOP' ? '#b91c1c' : craneState.status === 'IDLE' ? '#15803d' : '#b45309',
            fontWeight: 800,
            fontSize: '0.78rem',
            flexShrink: 0
          }}>
            <Activity size={13} />
            <span>CRANE: {craneState.status}</span>
          </div>

          {/* E-Stop Button */}
          {craneState.emergencyStop ? (
            isSafetyAdmin ? (
              <button 
                onClick={resetEmergencyStop}
                className="btn btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 800, borderRadius: '16px', flexShrink: 0 }}
              >
                🔄 ปลดล็อค E-Stop
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 800, background: '#fee2e2', padding: '5px 11px', borderRadius: '16px', border: '1px solid #fecdd3', flexShrink: 0 }}>
                🔒 E-Stop ค้าง
              </span>
            )
          ) : (
            <button 
              onClick={emergencyStop}
              className="btn btn-danger"
              style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 800, borderRadius: '16px', flexShrink: 0 }}
              title="กดหยุดฉุกเฉิน"
            >
              <AlertTriangle size={13} /> E-STOP
            </button>
          )}
        </div>
      </div>



      {/* 4. MOBILE 3-LINES HAMBURGER DRAWER MENU (วงสีเหลืองทั้งหมด) */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1.5px solid #e0f2fe',
              background: '#f8fafc'
            }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={20} color="#0284c7" />
                <span>เมนูหลัก & ผู้ใช้งาน</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* User Profile Card (จากวงสีเหลือง) */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
                }}
                title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว"
              >
                <span style={{ fontSize: '2.2rem' }}>{user?.avatar || '👨‍💼'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{user?.name || 'ผู้ใช้งาน'}</span>
                    <Edit3 size={13} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: deptInfo?.color || '#0284c7', fontWeight: 800, marginTop: '2px' }}>
                    {deptInfo?.badge || user?.roleLabel || user?.role || 'OPERATOR'}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs List (จากวงสีเหลือง) */}
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                เลือกหน้าการทำงาน (Navigation)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '13px 16px',
                        borderRadius: '12px',
                        border: isActive ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: isActive 
                          ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' 
                          : '#ffffff',
                        color: isActive ? '#0369a1' : '#0f172a',
                        fontWeight: isActive ? 900 : 700,
                        fontSize: '0.98rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 3px 10px rgba(2, 132, 199, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={20} color={isActive ? '#0284c7' : '#64748b'} />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'store-out' && !isOutboundAllowed && (
                        <span style={{ fontSize: '0.7rem', color: '#7c3aed', background: '#faf5ff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #d8b4fe' }}>
                          🔒 ดูอย่างเดียว
                        </span>
                      )}
                      <ChevronRight size={18} color={isActive ? '#0284c7' : '#cbd5e1'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Actions Section (สลับบัญชี & ออกจากระบบ จากวงสีเหลือง) */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800, justifyContent: 'center' }}
              >
                <User size={17} /> สลับบัญชีผู้ใช้งาน
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  borderColor: '#fca5a5',
                  color: '#dc2626 !important',
                  background: '#fee2e2',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={17} color="#dc2626" /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

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
