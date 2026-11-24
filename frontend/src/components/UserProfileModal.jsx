import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Lock, 
  KeyRound, 
  Check, 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save,
  AlertCircle,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserProfileModal = () => {
  const { user, updateUserProfile, isProfileModalOpen, setIsProfileModalOpen, getDepartmentInfo } = useAuth();
  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');

  // Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Dedicated Password Change States
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
      setPasswordMessage(null);
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  // Dedicated Handler: Confirm Change Password directly
  const handleConfirmPasswordChange = async (e) => {
    if (e) e.preventDefault();
    setPasswordMessage(null);
    setMessage(null);

    const cleanCurrent = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanCurrent) {
      setPasswordMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านเดิม / รหัสผ่านปัจจุบันเพื่อยืนยันตัวตน' });
      return;
    }

    if (!cleanNew) {
      setPasswordMessage({ type: 'error', text: 'กรุณากรอกรหัสผ่านใหม่' });
      return;
    }

    if (cleanNew.length < 4) {
      setPasswordMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    if (cleanNew === cleanCurrent) {
      setPasswordMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordMessage({ type: 'error', text: '❌ รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateUserProfile({
        name: (name || user?.name || '').trim(),
        email: (email || user?.email || '').trim(),
        phone: (phone || user?.phone || '').trim(),
        department: (department || user?.department || '').trim(),
        avatar: user?.avatar || '👨‍💼',
        currentPassword: cleanCurrent,
        password: cleanNew
      });

      setSavingPassword(false);

      if (res && res.success) {
        setPasswordMessage({ type: 'success', text: '✅ เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว!' });
        setMessage({ type: 'success', text: '✅ เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว สามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordMessage(null);
        }, 1800);
      } else {
        setPasswordMessage({ type: 'error', text: res?.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
      }
    } catch (err) {
      setSavingPassword(false);
      setPasswordMessage({ type: 'error', text: err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อ-นามสกุล' });
      return;
    }

    // If user filled in password fields while submitting whole profile, update password too
    if (isChangingPassword && (currentPassword || newPassword)) {
      await handleConfirmPasswordChange(e);
      return;
    }

    setSaving(true);

    const updatedData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      avatar: user?.avatar || '👨‍💼'
    };

    const res = await updateUserProfile(updatedData);
    setSaving(false);

    if (res && res.success) {
      setMessage({ type: 'success', text: '✅ อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว' });
      setTimeout(() => {
        setIsProfileModalOpen(false);
      }, 1400);
    } else {
      setMessage({ type: 'error', text: res?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  return (
    <div 
      className="modal-overlay" 
      role="dialog" 
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '20px'
      }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '32px',
        background: '#ffffff',
        border: '2px solid #bae6fd',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.18)',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-cyan">User Account</span>
              <span className="badge badge-emerald">Security Verified</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={26} color="#0284c7" /> แก้ไขข้อมูลส่วนตัว
            </h2>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast Alert */}
        {message && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fecdd3'}`,
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600
          }}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Locked Permanent Avatar Banner */}
        <div style={{
          background: '#f0f7ff',
          padding: '20px',
          borderRadius: '16px',
          border: '1.5px solid #bae6fd',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            fontSize: '3.4rem',
            width: '80px',
            height: '80px',
            background: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.2)',
            border: '2.5px solid #0284c7',
            flexShrink: 0
          }}>
            {user?.avatar || '👨‍💼'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1.3rem', color: '#0f172a' }}>
                @{user?.username}
              </span>
              <span style={{
                background: deptInfo?.bg || '#e0f2fe',
                border: `1.5px solid ${deptInfo?.border || '#7dd3fc'}`,
                color: deptInfo?.color || '#0284c7',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                {deptInfo?.badge || user?.roleLabel || user?.role?.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
              {deptInfo?.description}
            </div>
          </div>
        </div>

        {/* Assigned Privileges Card */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            📋 สิทธิ์การเข้าถึง:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {deptInfo?.capabilities?.map((cap) => (
              <div key={cap.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: cap.allowed ? '#166534' : '#991b1b' }}>
                {cap.allowed ? <CheckCircle2 size={16} color="#16a34a" /> : <Lock size={15} color="#dc2626" />}
                <span>{cap.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อ-นามสกุล"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              อีเมล
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@smartwarehouse.io"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
            />
          </div>

          {/* Change Password Collapsible Section */}
          <div style={{
            background: isChangingPassword ? '#f8fafc' : '#ffffff',
            padding: '18px',
            borderRadius: '14px',
            border: isChangingPassword ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
            marginTop: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                <KeyRound size={18} color="#0284c7" />
                <span>เปลี่ยนรหัสผ่าน</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setMessage(null);
                }}
                className={`btn ${isChangingPassword ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '5px 14px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {isChangingPassword ? 'ยกเลิกการเปลี่ยนรหัส' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>

            {isChangingPassword && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>

                
                {/* 1. Current Password */}
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    1. รหัสผ่านปัจจุบัน *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordMessage) setPasswordMessage(null);
                      }}
                      placeholder="กรอกรหัสผ่านเดิม (เช่น password123 หรือ 123456)"
                      style={{ paddingRight: '42px', borderColor: currentPassword ? '#0284c7' : '#cbd5e1' }}
                      required={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 2. New Password */}
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    2. รหัสผ่านใหม่ *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordMessage) setPasswordMessage(null);
                      }}
                      placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
                      style={{ paddingRight: '42px' }}
                      required={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirm New Password */}
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    3. ยืนยันรหัสผ่านใหม่ *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordMessage) setPasswordMessage(null);
                      }}
                      placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                      style={{ paddingRight: '42px' }}
                      required={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Inline Password Feedback Alert */}
                {passwordMessage && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: passwordMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: passwordMessage.type === 'success' ? '#166534' : '#991b1b',
                    border: `1.5px solid ${passwordMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                {/* Dedicated Confirm Password Change Button */}
                <div style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleConfirmPasswordChange}
                    disabled={savingPassword}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '13px 20px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.98rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: savingPassword ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <KeyRound size={18} />
                    <span>{savingPassword ? 'กำลังตรวจสอบและเปลี่ยนรหัสผ่าน...' : 'ยืนยันเปลี่ยนรหัสผ่าน'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px', fontSize: '1rem', fontWeight: 600 }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 2, padding: '14px', fontSize: '1rem', fontWeight: 700 }}
            >
              <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
