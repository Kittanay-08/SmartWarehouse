import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Camera, 
  CameraOff, 
  Sparkles, 
  QrCode, 
  Check, 
  AlertCircle, 
  Layers, 
  Box, 
  MapPin, 
  CheckCircle2, 
  Printer, 
  Copy, 
  Clock, 
  Info, 
  ArrowUpFromLine, 
  History,
  AlertTriangle,
  Ban,
  Scan,
  RefreshCw,
  Tag,
  Plus,
  Trash2,
  X,
  Lock,
  Search,
  Filter,
  Zap,
  Compass,
  Radio,
  Activity,
  Gauge
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

export const StoreInPanel = ({ preSelectedSlot, onFinished }) => {
  const { 
    slots, 
    storeIn, 
    storeOut, 
    addSlot,
    removeSlot,
    transactions, 
    craneState, 
    lookupProduct, 
    saveProductToCatalog 
  } = useWarehouse();
  const { user, canManageSlots, getDepartmentInfo } = useAuth();
  const isManager = canManageSlots ? canManageSlots(user) : true;
  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;

  // Lot Number Generator Helper
  const generateLotNumber = () => `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  // Form States (Blank by default for Product Name/Cat/Weight, with Auto Lot Number)
  const [qrCode, setQrCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [lotNumber, setLotNumber] = useState(generateLotNumber());
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Duplicate / Already Occupied Detection (For system-assigned QR labels)
  const [alreadyOccupiedSlot, setAlreadyOccupiedSlot] = useState(null);

  // Mandatory Label Printing Flow
  const [isLabelPrinted, setIsLabelPrinted] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // 2D Matrix Slot Inspect Modal (for occupied slots)
  const [inspectSlot, setInspectSlot] = useState(null);

  // Normalize code for comparison
  const normalizeCode = (code) => {
    if (!code) return '';
    return code.replace(/-0+/g, '-').trim().toUpperCase();
  };

  // Sync when preSelectedSlot prop changes
  useEffect(() => {
    if (preSelectedSlot && preSelectedSlot.slot_id) {
      if (!alreadyOccupiedSlot) {
        setSelectedSlotId(String(preSelectedSlot.slot_id));
        setIsLabelPrinted(false);
        setMessage({
          type: 'success',
          text: `📍 เลือกช่อง ${preSelectedSlot.slot_code} (ชั้น ${preSelectedSlot.level}, ช่อง ${preSelectedSlot.bay}) เรียบร้อยแล้ว`
        });
      }
    }
  }, [preSelectedSlot, alreadyOccupiedSlot]);

  // Intelligent QR Code Processor
  // Case 1: Scanning a known product barcode for a NEW box -> Auto-fill details & ALLOW picking an empty slot
  // Case 2: Scanning a system-printed label of an item ALREADY in a slot -> Show it's already stored & BLOCK re-storing
  const processIncomingQrCode = (inputCode) => {
    if (!inputCode || !inputCode.trim()) {
      setAlreadyOccupiedSlot(null);
      return;
    }

    const trimmed = inputCode.trim();
    let extractedQr = trimmed;
    let extractedName = '';
    let extractedCat = '';
    let extractedWeight = '';
    let extractedLot = '';
    let extractedSlotCode = '';
    let isSystemPrintedLabel = false;

    // 1. Check if input is a System-Generated QR Code Label (JSON payload with slotCode / coordinates)
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (parsed.qrCode) extractedQr = parsed.qrCode;
        if (parsed.name) extractedName = parsed.name;
        if (parsed.category) extractedCat = parsed.category;
        if (parsed.weight) extractedWeight = String(parsed.weight);
        if (parsed.lot) extractedLot = parsed.lot;
        if (parsed.slotCode) {
          extractedSlotCode = parsed.slotCode;
          isSystemPrintedLabel = true;
        }
      }
    } catch (e) {
      extractedQr = trimmed;
    }

    setQrCode(extractedQr);

    // 2. CASE B: Check if this is a System-Printed Label for a slot that is ALREADY OCCUPIED
    if (isSystemPrintedLabel && extractedSlotCode) {
      const matchedSlot = slots.find(s => normalizeCode(s.slot_code) === normalizeCode(extractedSlotCode) && s.is_occupied);
      if (matchedSlot) {
        setAlreadyOccupiedSlot(matchedSlot);
        setProductName(matchedSlot.product_name || extractedName || '');
        setCategory(matchedSlot.category || extractedCat || '');
        setWeightKg(matchedSlot.weight_kg ? String(matchedSlot.weight_kg) : extractedWeight || '');
        setLotNumber(matchedSlot.lot_number || extractedLot || generateLotNumber());
        setSelectedSlotId(''); // Block selecting another slot
        setIsLabelPrinted(false);

        setMessage({
          type: 'error',
          text: `🛑 สินค้านี้มีอยู่แล้วในระบบ! จัดเก็บอยู่ที่ช่อง ${matchedSlot.slot_code} (ชั้น ${matchedSlot.level}, ช่อง ${matchedSlot.bay}) ไม่สามารถจัดเก็บซ้ำได้`
        });
        return;
      }
    }

    // 3. CASE A: Scanning product barcode for NEW store-in
    setAlreadyOccupiedSlot(null);

    // Look up known product from persistent self-learning catalog or past transactions
    let finalName = '';
    let finalCat = '';
    let finalWeight = '';
    let finalLot = extractedLot || '';

    const knownFromCatalog = lookupProduct(extractedQr);

    if (extractedName) {
      finalName = extractedName;
      if (extractedCat) finalCat = extractedCat;
      if (extractedWeight) finalWeight = extractedWeight;
    } else if (knownFromCatalog) {
      finalName = knownFromCatalog.name || '';
      finalCat = knownFromCatalog.category || '';
      finalWeight = knownFromCatalog.weight ? String(knownFromCatalog.weight) : '';
    } else {
      const pastLog = transactions.find(t => t.qr_code === extractedQr);
      if (pastLog) {
        finalName = pastLog.product_name || '';
        finalCat = pastLog.category || '';
        finalWeight = pastLog.weight_kg ? String(pastLog.weight_kg) : '';
        if (pastLog.lot_number) finalLot = pastLog.lot_number;
      }
    }

    // Set form fields
    setProductName(finalName);
    setCategory(finalCat);
    setWeightKg(finalWeight);
    setLotNumber(finalLot || lotNumber || generateLotNumber());

    // Notify user
    if (finalName) {
      setMessage({
        type: 'success',
        text: `✨ สแกนพบสินค้าที่รู้จัก: "${finalName}" (${finalCat || 'ทั่วไป'}) ระบบเติมข้อมูลให้อัตโนมัติ กรุณาเลือกช่องว่างบนผังเพื่อจัดเก็บกล่องนี้`
      });
    } else {
      setMessage({
        type: 'success',
        text: `📷 สแกนรหัส "${extractedQr}" สำเร็จ (สินค้าใหม่) กรุณากรอกชื่อและหมวดหมู่ และเลือกช่องจัดเก็บบนผัง`
      });
    }
  };

  // Real-time input change for QR Code
  const handleQrInputChange = (e) => {
    const val = e.target.value;
    setQrCode(val);
    setIsLabelPrinted(false);
    setAlreadyOccupiedSlot(null);

    const trimmed = val.trim();
    if (!trimmed) return;

    // Check if known in catalog
    const known = lookupProduct(trimmed);
    if (known) {
      setProductName(known.name || '');
      setCategory(known.category || '');
      setWeightKg(known.weight ? String(known.weight) : '');
    } else {
      const pastLog = transactions.find(t => t.qr_code === trimmed);
      if (pastLog) {
        setProductName(pastLog.product_name || '');
        setCategory(pastLog.category || '');
        setWeightKg(pastLog.weight_kg ? String(pastLog.weight_kg) : '');
        if (pastLog.lot_number) setLotNumber(pastLog.lot_number);
      }
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setIsLabelPrinted(false);
  };

  const emptySlots = slots.filter(s => !s.is_occupied);
  const selectedSlot = slots.find(s => String(s.slot_id) === String(selectedSlotId));

  // Auto-Suggest empty slot
  const handleAutoSuggestSlot = () => {
    if (alreadyOccupiedSlot) {
      setMessage({ type: 'error', text: `⚠️ สินค้าชิ้นนี้จัดเก็บอยู่ในช่อง ${alreadyOccupiedSlot.slot_code} แล้ว ไม่สามารถเลือกช่องเพิ่มได้` });
      return;
    }
    if (emptySlots.length === 0) {
      setMessage({ type: 'error', text: '⚠️ คลังสินค้าเต็มทุก 9 ช่องแล้ว ไม่สามารถจัดเก็บเพิ่มได้' });
      return;
    }
    const sorted = [...emptySlots].sort((a, b) => a.level - b.level || a.bay - b.bay);
    setSelectedSlotId(String(sorted[0].slot_id));
    setIsLabelPrinted(false);
    setMessage({ 
      type: 'success', 
      text: `✨ แนะนำช่อง ${sorted[0].slot_code} (ระดับชั้น ${sorted[0].level} ช่องที่ ${sorted[0].bay})` 
    });
  };

  // Re-use data from recent inbound item
  const handleReuseData = (log) => {
    setAlreadyOccupiedSlot(null);
    setProductName(log.product_name || '');
    setQrCode(log.qr_code || '');
    setCategory(log.category || '');
    setWeightKg(log.weight_kg ? String(log.weight_kg) : '');
    setLotNumber(log.lot_number || generateLotNumber());
    setSelectedSlotId('');
    setIsLabelPrinted(false);
    setMessage({
      type: 'success',
      text: `📋 ดึงข้อมูล "${log.product_name}" (ล็อต: ${log.lot_number || '-'}) สำเร็จ! กรุณาคลิกเลือกช่องว่างบนผัง ➔ สั่งพิมพ์ฉลาก ➔ กดยืนยันนำเข้า`
    });
  };

  // Camera QR Scanner Handler
  useEffect(() => {
    if (showCamera) {
      const scanner = new Html5QrcodeScanner('qr-reader-inbound', {
        fps: 10,
        qrbox: { width: 240, height: 240 }
      });

      scanner.render(
        (decodedText) => {
          processIncomingQrCode(decodedText);
          setShowCamera(false);
          scanner.clear().catch(() => {});
        },
        (error) => {}
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [showCamera, slots]);

  // Handle Slot Click on 2D Matrix
  const handleSlotClick = (slot) => {
    if (slot.is_occupied) {
      setInspectSlot(slot);
      return;
    }

    if (alreadyOccupiedSlot) {
      setMessage({
        type: 'error',
        text: `🛑 ฉลากสินค้านี้จัดเก็บอยู่ที่ช่อง ${alreadyOccupiedSlot.slot_code} แล้ว! ไม่สามารถจัดเก็บซ้ำได้`
      });
      return;
    }

    setSelectedSlotId(String(slot.slot_id));
    setIsLabelPrinted(false);
    setMessage({
      type: 'success',
      text: `✅ คุณได้เลือกช่องจัดเก็บ: ${slot.slot_code} (ชั้น ${slot.level}, ช่อง ${slot.bay}) พิกัด X:${slot.x_axis} Y:${slot.y_axis} Z:${slot.z_axis}`
    });
  };

  // Structured QR Code Payload for Label Generation
  const qrPayload = JSON.stringify({
    qrCode: qrCode || 'SKU-INBOUND-001',
    name: productName || 'สินค้า',
    category: category || 'General',
    weight: weightKg || '1.0',
    lot: lotNumber || generateLotNumber(),
    slotCode: selectedSlot?.slot_code || 'A-01-01',
    rack: selectedSlot?.rack || 'A',
    level: selectedSlot?.level || 1,
    bay: selectedSlot?.bay || 1,
    coordinates: {
      x: selectedSlot?.x_axis || 1,
      y: selectedSlot?.y_axis || 1,
      z: selectedSlot?.z_axis || 1
    },
    ts: Date.now()
  });

  // Action: Print Label
  const handlePrintLabel = () => {
    if (alreadyOccupiedSlot) {
      setMessage({ type: 'error', text: `🛑 สินค้านี้จัดเก็บอยู่ในช่อง ${alreadyOccupiedSlot.slot_code} แล้ว ไม่สามารถพิมพ์ฉลากจัดเก็บซ้ำได้` });
      return;
    }
    if (!productName.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อสินค้าก่อนพิมพ์ฉลาก' });
      return;
    }
    if (!category) {
      setMessage({ type: 'error', text: 'กรุณาเลือกหมวดหมู่สินค้าก่อนพิมพ์ฉลาก' });
      return;
    }
    if (!weightKg || isNaN(parseFloat(weightKg)) || parseFloat(weightKg) <= 0) {
      setMessage({ type: 'error', text: 'กรุณาระบุน้ำหนักสินค้า (kg) ให้ถูกต้องก่อนพิมพ์ฉลาก' });
      return;
    }
    if (!selectedSlotId) {
      setMessage({ type: 'error', text: 'กรุณาเลือกช่องจัดเก็บบนผังชั้นวางก่อนพิมพ์ฉลาก' });
      return;
    }
    setShowPrintModal(true);
  };

  const confirmPrintAndReady = () => {
    window.print();
    setIsLabelPrinted(true);
    setShowPrintModal(false);
    setMessage({
      type: 'success',
      text: '🖨️ พิมพ์ฉลาก QR Code เรียบร้อยแล้ว! สามารถกดยืนยันการนำเข้าสินค้าได้ทันที'
    });
  };

  // Submit Inbound Request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (alreadyOccupiedSlot) {
      setMessage({
        type: 'error',
        text: `🛑 ไม่สามารถนำเข้าได้! สินค้ารหัสนี้ถูกจัดเก็บอยู่ในช่อง ${alreadyOccupiedSlot.slot_code} เรียบร้อยแล้ว`
      });
      return;
    }

    if (!productName.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อสินค้า' });
      return;
    }
    if (!category) {
      setMessage({ type: 'error', text: 'กรุณาเลือกหมวดหมู่สินค้า' });
      return;
    }
    if (!weightKg || isNaN(parseFloat(weightKg)) || parseFloat(weightKg) <= 0) {
      setMessage({ type: 'error', text: 'กรุณาระบุน้ำหนักสินค้า (kg) ให้ถูกต้อง' });
      return;
    }
    if (!selectedSlotId) {
      setMessage({ type: 'error', text: 'กรุณาคลิกเลือกช่องจัดเก็บบนผังชั้นวาง หรือเลือกจากเมนูดรอปดาวน์' });
      return;
    }
    if (!isLabelPrinted) {
      setMessage({
        type: 'error',
        text: '⚠️ กรุณากด "พิมพ์ฉลาก QR Code" สำหรับติดตัวสินค้าให้เรียบร้อยก่อนกดยืนยันนำเข้า'
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const activeLot = lotNumber || generateLotNumber();

    const res = await storeIn({
      productName: productName.trim(),
      qrCode: qrCode || `QR-${Date.now()}`,
      slotId: parseInt(selectedSlotId),
      category: category || 'General',
      weightKg: parseFloat(weightKg) || 1.0,
      lotNumber: activeLot
    });

    setSubmitting(false);
    if (res.success) {
      setMessage({ type: 'success', text: `✅ ${res.message}` });
      
      // Clear form inputs and prepare fresh new lot for next item
      setProductName('');
      setQrCode('');
      setCategory('');
      setWeightKg('');
      setSelectedSlotId('');
      setAlreadyOccupiedSlot(null);
      setLotNumber(generateLotNumber());
      setIsLabelPrinted(false);

      if (onFinished) onFinished();
    } else {
      setMessage({ type: 'error', text: `❌ ${res.message}` });
    }
  };

  // Filter Inbound Logs within last 12 hours (43,200,000 ms)
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const recentInboundLogs = transactions.filter(t => {
    if (t.transaction_type !== 'STORE_IN') return false;
    const timeDiff = Date.now() - new Date(t.created_at).getTime();
    return timeDiff <= TWELVE_HOURS_MS;
  });

  const formatTimeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    return `${hours} ชั่วโมงที่แล้ว`;
  };

  // Helper function to find the exact next slot in vertical sequence (3 bays per level)
  const getNextSequentialSlot = (currentSlots, defaultRack = 'A') => {
    const rackSlots = (currentSlots || []).filter(s => (s.rack || 'A').toUpperCase() === defaultRack.toUpperCase());
    const existingLevels = Array.from(new Set(rackSlots.map(s => Number(s.level) || 1))).sort((a, b) => a - b);
    const maxL = Math.max(3, ...existingLevels);

    // Check from level 1 up to maxL for any missing bay (1, 2, 3)
    for (let lvl = 1; lvl <= maxL; lvl++) {
      for (let b = 1; b <= 3; b++) {
        const exists = rackSlots.some(s => Number(s.level) === lvl && Number(s.bay) === b);
        if (!exists) {
          const code = `${defaultRack}-${String(lvl).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
          return {
            rack: defaultRack,
            level: lvl,
            bay: b,
            slot_code: code,
            x_axis: b,
            y_axis: lvl,
            z_axis: 1
          };
        }
      }
    }

    // All bays up to maxL are filled -> start next level at bay 1 (e.g. Level 4 Bay 1)
    const nextL = maxL + 1;
    const nextB = 1;
    const code = `${defaultRack}-${String(nextL).padStart(2, '0')}-${String(nextB).padStart(2, '0')}`;
    return {
      rack: defaultRack,
      level: nextL,
      bay: nextB,
      slot_code: code,
      x_axis: nextB,
      y_axis: nextL,
      z_axis: 1
    };
  };

  const nextSlot = getNextSequentialSlot(slots);
  // Only display floors that actually exist in the database (initially floors 1, 2, 3)
  // New floor only appears WHEN added, not beforehand!
  const maxExistingLevel = Math.max(1, ...slots.map(s => Number(s.level) || 1));
  const levels = Array.from({ length: maxExistingLevel }, (_, i) => maxExistingLevel - i);
  const bays = [1, 2, 3];
  const occupiedCount = slots.filter(s => s.is_occupied).length;
  const emptyCount = slots.length - occupiedCount;

  // Interactive UI States
  const [justAddedSlotId, setJustAddedSlotId] = useState(null);
  const [rackFilter, setRackFilter] = useState('all'); // 'all', 'empty', 'occupied', 'Beverages', 'Electronics', 'Snacks', 'Parts'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'category'

  // 1-Click Demo Barcode Presets for fast demonstration to professor
  const DEMO_PRESETS = [
    { label: '🥤 Pepsi Can', name: 'น้ำอัดลมเป๊ปซี่ 325ml', cat: 'Beverages', weight: '0.35', qr: 'PEPSI-325-CAN', lot: 'LOT-2026-PEP01' },
    { label: '⚡ ESP32 Board', name: 'บอร์ดไมโครคอนโทรลเลอร์ ESP32', cat: 'Electronics', weight: '0.15', qr: 'ESP32-DEV-WROOM', lot: 'LOT-2026-IOT08' },
    { label: '🥔 Lay\'s Chips', name: 'มันฝรั่งทอดกรอบ เลย์ 75g', cat: 'Snacks', weight: '0.18', qr: 'LAYS-75G-CLASSIC', lot: 'LOT-2026-SNK12' },
    { label: '⚙️ Bearing 608ZZ', name: 'ตลับลูกปืนแบริ่ง 608ZZ', cat: 'Parts', weight: '0.45', qr: 'BEARING-608ZZ-IND', lot: 'LOT-2026-IND05' }
  ];

  const handleApplyPreset = (preset) => {
    setQrCode(preset.qr);
    setProductName(preset.name);
    setCategory(preset.cat);
    setWeightKg(preset.weight);
    setLotNumber(preset.lot);
    setAlreadyOccupiedSlot(null);
    setIsLabelPrinted(false);

    const emptySlot = slots.find(s => !s.is_occupied);
    if (emptySlot) {
      setSelectedSlotId(String(emptySlot.slot_id));
      setMessage({
        type: 'success',
        text: `⚡ สแกนตัวอย่าง "${preset.name}" สำเร็จ! แนะนำจัดเก็บที่ช่อง ${emptySlot.slot_code}`
      });
    } else {
      setMessage({
        type: 'success',
        text: `⚡ สแกนตัวอย่าง "${preset.name}" สำเร็จ!`
      });
    }
  };

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotLevel, setNewSlotLevel] = useState(1);
  const [newSlotBay, setNewSlotBay] = useState(1);
  const [newSlotRack, setNewSlotRack] = useState('A');
  const [newSlotCode, setNewSlotCode] = useState('');
  const [addSlotError, setAddSlotError] = useState('');
  const [addSlotSuccess, setAddSlotSuccess] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Quick 1-click slot addition (adds single next slot sequentially)
  const handleQuickAddSlot = async (slotTarget = nextSlot) => {
    if (!isManager) {
      alert(`สิทธิ์การใช้งานของ [${deptInfo?.name || 'พนักงานปฏิบัติการ'}]: เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่มีสิทธิ์เพิ่ม/แก้ไขโครงสร้างช่องจัดเก็บ`);
      return;
    }

    setIsAddingSlot(true);
    const targetToCreate = slotTarget || nextSlot;
    const res = await addSlot({
      rack: targetToCreate.rack || 'A',
      level: targetToCreate.level,
      bay: targetToCreate.bay,
      slot_code: targetToCreate.slot_code
    });

    setIsAddingSlot(false);
    if (res && res.success) {
      if (res.slot && res.slot.slot_id) {
        setJustAddedSlotId(res.slot.slot_id);
        setTimeout(() => setJustAddedSlotId(null), 3500);
      }
      setMessage({
        type: 'success',
        text: `✨ เพิ่มช่องจัดเก็บใหม่ ${targetToCreate.slot_code} (ชั้น ${targetToCreate.level}, ช่อง ${targetToCreate.bay}) สำเร็จเรียบร้อย!`
      });
    } else {
      setMessage({
        type: 'error',
        text: `⚠️ ไม่สามารถเพิ่มช่องได้: ${res?.error || 'เกิดข้อผิดพลาด'}`
      });
    }
  };

  const handleOpenAddSlotModal = (presetSlot = null) => {
    const target = presetSlot || nextSlot;
    setNewSlotRack(target.rack || 'A');
    setNewSlotLevel(target.level);
    setNewSlotBay(target.bay);
    setNewSlotCode(target.slot_code);
    setAddSlotError('');
    setAddSlotSuccess('');
    setShowAddSlotModal(true);
  };

  const handleConfirmAddSlot = async (e) => {
    if (e) e.preventDefault();
    setAddSlotError('');
    setAddSlotSuccess('');
    setIsAddingSlot(true);

    const l = parseInt(newSlotLevel);
    const b = parseInt(newSlotBay);
    if (!l || !b || l < 1 || b < 1) {
      setAddSlotError('กรุณากรอกชั้นและช่องเป็นตัวเลขที่ถูกต้อง (ตั้งแต่ 1 ขึ้นไป)');
      setIsAddingSlot(false);
      return;
    }

    const cleanRack = (newSlotRack || 'A').toUpperCase().trim();
    const code = newSlotCode.trim().toUpperCase() || `${cleanRack}-${String(l).padStart(2, '0')}-${String(b).padStart(2, '0')}`;

    if (slots.some(s => s.slot_code === code || (s.level === l && s.bay === b && s.rack === cleanRack))) {
      setAddSlotError(`ช่อง ${code} (ชั้น ${l}, ช่อง ${b}) มีอยู่ในระบบแล้ว`);
      setIsAddingSlot(false);
      return;
    }

    const res = await addSlot({
      rack: cleanRack,
      level: l,
      bay: b,
      slot_code: code
    });

    setIsAddingSlot(false);
    if (res && res.success) {
      setAddSlotSuccess(res.message || `เพิ่มช่อง ${code} สำเร็จ!`);
      setTimeout(() => {
        setShowAddSlotModal(false);
        setAddSlotSuccess('');
      }, 1000);
    } else {
      setAddSlotError(res?.error || 'เกิดข้อผิดพลาดในการเพิ่มช่อง');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-emerald">Smart QR Inbound</span>
            <span className="badge badge-cyan">Precision Barcode & Lot Traceability</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
            นำเข้าสินค้า & ผังชั้นวางอัตโนมัติ (Store-In & Smart 2D Matrix)
          </h2>
          <p style={{ color: '#334155', fontSize: '0.95rem', fontWeight: 600 }}>
            สแกนบาร์โค้ดเพื่อนำเข้าสินค้า ➔ ระบบระบุข้อมูลอัตโนมัติ ➔ กำหนดหมายเลขล็อต ➔ พิมพ์ฉลาก ➔ นำเข้าคลัง
          </p>
        </div>

        <div style={{
          fontSize: '0.95rem',
          color: '#0f172a',
          fontWeight: 800,
          background: '#ffffff',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1.5px solid #bae6fd',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.06)'
        }}>
          สถานะคลัง: ใช้งานอยู่ <strong style={{ color: '#0284c7' }}>{occupiedCount}</strong> / {slots.length} ช่อง ({emptySlots.length} ช่องว่าง)
        </div>
      </div>

      {/* Toast Alert */}
      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '18px',
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fecdd3'}`,
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 800
        }}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Warning Banner when Scanned QR is a System Label of an ALREADY Occupied item */}
      {alreadyOccupiedSlot && (
        <div className="animate-fade-in" style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '14px',
          padding: '18px 22px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Ban size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#991b1b' }}>
                🛑 สินค้านี้มีอยู่แล้วในระบบ! จัดเก็บอยู่ที่ช่อง {alreadyOccupiedSlot.slot_code}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#7f1d1d', marginTop: '2px', fontWeight: 700 }}>
                ชื่อสินค้า: <strong>{alreadyOccupiedSlot.product_name}</strong> | ล็อต: <strong>{alreadyOccupiedSlot.lot_number || '-'}</strong> | ช่อง: <strong>{alreadyOccupiedSlot.slot_code}</strong> (ชั้น {alreadyOccupiedSlot.level}, ช่อง {alreadyOccupiedSlot.bay})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInspectSlot(alreadyOccupiedSlot)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800 }}
          >
            <Info size={16} /> ดูข้อมูลช่องนี้ / สั่งเบิกจ่าย
          </button>
        </div>
      )}

      {/* Main Grid Layout: Left Inbound Form + Right Compact 2D Shelf Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 1.05fr) minmax(420px, 1.15fr)',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Store-In Form & Mandatory Printing Workflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-panel" style={{ padding: '22px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} color="#0284c7" /> ข้อมูลสินค้าสำหรับนำเข้า
              </h3>
              <button
                type="button"
                className={`btn ${showCamera ? 'btn-danger' : 'btn-primary'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 800 }}
                onClick={() => setShowCamera(!showCamera)}
              >
                {showCamera ? <CameraOff size={15} /> : <Camera size={15} />}
                {showCamera ? 'ปิดกล้อง' : 'สแกน QR ผ่านกล้อง'}
              </button>
            </div>

            {/* 1-Click Demo Barcode Presets for fast demonstration */}
            <div style={{ marginBottom: '16px', background: '#f0f9ff', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={14} color="#0284c7" /> สแกนด่วนสินค้าตัวอย่าง (1-Click Demo Presets)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>กดเพื่อทดสอบระบบ</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #93c5fd',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#e0f2fe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#ffffff'; }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Scanner Viewport with Futuristic Laser HUD */}
            {showCamera && (
              <div className="scanner-crosshairs animate-fade-in" style={{
                position: 'relative',
                background: '#0f172a',
                padding: '14px',
                borderRadius: '14px',
                marginBottom: '16px',
                border: '2px solid #38bdf8',
                boxShadow: '0 8px 25px rgba(2, 132, 199, 0.3)',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #38bdf8, #22c55e, #38bdf8, transparent)',
                  boxShadow: '0 0 12px #38bdf8',
                  animation: 'scanLaserLine 2s infinite ease-in-out',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />
                <div style={{ position: 'relative', zIndex: 5 }}>
                  <div id="qr-reader-inbound" style={{ width: '100%', borderRadius: '10px', overflow: 'hidden' }}></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
                  🎯 กำลังสแกน... กรุณาเล็งบาร์โค้ดหรือ QR Code ให้อยู่ในกรอบเป้าหมาย
                </div>
              </div>
            )}

            {/* Form Fields (Always Fully Editable, Auto-learned) */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  รหัส QR Code / บาร์โค้ดสินค้า *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="กรอกรหัส หรือสแกนผ่านกล้อง"
                  value={qrCode}
                  onChange={handleQrInputChange}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    borderColor: alreadyOccupiedSlot ? '#ef4444' : '#0284c7',
                    background: alreadyOccupiedSlot ? '#fef2f2' : '#ffffff'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  ชื่อสินค้า (Product Name) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ระบุชื่อสินค้า"
                  value={productName}
                  onChange={handleInputChange(setProductName)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    หมวดหมู่สินค้า *
                  </label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={handleInputChange(setCategory)}
                    style={{ borderColor: category ? '#0284c7' : '#cbd5e1' }}
                    required
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    <option value="Beverages">เครื่องดื่ม (Beverages)</option>
                    <option value="Electronics">อิเล็กทรอนิกส์ (Electronics)</option>
                    <option value="Snacks">อาหาร/ขนม (Snacks)</option>
                    <option value="Parts">ชิ้นส่วน/อะไหล่ (Parts)</option>
                    <option value="General">สินค้าทั่วไป (General)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    น้ำหนัก (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder=""
                    value={weightKg}
                    onChange={handleInputChange(setWeightKg)}
                    required
                  />
                </div>
              </div>

              {/* Lot Number Input (Prominent & Editable with Refresh Button) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Tag size={15} color="#d97706" /> หมายเลขล็อตสินค้า (Lot Number) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setLotNumber(generateLotNumber())}
                    className="btn btn-secondary"
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#0284c7',
                      borderColor: '#0284c7',
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '6px'
                    }}
                    title="สร้างหมายเลขล็อตใหม่อัตโนมัติ"
                  >
                    <RefreshCw size={11} /> สุ่มล็อตใหม่
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น LOT-2026-101"
                  value={lotNumber}
                  onChange={handleInputChange(setLotNumber)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#92400e',
                    borderColor: '#fcd34d',
                    background: '#fffbeb'
                  }}
                  required
                />
              </div>

              {/* Selected Slot Indicator / Block Indicator */}
              <div style={{
                background: alreadyOccupiedSlot 
                  ? '#fee2e2' 
                  : selectedSlot 
                  ? '#dcfce7' 
                  : '#fef3c7',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1.5px solid ${
                  alreadyOccupiedSlot 
                    ? '#fca5a5' 
                    : selectedSlot 
                    ? '#86efac' 
                    : '#fde68a'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alreadyOccupiedSlot ? (
                    <Ban size={18} color="#dc2626" />
                  ) : (
                    <MapPin size={18} color={selectedSlot ? '#15803d' : '#b45309'} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: alreadyOccupiedSlot ? '#b91c1c' : selectedSlot ? '#15803d' : '#b45309', fontWeight: 800 }}>
                      {alreadyOccupiedSlot ? 'สถานะ: มีอยู่ในคลังแล้ว' : selectedSlot ? 'ช่องจัดเก็บที่เลือก:' : 'ยังไม่ได้เลือกช่องจัดเก็บ:'}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                      {alreadyOccupiedSlot 
                        ? `จัดเก็บอยู่ในช่อง ${alreadyOccupiedSlot.slot_code} แล้ว (ไม่อนุญาตให้เลือกช่องซ้ำ)`
                        : selectedSlot 
                        ? `ช่อง ${selectedSlot.slot_code} (ชั้น ${selectedSlot.level}, ช่อง ${selectedSlot.bay})` 
                        : 'กรุณาคลิกเลือกช่องสีเขียวบนผังทางขวา'}
                    </div>
                  </div>
                </div>

                {selectedSlot && !alreadyOccupiedSlot && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    color: '#0369a1',
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd'
                  }}>
                    X:{selectedSlot.x_axis} | Y:{selectedSlot.y_axis}
                  </div>
                )}
              </div>

              {/* Step 2: Print QR Code Button */}
              <div style={{
                background: alreadyOccupiedSlot ? '#f1f5f9' : isLabelPrinted ? '#f0fdf4' : '#f8fafc',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${alreadyOccupiedSlot ? '#cbd5e1' : isLabelPrinted ? '#86efac' : '#cbd5e1'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                    <Printer size={18} color={alreadyOccupiedSlot ? '#94a3b8' : '#0284c7'} />
                    <span>ขั้นตอนที่ 1: พิมพ์ฉลาก QR Code พิกัด</span>
                  </div>
                  {alreadyOccupiedSlot ? (
                    <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>ระงับการพิมพ์ (มีในคลังแล้ว)</span>
                  ) : isLabelPrinted ? (
                    <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <CheckCircle2 size={13} /> พิมพ์ฉลากพร้อมแล้ว
                    </span>
                  ) : (
                    <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>ต้องพิมพ์ก่อนนำเข้า</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePrintLabel}
                  disabled={alreadyOccupiedSlot || !productName.trim() || !category || !weightKg || !selectedSlotId}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: (alreadyOccupiedSlot || !productName.trim() || !category || !weightKg || !selectedSlotId) ? '#94a3b8' : '#0284c7',
                    borderColor: (alreadyOccupiedSlot || !productName.trim() || !category || !weightKg || !selectedSlotId) ? '#cbd5e1' : '#0284c7'
                  }}
                >
                  <Printer size={16} /> สั่งพิมพ์ฉลาก QR Code (Print Label)
                </button>
              </div>

              {/* Step 3: Final Store-In Button (Enabled only after label printed and not duplicate) */}
              <div>
                <button
                  type="submit"
                  disabled={alreadyOccupiedSlot || submitting || craneState.status !== 'IDLE' || !selectedSlotId || !isLabelPrinted}
                  className="btn btn-success"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    cursor: (alreadyOccupiedSlot || !selectedSlotId || !isLabelPrinted || submitting || craneState.status !== 'IDLE') ? 'not-allowed' : 'pointer',
                    opacity: (alreadyOccupiedSlot || !selectedSlotId || !isLabelPrinted) ? 0.65 : 1
                  }}
                >
                  <ArrowDownToLine size={20} />
                  {alreadyOccupiedSlot
                    ? `❌ สินค้าถูกจัดเก็บในช่อง ${alreadyOccupiedSlot.slot_code} แล้ว (ไม่อนุญาตให้จัดเก็บซ้ำ)`
                    : craneState.status !== 'IDLE' 
                    ? `เครนกำลังทำงาน (${craneState.status})...` 
                    : !selectedSlotId 
                    ? '1. กรุณาคลิกเลือกช่องจัดเก็บบนผังชั้นวาง'
                    : !isLabelPrinted
                    ? '2. กรุณากดพิมพ์ฉลาก QR Code ก่อนกดยืนยัน'
                    : '3. ยืนยันการจัดเก็บสินค้าเข้าคลัง (Store-In)'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Inbound History (12 Hours) with Quick Re-use Button */}
          <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="#0284c7" /> ประวัติการนำเข้าล่าสุด (12 ชั่วโมงที่ผ่านมา)
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                  💡 คลิกปุ่ม <strong style={{ color: '#0284c7' }}>"ใช้ข้อมูลนี้"</strong> เพื่อก๊อปปี้ข้อมูลสำหรับนำเข้าสินค้ากล่องถัดไปได้ทันที
                </p>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                {recentInboundLogs.length} รายการ
              </span>
            </div>

            {recentInboundLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                ยังไม่มีประวัติการนำเข้าในรอบ 12 ชั่วโมงที่ผ่านมา
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {recentInboundLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                        📦 {log.product_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                        รหัส: <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>{log.qr_code}</strong> | ช่อง: <strong style={{ color: '#059669' }}>{log.slot_code}</strong> | ล็อต: <strong style={{ color: '#b45309', fontFamily: 'var(--font-mono)' }}>{log.lot_number || '-'}</strong> | น้ำหนัก: {log.weight_kg}kg
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {formatTimeAgo(log.created_at)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleReuseData(log)}
                        className="btn btn-secondary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#0284c7',
                          borderColor: '#0284c7',
                          background: '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '8px'
                        }}
                        title="คลิกเพื่อนำข้อมูลสินค้าชนิดนี้ไปกรอกในฟอร์มสำหรับกล่องถัดไป"
                      >
                        <Copy size={12} /> ใช้ข้อมูลนี้
                      </button>
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                        จัดเก็บแล้ว
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Compact 2D Shelf Matrix with Live HUD & Interactive Filters */}
        <div className="glass-panel" style={{ padding: '22px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#059669" /> ผังชั้นวางสินค้า 2D ({slots.length} ช่อง)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                แสดงรหัส QR Code ประจำช่อง — คลิกช่องว่างเพื่อเลือกนำเข้า หรือคลิกช่องที่มีของเพื่อดูข้อมูล
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAutoSuggestSlot}
                disabled={Boolean(alreadyOccupiedSlot)}
                className="btn btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  color: alreadyOccupiedSlot ? '#94a3b8' : '#0284c7',
                  borderColor: alreadyOccupiedSlot ? '#cbd5e1' : '#0284c7',
                  fontWeight: 800,
                  cursor: alreadyOccupiedSlot ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} /> แนะนำช่องว่าง
              </button>

              {isManager ? (
                <button
                  type="button"
                  onClick={() => handleQuickAddSlot(nextSlot)}
                  disabled={isAddingSlot}
                  className={`btn btn-primary ${!isAddingSlot ? 'pulse-glow-btn' : ''}`}
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                    cursor: isAddingSlot ? 'wait' : 'pointer'
                  }}
                  title={`คลิกเพื่อเพิ่มช่องจัดเก็บ ${nextSlot.slot_code} ทีละช่อง`}
                >
                  <Plus size={15} /> 
                  {isAddingSlot ? 'กำลังเพิ่มช่อง...' : `+ เพิ่มช่องจัดเก็บ (${nextSlot.slot_code})`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => alert(`สิทธิ์การใช้งานของ [${deptInfo?.name || 'พนักงานปฏิบัติการ'}]: เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่มีสิทธิ์เพิ่ม/แก้ไขโครงสร้างช่องจัดเก็บ`)}
                  className="btn btn-secondary"
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#64748b',
                    borderColor: '#cbd5e1',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่เพิ่มช่องได้"
                >
                  <Lock size={13} color="#64748b" /> เพิ่มช่องจัดเก็บ
                </button>
              )}
            </div>
          </div>

          {/* Live Crane Telemetry & Travel Distance HUD Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            padding: '10px 16px',
            borderRadius: '12px',
            color: '#ffffff',
            marginBottom: '14px',
            boxShadow: '0 4px 15px rgba(15, 23, 42, 0.12)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                position: 'relative',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#38bdf8'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: '50%',
                  border: '1.5px solid #38bdf8',
                  animation: 'radarPing 1.8s infinite ease-out'
                }} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  พิกัดเครน AS/RS ปัจจุบัน
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  X:{craneState.currentX || 1} | Y:{craneState.currentY || 1} | Z:{craneState.currentZ || 1}
                  <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: craneState.status === 'IDLE' ? '#4ade80' : '#facc15', fontWeight: 800 }}>
                    [{craneState.status || 'IDLE'}]
                  </span>
                </div>
              </div>
            </div>

            {selectedSlotId && (() => {
              const sel = slots.find(s => String(s.slot_id) === String(selectedSlotId));
              if (!sel) return null;
              const estTime = Math.max(2, (Math.abs((sel.bay || 1) - 1) * 1.5 + Math.abs((sel.level || 1) - 1) * 2.0).toFixed(1));
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.15)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <Clock size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>
                    เวลาเดินทางไปช่อง {sel.slot_code}: <strong style={{ color: '#38bdf8' }}>~{estTime} วินาที</strong>
                  </span>
                </div>
              );
            })()}

            {/* Mini Occupancy Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
              <Gauge size={15} color="#34d399" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '2px' }}>
                  <span>ความจุคลัง</span>
                  <span>{Math.round((occupiedCount / Math.max(1, slots.length)) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(occupiedCount / Math.max(1, slots.length)) * 100}%`,
                    height: '100%',
                    background: occupiedCount / slots.length > 0.85 ? '#ef4444' : occupiedCount / slots.length > 0.6 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '280px' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="ค้นหารหัสช่อง, สินค้า, QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `ทั้งหมด (${slots.length})` },
                { id: 'empty', label: `🟢 ว่าง (${emptyCount})` },
                { id: 'occupied', label: `🔴 มีของ (${occupiedCount})` },
                { id: 'Beverages', label: '🥤 เครื่องดื่ม' },
                { id: 'Electronics', label: '⚡ อิเล็กทรอนิกส์' },
                { id: 'Snacks', label: '🥔 ขนม' },
                { id: 'Parts', label: '⚙️ อะไหล่' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRackFilter(f.id)}
                  style={{
                    padding: '4px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    borderRadius: '6px',
                    border: rackFilter === f.id ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    background: rackFilter === f.id ? '#e0f2fe' : '#ffffff',
                    color: rackFilter === f.id ? '#0369a1' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '10px',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '14px',
            background: '#f8fafc',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#86efac', display: 'inline-block' }} /> ว่าง (คลิกเลือก)
            </span>
            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#0284c7', display: 'inline-block' }} /> เลือกนำเข้า
            </span>
            <span style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#fca5a5', display: 'inline-block' }} /> มีสินค้า (รหัส QR)
            </span>
            <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', border: '1.5px dashed #0284c7', display: 'inline-block' }} /> ช่องรอเพิ่ม
            </span>
          </div>

          {/* Compact Interactive Shelf Grid with QR Code Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {levels.map(lvl => (
              <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Level badge */}
                <div style={{
                  width: '64px',
                  textAlign: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '12px 4px',
                  borderRadius: '8px',
                  border: '1.5px solid #7dd3fc',
                  flexShrink: 0
                }}>
                  ชั้น {lvl}
                </div>

                {/* Dynamic Bays */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bays.length}, 1fr)`, gap: '8px', flex: 1 }}>
                  {bays.map(bay => {
                    const slot = slots.find(s => Number(s.level) === lvl && Number(s.bay) === bay);
                    if (!slot) {
                      const codeForEmpty = `A-${String(lvl).padStart(2, '0')}-${String(bay).padStart(2, '0')}`;
                      const isNextTarget = nextSlot.level === lvl && nextSlot.bay === bay;
                      return (
                        <div
                          key={`empty-${lvl}-${bay}`}
                          onClick={() => {
                            if (!isManager) {
                              setMessage({ type: 'error', text: `🔒 จำกัดสิทธิ์ [${deptInfo?.name || 'ฝ่ายปฏิบัติการ'}]: เฉพาะฝ่ายบริหารและฝ่ายวิศวกรรมเท่านั้นที่มีสิทธิ์เพิ่มช่องจัดเก็บ` });
                              return;
                            }
                            if (!isAddingSlot) {
                              handleQuickAddSlot({
                                rack: 'A',
                                level: lvl,
                                bay: bay,
                                slot_code: codeForEmpty
                              });
                            }
                          }}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '10px',
                            border: isNextTarget ? '2px dashed #0284c7' : '1.5px dashed #cbd5e1',
                            background: isNextTarget ? '#f0f9ff' : '#f8fafc',
                            minHeight: '68px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isManager ? 'pointer' : 'default',
                            color: isNextTarget ? '#0284c7' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                            boxShadow: isNextTarget ? '0 2px 8px rgba(2, 132, 199, 0.18)' : 'none'
                          }}
                          title={isManager ? `คลิกเพื่อเพิ่มช่อง ${codeForEmpty} (ชั้น ${lvl}, ช่อง ${bay})` : 'ช่องว่างยังไม่ได้กำหนดในระบบ'}
                        >
                          {isManager ? (
                            <>
                              <Plus size={15} color={isNextTarget ? '#0284c7' : '#94a3b8'} />
                              <span style={{ marginTop: '2px', fontWeight: 800 }}>
                                + {codeForEmpty}
                              </span>
                              {isNextTarget && (
                                <span style={{ fontSize: '0.65rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', marginTop: '2px', fontWeight: 900 }}>
                                  คิวถัดไป
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>ช่องยังไม่เปิด</span>
                          )}
                        </div>
                      );
                    }

                    const isSelected = String(slot.slot_id) === String(selectedSlotId);
                    const isOccupied = slot.is_occupied;
                    const isCraneTarget = craneState.targetSlotId === slot.slot_id;
                    const isTheOccupiedSlot = alreadyOccupiedSlot && alreadyOccupiedSlot.slot_id === slot.slot_id;
                    const isJustAdded = justAddedSlotId === slot.slot_id;

                    // Filter matching
                    let passesFilter = true;
                    if (rackFilter === 'empty' && isOccupied) passesFilter = false;
                    if (rackFilter === 'occupied' && !isOccupied) passesFilter = false;
                    if (['Beverages', 'Electronics', 'Snacks', 'Parts'].includes(rackFilter)) {
                      if (!isOccupied || slot.category !== rackFilter) passesFilter = false;
                    }

                    // Search matching
                    let isSearchMatch = false;
                    if (searchQuery && searchQuery.trim()) {
                      const q = searchQuery.toLowerCase().trim();
                      isSearchMatch = (slot.slot_code || '').toLowerCase().includes(q) ||
                        (slot.product_name || '').toLowerCase().includes(q) ||
                        (slot.qr_code || '').toLowerCase().includes(q) ||
                        (slot.lot_number || '').toLowerCase().includes(q);
                      if (!isSearchMatch) passesFilter = false;
                    }

                    return (
                      <div
                        key={slot.slot_id}
                        onClick={() => handleSlotClick(slot)}
                        className={isJustAdded ? 'slot-new-enter' : ''}
                        title={isOccupied ? `สินค้า: ${slot.product_name} | ล็อต: ${slot.lot_number || '-'} (คลิกดูรายละเอียด)` : `ช่องว่าง: ${slot.slot_code} (คลิกเลือก)`}
                        style={{
                          padding: '8px 8px',
                          borderRadius: '10px',
                          background: isTheOccupiedSlot
                            ? '#fee2e2'
                            : isSelected 
                            ? '#e0f2fe' 
                            : isCraneTarget 
                            ? '#fef3c7' 
                            : isOccupied 
                            ? '#fee2e2' 
                            : '#dcfce7',
                          border: `2px solid ${
                            isTheOccupiedSlot
                              ? '#ef4444'
                              : isSelected 
                              ? '#0284c7' 
                              : isCraneTarget 
                              ? '#f59e0b' 
                              : isOccupied 
                              ? '#fca5a5' 
                              : '#86efac'
                          }`,
                          cursor: 'pointer',
                          boxShadow: isSearchMatch
                            ? '0 0 14px rgba(2, 132, 199, 0.5)'
                            : isTheOccupiedSlot 
                            ? '0 0 0 3px rgba(239, 68, 68, 0.4)' 
                            : isSelected 
                            ? '0 0 0 2.5px rgba(2, 132, 199, 0.3)' 
                            : 'none',
                          transform: (isSelected || isTheOccupiedSlot || isSearchMatch) ? 'scale(1.02)' : 'none',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                          minHeight: '68px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          textAlign: 'center',
                          opacity: passesFilter ? 1 : 0.28,
                          filter: passesFilter ? 'none' : 'grayscale(60%)'
                        }}
                      >
                        {isJustAdded && (
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#059669', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', marginBottom: '2px', border: '1px solid #86efac' }}>
                            ✨ เพิ่มใหม่!
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            color: isTheOccupiedSlot ? '#b91c1c' : isSelected ? '#0369a1' : isOccupied ? '#b91c1c' : '#15803d',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {slot.slot_code}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>
                              {slot.x_axis},{slot.y_axis}
                            </span>
                            {!slot.is_occupied && isManager && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`ต้องการลบช่อง ${slot.slot_code} ออกจากระบบใช่หรือไม่?`)) {
                                    removeSlot(slot.slot_id);
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '1px 3px',
                                  borderRadius: '4px',
                                  lineHeight: 1
                                }}
                                title={`ลบช่อง ${slot.slot_code}`}
                                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Display QR Code Number instead of Long Product Name */}
                        {isTheOccupiedSlot ? (
                          <div style={{ color: '#b91c1c', fontWeight: 900, fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', margin: '2px 0' }}>
                            <AlertTriangle size={13} /> สินค้านี้อยู่ที่นี่
                          </div>
                        ) : isSelected ? (
                          <div style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', margin: '2px 0' }}>
                            <CheckCircle2 size={13} /> เลือกช่องนี้
                          </div>
                        ) : isOccupied ? (
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            color: '#b91c1c',
                            background: '#ffffff',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            border: '1px solid #fecdd3',
                            margin: '2px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            🔲 {slot.qr_code || 'QR-CODE'}
                          </div>
                        ) : (
                          <div style={{ color: '#15803d', fontWeight: 700, fontSize: '0.78rem', margin: '2px 0' }}>
                            ○ ว่าง (คลิก)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Dropdown Alternative */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              หรือเลือกช่องจัดเก็บจากรายการดรอปดาวน์:
            </label>
            <select
              className="form-input"
              value={selectedSlotId}
              disabled={Boolean(alreadyOccupiedSlot)}
              onChange={(e) => {
                if (alreadyOccupiedSlot) return;
                setSelectedSlotId(e.target.value);
                setIsLabelPrinted(false);
                const found = slots.find(s => String(s.slot_id) === e.target.value);
                if (found) {
                  setMessage({
                    type: 'success',
                    text: `📍 เลือกช่อง ${found.slot_code} (X:${found.x_axis}, Y:${found.y_axis}, Z:${found.z_axis}) เรียบร้อยแล้ว`
                  });
                }
              }}
              style={{
                borderColor: selectedSlotId ? '#059669' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '8px 12px',
                background: alreadyOccupiedSlot ? '#f1f5f9' : '#ffffff',
                cursor: alreadyOccupiedSlot ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">{alreadyOccupiedSlot ? '-- ระงับการเลือก (สินค้านี้จัดเก็บในคลังแล้ว) --' : '-- กรุณาคลิกเลือกช่องจัดเก็บ --'}</option>
              {slots.map(s => (
                <option key={s.slot_id} value={s.slot_id} disabled={s.is_occupied}>
                  {s.slot_code} (ชั้น {s.level}, ช่อง {s.bay}) ➔ พิกัด X:{s.x_axis} Y:{s.y_axis} {s.is_occupied ? `❌ [ไม่ว่าง - QR: ${s.qr_code}]` : '✨ [ว่างพร้อมจัดเก็บ]'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MODAL 1: PRINT QR CODE LABEL PREVIEW MODAL */}
      {showPrintModal && (
        <div style={{
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
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            background: '#ffffff',
            border: '2px solid #0284c7',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
            borderRadius: '18px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>
                <Printer size={20} color="#0284c7" /> ตัวอย่างฉลากติดสินค้า (Label Preview)
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Printable Sticker Preview Box */}
            <div id="printable-label-area" style={{
              background: '#ffffff',
              color: '#000000',
              padding: '20px 16px',
              borderRadius: '12px',
              border: '2.5px solid #000000',
              margin: '0 auto 18px auto',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                fontSize: '8pt',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderBottom: '2px solid #000000',
                paddingBottom: '4px',
                marginBottom: '8px'
              }}>
                SMART WAREHOUSE AS/RS HYBRID
              </div>

              <div style={{
                fontWeight: 900,
                fontSize: '12pt',
                lineHeight: 1.25,
                marginBottom: '10px',
                color: '#000000'
              }}>
                {productName || 'ชื่อสินค้า'}
              </div>

              {/* Coordinate Highlight Banner */}
              <div style={{
                background: '#000000',
                color: '#ffffff',
                padding: '6px 8px',
                borderRadius: '6px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div style={{ fontSize: '10.5pt', fontWeight: 900, letterSpacing: '0.05em' }}>
                  📍 พิกัดตำแหน่ง: ช่อง {selectedSlot?.slot_code || 'A-01-01'}
                </div>
                <div style={{ fontSize: '8pt', fontWeight: 700, fontFamily: 'monospace', color: '#67e8f9' }}>
                  AS/RS Coordinates: [X: {selectedSlot?.x_axis || 1}, Y: {selectedSlot?.y_axis || 1}, Z: {selectedSlot?.z_axis || 1}]
                </div>
              </div>

              {/* QR Code SVG */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <QRCodeSVG 
                  value={qrPayload} 
                  size={135} 
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Barcode Number */}
              <div style={{
                fontFamily: 'monospace',
                fontSize: '10.5pt',
                fontWeight: 900,
                letterSpacing: '0.1em',
                marginBottom: '6px',
                color: '#000000'
              }}>
                * {qrCode || 'SKU-0000000'} *
              </div>

              {/* Metadata */}
              <div style={{
                fontSize: '7.8pt',
                color: '#1e293b',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1.5px dashed #475569',
                paddingTop: '6px',
                marginTop: '6px',
                fontWeight: 800
              }}>
                <span>LOT: {lotNumber || '-'}</span>
                <span>CAT: {category || 'General'}</span>
                <span>WT: {weightKg || 0}kg</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmPrintAndReady}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: '1rem', fontWeight: 900 }}
              >
                <Printer size={16} /> ยืนยันพิมพ์ฉลาก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT OCCUPIED SLOT MODAL */}
      {inspectSlot && (
        <div style={{
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
            maxWidth: '460px',
            width: '100%',
            padding: '26px',
            background: '#ffffff',
            border: '2px solid #0284c7',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
            borderRadius: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '1.25rem', color: '#0f172a' }}>
                <Info size={20} color="#0284c7" /> รายละเอียดช่อง {inspectSlot.slot_code}
              </div>
              <button 
                onClick={() => setInspectSlot(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>สถานะ:</span>
                <span className="badge badge-rose">มีสินค้าจัดเก็บอยู่</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>พิกัดเครน AS/RS:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 900 }}>
                  X:{inspectSlot.x_axis} | Y:{inspectSlot.y_axis} | Z:{inspectSlot.z_axis}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>ชื่อสินค้า:</span>
                <strong style={{ color: '#0f172a', fontWeight: 800 }}>{inspectSlot.product_name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>รหัส QR Code / SKU:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 800 }}>{inspectSlot.qr_code}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>หมายเลขล็อต (Lot No.):</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#b45309', fontWeight: 900, background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                  🏷️ {inspectSlot.lot_number || '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>หมวดหมู่:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{inspectSlot.category || 'General'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>น้ำหนัก:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{inspectSlot.weight_kg || 0} kg</span>
              </div>

              <div style={{
                textAlign: 'center',
                marginTop: '8px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1.5px solid #bae6fd',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}>
                <QRCodeSVG 
                  value={JSON.stringify({ 
                    qrCode: inspectSlot.qr_code, 
                    name: inspectSlot.product_name,
                    lot: inspectSlot.lot_number,
                    slotCode: inspectSlot.slot_code,
                    coordinates: { x: inspectSlot.x_axis, y: inspectSlot.y_axis, z: inspectSlot.z_axis }
                  })} 
                  size={110} 
                />
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '3px 8px',
                  borderRadius: '5px'
                }}>
                  พิกัด: ช่อง {inspectSlot.slot_code} [X:{inspectSlot.x_axis}, Y:{inspectSlot.y_axis}, Z:{inspectSlot.z_axis}]
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setInspectSlot(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.95rem', fontWeight: 800 }}
              >
                ปิด
              </button>
              <button
                onClick={async () => {
                  await storeOut(inspectSlot.slot_id);
                  setInspectSlot(null);
                  setAlreadyOccupiedSlot(null);
                }}
                disabled={craneState.status !== 'IDLE'}
                className="btn btn-primary"
                style={{ flex: 2, padding: '10px', fontSize: '0.95rem', fontWeight: 900 }}
              >
                <ArrowUpFromLine size={16} /> สั่งเบิกจ่ายสินค้านี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddSlotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
            border: '2px solid #bae6fd'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '10px', color: '#15803d' }}>
                  <Plus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    เพิ่มช่องจัดเก็บสินค้า (Add Slot)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    กำหนดพิกัดชั้นวางเพื่อขยายความจุคลังสินค้าอัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlotModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {addSlotError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecdd3', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{addSlotError}</span>
              </div>
            )}

            {addSlotSuccess && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{addSlotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    โซน / แร็ค (Rack)
                  </label>
                  <input
                    type="text"
                    value={newSlotRack}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewSlotRack(val);
                      setNewSlotCode(`${val || 'A'}-${String(newSlotLevel).padStart(2, '0')}-${String(newSlotBay).padStart(2, '0')}`);
                    }}
                    className="form-input"
                    maxLength={2}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    ชั้นที่ (Level Y)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSlotLevel}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewSlotLevel(val);
                      setNewSlotCode(`${newSlotRack || 'A'}-${String(val).padStart(2, '0')}-${String(newSlotBay).padStart(2, '0')}`);
                    }}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    ช่องที่ (Bay X)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSlotBay}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewSlotBay(val);
                      setNewSlotCode(`${newSlotRack || 'A'}-${String(newSlotLevel).padStart(2, '0')}-${String(val).padStart(2, '0')}`);
                    }}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  รหัสช่อง (Slot Code)
                </label>
                <input
                  type="text"
                  value={newSlotCode}
                  onChange={(e) => setNewSlotCode(e.target.value.toUpperCase())}
                  placeholder="เช่น A-01-04"
                  className="form-input"
                  style={{ fontWeight: 800, letterSpacing: '0.05em' }}
                  required
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                💡 <strong>คำแนะนำ:</strong> เมื่อเพิ่มช่องใหม่ ผัง 2D และโมเดล 3D แบบเรียลไทม์จะขยายสเกลเพื่อรองรับช่องใหม่อัตโนมัติ สามารถนำเข้าสินค้าได้ทันที
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontWeight: 800 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAddingSlot}
                  className="btn btn-primary"
                  style={{ padding: '9px 22px', fontWeight: 800, background: 'linear-gradient(135deg, #059669, #10b981)', borderColor: '#059669' }}
                >
                  {isAddingSlot ? 'กำลังเพิ่ม...' : '✓ ยืนยันเพิ่มช่องจัดเก็บ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
