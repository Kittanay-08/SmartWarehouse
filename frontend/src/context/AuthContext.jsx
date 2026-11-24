import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  admin: {
    canViewDashboard: true,
    canInbound: true,
    canOutbound: true,
    canManageSlots: true,
    canDeleteHistory: true,
    canControlHardware: true,
    canManageUsers: true,
    label: 'ผู้ดูแลระบบ',
    department: 'ฝ่ายบริหาร',
    departmentCode: 'MGMT',
    badge: '👑 ฝ่ายบริหาร',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#7dd3fc',
    description: 'สิทธิ์สูงสุดทุกระบบ: จัดการโครงสร้างแร็ค นำเข้า เบิกจ่าย ลบประวัติ และควบคุมความปลอดภัย',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม', allowed: true, note: 'เฉพาะ Admin' },
      { id: 'hardware', name: 'ควบคุมความปลอดภัย & ปลดล็อค E-Stop', allowed: true, note: 'อนุญาตสมบูรณ์' }
    ]
  },
  operator: {
    canViewDashboard: true,
    canInbound: true,
    canOutbound: true,
    canManageSlots: false,
    canDeleteHistory: false,
    canControlHardware: false,
    canManageUsers: false,
    label: 'เจ้าหน้าที่คลัง',
    department: 'ฝ่ายปฏิบัติการ',
    departmentCode: 'OPS',
    badge: '📦 ฝ่ายปฏิบัติการ',
    color: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    description: 'เน้นงานเคลื่อนย้ายสินค้า: นำเข้า สแกนบาร์โค้ด และสั่งเบิกจ่ายสินค้า (จำกัดสิทธิ์แก้ไขโครงสร้างและลบประวัติ)',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: false, note: '🔒 เฉพาะฝ่ายบริหาร & วิศวกรรม' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม', allowed: false, note: '🔒 ดูได้อย่างเดียว (ห้ามลบ)' },
      { id: 'hardware', name: 'ควบคุมความปลอดภัย & ปลดล็อค E-Stop', allowed: false, note: '🔒 หยุดฉุกเฉินได้ แต่ปลดล็อคไม่ได้' }
    ]
  },
  engineer: {
    canViewDashboard: true,
    canInbound: true,
    canOutbound: false,
    canManageSlots: true,
    canDeleteHistory: false,
    canControlHardware: true,
    canManageUsers: false,
    label: 'วิศวกรระบบ',
    department: 'ฝ่ายวิศวกรรม',
    departmentCode: 'ENG',
    badge: '🔧 ฝ่ายวิศวกรรม',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    description: 'เน้นงานโครงสร้างและเทคนิค: ออกแบบผังคลัง เพิ่มช่องจัดเก็บ มอนิเตอร์ IoT ESP32 (จำกัดสิทธิ์เบิกจ่ายสินค้าจริง)',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'ทดสอบนำเข้าได้' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: false, note: '🔒 เฉพาะฝ่ายปฏิบัติการ & บริหาร' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม', allowed: false, note: '🔒 ดูได้อย่างเดียว (ห้ามลบ)' },
      { id: 'hardware', name: 'ควบคุมความปลอดภัย & ปลดล็อค E-Stop', allowed: true, note: 'อนุญาตสมบูรณ์' }
    ]
  }
};

export const DEFAULT_ACCOUNTS = [
  {
    username: 'admin',
    password: 'password123',
    hasCustomPassword: true,
    name: 'สมชาย จัดการคลัง',
    role: 'admin',
    roleLabel: 'ผู้ดูแลระบบ',
    department: 'ฝ่ายบริหาร',
    departmentCode: 'MGMT',
    email: 'admin@smartwarehouse.io',
    avatar: '👨‍💼',
    phone: '081-234-5678'
  },
  {
    username: 'operator',
    password: 'password123',
    hasCustomPassword: true,
    name: 'กิตติยา สแกนสต็อก',
    role: 'operator',
    roleLabel: 'เจ้าหน้าที่คลัง',
    department: 'ฝ่ายปฏิบัติการ',
    departmentCode: 'OPS',
    email: 'operator@smartwarehouse.io',
    avatar: '👩‍🔧',
    phone: '089-876-5432'
  },
  {
    username: 'engineer',
    password: 'password123',
    hasCustomPassword: true,
    name: 'วิศวกร ซ่อมบำรุง',
    role: 'engineer',
    roleLabel: 'วิศวกรระบบ',
    department: 'ฝ่ายวิศวกรรม',
    departmentCode: 'ENG',
    email: 'engineer@smartwarehouse.io',
    avatar: '🧑‍💻',
    phone: '086-555-4321'
  }
];

export const AuthProvider = ({ children }) => {
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('asrs_registered_users');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => ({
            ...u,
            hasCustomPassword: Boolean(u.password),
            password: u.password || 'password123'
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_ACCOUNTS;
  });

  // Automatically sync registered users from backend on load (cross-device support)
  useEffect(() => {
    const syncUsersFromBackend = async () => {
      try {
        const res = await axios.get('/api/users');
        const userList = Array.isArray(res.data) ? res.data : (res.data?.users && Array.isArray(res.data.users) ? res.data.users : []);
        if (userList.length > 0) {
          setRegisteredUsers(prev => {
            const currentList = Array.isArray(prev) ? [...prev] : [...DEFAULT_ACCOUNTS];
            for (const bUser of userList) {
              const idx = currentList.findIndex(u => u.username.toLowerCase() === bUser.username.toLowerCase());
              if (idx >= 0) {
                currentList[idx] = { 
                  ...currentList[idx], 
                  ...bUser,
                  password: currentList[idx].password || 'password123',
                  hasCustomPassword: true
                };
              } else {
                currentList.push({
                  ...bUser,
                  password: bUser.password || 'password123',
                  hasCustomPassword: true
                });
              }
            }
            localStorage.setItem('asrs_registered_users', JSON.stringify(currentList));
            return currentList;
          });
        }
      } catch (err) {
        console.warn('Backend user directory sync standby:', err.message);
      }
    };
    syncUsersFromBackend();
  }, []);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('asrs_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed) {
          const isCustom = Boolean(parsed.hasCustomPassword && parsed.password && parsed.password !== 'password123');
          return {
            ...parsed,
            hasCustomPassword: isCustom,
            password: isCustom ? parsed.password : ''
          };
        }
      } catch (e) {}
    }
    return DEFAULT_ACCOUNTS[0];
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const setUserPassword = async (username, newPassword) => {
    const cleanU = (username || '').toLowerCase();
    try {
      await axios.post('/api/change-password', {
        username: cleanU,
        currentPassword: 'password123',
        newPassword: newPassword
      });
    } catch (e) {
      try {
        await axios.post('/api/register', {
          username: cleanU,
          password: newPassword,
          fullName: cleanU.toUpperCase(),
          role: 'operator'
        });
      } catch (err2) {}
    }

    const currentList = registeredUsers && registeredUsers.length > 0 ? registeredUsers : DEFAULT_ACCOUNTS;
    const updatedList = currentList.map(u => 
      u.username.toLowerCase() === cleanU 
        ? { ...u, password: newPassword, hasCustomPassword: true } 
        : u
    );
    setRegisteredUsers(updatedList);
    localStorage.setItem('asrs_registered_users', JSON.stringify(updatedList));

    if (user?.username?.toLowerCase() === cleanU) {
      const updatedUser = { ...user, password: newPassword, hasCustomPassword: true };
      setUser(updatedUser);
      localStorage.setItem('asrs_user', JSON.stringify(updatedUser));
    }
    return { success: true, message: 'ตั้งรหัสผ่านสำเร็จเรียบร้อย' };
  };

  const login = (account, token) => {
    const cleanU = (account?.username || '').toLowerCase();
    const existing = registeredUsers?.find(u => u.username.toLowerCase() === cleanU);
    const finalAccount = existing ? { ...existing, ...account } : account;
    setUser(finalAccount);
    localStorage.setItem('asrs_user', JSON.stringify(finalAccount));
    localStorage.setItem('username', finalAccount.username);
    localStorage.setItem('role', finalAccount.role);
    const validToken = token || localStorage.getItem('token') || `asrs_token_${cleanU}_${Date.now()}`;
    localStorage.setItem('token', validToken);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setUser(DEFAULT_ACCOUNTS[1]);
    localStorage.removeItem('asrs_user');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  };

  const registerUser = (newUser) => {
    const userToSave = {
      ...newUser,
      hasCustomPassword: Boolean(newUser.password),
      password: newUser.password || ''
    };
    const updated = [...registeredUsers.filter(u => u.username.toLowerCase() !== newUser.username.toLowerCase()), userToSave];
    setRegisteredUsers(updated);
    localStorage.setItem('asrs_registered_users', JSON.stringify(updated));
  };

  const updateUserProfile = async (updatedData) => {
    const isUpdatingPassword = Boolean(updatedData.password);
    const cleanU = (user?.username || '').toLowerCase();

    // 1. If updating password, call real backend API to verify current password & persist new password
    if (isUpdatingPassword) {
      try {
        const res = await axios.post('/api/change-password', {
          username: user.username,
          currentPassword: updatedData.currentPassword,
          newPassword: updatedData.password
        });
        if (!res.data || !res.data.success) {
          return { success: false, message: res.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
        }
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        return { success: false, message: msg };
      }
    }

    // 2. Call backend profile update endpoint
    try {
      await axios.post('/api/user/profile', {
        username: user.username,
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone,
        department: updatedData.department,
        avatar: updatedData.avatar
      });
    } catch (e) {
      console.warn('Backend profile update note:', e.message);
    }

    // 3. Update React state & localStorage
    const updatedUser = { 
      ...user, 
      ...updatedData,
      ...(isUpdatingPassword ? { password: updatedData.password, hasCustomPassword: true } : {})
    };
    setUser(updatedUser);
    localStorage.setItem('asrs_user', JSON.stringify(updatedUser));

    const currentList = registeredUsers && registeredUsers.length > 0 ? registeredUsers : DEFAULT_ACCOUNTS;
    const updatedList = currentList.map(u => 
      u.username.toLowerCase() === cleanU 
        ? { ...u, ...updatedData, ...(isUpdatingPassword ? { password: updatedData.password, hasCustomPassword: true } : {}) } 
        : u
    );
    setRegisteredUsers(updatedList);
    localStorage.setItem('asrs_registered_users', JSON.stringify(updatedList));

    return { 
      success: true, 
      message: isUpdatingPassword 
        ? 'เปลี่ยนรหัสผ่านและอัปเดตข้อมูลส่วนตัวสำเร็จแล้ว' 
        : 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว' 
    };
  };

  const canManageSlots = (u = user) => {
    const role = u?.role || 'operator';
    return Boolean(ROLE_PERMISSIONS[role]?.canManageSlots);
  };

  const canPerformInbound = (u = user) => {
    const role = u?.role || 'operator';
    return Boolean(ROLE_PERMISSIONS[role]?.canInbound);
  };

  const canPerformOutbound = (u = user) => {
    const role = u?.role || 'operator';
    return Boolean(ROLE_PERMISSIONS[role]?.canOutbound);
  };

  const canDeleteHistory = (u = user) => {
    const role = u?.role || 'operator';
    return Boolean(ROLE_PERMISSIONS[role]?.canDeleteHistory);
  };

  const canControlHardware = (u = user) => {
    const role = u?.role || 'operator';
    return Boolean(ROLE_PERMISSIONS[role]?.canControlHardware);
  };

  const getDepartmentInfo = (u = user) => {
    const role = u?.role || 'operator';
    const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.operator;
    return {
      code: config.departmentCode,
      name: config.department,
      badge: config.badge,
      color: config.color,
      bg: config.bg,
      border: config.border,
      description: config.description,
      capabilities: config.capabilities,
      permissions: config.capabilities.filter(c => c.allowed).map(c => c.name)
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      registerUser,
      setUserPassword,
      updateUserProfile,
      registeredUsers,
      isLoginModalOpen,
      setIsLoginModalOpen,
      isProfileModalOpen,
      setIsProfileModalOpen,
      canManageSlots,
      canPerformInbound,
      canPerformOutbound,
      canDeleteHistory,
      canControlHardware,
      getDepartmentInfo,
      ROLE_PERMISSIONS,
      demoAccounts: DEFAULT_ACCOUNTS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

