import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
  Sun,
  Moon,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useTheme } from '../context/ThemeContext';
import { soundFx } from '../utils/soundFx';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  isMobileMenuOpen: externalMobileMenuOpen, 
  setIsMobileMenuOpen: externalSetMobileMenuOpen 
}) => {
  const { user, logout, setIsLoginModalOpen, setIsProfileModalOpen, getDepartmentInfo, canControlHardware, canPerformOutbound } = useAuth();
  const { esp32Connected, craneState, emergencyStop, resetEmergencyStop } = useWarehouse();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const isMobileMenuOpen = externalMobileMenuOpen !== undefined ? externalMobileMenuOpen : internalMobileMenuOpen;
  const setIsMobileMenuOpen = externalSetMobileMenuOpen || setInternalMobileMenuOpen;
  const [isSoundOn, setIsSoundOn] = useState(() => soundFx.isEnabled());

  const handleToggleSound = () => {
    const next = soundFx.toggle();
    setIsSoundOn(next);
    if (next) {
      soundFx.playChime();
    }
  };

  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;
  const isSafetyAdmin = canControlHardware ? canControlHardware(user) : true;
  const isOutboundAllowed = canPerformOutbound ? canPerformOutbound(user) : true;

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'store-in', label: 'นำเข้าสินค้า & ผังชั้นวาง', icon: ArrowDownToLine },
    { id: 'store-out', label: 'เบิกจ่ายสินค้า', icon: ArrowUpFromLine },
    { id: 'history', label: 'ประวัติบันทึก', icon: History },
    { id: 'iot', label: 'ควบคุมฮาร์ดแวร์ IoT', icon: Cpu },
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
      background: 'var(--bg-card)',
      borderBottom: '1.5px solid var(--border-color)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Sticky Emergency Banner when E-Stop is triggered */}
      {(craneState.emergencyStop || craneState.status === 'EMERGENCY_STOP') && (
        <div style={{
          background: 'linear-gradient(90deg, #b91c1c, #e11d48, #b91c1c)',
          color: '#ffffff',
          padding: '9px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(225, 29, 72, 0.45)',
          animation: 'pulseRedBanner 2s infinite ease-in-out',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#fef08a" />
            <span>🚨 สถานะฉุกเฉิน — ระบบ AS/RS ถูกล็อคความปลอดภัย</span>
          </div>
          <button
            type="button"
            onClick={resetEmergencyStop}
            style={{
              background: '#ffffff',
              color: '#b91c1c',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 14px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px' }} />
            ปลดล็อค E-Stop
          </button>
        </div>
      )}

      {/* UNIFIED HEADER */}
      <div className="unified-nav-header">
        {/* Row 1: Brand Title + Desktop Tabs + Global E-Stop + Theme Switcher + Hamburger Menu Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          transition: 'background-color 0.3s ease',
          gap: '12px'
        }}>
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
              <div className="nav-brand-name" style={{ fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.02em', background: 'linear-gradient(135deg, #0284c7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>
                SMART WAREHOUSE AS/RS
              </div>
              <div className="nav-brand-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                ระบบคลังสินค้าอัตโนมัติ
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 13px',
                    borderRadius: '10px',
                    border: isActive ? '1.5px solid var(--accent-sky)' : '1px solid transparent',
                    background: isActive 
                      ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'linear-gradient(135deg, #e0f2fe, #bae6fd)')
                      : 'transparent',
                    color: isActive ? 'var(--accent-sky)' : 'var(--text-main)',
                    fontWeight: isActive ? 900 : 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Group: Global E-Stop + Theme Toggle Button + Hamburger Menu */}
          <div className="nav-action-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Global Emergency Stop Button */}
            {craneState.emergencyStop || craneState.status === 'EMERGENCY_STOP' ? (
              <button
                type="button"
                onClick={resetEmergencyStop}
                className="btn-estop reset pulse-glow-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(5, 150, 105, 0.4)'
                }}
                title="กดเพื่อปลดล็อคสถานะหยุดฉุกเฉิน"
              >
                <RotateCcw size={16} />
                <span>ปลดล็อค E-STOP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={emergencyStop}
                className="btn-estop trigger"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(239, 68, 68, 0.4)'
                }}
                title="สั่งหยุดการทำงานของเครน AS/RS ฉุกเฉินทันที"
              >
                <AlertTriangle size={16} />
                <span>E-STOP</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
            >
              {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
              <span style={{ fontSize: '0.84rem' }}>{isDark ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง'}</span>
            </button>

            {/* Sound FX Toggle Button */}
            <button
              className="nav-sound-btn"
              type="button"
              onClick={handleToggleSound}
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isSoundOn ? 'var(--accent-sky)' : 'var(--text-dim)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
              title={isSoundOn ? "ปิดเสียง" : "เปิดเสียง"}
            >
              {isSoundOn ? <Volume2 size={18} color="#0284c7" /> : <VolumeX size={18} color="var(--text-dim)" />}
              <span style={{ fontSize: '0.84rem' }}>{isSoundOn ? 'เสียงเปิด' : 'เสียงปิด'}</span>
            </button>

            {/* Desktop User Profile Button */}
            <button
              className="nav-profile-btn"
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '10px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
              title="คลิกเพื่อแก้ไขข้อมูลโปรไฟล์ผู้ใช้งาน"
            >
              <span style={{ fontSize: '1.25rem' }}>{user?.avatar || '👨‍💼'}</span>
              <div className="nav-profile-text" style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'ผู้ใช้งาน'}
                </div>
                <div style={{ fontSize: '0.70rem', color: deptInfo?.color || 'var(--accent-sky)', fontWeight: 600 }}>
                  {deptInfo?.badge || user?.roleLabel || user?.role || 'OPERATOR'}
                </div>
              </div>
            </button>

            {/* 3-Lines Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent-sky)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
              title="เปิดเมนู 3 ขีด"
            >
              <Menu size={22} color="var(--accent-sky)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>เมนู</span>
            </button>
          </div>
        </div>

        {/* Row 2: Telemetry Status Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px 10px 16px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>

          {/* ESP32 Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '16px',
            background: esp32Connected 
              ? (isDark ? 'rgba(14, 165, 233, 0.18)' : '#e0f2fe')
              : (isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7'),
            border: `1px solid ${esp32Connected ? (isDark ? 'rgba(56, 189, 248, 0.4)' : '#7dd3fc') : (isDark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a')}`,
            color: esp32Connected ? (isDark ? '#38bdf8' : '#0369a1') : (isDark ? '#fbbf24' : '#b45309'),
            fontWeight: 600,
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
            background: craneState.status === 'EMERGENCY_STOP'
              ? (isDark ? 'rgba(225, 29, 72, 0.2)' : '#fee2e2')
              : craneState.status === 'IDLE'
              ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7')
              : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'),
            border: `1px solid ${
              craneState.status === 'EMERGENCY_STOP'
                ? (isDark ? 'rgba(251, 113, 133, 0.4)' : '#fecdd3')
                : craneState.status === 'IDLE'
                ? (isDark ? 'rgba(52, 211, 153, 0.4)' : '#86efac')
                : (isDark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a')
            }`,
            color: craneState.status === 'EMERGENCY_STOP'
              ? (isDark ? '#fb7185' : '#b91c1c')
              : craneState.status === 'IDLE'
              ? (isDark ? '#34d399' : '#15803d')
              : (isDark ? '#fbbf24' : '#b45309'),
            fontWeight: 600,
            fontSize: '0.78rem',
            flexShrink: 0
          }}>
            <Activity size={13} />
            <span>CRANE: {craneState.status}</span>
          </div>
        </div>
      </div>

      {/* MOBILE HAMBURGER DRAWER MENU */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1.5px solid var(--border-color)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={20} color="var(--accent-sky)" />
                <span>เมนูหลัก & ผู้ใช้งาน</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* User Profile Card */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
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
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว"
              >
                <span style={{ fontSize: '2.2rem' }}>{user?.avatar || '👨‍💼'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{user?.name || 'ผู้ใช้งาน'}</span>
                    <Edit3 size={13} color="var(--accent-sky)" />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: deptInfo?.color || 'var(--accent-sky)', fontWeight: 600, marginTop: '2px' }}>
                    {deptInfo?.badge || user?.roleLabel || user?.role || 'OPERATOR'}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Mode Switcher in Drawer */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>โหมดการแสดงผล</span>
                <span style={{ fontSize: '0.75rem', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 600 }}>
                  {isDark ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง'}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'var(--bg-primary)',
                padding: '4px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !isDark ? 'var(--bg-card)' : 'transparent',
                    color: !isDark ? '#0284c7' : 'var(--text-dim)',
                    fontWeight: !isDark ? 900 : 700,
                    boxShadow: !isDark ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sun size={17} color={!isDark ? '#f59e0b' : 'currentColor'} />
                  <span>โหมดสว่าง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isDark ? 'var(--bg-card)' : 'transparent',
                    color: isDark ? '#38bdf8' : 'var(--text-dim)',
                    fontWeight: isDark ? 900 : 700,
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Moon size={17} color={isDark ? '#38bdf8' : 'currentColor'} />
                  <span>โหมดมืด</span>
                </button>
              </div>
            </div>

            {/* Sound FX Toggle in Mobile Drawer */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600 }}>
                {isSoundOn ? <Volume2 size={18} color="var(--accent-sky)" /> : <VolumeX size={18} color="var(--text-dim)" />}
                <span>เสียงเอฟเฟกต์ AS/RS</span>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: isSoundOn ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-card)',
                  color: isSoundOn ? 'var(--accent-sky)' : 'var(--text-dim)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSoundOn ? 'เปิดอยู่' : 'ปิดอยู่'}
              </button>
            </div>

            {/* Navigation Tabs List */}
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>
                การนำทาง
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
                        border: isActive ? '2px solid var(--accent-sky)' : '1.5px solid var(--border-color)',
                        background: isActive 
                          ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'linear-gradient(135deg, #e0f2fe, #bae6fd)')
                          : 'var(--bg-card)',
                        color: isActive ? 'var(--accent-sky)' : 'var(--text-main)',
                        fontWeight: isActive ? 900 : 700,
                        fontSize: '0.98rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 3px 10px rgba(2, 132, 199, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={20} color={isActive ? 'var(--accent-sky)' : 'var(--text-dim)'} />
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'store-out' && !isOutboundAllowed && (
                        <span style={{ fontSize: '0.7rem', color: '#c084fc', background: isDark ? 'rgba(192, 132, 252, 0.15)' : '#faf5ff', padding: '2px 6px', borderRadius: '6px', border: '1px solid #d8b4fe' }}>
                          🔒 ดูอย่างเดียว
                        </span>
                      )}
                      <ChevronRight size={18} color={isActive ? 'var(--accent-sky)' : 'var(--text-dim)'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Actions Section */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1.5px solid var(--border-color)',
              background: 'var(--bg-secondary)',
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
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, justifyContent: 'center' }}
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
                  fontWeight: 600,
                  borderColor: '#fca5a5',
                  color: isDark ? '#fb7185 !important' : '#dc2626 !important',
                  background: isDark ? 'rgba(225, 29, 72, 0.15)' : '#fee2e2',
                  justifyContent: 'center'
                }}
              >
                <LogOut size={17} color={isDark ? "#fb7185" : "#dc2626"} /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '430px',
            width: '100%',
            padding: '34px',
            background: 'var(--bg-card)',
            border: '2px solid #fecdd3',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '18px',
              borderRadius: '50%',
              background: isDark ? 'rgba(225, 29, 72, 0.2)' : '#fee2e2',
              color: isDark ? '#fb7185' : '#dc2626',
              marginBottom: '18px'
            }}>
              <LogOut size={38} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
              ยืนยันการออกจากระบบ?
            </h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '26px', fontWeight: 600 }}>
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
        </div>,
        document.body
      )}
    </header>
  );
};
