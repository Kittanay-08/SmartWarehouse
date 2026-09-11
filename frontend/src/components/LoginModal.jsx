import React, { useState } from 'react';
import { X, KeyRound, Lock, User, ShieldCheck, CheckCircle2, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth, DEFAULT_ACCOUNTS } from '../context/AuthContext';

export const LoginModal = () => {
  const { 
    user, 
    login, 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    registeredUsers, 
    setUserPassword, 
    getDepartmentInfo 
  } = useAuth();

  // Manual login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  // States for switching accounts & custom password setup
  const [selectedAccountForSwitch, setSelectedAccountForSwitch] = useState(null);
  const [isSettingPasswordMode, setIsSettingPasswordMode] = useState(false);
  const [switchPassword, setSwitchPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [switchError, setSwitchError] = useState('');

  if (!isLoginModalOpen) return null;

  const accountsToDisplay = (registeredUsers && registeredUsers.length > 0) ? registeredUsers : DEFAULT_ACCOUNTS;

  const handleSelectAccountForSwitch = (account) => {
    const isCurrent = user?.username?.toLowerCase() === account.username?.toLowerCase();
    if (isCurrent) return;

    if (selectedAccountForSwitch?.username?.toLowerCase() === account.username?.toLowerCase()) {
      setSelectedAccountForSwitch(null);
      setIsSettingPasswordMode(false);
      setSwitchPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSwitchError('');
    } else {
      const hasExistingPassword = Boolean(account.hasCustomPassword && account.password);
      setSelectedAccountForSwitch(account);
      setIsSettingPasswordMode(!hasExistingPassword);
      setSwitchPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSwitchError('');
    }
  };

  // Case A: User enters existing custom password to switch
  const handleConfirmSwitch = (e, account) => {
    e.preventDefault();
    setSwitchError('');

    const cleanP = (switchPassword || '').trim();
    if (!cleanP) {
      setSwitchError('กรุณากรอกรหัสผ่านเพื่อยืนยัน');
      return;
    }

    if (cleanP === account.password) {
      login(account);
      setIsLoginModalOpen(false);
      setSelectedAccountForSwitch(null);
      setSwitchPassword('');
      setSwitchError('');
    } else {
      setSwitchError(`❌ รหัสผ่านของ "${account.name}" ไม่ถูกต้อง กรุณากรอกรหัสผ่านที่คุณตั้งไว้ หรือกด "ตั้งรหัสผ่านใหม่" ด้านล่าง`);
    }
  };

  // Case B: User (Admin, Operator, Engineer) sets their own password
  const handleSetPasswordAndLogin = (e, account) => {
    e.preventDefault();
    setSwitchError('');

    const cleanNew = (newPassword || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanNew) {
      setSwitchError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (cleanNew.length < 4) {
      setSwitchError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setSwitchError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setUserPassword(account.username, cleanNew);
    const updatedAccount = { ...account, password: cleanNew, hasCustomPassword: true };
    login(updatedAccount);

    setIsLoginModalOpen(false);
    setSelectedAccountForSwitch(null);
    setNewPassword('');
    setConfirmPassword('');
    setSwitchError('');
  };

  // Manual username & password login
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

    const found = accountsToDisplay.find(a => 
      a.username.toLowerCase() === cleanU || (a.email && a.email.toLowerCase() === cleanU)
    );

    if (found) {
      if (!found.hasCustomPassword || !found.password) {
        setError(`บัญชี "${found.name}" ยังไม่ได้ตั้งรหัสผ่าน กรุณากดเลือกที่รายการบัญชีด้านบนเพื่อกำหนดรหัสผ่านของคุณก่อนเข้าใช้งาน`);
        return;
      }

      if (cleanP === found.password) {
        login(found);
        setIsLoginModalOpen(false);
        return;
      } else {
        setError('รหัสผ่านไม่ถูกต้อง');
        return;
      }
    }

    setError('ไม่พบชื่อผู้ใช้งานนี้ในระบบ');
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
        maxWidth: '580px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '30px 26px',
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: '#e0f2fe',
            borderRadius: '16px',
            color: '#0284c7',
            marginBottom: '10px'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a' }}>
            สลับบัญชีและทดสอบสิทธิ์ผู้ใช้งาน (Switch Role & User)
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
            ปัจจุบันเข้าสู่ระบบในชื่อ: <strong style={{ color: activeDept?.color || '#0284c7' }}>{user?.name}</strong> ({activeDept?.badge || user?.role})
          </p>
        </div>

        {/* General Error Banner */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fee2e2',
            border: '1.5px solid #fecdd3',
            color: '#b91c1c',
            fontSize: '0.9rem',
            marginBottom: '16px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Switch Account Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              🔒 เลือกสลับบัญชี (แต่ละบัญชีผู้ใช้ต้องตั้งรหัสผ่านเอง):
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {accountsToDisplay.map((acc) => {
              const isCurrent = user?.username?.toLowerCase() === acc.username?.toLowerCase();
              const isSelected = selectedAccountForSwitch?.username?.toLowerCase() === acc.username?.toLowerCase();
              const hasCustomPass = Boolean(acc.hasCustomPassword && acc.password);
              
              const isAdm = acc.role === 'admin';
              const isEng = acc.role === 'engineer';
              const themeColor = isAdm ? '#0284c7' : isEng ? '#7c3aed' : '#059669';
              const themeBg = isAdm ? '#f0f9ff' : isEng ? '#faf5ff' : '#f0fdf4';
              const themeBorder = isAdm ? '#bae6fd' : isEng ? '#e9d5ff' : '#bbf7d0';

              return (
                <div
                  key={acc.username}
                  onClick={() => handleSelectAccountForSwitch(acc)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: isCurrent ? themeBg : isSelected ? '#f8fafc' : '#ffffff',
                    border: isCurrent 
                      ? `2.5px solid ${themeColor}` 
                      : isSelected 
                        ? `2px solid ${themeColor}` 
                        : `1.5px solid ${themeBorder}`,
                    cursor: isCurrent ? 'default' : 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isCurrent 
                      ? `0 4px 14px ${themeColor}22` 
                      : isSelected 
                        ? '0 4px 16px rgba(0,0,0,0.08)' 
                        : '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                  onMouseOver={(e) => {
                    if (!isCurrent && !isSelected) e.currentTarget.style.background = themeBg;
                  }}
                  onMouseOut={(e) => {
                    if (!isCurrent && !isSelected) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '2.1rem' }}>{acc.avatar}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a' }}>
                            {acc.name}
                          </span>
                          {isCurrent ? (
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
                          ) : hasCustomPass ? (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <Lock size={11} /> ตั้งรหัสแล้ว
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fcd34d',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <KeyRound size={11} /> ยังไม่ได้ตั้งรหัสผ่าน
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: themeColor, marginTop: '2px' }}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAccountForSwitch(acc);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isCurrent ? '#f1f5f9' : isSelected ? '#e2e8f0' : themeColor,
                        color: isCurrent ? '#475569' : isSelected ? '#0f172a' : '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: isCurrent ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 size={16} color="#16a34a" />
                          <span>ใช้งานอยู่</span>
                        </>
                      ) : isSelected ? (
                        <>
                          <X size={15} />
                          <span>ปิดช่องกรอก</span>
                        </>
                      ) : hasCustomPass ? (
                        <>
                          <KeyRound size={15} />
                          <span>สลับบัญชี (ใส่รหัส)</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={15} />
                          <span>ตั้งรหัสและเข้าใช้</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Inline Verification / Password Setup Form */}
                  {isSelected && !isCurrent && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: '14px',
                        padding: '16px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: `2px solid ${themeColor}`,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                      }}
                    >
                      {/* Sub-mode 1: Account already has a custom password -> Enter password */}
                      {!isSettingPasswordMode ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                              <Lock size={16} color={themeColor} />
                              <span>กรุณากรอกรหัสผ่านของ <strong style={{ color: themeColor }}>{acc.name}</strong> เพื่อสลับสิทธิ์:</span>
                            </div>
                          </div>

                          <form onSubmit={(e) => handleConfirmSwitch(e, acc)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                  type={showSwitchPassword ? 'text' : 'password'}
                                  className="form-input"
                                  placeholder="กรอกรหัสผ่านที่คุณตั้งไว้สำหรับบัญชีนี้"
                                  value={switchPassword}
                                  onChange={(e) => { setSwitchPassword(e.target.value); setSwitchError(''); }}
                                  autoFocus
                                  required
                                  style={{ width: '100%', padding: '8px 40px 8px 12px', fontSize: '0.9rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {showSwitchPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>

                              <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                  background: themeColor,
                                  borderColor: themeColor,
                                  padding: '8px 16px',
                                  fontSize: '0.88rem',
                                  fontWeight: 900,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                ยืนยันสลับบัญชี
                              </button>
                            </div>

                            {/* Reset Password Option */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSettingPasswordMode(true);
                                  setNewPassword('');
                                  setConfirmPassword('');
                                  setSwitchError('');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0284c7',
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <RefreshCw size={12} /> รีเซ็ตหรือตั้งรหัสผ่านใหม่ (Reset Password)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccountForSwitch(null);
                                  setSwitchPassword('');
                                  setSwitchError('');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#64748b',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        /* Sub-mode 2: Account has NO password yet, or user is resetting -> Set custom password */
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', marginBottom: '4px' }}>
                            <KeyRound size={16} color={themeColor} />
                            <span>กำหนดรหัสผ่านสำหรับ <strong style={{ color: themeColor }}>{acc.name}</strong></span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
                            {hasCustomPass 
                              ? 'คุณกำลังรีเซ็ตรหัสผ่านใหม่ กรุณากำหนดรหัสผ่านที่ต้องการ:' 
                              : 'เข้าใช้งานครั้งแรก: แต่ละผู้ใช้ต้องกำหนดรหัสผ่านของตนเองเพื่อความปลอดภัย'}
                          </p>

                          <form onSubmit={(e) => handleSetPasswordAndLogin(e, acc)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                                  รหัสผ่านใหม่ *
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="อย่างน้อย 4 ตัวอักษร"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setSwitchError(''); }}
                                    autoFocus
                                    required
                                    style={{ width: '100%', padding: '7px 36px 7px 10px', fontSize: '0.88rem' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    style={{
                                      position: 'absolute',
                                      right: '8px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748b',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                                  ยืนยันรหัสผ่านใหม่ *
                                </label>
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  className="form-input"
                                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                  value={confirmPassword}
                                  onChange={(e) => { setConfirmPassword(e.target.value); setSwitchError(''); }}
                                  required
                                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.88rem' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                  background: themeColor,
                                  borderColor: themeColor,
                                  flex: 1,
                                  padding: '8px 14px',
                                  fontSize: '0.88rem',
                                  fontWeight: 900
                                }}
                              >
                                บันทึกรหัสผ่านและเข้าสู่ระบบ
                              </button>

                              {hasCustomPass && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSettingPasswordMode(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setSwitchError('');
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800 }}
                                >
                                  ย้อนกลับ
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccountForSwitch(null);
                                  setIsSettingPasswordMode(false);
                                  setNewPassword('');
                                  setConfirmPassword('');
                                  setSwitchError('');
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800 }}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Error in Switch Box */}
                      {switchError && (
                        <div style={{
                          marginTop: '10px',
                          color: '#b91c1c',
                          background: '#fee2e2',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: '1px solid #fca5a5'
                        }}>
                          {switchError}
                        </div>
                      )}
                    </div>
                  )}
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
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showManualForm ? '▲ ซ่อนฟอร์มกรอกชื่อผู้ใช้และรหัสผ่าน' : '▼ เข้าสู่ระบบด้วยชื่อผู้ใช้งานอื่น'}
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
                <Lock size={16} color="#0284c7" /> รหัสผ่านของคุณ
              </label>
              <input 
                type="password" 
                className="form-input"
                placeholder="กรอกรหัสผ่านที่คุณได้ตั้งไว้"
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
