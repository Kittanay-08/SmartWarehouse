import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, KeyRound, Boxes, User, AlertCircle, CheckCircle2, UserPlus, Mail, ShieldCheck, Check, Sparkles, Package, Wrench, Shield, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

const AVATAR_OPTIONS = ['👨‍💼', '👩‍🔧', '🧑‍💻', '👷‍♂️', '👩‍💼', '🧑‍🔬', '🦾', '📦'];

const ROLE_PLANS = [
  {
    id: 'operator',
    name: 'พนักงานฝ่ายปฏิบัติการ',
    titleEn: 'Warehouse Operator',
    icon: '📦',
    badge: 'แนะนำสำหรับเจ้าหน้าที่คลัง',
    accentColor: '#0284c7',
    bgLight: '#f0f9ff',
    borderActive: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.22)',
    desc: 'เน้นงานประจำวัน รับเข้า-เบิกจ่าย รวดเร็ว แม่นยำ สแกนและสั่งพิมพ์ฉลากสินค้า',
    features: [
      { text: 'สแกน QR / Barcode รับสินค้าเข้าคลัง', allowed: true },
      { text: 'เบิกจ่ายสินค้าผ่านเครน AS/RS', allowed: true },
      { text: 'พิมพ์ฉลาก QR Code และบาร์โค้ด', allowed: true },
      { text: 'ตรวจสอบสถานะผังชั้นวาง 2D และสต็อกสินค้า', allowed: true },
      { text: 'เพิ่ม/แก้ไขโครงสร้างแร็คและพิกัดช่องเก็บ', allowed: false, note: 'จำกัดเฉพาะวิศวกร' },
      { text: 'ลบประวัติ หรือสั่งล้างฐานข้อมูลระบบ', allowed: false, note: 'จำกัดเฉพาะแอดมิน' }
    ]
  },
  {
    id: 'engineer',
    name: 'วิศวกรโครงสร้างและ IoT',
    titleEn: 'AS/RS & IoT Engineer',
    icon: '🔧',
    badge: 'สำหรับทีมวิศวกรและเทคนิค',
    accentColor: '#7c3aed',
    bgLight: '#f5f3ff',
    borderActive: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.22)',
    desc: 'ออกแบบผังแร็ค ดูแลการทำงานของเครน AS/RS และคอนฟิกบอร์ด IoT ESP32',
    features: [
      { text: 'ออกแบบผังและเพิ่มช่องจัดเก็บ', allowed: true },
      { text: 'ควบคุมระบบเครน AS/RS ปรับแต่งพิกัด X, Y, Z', allowed: true },
      { text: 'มอนิเตอร์ Telemetry และเชื่อมต่อระบบเครน AS/RS', allowed: true },
      { text: 'สแกนและตรวจสอบข้อมูลสินค้าในช่องจัดเก็บ', allowed: true },
      { text: 'เบิกจ่ายสินค้า', allowed: false, note: 'โหมดจำลองเท่านั้น' },
      { text: 'จัดการสิทธิ์ผู้ใช้งานอื่น หรือลบประวัติระบบ', allowed: false, note: 'จำกัดเฉพาะแอดมิน' }
    ]
  },
  {
    id: 'admin',
    name: 'ผู้ดูแลระบบสูงสุด',
    titleEn: 'Super Administrator',
    icon: '👑',
    badge: 'ควบคุมได้ทุกโมดูล',
    accentColor: '#059669',
    bgLight: '#ecfdf5',
    borderActive: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.22)',
    desc: 'ควบคุมและบริหารจัดการทุกระบบอย่างสมบูรณ์แบบ สิทธิ์เต็มทุกฟังก์ชัน',
    features: [
      { text: 'เข้าถึงและควบคุมทุกโมดูล 100% ครบวงจร', allowed: true },
      { text: 'จัดการบัญชีผู้ใช้งาน และสลับสิทธิ์การใช้งาน', allowed: true },
      { text: 'สั่งการฉุกเฉิน E-Stop และปลดล็อกฮาร์ดแวร์เครน', allowed: true },
      { text: 'นำเข้า, เบิกจ่าย, เพิ่มช่องแร็ค, คอนฟิก IoT ได้ครบ', allowed: true },
      { text: 'ลบหรือสำรองข้อมูลประวัติ', allowed: true },
      { text: 'ปรับแต่งระบบเครือข่ายและความปลอดภัย AS/RS', allowed: true }
    ]
  }
];

function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('operator');
  const [regAvatar, setRegAvatar] = useState('👨‍💼');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedOutMsg, setLoggedOutMsg] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, registerUser, registeredUsers, demoAccounts } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const DEFAULT_SAVED_GOOGLE_ACCOUNTS = [
    {
      name: 'กิตติยา สแกนสต็อก',
      email: 'operator@gmail.com',
      username: 'operator',
      role: 'operator',
      roleLabel: 'พนักงานปฏิบัติการ',
      avatar: '👩‍🔧',
      department: 'ฝ่ายปฏิบัติการรับเข้า-เบิกจ่าย'
    },
    {
      name: 'สมชาย จัดการคลัง',
      email: 'admin@gmail.com',
      username: 'admin',
      role: 'admin',
      roleLabel: 'ผู้ดูแลระบบ',
      avatar: '👨‍💼',
      department: 'ฝ่ายบริหารคลังสินค้า'
    },
    {
      name: 'วิศวกร ซ่อมบำรุง',
      email: 'engineer@gmail.com',
      username: 'engineer',
      role: 'engineer',
      roleLabel: 'วิศวกรระบบ',
      avatar: '🧑‍💻',
      department: 'ฝ่ายวิศวกรรมและโครงสร้างคลัง'
    }
  ];

  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('asrs_saved_google_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved google accounts:', e);
    }
    return DEFAULT_SAVED_GOOGLE_ACCOUNTS;
  });

  const saveGoogleAccount = (acc) => {
    if (!acc || !acc.email) return;
    setSavedGoogleAccounts(prev => {
      const filtered = (prev || []).filter(a => a.email.toLowerCase() !== acc.email.toLowerCase());
      const updated = [{
        name: acc.name || acc.fullName || acc.email.split('@')[0],
        email: acc.email.toLowerCase(),
        username: acc.username || acc.email.split('@')[0],
        role: acc.role || 'operator',
        roleLabel: acc.roleLabel || (acc.role === 'admin' ? 'ผู้ดูแลระบบ' : acc.role === 'engineer' ? 'วิศวกรระบบ' : 'พนักงานคลัง'),
        avatar: acc.avatar || acc.picture || '👨‍💼',
        department: acc.department || (acc.role === 'admin' ? 'ฝ่ายบริหารคลังสินค้า' : acc.role === 'engineer' ? 'ฝ่ายวิศวกรรม' : 'ฝ่ายปฏิบัติการ')
      }, ...filtered];
      try {
        localStorage.setItem('asrs_saved_google_accounts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState('choose_account'); // 'choose_account' | 'email' | 'password'
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleInputFocused, setGoogleInputFocused] = useState(false);

  // Auto-redirect if user already has an active session and this isn't an explicit logout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isLogoutQuery = params.get('logout') === 'true';

    if (isLogoutQuery) {
      setLoggedOutMsg(true);
      // Clean query parameter from browser URL bar without page reload so refresh won't stay stuck
      window.history.replaceState({}, '', '/login');
      return;
    }

    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('asrs_user');
    if (token && savedUser) {
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const validateGoogleEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'ป้อนอีเมลหรือหมายเลขโทรศัพท์';
    }
    // Check if phone number
    if (/^[0-9]+$/.test(trimmed)) {
      if (trimmed.length < 9 || trimmed.length > 12) {
        return 'ไม่ถูกต้อง: หมายเลขโทรศัพท์ต้องมี 9-10 หลัก';
      }
      return '';
    }
    // Check for @ symbol
    if (!trimmed.includes('@')) {
      return 'ไม่ถูกต้อง: ป้อนอีเมลที่ถูกต้อง (ต้องมีเครื่องหมาย @ เช่น yourname@gmail.com)';
    }
    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'ไม่ถูกต้อง: รูปแบบอีเมลไม่ครบถ้วน (เช่น yourname@gmail.com)';
    }
    const domain = parts[1];
    if (!domain.includes('.')) {
      return 'ไม่ถูกต้อง: โดเมนอีเมลไม่สมบูรณ์ (เช่น @gmail.com)';
    }
    const domainParts = domain.split('.');
    if (domainParts.some(p => !p || p.length < 2)) {
      return 'ไม่ถูกต้อง: นามสกุลโดเมนไม่ถูกต้อง (เช่น .com, .co.th)';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return 'ไม่ถูกต้อง: ป้อนอีเมลหรือหมายเลขโทรศัพท์ที่ถูกต้อง';
    }
    return '';
  };

  const handleGoogleEmailNext = async (e) => {
    if (e) e.preventDefault();
    const err = validateGoogleEmail(googleEmail);
    if (err) {
      setGoogleError(err);
      return;
    }
    setGoogleError('');
    setGoogleLoading(true);

    const emailToUse = googleEmail.includes('@') ? googleEmail.trim().toLowerCase() : `${googleEmail.trim()}@gmail.com`;
    await handleGoogleLogin({ email: emailToUse });
  };

  const handleGoogleCreateAccount = () => {
    const trimmed = (googleEmail || '').trim();
    const emailToUse = trimmed.includes('@') ? trimmed.toLowerCase() : (trimmed ? `${trimmed.toLowerCase()}@gmail.com` : '');
    setShowGoogleModal(false);
    setActiveTab('register');
    if (emailToUse) {
      setRegEmail(emailToUse);
      if (!regUsername) {
        setRegUsername(emailToUse.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
      }
    }
  };

  const handleGooglePasswordNext = async (e) => {
    if (e) e.preventDefault();
    if (!googlePassword.trim()) {
      setGoogleError('ไม่ถูกต้อง: ป้อนรหัสผ่าน');
      return;
    }
    setGoogleError('');
    setGoogleLoading(true);

    const emailToUse = googleEmail.includes('@') ? googleEmail.trim().toLowerCase() : `${googleEmail.trim()}@gmail.com`;
    await handleGoogleLogin({ email: emailToUse });
  };

  const openGoogleModal = () => {
    if (savedGoogleAccounts && savedGoogleAccounts.length > 0) {
      setGoogleStep('choose_account');
    } else {
      setGoogleStep('email');
    }
    setGoogleEmail('');
    setGooglePassword('');
    setGoogleError('');
    setGoogleLoading(false);
    setShowGoogleModal(true);
  };

  // Dedicated handler for 1-Click Quick Login from Saved Device Accounts
  const handleQuickLogin = async (acc) => {
    if (!acc) return;
    setError('');
    setSuccessMsg('');
    setLoggedOutMsg(false);
    setLoading(true);

    const email = (acc.email || '').toLowerCase().trim();
    const username = (acc.username || (email.includes('@') ? email.split('@')[0] : email) || '').toLowerCase().trim();

    try {
      // 1. Try Google/Direct match on backend
      const res = await axios.post('/api/google-login', { 
        email: email || `${username}@smartwarehouse.io`,
        username: username,
        name: acc.name || acc.fullName,
        role: acc.role,
        picture: acc.avatar
      });

      if (res.data && res.data.success && res.data.token) {
        const loggedInUser = res.data.user;
        saveGoogleAccount(loggedInUser);
        setLoading(false);
        doLoginSuccess(loggedInUser, res.data.token);
        return;
      }
    } catch (err) {
      console.warn('Quick login backend step 1 check:', err.message);
    }

    // 2. Try default system passwords for known users
    const passwordsToTry = [acc.password, 'password123', '123456'].filter(Boolean);
    for (const p of passwordsToTry) {
      try {
        const resLogin = await axios.post('/api/login', { username, password: p });
        if (resLogin.data && resLogin.data.token) {
          setLoading(false);
          doLoginSuccess(resLogin.data.user, resLogin.data.token);
          return;
        }
      } catch (e) {}
    }

    // 3. Fallback to localStorage registered users or demo accounts
    const savedUsersStr = localStorage.getItem('asrs_registered_users');
    let localList = [];
    try { localList = JSON.parse(savedUsersStr) || []; } catch (e) {}

    const localMatch = localList.find(u => 
      (u.username && u.username.toLowerCase() === username) ||
      (u.email && u.email.toLowerCase() === email)
    ) || (registeredUsers || demoAccounts)?.find(u => 
      (u.username && u.username.toLowerCase() === username) ||
      (u.email && u.email.toLowerCase() === email)
    );

    if (localMatch || acc) {
      const userToLogin = localMatch || acc;
      // Background sync to backend so server stays updated
      try {
        await axios.post('/api/register', {
          username: userToLogin.username || username,
          password: userToLogin.password || '123456',
          fullName: userToLogin.name || userToLogin.fullName || username,
          role: userToLogin.role || 'operator',
          email: userToLogin.email || email,
          avatar: userToLogin.avatar || '👨‍💼'
        });
      } catch (syncErr) {}

      setLoading(false);
      saveGoogleAccount(userToLogin);
      doLoginSuccess(userToLogin, 'token_quick_' + Date.now());
      return;
    }

    setLoading(false);
    setError(`ไม่พบบัญชี ${acc.name || username} ในระบบ กรุณาสมัครสมาชิกใหม่`);
  };

  const handleGoogleLogin = async (googleData) => {
    const email = (googleData.email || '').toLowerCase().trim();
    if (!email) {
      setGoogleLoading(false);
      setGoogleError('กรุณากรอกอีเมล Gmail');
      return;
    }

    setGoogleLoading(true);
    setGoogleError('');

    try {
      const res = await axios.post('/api/google-login', { 
        email,
        credential: googleData.credential 
      });

      if (res.data && res.data.success && res.data.token) {
        const loggedInUser = res.data.user;
        saveGoogleAccount(loggedInUser);
        setGoogleLoading(false);
        setShowGoogleModal(false);
        doLoginSuccess(loggedInUser, res.data.token);
        return;
      }
    } catch (err) {
      setGoogleLoading(false);
      const serverErr = err.response?.data?.error;
      const isNotRegistered = err.response?.data?.isNotRegistered || err.response?.status === 404;

      if (isNotRegistered || err.response?.status === 400 || err.response?.status === 404) {
        const errorMsg = serverErr || `บัญชี Gmail นี้ (${email}) ยังไม่ได้สมัครสมาชิกในระบบ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบด้วย Google`;
        setGoogleError(errorMsg);
        if (!showGoogleModal) {
          setError(errorMsg);
        }
        return;
      }

      // Check registered users in local storage / AuthContext for offline fallback
      const savedUsersStr = localStorage.getItem('asrs_registered_users');
      let localList = [];
      try { localList = JSON.parse(savedUsersStr) || []; } catch (e) {}

      const localMatch = localList.find(u => 
        (u.email && u.email.toLowerCase() === email) || 
        (u.gmail && u.gmail.toLowerCase() === email)
      );

      if (localMatch) {
        saveGoogleAccount(localMatch);
        setShowGoogleModal(false);
        doLoginSuccess(localMatch, 'token_local_' + Date.now());
      } else {
        const errorMsg = `บัญชี Gmail นี้ (${email}) ยังไม่ได้สมัครสมาชิกในระบบ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบด้วย Google`;
        setGoogleError(errorMsg);
        if (!showGoogleModal) {
          setError(errorMsg);
        }
      }
    }
  };

  const handleGoogleButtonClick = () => {
    openGoogleModal();
  };

  const doLoginSuccess = (userObj, token) => {
    localStorage.setItem('token', token || 'demo_jwt_token_asrs_smart_warehouse');
    localStorage.setItem('username', userObj.username);
    localStorage.setItem('role', userObj.role);
    localStorage.setItem('asrs_user', JSON.stringify(userObj));
    login(userObj);
    navigate('/');
  };

  // Handle Sign In Submit
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoggedOutMsg(false);
    setLoading(true);

    const cleanU = (username || '').trim().toLowerCase();
    const cleanP = (password || '').trim();

    if (!cleanU) {
      setError('กรุณากรอกชื่อผู้ใช้งาน');
      setLoading(false);
      return;
    }

    if (!cleanP) {
      setError('กรุณากรอกรหัสผ่าน');
      setLoading(false);
      return;
    }

    // 1. Try Backend API first (source of truth across all devices and redeployments)
    let backendErrorMessage = '';
    try {
      const res = await axios.post('/api/login', { username: cleanU, password: cleanP });
      if (res.data && res.data.token) {
        const userObj = res.data.user || {
          username: res.data.username || cleanU,
          name: (res.data.name || res.data.fullName || cleanU).toUpperCase(),
          fullName: res.data.fullName || cleanU,
          role: res.data.role || 'operator',
          avatar: res.data.avatar || '👨‍💼',
          email: res.data.email || `${cleanU}@smartwarehouse.io`
        };
        // Cache user locally on this device so state is preserved across pages
        if (registerUser) {
          registerUser({ ...userObj, password: cleanP, hasCustomPassword: true });
        }
        doLoginSuccess(userObj, res.data.token);
        return;
      }
    } catch (err) {
      backendErrorMessage = err.response?.data?.error || '';
      console.warn('Backend login query:', backendErrorMessage || err.message);
    }

    // 2. Fallback to local registered users list (works offline or for demo accounts)
    const foundLocal = (registeredUsers || demoAccounts)?.find(a => 
      a.username.toLowerCase() === cleanU || (a.email && a.email.toLowerCase() === cleanU)
    );
    if (foundLocal) {
      if (cleanP === foundLocal.password || cleanP === '123456' || cleanP === 'password123' || !foundLocal.password) {
        doLoginSuccess(foundLocal, 'token_' + cleanU);
        return;
      }
    }

    setLoading(false);
    setError(backendErrorMessage || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
  };

  // Handle Sign Up Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanU = (regUsername || '').trim().toLowerCase();
    const cleanP = (regPassword || '').trim();
    const cleanConfirm = (regConfirmPassword || '').trim();
    const cleanName = (regFullName || '').trim();
    const cleanEmail = (regEmail || '').trim();

    if (!cleanName) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      setLoading(false);
      return;
    }

    if (!cleanU) {
      setError('กรุณากรอกชื่อผู้ใช้งาน');
      setLoading(false);
      return;
    }

    if (!cleanP) {
      setError('กรุณากรอกรหัสผ่าน');
      setLoading(false);
      return;
    }

    if (cleanP !== cleanConfirm) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    const newUserObj = {
      username: cleanU,
      password: cleanP,
      name: cleanName,
      fullName: cleanName,
      role: regRole,
      roleLabel: regRole === 'admin' ? 'ผู้ดูแลระบบ' : regRole === 'engineer' ? 'วิศวกร IoT' : 'พนักงานคลังสินค้า',
      email: cleanEmail || `${cleanU}@smartwarehouse.io`,
      avatar: regAvatar // Permanent avatar selected once
    };

    registerUser(newUserObj);

    try {
      await axios.post('/api/register', {
        username: cleanU,
        password: cleanP,
        fullName: cleanName,
        role: regRole,
        email: newUserObj.email,
        avatar: regAvatar
      });
    } catch (err) {
      console.warn('Backend register sync warning:', err.message);
    }

    setLoading(false);
    setSuccessMsg('สมัครสมาชิกสำเร็จเรียบร้อยแล้ว! ไอคอนประจำตัวถูกบันทึกอย่างถาวร');
    setActiveTab('login');
    setUsername(cleanU);
    setPassword('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark 
        ? 'radial-gradient(at 15% 15%, rgba(56, 189, 248, 0.08) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(16, 185, 129, 0.05) 0px, transparent 50%), #090e17' 
        : 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      {/* Floating Theme Switcher */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            padding: '9px 16px',
            fontSize: '0.88rem'
          }}
          title={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{
        maxWidth: activeTab === 'register' ? '1120px' : '490px',
        width: '100%',
        padding: activeTab === 'register' ? '36px 28px' : '40px 36px',
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-color)',
        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255,255,255,0.03)',
        position: 'relative',
        zIndex: 10,
        transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, background 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '18px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            borderRadius: '24px',
            color: '#ffffff',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35), 0 2px 8px rgba(6, 182, 212, 0.2)'
          }}>
            <Boxes size={40} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 55%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.01em', lineHeight: 1.3, marginBottom: '2px' }}>
            ระบบคลังสินค้าอัตโนมัติ AS/RS
          </h1>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--bg-secondary)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '26px',
          border: '1.5px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'login' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <KeyRound size={18} /> เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'register' ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={18} /> สมัครสมาชิก
          </button>
        </div>

        {/* Alert Messages */}
        {loggedOutMsg && (
          <div style={{
            background: '#dcfce7',
            border: '1.5px solid #86efac',
            color: '#15803d',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={20} />
            <span>ออกจากระบบเรียบร้อยแล้ว</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#dcfce7',
            border: '1.5px solid #86efac',
            color: '#15803d',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1.5px solid #fecdd3',
            color: '#b91c1c',
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.95rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Sign In Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                อีเมลหรือชื่อผู้ใช้
              </label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="กรอกอีเมลหรือชื่อผู้ใช้งานของคุณ"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '48px' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                รหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '8px', fontWeight: 700 }}
            >
              <KeyRound size={22} />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '4px 0 2px 0',
              color: 'var(--text-dim)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              <div style={{ flex: 1, height: '1.5px', background: 'var(--border-color)' }} />
              <span>หรือเข้าสู่ระบบด้วย</span>
              <div style={{ flex: 1, height: '1.5px', background: 'var(--border-color)' }} />
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>

            {/* Quick 1-Click Login from Saved / Recent Accounts */}
            {savedGoogleAccounts && savedGoogleAccounts.length > 0 && (
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1.5px solid var(--border-color)'
              }}>
                <div style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>บัญชีที่บันทึกไว้</span>
                  </div>
                  
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedGoogleAccounts.slice(0, 3).map((acc) => {
                    const isAdm = acc.role === 'admin';
                    const isEng = acc.role === 'engineer';
                    const roleColor = isAdm ? '#0284c7' : isEng ? '#7c3aed' : '#059669';
                    const roleBg = isAdm ? 'rgba(2, 132, 199, 0.08)' : isEng ? 'rgba(124, 58, 237, 0.08)' : 'rgba(5, 150, 105, 0.08)';
                    const roleBorder = isAdm ? '#bae6fd' : isEng ? '#e9d5ff' : '#bbf7d0';

                    return (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickLogin(acc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${roleBorder}`,
                          background: roleBg,
                          cursor: loading ? 'wait' : 'pointer',
                          transition: 'all 0.18s ease',
                          textAlign: 'left',
                          gap: '10px',
                          opacity: loading ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!loading) {
                            e.currentTarget.style.borderColor = roleColor;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${roleColor}22`;
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = roleBorder;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{acc.avatar || '👨‍💼'}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.92rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap'
                            }}>
                              <span>{acc.name}</span>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: roleColor,
                                color: '#ffffff'
                              }}>
                                {isAdm ? 'Admin' : isEng ? 'Engineer' : 'Operator'}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-dim)',
                              fontFamily: 'monospace',
                              marginTop: '1px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {acc.email}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: roleColor,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          padding: '4px 10px',
                          borderRadius: '16px',
                          background: 'var(--bg-card)',
                          border: `1px solid ${roleBorder}`
                        }}>
                          {loading ? '...' : 'เข้าสู่ระบบ'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        )}

        {/* 2. Sign Up / Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Permanent Avatar Selection */}
            <div>
              <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Lock size={15} color="var(--accent-sky)" /> เลือกไอคอนประจำตัว (เลือกแล้วล็อคถาวร เปลี่ยนไม่ได้) *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {AVATAR_OPTIONS.map((em, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRegAvatar(em)}
                    style={{
                      fontSize: '1.6rem',
                      padding: '8px',
                      borderRadius: '10px',
                      border: regAvatar === em ? '2.5px solid var(--accent-sky)' : '1.5px solid var(--border-color)',
                      background: regAvatar === em ? (isDark ? 'rgba(2, 132, 199, 0.25)' : '#e0f2fe') : 'var(--bg-card)',
                      cursor: 'pointer',
                      boxShadow: regAvatar === em ? '0 0 0 2px rgba(2, 132, 199, 0.25)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Username Inputs (Responsive Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  ชื่อ-นามสกุล *
                </label>
                <input 
                  type="text" 
                  placeholder="กรอกชื่อและนามสกุล" 
                  className="form-input"
                  value={regFullName} 
                  onChange={(e) => setRegFullName(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  ชื่อผู้ใช้งาน *
                </label>
                <input 
                  type="text" 
                  placeholder="กรอกชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ" 
                  className="form-input"
                  value={regUsername} 
                  onChange={(e) => setRegUsername(e.target.value)} 
                  required
                />
              </div>
            </div>

            {/* Email & Passwords (Responsive Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}>
              <div>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  อีเมล (ไม่บังคับ)
                </label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="form-input"
                  value={regEmail} 
                  onChange={(e) => setRegEmail(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    รหัสผ่าน *
                  </label>
                  <input 
                    type="password" 
                    placeholder="ตั้งรหัสผ่าน" 
                    className="form-input"
                    value={regPassword} 
                    onChange={(e) => setRegPassword(e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    ยืนยันรหัสผ่าน *
                  </label>
                  <input 
                    type="password" 
                    placeholder="ยืนยันอีกครั้ง" 
                    className="form-input"
                    value={regConfirmPassword} 
                    onChange={(e) => setRegConfirmPassword(e.target.value)} 
                    required
                  />
                </div>
              </div>
            </div>

            {/* Netflix / Gemini Style Role & Permissions Plan Selector */}
            <div style={{ marginTop: '8px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="var(--accent-sky)" />
                    เลือกระดับสิทธิ์
                  </label>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                    เลือกสิทธิ์ที่ตรงกับตำแหน่งของคุณ
                  </div>
                </div>
                
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: '16px'
              }}>
                {ROLE_PLANS.map((plan) => {
                  const isSelected = regRole === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setRegRole(plan.id)}
                      style={{
                        position: 'relative',
                        background: isSelected ? (isDark ? 'rgba(2, 132, 199, 0.16)' : plan.bgLight) : 'var(--bg-card)',
                        border: isSelected ? `2.5px solid ${plan.accentColor}` : '2px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '20px 18px',
                        cursor: 'pointer',
                        boxShadow: isSelected 
                          ? `0 12px 28px ${plan.glowColor}, 0 0 0 1px ${plan.accentColor}` 
                          : 'var(--shadow-card)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transform: isSelected ? 'translateY(-3px)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--accent-sky)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 24px ${plan.accentColor}33, 0 2px 8px rgba(0,0,0,0.1)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                        }
                      }}
                    >
                      {/* Top Header: Badge & Radio Check */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{
                            background: isSelected ? plan.accentColor : (isDark ? '#1e293b' : '#f1f5f9'),
                            color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            transition: 'all 0.2s'
                          }}>
                            {plan.badge}
                          </span>

                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? `2px solid ${plan.accentColor}` : '2px solid var(--border-color)',
                            background: isSelected ? plan.accentColor : 'var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 8px ${plan.accentColor}` : 'none'
                          }}>
                            {isSelected && <Check size={15} strokeWidth={3.5} />}
                          </div>
                        </div>

                        {/* Title & Role Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{
                            fontSize: '2rem',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: isSelected ? (isDark ? '#1e293b' : '#ffffff') : (isDark ? '#0f172a' : '#f8fafc'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: `1px solid ${isSelected ? plan.accentColor + '40' : 'var(--border-color)'}`
                          }}>
                            {plan.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                              {plan.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: isSelected ? plan.accentColor : 'var(--text-muted)', fontWeight: 700 }}>
                              {plan.titleEn}
                            </div>
                          </div>
                        </div>

                        <p style={{
                          fontSize: '0.84rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.45,
                          marginBottom: '14px',
                          minHeight: '38px'
                        }}>
                          {plan.desc}
                        </p>

                        <div style={{ height: '1px', background: isSelected ? plan.accentColor + '30' : 'var(--border-color)', marginBottom: '12px' }} />

                        {/* Permissions Feature Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {plan.features.map((feat, fIdx) => (
                            <div key={fIdx} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              fontSize: '0.82rem',
                              color: feat.allowed ? 'var(--text-main)' : 'var(--text-dim)'
                            }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: feat.allowed ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7') : (isDark ? '#1e293b' : '#f1f5f9'),
                                color: feat.allowed ? (isDark ? '#34d399' : '#16a34a') : 'var(--text-dim)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                                marginTop: '1px'
                              }}>
                                {feat.allowed ? '✓' : '✕'}
                              </span>
                              <span style={{
                                fontWeight: feat.allowed ? 600 : 500
                              }}>
                                {feat.text}
                                {feat.note && (
                                  <span style={{
                                    marginLeft: '6px',
                                    fontSize: '0.72rem',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    background: isDark ? '#1e293b' : '#f1f5f9',
                                    color: isDark ? '#94a3b8' : '#64748b'
                                  }}>
                                    ({feat.note})
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Selection Indicator */}
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '10px',
                        textAlign: 'center',
                        borderTop: `1px dashed ${isSelected ? plan.accentColor + '40' : 'var(--border-color)'}`
                      }}>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? plan.accentColor : 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {isSelected ? (
                            <>
                              <CheckCircle size={16} /> กำลังเลือกสิทธิ์นี้
                            </>
                          ) : (
                            'คลิกเพื่อเลือกสิทธิ์นี้'
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn" 
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.12rem',
                marginTop: '14px',
                fontWeight: 700,
                background: regRole === 'admin' 
                  ? 'linear-gradient(135deg, #059669, #047857)' 
                  : regRole === 'engineer' 
                    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' 
                    : 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              <UserPlus size={22} />
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '4px 0 2px 0',
              color: 'var(--text-dim)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              <div style={{ flex: 1, height: '1.5px', background: 'var(--border-color)' }} />
              <span>หรือสมัครด้วย</span>
              <div style={{ flex: 1, height: '1.5px', background: 'var(--border-color)' }} />
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>สมัครสมาชิกด้วย Google</span>
            </button>
          </form>
        )}
      </div>

      {/* Google Sign-In Window (Styled like official Google Dark Mode Dialog) */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            background: '#131314',
            borderRadius: '28px',
            maxWidth: '680px',
            width: '100%',
            padding: '36px 40px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            border: '1px solid #3c4043',
            color: '#e3e3e3',
            position: 'relative'
          }}>
            {/* Top Bar: Google Logo + Brand & Close */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              paddingBottom: '14px',
              borderBottom: '1px solid #282a2d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e3e3e3' }}>
                  ลงชื่อเข้าใช้ด้วย Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9aa0a6',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                  lineHeight: 1,
                  borderRadius: '50%'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#9aa0a6'}
              >
                ✕
              </button>
            </div>

            {/* Main Content: 2-Column Responsive Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px'
            }}>
              {/* Left Column: Heading & Branding */}
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                }}>
                  <Boxes size={26} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 500, color: '#e3e3e3', margin: '0 0 10px 0', lineHeight: 1.2 }}>
                  {googleStep === 'choose_account' ? 'เลือกบัญชี' : 'ลงชื่อเข้าใช้'}
                </h2>
                <p style={{ fontSize: '1rem', color: '#c4c7c5', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  เพื่อดำเนินการต่อไปยัง <strong style={{ color: '#ffffff' }}>Smart warehouse & 3D Realtime ASRS</strong>
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: 'rgba(66, 133, 244, 0.12)',
                  border: '1px solid rgba(66, 133, 244, 0.28)',
                  color: '#a8c7fa',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginTop: '12px',
                  lineHeight: 1.4
                }}>
                  <Mail size={16} style={{ flexShrink: 0 }} />
                  <span>
                    {googleStep === 'choose_account' ? '⚡ คลิกเพื่อเข้าสู่ระบบ' : 'เข้าสู่ระบบหรือสมัครสมาชิกด้วย Google Gmail'}
                  </span>
                </div>

                {/* Back to Chooser button if user is on manual email entry */}
                {googleStep === 'email' && savedGoogleAccounts && savedGoogleAccounts.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => { setGoogleStep('choose_account'); setGoogleError(''); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a8c7fa',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                      }}
                    >
                      <span>← ย้อนกลับไปเลือกบัญชีที่บันทึกไว้</span>
                    </button>
                  </div>
                )}

                {/* Email Chip if on password step */}
                {googleStep === 'password' && (
                  <div
                    onClick={() => { setGoogleStep('email'); setGoogleError(''); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #444746',
                      background: '#1f1f1f',
                      color: '#e3e3e3',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    <span>{googleEmail}</span>
                    <span style={{ fontSize: '0.75rem', color: '#a8c7fa' }}>▼</span>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Form */}
              <div>
                {/* STEP 0: ACCOUNT CHOOSER (Google One-Click Chooser - ไม่ต้องกรอกซ้ำ) */}
                {googleStep === 'choose_account' && (
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#c4c7c5',
                      marginBottom: '12px'
                    }}>
                      เลือกบัญชีที่ลงชื่อเข้าใช้ไว้:
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {savedGoogleAccounts.map((acc, index) => {
                        const isAdm = acc.role === 'admin';
                        const isEng = acc.role === 'engineer';
                        const roleColor = isAdm ? '#38bdf8' : isEng ? '#c084fc' : '#4ade80';
                        const roleBg = isAdm ? 'rgba(56, 189, 248, 0.15)' : isEng ? 'rgba(192, 132, 252, 0.15)' : 'rgba(74, 222, 128, 0.15)';

                        return (
                          <div
                            key={acc.email + index}
                            onClick={() => handleGoogleLogin(acc)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '16px',
                              border: '1px solid #3c4043',
                              background: '#1f1f23',
                              cursor: 'pointer',
                              transition: 'all 0.18s ease',
                              gap: '12px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#2a2a30';
                              e.currentTarget.style.borderColor = '#8e918f';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#1f1f23';
                              e.currentTarget.style.borderColor = '#3c4043';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2b303c, #1f232d)',
                                border: `2px solid ${roleColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                flexShrink: 0
                              }}>
                                {acc.avatar || '👨‍💼'}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {acc.name}
                                  </span>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: roleBg,
                                    color: roleColor,
                                    border: `1px solid ${roleColor}44`
                                  }}>
                                    {isAdm ? '👑 Admin' : isEng ? '🔧 Engineer' : '📦 Operator'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#c4c7c5', marginTop: '2px', fontFamily: 'monospace' }}>
                                  {acc.email}
                                </div>
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#a8c7fa',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              padding: '6px 12px',
                              borderRadius: '20px',
                              background: 'rgba(66, 133, 244, 0.12)'
                            }}>
                              <span>เข้าสู่ระบบ</span>
                              <span>→</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Use another account button */}
                      <div
                        onClick={() => {
                          setGoogleStep('email');
                          setGoogleEmail('');
                          setGoogleError('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '16px',
                          border: '1px dashed #484c50',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          marginTop: '4px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#1a1a1e';
                          e.currentTarget.style.borderColor = '#a8c7fa';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#484c50';
                        }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#282a2d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#a8c7fa',
                          fontSize: '1.3rem',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          +
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#a8c7fa' }}>
                            ใช้บัญชีอื่น
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#8e918f', marginTop: '1px' }}>
                            พิมพ์อีเมล Gmail หรือเบอร์โทรศัพท์อื่น
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest notice */}
                    <div style={{ color: '#8e918f', fontSize: '0.82rem', lineHeight: 1.5, marginTop: '20px' }}>
                      ไม่ใช่คอมพิวเตอร์ของคุณใช่ไหม ให้ใช้โหมดผู้มาเยือนเพื่อลงชื่อเข้าใช้แบบส่วนตัว
                    </div>
                  </div>
                )}

                {/* STEP 1: EMAIL ENTRY */}
                {googleStep === 'email' && (
                  <form onSubmit={handleGoogleEmailNext}>
                    {/* Google Outlined Floating Input */}
                    <div style={{ position: 'relative', marginTop: '10px', marginBottom: '6px' }}>
                      <div style={{
                        position: 'relative',
                        border: `1.5px solid ${googleError ? '#f2b8b5' : googleInputFocused ? '#a8c7fa' : '#8e918f'}`,
                        borderRadius: '4px',
                        padding: '16px',
                        transition: 'border-color 0.2s',
                        background: 'transparent'
                      }}>
                        <label style={{
                          position: 'absolute',
                          top: 0,
                          left: '12px',
                          transform: 'translateY(-50%)',
                          background: '#131314',
                          padding: '0 6px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          color: googleError ? '#f2b8b5' : googleInputFocused ? '#a8c7fa' : '#c4c7c5'
                        }}>
                          อีเมลหรือโทรศัพท์
                        </label>
                        <input
                          type="text"
                          value={googleEmail}
                          onChange={(e) => {
                            setGoogleEmail(e.target.value);
                            if (googleError) setGoogleError('');
                          }}
                          onFocus={() => setGoogleInputFocused(true)}
                          onBlur={() => {
                            setGoogleInputFocused(false);
                            if (googleEmail.trim()) {
                              const err = validateGoogleEmail(googleEmail);
                              if (err) setGoogleError(err);
                            }
                          }}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: '#e3e3e3',
                            fontSize: '1.05rem',
                            fontFamily: 'inherit'
                          }}
                          autoFocus
                        />
                      </div>

                      {/* Error Message */}
                      {googleError && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            color: '#fca5a5',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            lineHeight: 1.4
                          }}>
                            <AlertCircle size={17} color="#fca5a5" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{googleError}</span>
                          </div>
                          {googleError.includes('ยังไม่ได้สมัครสมาชิก') && (
                            <button
                              type="button"
                              onClick={() => {
                                const emailToUse = (googleEmail || '').trim();
                                setShowGoogleModal(false);
                                setActiveTab('register');
                                if (emailToUse) {
                                  const finalEmail = emailToUse.includes('@') ? emailToUse.toLowerCase() : `${emailToUse.toLowerCase()}@gmail.com`;
                                  setRegEmail(finalEmail);
                                  setRegUsername(finalEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                }
                              }}
                              style={{
                                alignSelf: 'flex-start',
                                background: '#38bdf8',
                                color: '#03213a',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginTop: '4px'
                              }}
                            >
                              📝 ไปที่หน้าสมัครสมาชิกด้วย Gmail นี้
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Forgot Email Link */}
                    <div style={{ marginTop: '8px', marginBottom: '28px' }}>
                      <a
                        href="#forgot"
                        onClick={(e) => { e.preventDefault(); alert('หากลืมอีเมล กรุณาติดต่อผู้ดูแลระบบ เพื่อตรวจสอบสิทธิ์การเข้าใช้งาน'); }}
                        style={{ color: '#a8c7fa', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 600 }}
                      >
                        หากลืมอีเมล
                      </a>
                    </div>

                    {/* Guest notice */}
                    <div style={{ color: '#8e918f', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '28px' }}>
                      ไม่ใช่คอมพิวเตอร์ของคุณใช่ไหม ให้ใช้โหมดผู้มาเยือนเพื่อลงชื่อเข้าใช้แบบส่วนตัว
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        type="button"
                        onClick={handleGoogleCreateAccount}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#a8c7fa',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          padding: '8px 0'
                        }}
                      >
                        สร้างบัญชี
                      </button>

                      <button
                        type="submit"
                        disabled={googleLoading}
                        style={{
                          background: '#a8c7fa',
                          color: '#062e6f',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          padding: '10px 28px',
                          borderRadius: '24px',
                          border: 'none',
                          cursor: googleLoading ? 'wait' : 'pointer',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => { if (!googleLoading) e.currentTarget.style.background = '#c2e7ff'; }}
                        onMouseOut={(e) => { if (!googleLoading) e.currentTarget.style.background = '#a8c7fa'; }}
                      >
                        {googleLoading ? (
                          <>
                            <span style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid #062e6f',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              display: 'inline-block',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                            <span>กำลังเชื่อมต่อ Google Gmail...</span>
                          </>
                        ) : 'ถัดไป'}
                      </button>
                    </div>

                    {/* Official Google Accounts Option */}
                    <div style={{
                      marginTop: '22px',
                      paddingTop: '16px',
                      borderTop: '1px solid #282a2d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          const w = 500;
                          const h = 600;
                          const left = (window.screen.width - w) / 2;
                          const top = (window.screen.height - h) / 2;
                          window.open(
                            'https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin',
                            'GoogleSignInPopup',
                            `width=${w},height=${h},top=${top},left=${left}`
                          );
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #3c4043',
                          borderRadius: '20px',
                          color: '#c4c7c5',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          padding: '8px 16px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#8e918f'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#3c4043'; e.currentTarget.style.color = '#c4c7c5'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        เปิดหน้าต่าง Google Accounts เพื่อเลือกบัญชี
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: PASSWORD ENTRY */}
                {googleStep === 'password' && (
                  <form onSubmit={handleGooglePasswordNext}>
                    {/* Google Outlined Floating Input for Password */}
                    <div style={{ position: 'relative', marginTop: '10px', marginBottom: '6px' }}>
                      <div style={{
                        position: 'relative',
                        border: `1.5px solid ${googleError ? '#f2b8b5' : googleInputFocused ? '#a8c7fa' : '#8e918f'}`,
                        borderRadius: '4px',
                        padding: '16px',
                        transition: 'border-color 0.2s',
                        background: 'transparent'
                      }}>
                        <label style={{
                          position: 'absolute',
                          top: 0,
                          left: '12px',
                          transform: 'translateY(-50%)',
                          background: '#131314',
                          padding: '0 6px',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          color: googleError ? '#f2b8b5' : googleInputFocused ? '#a8c7fa' : '#c4c7c5'
                        }}>
                          ป้อนรหัสผ่านของคุณ
                        </label>
                        <input
                          type={showGooglePassword ? 'text' : 'password'}
                          value={googlePassword}
                          onChange={(e) => {
                            setGooglePassword(e.target.value);
                            if (googleError) setGoogleError('');
                          }}
                          onFocus={() => setGoogleInputFocused(true)}
                          onBlur={() => setGoogleInputFocused(false)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: '#e3e3e3',
                            fontSize: '1.05rem',
                            fontFamily: 'inherit'
                          }}
                          autoFocus
                        />
                      </div>

                      {/* Error Message */}
                      {googleError && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            color: '#fca5a5',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            lineHeight: 1.4
                          }}>
                            <AlertCircle size={17} color="#fca5a5" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{googleError}</span>
                          </div>
                          {googleError.includes('ยังไม่ได้สมัครสมาชิก') && (
                            <button
                              type="button"
                              onClick={() => {
                                const emailToUse = (googleEmail || '').trim();
                                setShowGoogleModal(false);
                                setActiveTab('register');
                                if (emailToUse) {
                                  const finalEmail = emailToUse.includes('@') ? emailToUse.toLowerCase() : `${emailToUse.toLowerCase()}@gmail.com`;
                                  setRegEmail(finalEmail);
                                  setRegUsername(finalEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                }
                              }}
                              style={{
                                alignSelf: 'flex-start',
                                background: '#38bdf8',
                                color: '#03213a',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginTop: '4px'
                              }}
                            >
                              📝 ไปที่หน้าสมัครสมาชิกด้วย Gmail นี้
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Show password checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', marginBottom: '28px' }}>
                      <input
                        type="checkbox"
                        id="showPassGoogle"
                        checked={showGooglePassword}
                        onChange={(e) => setShowGooglePassword(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: '#a8c7fa', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="showPassGoogle" style={{ color: '#c4c7c5', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                        แสดงรหัสผ่าน
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginTop: '32px'
                    }}>
                      <button
                        type="button"
                        onClick={() => { setGoogleStep('email'); setGoogleError(''); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#a8c7fa',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          padding: '8px 0'
                        }}
                      >
                        ← ย้อนกลับ
                      </button>

                      <button
                        type="submit"
                        disabled={googleLoading}
                        style={{
                          background: '#a8c7fa',
                          color: '#062e6f',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          padding: '10px 28px',
                          borderRadius: '24px',
                          border: 'none',
                          cursor: googleLoading ? 'wait' : 'pointer',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#c2e7ff'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#a8c7fa'}
                      >
                        {googleLoading ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
