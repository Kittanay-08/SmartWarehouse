import React, { useState, useMemo } from 'react';
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
  X
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
  
  // Date Range States
  const THREE_MONTHS_DAYS = 90;
  const THREE_MONTHS_MS = THREE_MONTHS_DAYS * 24 * 60 * 60 * 1000;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const threeMonthsAgoStr = new Date(Date.now() - THREE_MONTHS_MS).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(threeMonthsAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [datePreset, setDatePreset] = useState('3M'); // 'TODAY', '7D', '30D', '3M', 'CUSTOM'

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">Audit Trail & Compliance</span>
            <span className="badge badge-cyan">Retention: 3 Months Auto-Purge</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            ประวัติการใช้งานการนำเข้า-ออกสินค้า (Transaction History Logs)
          </h2>
          <p style={{ color: '#334155', fontSize: '1rem', fontWeight: 600 }}>
            บันทึกประวัติการทำรายการเรียงลำดับจาก <strong>วันล่าสุดอยู่ด้านบน</strong> (จัดเก็บย้อนหลังสูงสุด 3 เดือน ระบบจะล้างข้อมูลเก่ากว่า 3 เดือนอัตโนมัติ)
          </p>
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
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '180px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#0284c7" /> วันและเวลา (ล่าสุดอยู่บน)
                </span>
              </th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '120px' }}>ประเภทรายการ</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '110px' }}>ช่องจัดเก็บ (Slot)</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '220px' }}>ชนิดสินค้า (Product)</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '150px' }}>รหัส QR Code</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '160px' }}>ผู้ทำรายการ (Operator)</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '110px' }}>สถานะ</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, minWidth: '240px' }}>รายละเอียดการทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {validAndSortedLogs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 700 }}>
                  ไม่พบรายการประวัติในช่วงวันที่และเงื่อนไขที่ระบุ
                </td>
              </tr>
            ) : (
              validAndSortedLogs.map((t, index) => (
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
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: '#334155', fontWeight: 800 }}>
                    {t.qr_code}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.operator_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800 }}>
                      {t.operator_role}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={14} /> {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '0.88rem', maxWidth: '340px', fontWeight: 600 }}>
                    {t.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
