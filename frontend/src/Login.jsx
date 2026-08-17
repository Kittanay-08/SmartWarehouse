import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post('/api/login', { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role);
        navigate('/');
      } else {
        await axios.post('/api/register', { username, password, role });
        setSuccess('✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setIsLogin(true);
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setSuccess('');
  };

  const roleLabel = { student: 'นักศึกษา', teacher: 'อาจารย์', external: 'บุคคลภายนอก' };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏭</div>
          <div className="login-logo-text">
            <span className="login-logo-title">ASRS Warehouse</span>
            <span className="login-logo-sub">Smart Shelf Management System</span>
          </div>
        </div>

        <h1 className="login-heading">{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h1>
        <p className="login-subheading">
          {isLogin ? 'กรอกข้อมูลเพื่อเข้าใช้งานระบบ' : 'สร้างบัญชีผู้ใช้งานใหม่'}
        </p>

        <div className="tab-switch">
          <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => switchTab(true)}>
            🔐 เข้าสู่ระบบ
          </button>
          <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => switchTab(false)}>
            📝 สมัครสมาชิก
          </button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="field-wrapper">
              <label className="field-label">ชื่อผู้ใช้งาน</label>
              <input
                type="text"
                className="field-input"
                placeholder="กรอกชื่อผู้ใช้งาน"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field-wrapper">
              <label className="field-label">รหัสผ่าน</label>
              <input
                type="password"
                className="field-input"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="field-wrapper">
                <label className="field-label">ประเภทผู้ใช้งาน</label>
                <select className="field-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">🎓 นักศึกษา (Student)</option>
                  <option value="teacher">👩‍🏫 อาจารย์ (Teacher)</option>
                  <option value="external">🧑‍💼 บุคคลภายนอก (External)</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ กำลังดำเนินการ...' : isLogin ? 'เข้าสู่ระบบ →' : 'สร้างบัญชีผู้ใช้งาน →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
