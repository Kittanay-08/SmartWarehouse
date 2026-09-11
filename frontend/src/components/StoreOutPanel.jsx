import React, { useState } from 'react';
import { 
  ArrowUpFromLine, 
  Search, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Lock,
  ShieldAlert,
  Box
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

export const StoreOutPanel = () => {
  const { slots, storeOut, craneState } = useWarehouse();
  const { user, canPerformOutbound, getDepartmentInfo } = useAuth();
  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;
  const isOutboundAllowed = canPerformOutbound ? canPerformOutbound(user) : true;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [message, setMessage] = useState(null);

  const occupiedSlots = slots.filter(s => s.is_occupied);

  const filteredSlots = occupiedSlots.filter(s => {
    const matchesSearch = 
      (s.product_name && s.product_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.slot_code && s.slot_code.toLowerCase().includes(search.toLowerCase())) ||
      (s.qr_code && s.qr_code.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRetrieve = async (slot) => {
    if (!isOutboundAllowed) {
      setMessage({ type: 'error', text: `🔒 จำกัดสิทธิ์ [${deptInfo?.name || 'ฝ่ายวิศวกรรม'}]: คุณไม่มีสิทธิ์สั่งเบิกจ่ายสินค้า (สงวนสิทธิ์เฉพาะฝ่ายปฏิบัติการและฝ่ายบริหารเท่านั้น)` });
      return;
    }
    if (craneState.status !== 'IDLE') return;
    setMessage(null);

    const res = await storeOut(slot.slot_id);
    if (res.success) {
      setMessage({ type: 'success', text: `✅ เบิกจ่ายสินค้า "${slot.product_name}" สำเร็จ!` });
    } else {
      setMessage({ type: 'error', text: `❌ ${res.message}` });
    }
  };

  const categories = ['ALL', 'Beverages', 'Electronics', 'Snacks', 'Parts', 'General'];

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-cyan">Outbound Station</span>
          <span className="badge badge-emerald">Real-time Dispatch</span>
          {deptInfo && (
            <span style={{
              background: deptInfo.bg,
              border: `1px solid ${deptInfo.border}`,
              color: deptInfo.color,
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.8rem'
            }}>
              {deptInfo.badge}
            </span>
          )}
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
          เบิกจ่ายสินค้าอัตโนมัติ (Store-Out / Retrieval Operation)
        </h2>
        <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600 }}>
          เลือกสินค้าที่ต้องการเบิกจ่าย เครน AS/RS จะเคลื่อนที่ไปดึงสินค้าจากชั้นวางและนำมาส่งที่จุดรับสินค้าทันที
        </p>
      </div>

      {/* Role Restriction Banner for Non-Outbound Roles (e.g. Engineer) */}
      {!isOutboundAllowed && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          marginBottom: '24px',
          background: '#faf5ff',
          border: '1.5px solid #d8b4fe',
          color: '#6b21a8',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontWeight: 700,
          boxShadow: '0 2px 10px rgba(124, 58, 237, 0.08)'
        }}>
          <ShieldAlert size={28} color="#7c3aed" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#581c87', marginBottom: '2px' }}>
              🔒 โหมดตรวจสอบสต็อกสินค้า (View-Only Mode) — จำกัดสิทธิ์การเบิกจ่าย
            </div>
            <div>
              คุณเข้าสู่ระบบในฐานะ <strong>{user?.name}</strong> ({deptInfo?.badge || user?.role}) — บัญชีของคุณสามารถตรวจสอบรายการสินค้าได้ แต่ <strong>ไม่มีสิทธิ์สั่งเบิกจ่ายสินค้าจริง</strong> ออกจากคลัง (สงวนสิทธิ์เฉพาะ <strong>ฝ่ายปฏิบัติการ (Operator)</strong> และ <strong>ฝ่ายบริหาร (Admin)</strong> เท่านั้น)
            </div>
          </div>
        </div>
      )}

      {/* Status / Alert Banner */}
      {message && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '26px',
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fecdd3'}`,
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 800
        }}>
          {message.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Active Crane Retrieval Progress Banner */}
      {craneState.status === 'RETRIEVING' && (
        <div className="glass-panel" style={{
          padding: '20px 26px',
          marginBottom: '28px',
          border: '2px solid #0284c7',
          background: 'linear-gradient(135deg, #e0f2fe, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="pulse-dot busy" />
              <strong style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 900 }}>กลไก AS/RS กำลังดำเนินการเบิกจ่าย...</strong>
            </div>
            <span className="badge badge-amber">{craneState.stepProgress}%</span>
          </div>
          <p style={{ fontSize: '1rem', color: '#0284c7', marginBottom: '10px', fontWeight: 700 }}>
            {craneState.stepDescription}
          </p>
          <div style={{ width: '100%', height: '8px', background: '#cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${craneState.stepProgress}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-panel" style={{
        padding: '20px 26px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
        background: '#ffffff',
        border: '1.5px solid #bae6fd'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '450px' }}>
          <Search size={20} color="#0284c7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '46px' }}
            placeholder="ค้นหาชื่อสินค้า หรือ รหัสบาร์โค้ด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800 }}
            >
              {cat === 'ALL' ? 'ทั้งหมด (All)' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Occupied Items Grid */}
      {filteredSlots.length === 0 ? (
        <div className="glass-panel" style={{ padding: '56px', textAlign: 'center', background: '#ffffff' }}>
          <Package size={60} color="#0284c7" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '8px', fontWeight: 800 }}>
            ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา
          </h3>
          <p style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 600 }}>
            ลองเปลี่ยนคำค้นหา หรือนำเข้าสินค้าใหม่ในหน้า Store-In
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}>
          {filteredSlots.map(slot => (
            <div key={slot.slot_id} className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1.5px solid #bae6fd'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    border: '1.5px solid #7dd3fc',
                    color: '#0369a1',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    fontSize: '0.95rem'
                  }}>
                    {slot.slot_code}
                  </div>

                  <span className="badge badge-purple">
                    {slot.category || 'General'}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', lineHeight: 1.4 }}>
                  {slot.product_name}
                </h4>

                <div style={{ fontSize: '0.95rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>รหัสบาร์โค้ด:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 800 }}>{slot.qr_code}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>พิกัด AS/RS:</span>
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>X:{slot.x_axis} | Y:{slot.y_axis} | Z:{slot.z_axis}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>น้ำหนัก:</span>
                    <span style={{ color: '#0f172a', fontWeight: 800 }}>{slot.weight_kg || 0} kg</span>
                  </div>
                  {slot.lot_number && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>ล็อตสินค้า:</span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>{slot.lot_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {isOutboundAllowed ? (
                  <button
                    onClick={() => handleRetrieve(slot)}
                    disabled={craneState.status !== 'IDLE'}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px', fontSize: '0.98rem', fontWeight: 800 }}
                  >
                    <ArrowUpFromLine size={18} />
                    {craneState.status !== 'IDLE' ? 'กำลังเบิก...' : 'สั่งเบิกจ่าย'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMessage({ type: 'error', text: `🔒 จำกัดสิทธิ์ [${deptInfo?.name || 'ฝ่ายวิศวกรรม'}]: เฉพาะฝ่ายปฏิบัติการและฝ่ายบริหารเท่านั้นที่มีสิทธิ์เบิกจ่ายสินค้า` })}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      background: '#f1f5f9',
                      color: '#64748b',
                      borderColor: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                    title="บัญชีของคุณไม่มีสิทธิ์เบิกจ่ายสินค้า"
                  >
                    <Lock size={16} color="#64748b" /> ดูอย่างเดียว
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
