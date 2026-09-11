import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

const WarehouseContext = createContext(null);

// 9 Standard AS/RS Slots (3 Levels x 3 Bays = 9 Slots)
const DEFAULT_SLOTS = [
  { slot_id: 1, slot_code: 'A-01-01', rack: 'A', level: 1, bay: 1, x_axis: 1.0, y_axis: 1.0, z_axis: 1.0, is_occupied: true, product_name: 'น้ำดื่มคริสตัล 600ml (Pack 12)', qr_code: '8851950001015', category: 'Beverages', weight_kg: 7.5, lot_number: 'LOT-2026-A101', stored_at: new Date(Date.now() - 3600000).toISOString() },
  { slot_id: 2, slot_code: 'A-01-02', rack: 'A', level: 1, bay: 2, x_axis: 2.0, y_axis: 1.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, weight_kg: 0, lot_number: null, stored_at: null },
  { slot_id: 3, slot_code: 'A-01-03', rack: 'A', level: 1, bay: 3, x_axis: 3.0, y_axis: 1.0, z_axis: 1.0, is_occupied: true, product_name: 'ชิป ESP32-WROOM Dual Core', qr_code: '8850029381023', category: 'Electronics', weight_kg: 0.8, lot_number: 'LOT-2026-E402', stored_at: new Date(Date.now() - 7200000).toISOString() },
  { slot_id: 4, slot_code: 'A-02-01', rack: 'A', level: 2, bay: 1, x_axis: 1.0, y_axis: 2.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, weight_kg: 0, lot_number: null, stored_at: null },
  { slot_id: 5, slot_code: 'A-02-02', rack: 'A', level: 2, bay: 2, x_axis: 2.0, y_axis: 2.0, z_axis: 1.0, is_occupied: true, product_name: 'ขนม เลย์ รสคลาสสิค 75g', qr_code: '8850718801129', category: 'Snacks', weight_kg: 1.2, lot_number: 'LOT-2026-S110', stored_at: new Date(Date.now() - 14400000).toISOString() },
  { slot_id: 6, slot_code: 'A-02-03', rack: 'A', level: 2, bay: 3, x_axis: 3.0, y_axis: 2.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, weight_kg: 0, lot_number: null, stored_at: null },
  { slot_id: 7, slot_code: 'A-03-01', rack: 'A', level: 3, bay: 1, x_axis: 1.0, y_axis: 3.0, z_axis: 1.0, is_occupied: true, product_name: 'มอเตอร์ NEMA 17 Stepper', qr_code: '8859948123019', category: 'Parts', weight_kg: 2.4, lot_number: 'LOT-2026-P881', stored_at: new Date(Date.now() - 21600000).toISOString() },
  { slot_id: 8, slot_code: 'A-03-02', rack: 'A', level: 3, bay: 2, x_axis: 2.0, y_axis: 3.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, weight_kg: 0, lot_number: null, stored_at: null },
  { slot_id: 9, slot_code: 'A-03-03', rack: 'A', level: 3, bay: 3, x_axis: 3.0, y_axis: 3.0, z_axis: 1.0, is_occupied: false, product_name: null, qr_code: null, category: null, weight_kg: 0, lot_number: null, stored_at: null }
];

const DEFAULT_TRANSACTIONS = [
  { id: 101, transaction_type: 'STORE_IN', slot_id: 1, slot_code: 'A-01-01', product_name: 'น้ำดื่มคริสตัล 600ml (Pack 12)', qr_code: '8851950001015', category: 'Beverages', weight_kg: 7.5, operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', details: 'สแกน QR Code พิมพ์ฉลาก และจัดเก็บเข้าช่องสำเร็จ', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 102, transaction_type: 'STORE_IN', slot_id: 3, slot_code: 'A-01-03', product_name: 'ชิป ESP32-WROOM Dual Core', qr_code: '8850029381023', category: 'Electronics', weight_kg: 0.8, operator_name: 'สมชาย จัดการคลัง', operator_role: 'admin', status: 'COMPLETED', details: 'สแกน QR Code พิมพ์ฉลาก และจัดเก็บเข้าช่องสำเร็จ', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 103, transaction_type: 'STORE_IN', slot_id: 5, slot_code: 'A-02-02', product_name: 'ขนม เลย์ รสคลาสสิค 75g', qr_code: '8850718801129', category: 'Snacks', weight_kg: 1.2, operator_name: 'กิตติยา สแกนสต็อก', operator_role: 'operator', status: 'COMPLETED', details: 'จัดเก็บเข้าชั้นวางสำเร็จ', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 104, transaction_type: 'STORE_IN', slot_id: 7, slot_code: 'A-03-01', product_name: 'มอเตอร์ NEMA 17 Stepper', qr_code: '8859948123019', category: 'Parts', weight_kg: 2.4, operator_name: 'วิศวกร ซ่อมบำรุง', operator_role: 'engineer', status: 'COMPLETED', details: 'จัดเก็บเข้าชั้นวางสำเร็จ', created_at: new Date(Date.now() - 21600000).toISOString() }
];

const INITIAL_PRODUCT_CATALOG = {
  '8851950001015': { name: 'น้ำดื่มคริสตัล 600ml (Pack 12)', category: 'Beverages', weight: '7.5' },
  '8850029381023': { name: 'ชิป ESP32-WROOM Dual Core', category: 'Electronics', weight: '0.8' },
  '8850718801129': { name: 'ขนม เลย์ รสคลาสสิค 75g', category: 'Snacks', weight: '1.2' },
  '8859948123019': { name: 'มอเตอร์ NEMA 17 Stepper', category: 'Parts', weight: '2.4' },
  '8850123456789': { name: 'นมสดไทย-เดนมาร์ค UHT 200ml (Pack 6)', category: 'Beverages', weight: '1.3' },
  '8859876543210': { name: 'สายพานไทม์มิ่ง GT2 6mm (5 เมตร)', category: 'Parts', weight: '0.4' },
};

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export const WarehouseProvider = ({ children }) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem('asrs_slots_9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_SLOTS;
  });
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('asrs_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(t => (Date.now() - new Date(t.created_at).getTime()) <= THREE_MONTHS_MS);
        }
      } catch (e) {}
    }
    return DEFAULT_TRANSACTIONS;
  });

  // Persistent Self-Learning Product Barcode Catalog
  const [productCatalog, setProductCatalog] = useState(() => {
    const saved = localStorage.getItem('asrs_product_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_PRODUCT_CATALOG, ...parsed };
      } catch (e) {}
    }
    return INITIAL_PRODUCT_CATALOG;
  });

  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [craneState, setCraneState] = useState({
    status: 'IDLE',
    currentX: 0.0,
    currentY: 0.0,
    currentZ: 0.0,
    targetX: 0.0,
    targetY: 0.0,
    targetZ: 0.0,
    targetSlotId: null,
    targetSlotCode: null,
    forkExtended: false,
    hasPayload: false,
    carriedItem: null,
    emergencyStop: false,
    stepProgress: 0,
    stepDescription: 'พร้อมทำงาน (System Ready)'
  });

  const [mqttStatus, setMqttStatus] = useState({ connected: true, broker: 'mqtt://localhost:1883' });
  const [esp32Connected, setEsp32Connected] = useState(true);
  const [simulatorActive, setSimulatorActive] = useState(true);
  const [mqttLogs, setMqttLogs] = useState([]);
  const [lastScannedQr, setLastScannedQr] = useState(null);

  // Save slots, transactions, and learned product catalog locally
  useEffect(() => {
    localStorage.setItem('asrs_slots_9', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    const valid = transactions.filter(t => (Date.now() - new Date(t.created_at).getTime()) <= THREE_MONTHS_MS);
    localStorage.setItem('asrs_transactions', JSON.stringify(valid));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('asrs_product_catalog', JSON.stringify(productCatalog));
  }, [productCatalog]);

  // Method to learn and remember products
  const saveProductToCatalog = (barcode, productData) => {
    if (!barcode || !barcode.trim() || !productData || !productData.name) return;
    const cleanKey = barcode.trim().toLowerCase();
    setProductCatalog(prev => {
      const updated = {
        ...prev,
        [cleanKey]: {
          name: productData.name,
          category: productData.category || 'General',
          weight: String(productData.weight || '1.0'),
          updatedAt: new Date().toISOString()
        }
      };
      localStorage.setItem('asrs_product_catalog', JSON.stringify(updated));
      return updated;
    });
  };

  const lookupProduct = (barcode) => {
    if (!barcode || !barcode.trim()) return null;
    const cleanKey = barcode.trim().toLowerCase();
    return productCatalog[cleanKey] || null;
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [slotsRes, transRes, asrsRes] = await Promise.all([
        axios.get(`/api/slots`).catch(() => null),
        axios.get(`/api/logs?limit=100`).catch(() => null),
        axios.get(`/api/asrs/status`).catch(() => null)
      ]);

      if (slotsRes && Array.isArray(slotsRes.data) && slotsRes.data.length > 0) {
        setSlots(slotsRes.data);
      }
      if (transRes && Array.isArray(transRes.data) && transRes.data.length > 0) {
        const filtered = transRes.data.filter(t => (Date.now() - new Date(t.created_at).getTime()) <= THREE_MONTHS_MS);
        setTransactions(filtered);
      }
      if (asrsRes && asrsRes.data) {
        if (asrsRes.data.crane) setCraneState(asrsRes.data.crane);
        if (asrsRes.data.mqttConnected !== undefined) setMqttStatus(prev => ({ ...prev, connected: asrsRes.data.mqttConnected }));
        if (asrsRes.data.simulatorActive !== undefined) setSimulatorActive(asrsRes.data.simulatorActive);
      }
      setLoading(false);
    } catch (err) {
      console.warn('Backend offline or initializing:', err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Real-time connection
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected to AS/RS Gateway');
    });

    socket.on('slots_updated', (updatedSlots) => {
      if (Array.isArray(updatedSlots) && updatedSlots.length > 0) {
        setSlots(updatedSlots);
      }
    });

    socket.on('crane_telemetry', (telemetry) => {
      setCraneState(telemetry);
    });

    socket.on('transaction_created', (newTrans) => {
      setTransactions(prev => [newTrans, ...prev.filter(t => t.id !== newTrans.id)]);
    });

    socket.on('transactions_cleared', () => {
      setTransactions([]);
      localStorage.removeItem('asrs_transactions');
    });

    socket.on('mqtt_message', (msg) => {
      setMqttLogs(prev => [msg, ...prev.slice(0, 49)]);
    });

    socket.on('mqtt_status', (status) => {
      setMqttStatus(status);
    });

    socket.on('esp32_status', (status) => {
      setEsp32Connected(status.connected);
    });

    socket.on('qr_scanned', (data) => {
      console.log('📷 Socket received qr_scanned:', data);
      setLastScannedQr({
        code: data.scanned_qr || '',
        device: data.device || 'ESP32_CAM',
        timestamp: data.timestamp || Date.now()
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Store-In Handler
  const storeIn = async (formData) => {
    const targetSlot = slots.find(s => s.slot_id === formData.slotId);
    const newLog = {
      id: Date.now(),
      transaction_type: 'STORE_IN',
      slot_id: formData.slotId,
      slot_code: targetSlot?.slot_code || `Slot #${formData.slotId}`,
      product_name: formData.productName,
      qr_code: formData.qrCode,
      category: formData.category || 'General',
      weight_kg: formData.weightKg || 1.0,
      lot_number: formData.lotNumber || '-',
      operator_name: user?.name || 'ผู้ใช้งาน',
      operator_role: user?.role || 'operator',
      status: 'COMPLETED',
      details: 'พิมพ์ฉลาก QR Code และนำเข้าจัดเก็บสำเร็จ',
      created_at: new Date().toISOString()
    };

    // Auto-learn this product for future scans!
    saveProductToCatalog(formData.qrCode, {
      name: formData.productName,
      category: formData.category,
      weight: formData.weightKg
    });

    try {
      const res = await axios.post(`/api/store-in`, {
        ...formData,
        operatorName: user?.name,
        operatorRole: user?.role
      });

      setSlots(prev => prev.map(s => {
        if (s.slot_id === formData.slotId) {
          return {
            ...s,
            is_occupied: true,
            product_name: formData.productName,
            qr_code: formData.qrCode,
            category: formData.category,
            weight_kg: formData.weightKg,
            lot_number: formData.lotNumber,
            stored_at: new Date().toISOString()
          };
        }
        return s;
      }));

      setTransactions(prev => [newLog, ...prev]);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      fetchData();
      return { success: true, message: res.data.message || `นำเข้าสินค้า "${formData.productName}" สำเร็จ!` };
    } catch (err) {
      setSlots(prev => prev.map(s => {
        if (s.slot_id === formData.slotId) {
          return {
            ...s,
            is_occupied: true,
            product_name: formData.productName,
            qr_code: formData.qrCode,
            category: formData.category,
            weight_kg: formData.weightKg,
            lot_number: formData.lotNumber,
            stored_at: new Date().toISOString()
          };
        }
        return s;
      }));

      setTransactions(prev => [newLog, ...prev]);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      return { success: true, message: `นำเข้าสินค้า "${formData.productName}" เข้าช่อง ${targetSlot?.slot_code} สำเร็จ!` };
    }
  };

  // Store-Out Handler
  const storeOut = async (slotId) => {
    const targetSlot = slots.find(s => s.slot_id === slotId);
    const newLog = {
      id: Date.now(),
      transaction_type: 'RETRIEVE_OUT',
      slot_id: slotId,
      slot_code: targetSlot?.slot_code || `Slot #${slotId}`,
      product_name: targetSlot?.product_name || 'สินค้า',
      qr_code: targetSlot?.qr_code || '-',
      category: targetSlot?.category || 'General',
      operator_name: user?.name || 'ผู้ใช้งาน',
      operator_role: user?.role || 'operator',
      status: 'COMPLETED',
      details: 'เบิกจ่ายสินค้าสำเร็จ',
      created_at: new Date().toISOString()
    };

    try {
      const res = await axios.post(`/api/store-out`, {
        slotId,
        operatorName: user?.name,
        operatorRole: user?.role
      });
      
      setSlots(prev => prev.map(s => {
        if (s.slot_id === slotId) {
          return {
            ...s,
            is_occupied: false,
            product_name: null,
            qr_code: null,
            category: null,
            weight_kg: 0,
            lot_number: null,
            stored_at: null
          };
        }
        return s;
      }));
      setTransactions(prev => [newLog, ...prev]);
      fetchData();
      return { success: true, message: res.data.message || `เบิกจ่ายสินค้า "${targetSlot?.product_name || ''}" สำเร็จ!` };
    } catch (err) {
      setSlots(prev => prev.map(s => {
        if (s.slot_id === slotId) {
          return {
            ...s,
            is_occupied: false,
            product_name: null,
            qr_code: null,
            category: null,
            weight_kg: 0,
            lot_number: null,
            stored_at: null
          };
        }
        return s;
      }));
      setTransactions(prev => [newLog, ...prev]);

      return { success: true, message: `เบิกจ่ายสินค้า "${targetSlot?.product_name || ''}" สำเร็จ!` };
    }
  };

  // Manual Crane Commands
  const sendCraneCommand = async (command, params = {}) => {
    try {
      const res = await axios.post(`/api/asrs/command`, {
        command,
        ...params
      });
      if (res.data.craneState) {
        setCraneState(res.data.craneState);
      }
      return { success: true, data: res.data };
    } catch (err) {
      if (command === 'JOG') {
        const { axis, delta } = params;
        setCraneState(prev => ({
          ...prev,
          currentX: axis === 'X' ? Math.max(0, Math.min(3, prev.currentX + delta)) : prev.currentX,
          currentY: axis === 'Y' ? Math.max(0, Math.min(3, prev.currentY + delta)) : prev.currentY,
          stepDescription: `Manual Jog ${axis} ${delta > 0 ? '+' : ''}${delta}m`
        }));
      } else if (command === 'HOME') {
        setCraneState(prev => ({ ...prev, currentX: 0, currentY: 0, currentZ: 0, stepDescription: 'กลับสู่ตำแหน่งโฮม (0, 0, 0)' }));
      } else if (command === 'EMERGENCY_STOP') {
        setCraneState(prev => ({ ...prev, emergencyStop: true, status: 'EMERGENCY_STOP', stepDescription: '⚠️ หยุดฉุกเฉิน (E-Stop Active)' }));
      } else if (command === 'RESET_ESTOP') {
        setCraneState(prev => ({ ...prev, emergencyStop: false, status: 'IDLE', stepDescription: 'ปลดล็อค E-Stop พร้อมทำงาน' }));
      }
      return { success: true };
    }
  };

  const jogCrane = (axis, delta) => sendCraneCommand('JOG', { axis, delta });
  const homeCrane = () => sendCraneCommand('HOME');
  const emergencyStop = () => sendCraneCommand('EMERGENCY_STOP');
  const resetEmergencyStop = () => sendCraneCommand('RESET_ESTOP');

  const toggleSimulator = async () => {
    try {
      const res = await axios.post(`/api/simulator/toggle`, { active: !simulatorActive });
      setSimulatorActive(res.data.simulatorActive);
    } catch (err) {
      setSimulatorActive(prev => !prev);
    }
  };

  // 9 Slots Stats
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.is_occupied).length;
  const emptySlots = totalSlots - occupiedSlots;
  const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0;
  const totalWeight = slots.reduce((acc, s) => acc + (s.is_occupied ? (Number(s.weight_kg) || 0) : 0), 0).toFixed(1);

  // Add Slot Handler
  const addSlot = async (slotData) => {
    try {
      const res = await axios.post('/api/slots', slotData);
      if (res.data && res.data.slot) {
        setSlots(prev => {
          if (prev.some(s => s.slot_id === res.data.slot.slot_id || s.slot_code === res.data.slot.slot_code)) {
            return prev;
          }
          const updated = [...prev, res.data.slot];
          localStorage.setItem('asrs_slots_9', JSON.stringify(updated));
          return updated;
        });
        return { success: true, message: res.data.message || 'เพิ่มช่องจัดเก็บสำเร็จ' };
      }
    } catch (err) {
      // Local fallback
      const cleanRack = (slotData.rack || 'A').toUpperCase().trim();
      const numLevel = parseInt(slotData.level);
      const numBay = parseInt(slotData.bay);
      const code = slotData.slot_code ? slotData.slot_code.trim().toUpperCase() : `${cleanRack}-${String(numLevel).padStart(2, '0')}-${String(numBay).padStart(2, '0')}`;

      if (slots.some(s => s.slot_code === code || (s.rack === cleanRack && s.level === numLevel && s.bay === numBay))) {
        return { success: false, error: `ช่อง ${code} มีอยู่ในผังแล้ว` };
      }

      const nextId = slots.length > 0 ? Math.max(...slots.map(s => s.slot_id)) + 1 : 1;
      const newSlot = {
        slot_id: nextId,
        slot_code: code,
        rack: cleanRack,
        level: numLevel,
        bay: numBay,
        x_axis: parseFloat(numBay),
        y_axis: parseFloat(numLevel),
        z_axis: 1.0,
        is_occupied: false,
        product_name: null,
        qr_code: null,
        category: null,
        weight_kg: 0,
        lot_number: null,
        stored_at: null,
        updated_at: new Date().toISOString()
      };

      setSlots(prev => {
        const updated = [...prev, newSlot];
        localStorage.setItem('asrs_slots_9', JSON.stringify(updated));
        return updated;
      });

      return { success: true, message: `เพิ่มช่องจัดเก็บ ${code} สำเร็จ` };
    }
  };

  // Remove Slot Handler
  const removeSlot = async (slotId) => {
    const target = slots.find(s => s.slot_id === slotId);
    if (!target) return { success: false, error: 'ไม่พบช่องจัดเก็บ' };
    if (target.is_occupied) return { success: false, error: 'ไม่สามารถลบช่องที่มีสินค้าได้' };

    try {
      await axios.delete(`/api/slots/${slotId}`);
    } catch (err) {
      console.warn('Backend delete slot notice:', err.message);
    }

    setSlots(prev => {
      const updated = prev.filter(s => s.slot_id !== slotId);
      localStorage.setItem('asrs_slots_9', JSON.stringify(updated));
      return updated;
    });

    return { success: true, message: `ลบช่อง ${target.slot_code} สำเร็จ` };
  };

  // Clear Transactions (Admin Audit Purge)
  const clearTransactions = async () => {
    try {
      await axios.delete('/api/transactions');
    } catch (err) {
      console.warn('Backend delete transactions notice:', err.message);
    }
    setTransactions([]);
    localStorage.removeItem('asrs_transactions');
    return { success: true, message: 'ล้างประวัติธุรกรรมทั้งหมดเรียบร้อยแล้ว' };
  };

  return (
    <WarehouseContext.Provider value={{
      slots,
      loading,
      craneState,
      transactions,
      selectedSlot,
      setSelectedSlot,
      mqttStatus,
      esp32Connected,
      simulatorActive,
      mqttLogs,
      lastScannedQr,
      setLastScannedQr,
      productCatalog,
      saveProductToCatalog,
      lookupProduct,
      stats: {
        totalSlots,
        occupiedSlots,
        emptySlots,
        occupancyRate,
        totalWeight
      },
      storeIn,
      storeOut,
      addSlot,
      removeSlot,
      clearTransactions,
      jogCrane,
      homeCrane,
      emergencyStop,
      resetEmergencyStop,
      toggleSimulator,
      refreshData: fetchData
    }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => useContext(WarehouseContext);
