import React, { createContext, useContext, useState } from 'react';

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
    label: 'ผู้ดูแลระบบ (Admin)',
    department: 'ฝ่ายบริหารคลังสินค้า (Executive)',
    departmentCode: 'MGMT',
    badge: '👑 ฝ่ายบริหาร (Admin)',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#7dd3fc',
    description: 'สิทธิ์สูงสุดทุกระบบ: จัดการโครงสร้างแร็ค นำเข้า เบิกจ่าย ลบประวัติ และควบคุมความปลอดภัย',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม (Purge)', allowed: true, note: 'เฉพาะ Admin' },
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
    label: 'เจ้าหน้าที่คลังสินค้า (Operator)',
    department: 'ฝ่ายปฏิบัติการรับเข้า-เบิกจ่าย (Operations)',
    departmentCode: 'OPS',
    badge: '📦 ฝ่ายปฏิบัติการ (Operator)',
    color: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    description: 'เน้นงานเคลื่อนย้ายสินค้า: นำเข้า สแกนบาร์โค้ด และสั่งเบิกจ่ายสินค้า (จำกัดสิทธิ์แก้ไขโครงสร้างและลบประวัติ)',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: false, note: '🔒 เฉพาะฝ่ายบริหาร & วิศวกรรม' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม (Purge)', allowed: false, note: '🔒 ดูได้อย่างเดียว (ห้ามลบ)' },
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
    label: 'วิศวกรโครงสร้างและระบบคลัง (Engineer)',
    department: 'ฝ่ายวิศวกรรมและโครงสร้างคลัง (Engineering)',
    departmentCode: 'ENG',
    badge: '🔧 ฝ่ายวิศวกรรม (Engineer)',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    description: 'เน้นงานโครงสร้างและเทคนิค: ออกแบบผังคลัง เพิ่มช่องจัดเก็บ มอนิเตอร์ IoT ESP32 (จำกัดสิทธิ์เบิกจ่ายสินค้าจริง)',
    capabilities: [
      { id: 'inbound', name: 'นำเข้าสินค้า & พิมพ์ฉลาก QR', allowed: true, note: 'ทดสอบนำเข้าได้' },
      { id: 'outbound', name: 'สั่งเบิกจ่ายสินค้าอัตโนมัติ', allowed: false, note: '🔒 เฉพาะฝ่ายปฏิบัติการ & บริหาร' },
      { id: 'slots', name: 'เพิ่ม/ขยายช่องจัดเก็บชั้นวาง', allowed: true, note: 'อนุญาตสมบูรณ์' },
      { id: 'history', name: 'ดูและล้างประวัติธุรกรรม (Purge)', allowed: false, note: '🔒 ดูได้อย่างเดียว (ห้ามลบ)' },
      { id: 'hardware', name: 'ควบคุมความปลอดภัย & ปลดล็อค E-Stop', allowed: true, note: 'อนุญาตสมบูรณ์' }
    ]
  }
};

export const DEFAULT_ACCOUNTS = [
  {
    username: 'admin',
    password: '',
    hasCustomPassword: false,
    name: 'สมชาย จัดการคลัง',
    role: 'admin',
    roleLabel: 'ผู้ดูแลระบบ (Admin)',
    department: 'ฝ่ายบริหารคลังสินค้า (Executive)',
    departmentCode: 'MGMT',
    email: 'admin@smartwarehouse.io',
    avatar: '👨‍💼',
    phone: '081-234-5678'
  },
  {
    username: 'operator',
    password: '',
    hasCustomPassword: false,
    name: 'กิตติยา สแกนสต็อก',
    role: 'operator',
    roleLabel: 'เจ้าหน้าที่คลังสินค้า (Operator)',
    department: 'ฝ่ายปฏิบัติการรับเข้า-เบิกจ่าย (Operations)',
    departmentCode: 'OPS',
    email: 'operator@smartwarehouse.io',
    avatar: '👩‍🔧',
    phone: '089-876-5432'
  },
  {
    username: 'engineer',
    password: '',
    hasCustomPassword: false,
    name: 'วิศวกร ซ่อมบำรุง',
    role: 'engineer',
    roleLabel: 'วิศวกรระบบและผังคลัง (Engineer)',
    department: 'ฝ่ายวิศวกรรมและโครงสร้างคลัง (Engineering)',
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
            hasCustomPassword: Boolean(u.hasCustomPassword && u.password && u.password !== 'password123'),
            password: (u.hasCustomPassword && u.password && u.password !== 'password123') ? u.password : ''
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_ACCOUNTS;
  });

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

  const setUserPassword = (username, newPassword) => {
    const cleanU = (username || '').toLowerCase();
    const updatedList = (registeredUsers || DEFAULT_ACCOUNTS).map(u => 
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

  const login = (account) => {
    const cleanU = (account?.username || '').toLowerCase();
    const existing = registeredUsers?.find(u => u.username.toLowerCase() === cleanU);
    const finalAccount = existing ? { ...existing, ...account } : account;
    setUser(finalAccount);
    localStorage.setItem('asrs_user', JSON.stringify(finalAccount));
    localStorage.setItem('username', finalAccount.username);
    localStorage.setItem('role', finalAccount.role);
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
    const updated = [...registeredUsers.filter(u => u.username.toLowerCase() !== newUser.username.toLowerCase()), newUser];
    setRegisteredUsers(updated);
    localStorage.setItem('asrs_registered_users', JSON.stringify(updated));
  };

  const updateUserProfile = (updatedData) => {
    const isUpdatingPassword = Boolean(updatedData.password);
    const updatedUser = { 
      ...user, 
      ...updatedData,
      ...(isUpdatingPassword ? { hasCustomPassword: true } : {})
    };
    setUser(updatedUser);
    localStorage.setItem('asrs_user', JSON.stringify(updatedUser));

    const updatedList = registeredUsers.map(u => 
      u.username.toLowerCase() === updatedUser.username.toLowerCase() 
        ? { ...u, ...updatedData, ...(isUpdatingPassword ? { hasCustomPassword: true } : {}) } 
        : u
    );
    setRegisteredUsers(updatedList);
    localStorage.setItem('asrs_registered_users', JSON.stringify(updatedList));

    return { success: true, message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว' };
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

