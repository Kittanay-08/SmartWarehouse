import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileSpreadsheet,
  User,
  Layers,
  Filter,
  Trash2,
  Clock, 
  ShieldAlert,
  Lock,
  ShieldCheck,
  X,
  MoreVertical,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

export const TransactionHistory = () => {
  const { transactions, clearTransactions } = useWarehouse();
  const { user, canDeleteHistory, getDepartmentInfo } = useAuth();
  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;
  const isAdmin = canDeleteHistory ? canDeleteHistory(user) : false;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearMessage, setClearMessage] = useState(null);
  
  // View More / Pagination state (Default 7 items)
  const [visibleCount, setVisibleCount] = useState(7);
  // Transaction detail popup modal state (from 3-dots button ⋮)
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Date Range States
  const THREE_MONTHS_DAYS = 90;
  const THREE_MONTHS_MS = THREE_MONTHS_DAYS * 24 * 60 * 60 * 1000;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const threeMonthsAgoStr = new Date(Date.now() - THREE_MONTHS_MS).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(threeMonthsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [datePreset, setDatePreset] = useState('3M'); // 'TODAY', '7D', '30D', '3M', 'CUSTOM'

  // Reset visibleCount to 7 whenever search or filter changes
  useEffect(() => {
    setVisibleCount(7);
  }, [search, filterType, startDate, endDate]);

  // Apply Quick Date Presets
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const end = todayStr;

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7D') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past7);
      setEndDate(end);
    } else if (preset === '30D') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(past30);
      setEndDate(end);
    } else if (preset === '3M') {
      setStartDate(threeMonthsAgoStr);
      setEndDate(end);
    }
  };

  // Filter and Sort:
  // 1. Auto-purge records older than 3 months (> 90 days)
  // 2. Filter by Search keyword
  // 3. Filter by Transaction Type (STORE_IN / RETRIEVE_OUT)
  // 4. Filter by Selected Date Range (within 3 months)
  // 5. SORT ORDER: Newest first (วันล่าสุดอยู่ด้านบน)
  const validAndSortedLogs = useMemo(() => {
    const nowMs = Date.now();

    return transactions
      // Rule 1: Automatically exclude/purge anything older than 3 months
      .filter(t => {
        const itemTimeMs = new Date(t.created_at).getTime();
        return (nowMs - itemTimeMs) <= THREE_MONTHS_MS;
      })
      // Rule 2: Filter by user search & type & date range
      .filter(t => {
        const matchesSearch = 
          (t.product_name && t.product_name.toLowerCase().includes(search.toLowerCase())) ||
          (t.slot_code && t.slot_code.toLowerCase().includes(search.toLowerCase())) ||
          (t.qr_code && t.qr_code.toLowerCase().includes(search.toLowerCase())) ||
          (t.operator_name && t.operator_name.toLowerCase().includes(search.toLowerCase())) ||
          (t.details && t.details.toLowerCase().includes(search.toLowerCase()));

        const matchesType = filterType === 'ALL' || t.transaction_type === filterType;

        // Date range matching
        const itemDateStr = new Date(t.created_at).toISOString().split('T')[0];
        const matchesDate = (!startDate || itemDateStr >= startDate) && (!endDate || itemDateStr <= endDate);

        return matchesSearch && matchesType && matchesDate;
      })
      // Rule 3: Sort descending - NEWEST FIRST (วันล่าสุดอยู่ด้านบนสุด)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, search, filterType, startDate, endDate, THREE_MONTHS_MS]);

  const handleExportCSV = () => {
    const headers = 'ลำดับ,วันและเวลา,ประเภทรายการ,ช่องจัดเก็บ,ชื่อสินค้า,รหัส QR/บาร์โค้ด,หมวดหมู่,ผู้ทำรายการ,บทบาท,สถานะ,รายละเอียด\n';
    const rows = validAndSortedLogs.map((t, idx) => {
      const dateStr = new Date(t.created_at).toLocaleString('th-TH');
      return `"${idx + 1}","${dateStr}","${t.transaction_type}","${t.slot_code || ''}","${(t.product_name || '').replace(/"/g, '""')}","${t.qr_code || ''}","${t.category || ''}","${t.operator_name || ''}","${t.operator_role || ''}","${t.status || ''}","${(t.details || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `asrs_transactions_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            ประวัติการใช้งานการนำเข้า-ออกสินค้า (Transaction History Logs)
          </h2>
        </div>

        {/* Actions: Export & Admin-Only Clear History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-danger"
              style={{ padding: '12px 18px', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              title="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถล้างประวัติได้"
            >
              <Trash2 size={18} /> ล้างประวัติ (Admin Only)
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: 800
            }}>
              <Lock size={15} color="#94a3b8" />
              <span>ความปลอดภัยข้อมูล: ห้ามลบประวัติ (Admin Only)</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="btn btn-success"
            style={{ padding: '12px 22px', fontSize: '0.95rem', fontWeight: 800 }}
          >
            <FileSpreadsheet size={18} /> ส่งออกรายงาน Excel / CSV
          </button>
        </div>
      </div>

      {/* Clear Success/Error Toast Alert */}
      {clearMessage && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '18px',
          background: '#dcfce7',
          border: '1.5px solid #86efac',
          color: '#15803d',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={20} />
          <span>{clearMessage}</span>
        </div>
      )}

      {/* Admin Clear Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '450px',
            width: '100%',
            padding: '32px',
            background: '#ffffff',
            border: '2px solid #fecdd3',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              marginBottom: '16px'
            }}>
              <Trash2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
              ยืนยันการล้างประวัติธุรกรรมทั้งหมด?
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '24px', fontWeight: 600 }}>
              การดำเนินการนี้จะลบรายการประวัติทั้งหมดในระบบอย่างถาวร บัญชี <strong>{user?.name} (Admin)</strong> มีสิทธิ์ล้างข้อมูลได้
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <X size={18} /> ยกเลิก
              </button>
              <button
                onClick={async () => {
                  const res = await clearTransactions();
                  setShowClearConfirm(false);
                  setClearMessage(res.message || 'ล้างประวัติเรียบร้อยแล้ว');
                  setTimeout(() => setClearMessage(null), 4000);
                }}
                className="btn btn-danger"
                style={{ flex: 1, padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <Trash2 size={18} /> ยืนยันการล้าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention Policy Notice Banner */}
      <div style={{
        background: '#f0fdf4',
        border: '1.5px solid #86efac',
        padding: '12px 18px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.9rem',
        fontWeight: 700,
        color: '#166534'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#15803d" />
          <span>นโยบายความจุข้อมูล: แสดงประวัติสูงสุด 3 เดือนย้อนหลัง ({threeMonthsAgoStr} ถึง {todayStr}) ข้อมูลที่เก่ากว่า 3 เดือนจะถูกล้างอัตโนมัติ</span>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
          Auto-Purge Active
        </span>
      </div>

      {/* Date Range Selector & Filter Toolbar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: '22px',
        background: '#ffffff',
        border: '1.5px solid #bae6fd',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Row 1: Date Range Presets & Date Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Quick Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#0284c7" /> ช่วงเวลา:
            </span>
            <button
              type="button"
              onClick={() => handleDatePreset('TODAY')}
              className={`btn ${datePreset === 'TODAY' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('7D')}
              className={`btn ${datePreset === '7D' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('30D')}
              className={`btn ${datePreset === '30D' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              30 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset('3M')}
              className={`btn ${datePreset === '3M' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              3 เดือนย้อนหลัง (สูงสุด)
            </button>
          </div>

          {/* Custom Date Pickers (Bounded by 3 months max) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>ตั้งแต่วันที่:</label>
              <input
                type="date"
                className="form-input"
                min={threeMonthsAgoStr}
                max={todayStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                style={{ padding: '6px 10px', fontSize: '0.88rem', fontWeight: 700 }}
              />
            </div>

            <span style={{ color: '#94a3b8', fontWeight: 800 }}>-</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>ถึงวันที่:</label>
              <input
                type="date"
                className="form-input"
                min={startDate || threeMonthsAgoStr}
                max={todayStr}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                style={{ padding: '6px 10px', fontSize: '0.88rem', fontWeight: 700 }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search & Type Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '460px' }}>
            <Search size={18} color="#0284c7" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px', fontSize: '0.9rem' }}
              placeholder="ค้นหาชื่อสินค้า, ช่องจัดเก็บ, รหัส QR, หรือผู้ทำรายการ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => setFilterType('ALL')}
              className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              ทั้งหมด ({validAndSortedLogs.length})
            </button>
            <button
              onClick={() => setFilterType('STORE_IN')}
              className={`btn ${filterType === 'STORE_IN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              📥 นำเข้า ({validAndSortedLogs.filter(t => t.transaction_type === 'STORE_IN').length})
            </button>
            <button
              onClick={() => setFilterType('RETRIEVE_OUT')}
              className={`btn ${filterType === 'RETRIEVE_OUT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              📤 เบิกจ่าย ({validAndSortedLogs.filter(t => t.transaction_type === 'RETRIEVE_OUT').length})
            </button>
          </div>
        </div>
      </div>

      {/* History Table (Newest at Top) */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
              <th style={{ padding: '14px 16px', fontWeight: 800, width: '60px' }}>#</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '170px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#0284c7" /> วันและเวลา (ล่าสุดอยู่บน)
                </span>
              </th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '120px' }}>ประเภทรายการ</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '110px' }}>ช่องจัดเก็บ (Slot)</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '220px' }}>ชนิดสินค้า (Product)</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, width: '120px', textAlign: 'center' }}>รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {validAndSortedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 700 }}>
                  ไม่พบรายการประวัติในช่วงวันที่และเงื่อนไขที่ระบุ
                </td>
              </tr>
            ) : (
              validAndSortedLogs.slice(0, visibleCount).map((t, index) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 700 }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#0f172a', whiteSpace: 'nowrap', fontWeight: 800 }}>
                    {new Date(t.created_at).toLocaleString('th-TH', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: false 
                    })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${t.transaction_type === 'STORE_IN' ? 'badge-emerald' : 'badge-cyan'}`}>
                      {t.transaction_type === 'STORE_IN' ? '📥 นำเข้า' : '📤 เบิกจ่าย'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#0284c7' }}>
                    {t.slot_code || `Slot #${t.slot_id}`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.product_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>{t.category || 'General'}</span>
                      {t.lot_number && (
                        <span style={{ fontSize: '0.74rem', color: '#b45309', fontFamily: 'var(--font-mono)', fontWeight: 800, background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                          🏷️ ล็อต: {t.lot_number}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* 3-dots action button to open detail modal */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTxDetail(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #bae6fd',
                        background: '#f0f9ff',
                        color: '#0284c7',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        transition: 'all 0.15s ease'
                      }}
                      title="คลิกเพื่อดูรายละเอียด (รหัส QR, ผู้ทำรายการ, สถานะ, รายละเอียดการทำงาน)"
                    >
                      <MoreVertical size={16} />
                      <span>ดูข้อมูล</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Load More Button if logs > 7 */}
        {validAndSortedLogs.length > 7 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            {visibleCount < validAndSortedLogs.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 7)}
                className="btn btn-secondary"
                style={{
                  padding: '11px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>ดูเพิ่มเติม (แสดงอีก {Math.min(7, validAndSortedLogs.length - visibleCount)} รายการ) ⬇️</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(7)}
                className="btn btn-secondary"
                style={{
                  padding: '9px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#64748b',
                  borderColor: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <span>ย่อแสดง 7 รายการล่าสุด ⬆️</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal (เปิดจากปุ่ม 3 จุด ⋮) */}
      {selectedTxDetail && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            background: '#ffffff',
            border: '2px solid #bae6fd',
            borderRadius: '18px',
            boxShadow: '0 20px 50px rgba(2, 132, 199, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                  color: '#ffffff',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Info size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    รายละเอียดธุรกรรม
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    รหัสบันทึก: #{selectedTxDetail.id || 'N/A'} • {new Date(selectedTxDetail.created_at).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 4 Items from User Image 3: QR Code, ผู้ทำรายการ, สถานะ, รายละเอียดการทำงาน */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              {/* Product & Slot info */}
              <div style={{
                background: '#f0f9ff',
                border: '1.5px solid #bae6fd',
                padding: '14px 16px',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 800, marginBottom: '4px' }}>
                  📦 สินค้าและตำแหน่งช่องจัดเก็บ
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>
                  {selectedTxDetail.product_name}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#0284c7', background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #7dd3fc', fontSize: '0.85rem' }}>
                    📍 ช่อง: {selectedTxDetail.slot_code || `Slot #${selectedTxDetail.slot_id}`}
                  </span>
                  <span className={`badge ${selectedTxDetail.transaction_type === 'STORE_IN' ? 'badge-emerald' : 'badge-cyan'}`}>
                    {selectedTxDetail.transaction_type === 'STORE_IN' ? '📥 นำเข้า' : '📤 เบิกจ่าย'}
                  </span>
                  {selectedTxDetail.category && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                      หมวดหมู่: {selectedTxDetail.category}
                    </span>
                  )}
                  {selectedTxDetail.lot_number && (
                    <span style={{ fontSize: '0.78rem', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 800 }}>
                      ล็อต: {selectedTxDetail.lot_number}
                    </span>
                  )}
                </div>
              </div>

              {/* 1. รหัส QR Code */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                  🏷️ รหัส QR Code / บาร์โค้ด:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '0.04em' }}>
                    {selectedTxDetail.qr_code || '-'}
                  </span>
                  {selectedTxDetail.qr_code && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTxDetail.qr_code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedCode ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                      <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. ผู้ทำรายการ (Operator) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                  👤 ผู้ทำรายการ (Operator):
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {selectedTxDetail.operator_name || 'ไม่ระบุผู้ทำรายการ'}
                  </span>
                  {selectedTxDetail.operator_role && (
                    <span style={{
                      fontSize: '0.74rem',
                      textTransform: 'uppercase',
                      fontWeight: 900,
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {selectedTxDetail.operator_role}
                    </span>
                  )}
                </div>
              </div>

              {/* 3. สถานะ (Status) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                  🔄 สถานะ (Status):
                </div>
                <div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.88rem', padding: '4px 12px' }}>
                    <CheckCircle2 size={15} /> {selectedTxDetail.status || 'COMPLETED'}
                  </span>
                </div>
              </div>

              {/* 4. รายละเอียดการทำงาน (Work Details) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                  📝 รายละเอียดการทำงาน:
                </div>
                <div style={{ fontSize: '0.92rem', color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                  {selectedTxDetail.details || 'ไม่มีบันทึกเพิ่มเติม'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 24px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
