import React, { useState } from 'react';
import { X, KeyRound, Lock, User, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth, DEFAULT_ACCOUNTS } from '../context/AuthContext';

export const LoginModal = () => {
  const { user, login, isLoginModalOpen, setIsLoginModalOpen, registeredUsers, getDepartmentInfo } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleQuickSwitch = (account) => {
    login(account);
    setIsLoginModalOpen(false);
  };

  const handleCustomLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanU = (username || '').trim().toLowerCase();
    const cleanP = (password || '').trim();

    if (!cleanU) {
      setError('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    if (!cleanP) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    const found = (registeredUsers || DEFAULT_ACCOUNTS)?.find(a => 
      a.username.toLowerCase() === cleanU || (a.email && a.email.toLowerCase() === cleanU)
    );
    if (found && (cleanP === '123456' || cleanP === 'password123' || cleanP === found.password || cleanP === cleanU)) {
      login(found);
      setIsLoginModalOpen(false);
      return;
    }

    if (cleanP === '123456' || cleanP === 'password123') {
      const role = cleanU.includes('admin') ? 'admin' : cleanU.includes('eng') ? 'engineer' : 'operator';
      login({
        username: cleanU,
        name: cleanU === 'admin' ? 'สมชาย จัดการคลัง' : cleanU === 'engineer' ? 'วิศวกร ซ่อมบำรุง' : 'กิตติยา สแกนสต็อก',
        role: role,
        roleLabel: role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : role === 'engineer' ? 'วิศวกรโครงสร้างคลัง' : 'พนักงานคลังสินค้า',
        email: `${cleanU}@smartwarehouse.io`,
        avatar: role === 'admin' ? '👨‍💼' : role === 'engineer' ? '🧑‍💻' : '👩‍🔧'
      });
      setIsLoginModalOpen(false);
      return;
    }

    setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
  };

  const activeDept = getDepartmentInfo ? getDepartmentInfo(user) : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '32px 28px',
        position: 'relative',
        background: '#ffffff',
        border: '2px solid #0284c7',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Close Button */}
        <button 
          onClick={() => setIsLoginModalOpen(false)}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '1.4rem',
            fontWeight: 800,
            padding: '4px'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '14px',
            background: '#e0f2fe',
            borderRadius: '16px',
            color: '#0284c7',
            marginBottom: '10px'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
            สลับบัญชีและทดสอบสิทธิ์ผู้ใช้งาน (Switch Role & User)
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
            ปัจจุบันเข้าสู่ระบบในชื่อ: <strong style={{ color: activeDept?.color || '#0284c7' }}>{user?.name}</strong> ({activeDept?.badge || user?.role})
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fee2e2',
            border: '1.5px solid #fecdd3',
            color: '#b91c1c',
            fontSize: '0.92rem',
            marginBottom: '16px',
            fontWeight: 700
          }}>
            {error}
          </div>
        )}

        {/* 1-Click Role Switch Cards */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '0.88rem',
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '10px'
          }}>
            ⚡ เลือกสลับบัญชีเพื่อทดสอบสิทธิ์ที่แตกต่าง (1-Click Switch):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEFAULT_ACCOUNTS.map((acc) => {
              const isCurrent = user?.username?.toLowerCase() === acc.username.toLowerCase();
              const isAdm = acc.role === 'admin';
              const isEng = acc.role === 'engineer';
              const themeColor = isAdm ? '#0284c7' : isEng ? '#7c3aed' : '#059669';
              const themeBg = isAdm ? '#f0f9ff' : isEng ? '#faf5ff' : '#f0fdf4';
              const themeBorder = isAdm ? '#bae6fd' : isEng ? '#e9d5ff' : '#bbf7d0';

              return (
                <div
                  key={acc.username}
                  onClick={() => handleQuickSwitch(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: isCurrent ? themeBg : '#ffffff',
                    border: isCurrent ? `2.5px solid ${themeColor}` : `1.5px solid ${themeBorder}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isCurrent ? `0 4px 14px ${themeColor}22` : '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  onMouseOver={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = themeBg;
                  }}
                  onMouseOut={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{acc.avatar}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.02rem', color: '#0f172a' }}>
                          {acc.name}
                        </span>
                        {isCurrent && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: themeColor,
                            color: '#ffffff'
                          }}>
                            บัญชีปัจจุบัน
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: themeColor, marginTop: '2px' }}>
                        {acc.roleLabel} • {acc.departmentCode}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                        {isAdm && '✅ สิทธิ์สูงสุดทุกระบบ: จัดการแร็ค, นำเข้า, เบิกจ่าย, ลบประวัติ'}
                        {!isAdm && !isEng && '✅ นำเข้า + เบิกจ่าย | 🔒 ห้ามเพิ่มช่องจัดเก็บ | 🔒 ห้ามลบประวัติ'}
                        {isEng && '✅ เพิ่มช่องจัดเก็บ + IoT ESP32 | 🔒 ห้ามเบิกจ่ายสินค้า (View-Only)'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isCurrent ? '#ffffff' : themeColor,
                      color: isCurrent ? themeColor : '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isCurrent ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                    <span>{isCurrent ? 'ใช้งานอยู่' : 'สลับทันที'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggle Manual Form */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showManualForm ? '▲ ซ่อนฟอร์มกรอกรหัสผ่านด้วยตนเอง' : '▼ เข้าสู่ระบบด้วยชื่อผู้ใช้อื่น / รหัสผ่านของตนเอง'}
          </button>
        </div>

        {/* Manual Login Form */}
        {showManualForm && (
          <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <User size={16} color="#0284c7" /> ชื่อผู้ใช้งานหรืออีเมล
              </label>
              <input 
                type="text" 
                className="form-input"
                placeholder="เช่น admin, operator, engineer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Lock size={16} color="#0284c7" /> รหัสผ่าน
              </label>
              <input 
                type="password" 
                className="form-input"
                placeholder="กรอกรหัสผ่าน (เดโม: password123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 900, marginTop: '4px' }}
            >
              <KeyRound size={18} /> ยืนยันการเข้าสู่ระบบ
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
