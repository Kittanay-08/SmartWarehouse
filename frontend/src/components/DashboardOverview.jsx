import React from 'react';
import { 
  Boxes, 
  Box,
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Activity, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Radio,
  Lock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';

export const DashboardOverview = ({ setActiveTab }) => {
  const { slots, stats, craneState, transactions, mqttStatus, esp32Connected } = useWarehouse();
  const { user, getDepartmentInfo, canPerformOutbound, setIsLoginModalOpen } = useAuth();
  const deptInfo = getDepartmentInfo ? getDepartmentInfo(user) : null;
  const isOutboundAllowed = canPerformOutbound ? canPerformOutbound(user) : true;

  const categories = ['Beverages', 'Electronics', 'Snacks', 'Parts', 'General'];
  const categoryColors = {
    Beverages: '#0284c7',    // Sky Blue
    Electronics: '#7c3aed',  // Violet
    Snacks: '#d97706',       // Amber
    Parts: '#059669',        // Mint Emerald
    General: '#64748b'       // Cool Slate
  };

  const categoryCounts = categories.map(cat => {
    const count = slots.filter(s => s.is_occupied && (s.category === cat || (!s.category && cat === 'General'))).length;
    return { name: cat, count, color: categoryColors[cat] };
  });

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Welcome Hero Banner (Fresh Ice Blue Gradient) */}
      <div className="glass-panel" style={{
        padding: '30px 34px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 60%, #f0fdf4 100%)',
        border: '1.5px solid #bae6fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span className="badge badge-emerald">ระบบทำงานปกติ (System Operational)</span>
            <span className="badge badge-cyan">ESP32 IoT Connected</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.01em' }}>
            ศูนย์ควบคุมและแดชบอร์ดคลังสินค้าอัตโนมัติ (AS/RS Smart Hub)
          </h1>
          <p style={{ color: '#334155', fontSize: '1.05rem', marginTop: '6px', maxWidth: '850px', fontWeight: 600 }}>
            ติดตามการจัดเก็บ เบิกจ่าย และควบคุมระบบเครน AS/RS {slots.length} ช่องแบบเรียลไทม์ผ่านโปรโตคอล MQTT & WebSockets
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('store-in')}
            className="btn btn-primary"
            style={{ padding: '13px 22px', fontSize: '0.98rem', fontWeight: 800 }}
          >
            <ArrowDownToLine size={20} /> นำเข้าสินค้า & ผังชั้นวาง
          </button>
          <button 
            onClick={() => setActiveTab('store-out')}
            className={`btn ${isOutboundAllowed ? 'btn-success' : 'btn-secondary'}`}
            style={{ 
              padding: '13px 22px', 
              fontSize: '0.98rem', 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isOutboundAllowed ? <ArrowUpFromLine size={20} /> : <Lock size={18} />}
            <span>{isOutboundAllowed ? 'เบิกจ่ายสินค้า' : 'เบิกจ่าย (ดูอย่างเดียว)'}</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* KPI 1: Occupancy Rate */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                อัตราการใช้พื้นที่คลัง (Occupancy)
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {stats.occupancyRate}%
              </div>
              <div style={{ fontSize: '0.95rem', color: '#334155', marginTop: '4px', fontWeight: 600 }}>
                ใช้งาน <strong style={{ color: '#0284c7' }}>{stats.occupiedSlots}</strong> จากทั้งหมด {stats.totalSlots} ช่อง
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              border: '1.5px solid #bae6fd'
            }}>
              <Layers size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.occupancyRate}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 2: Available Capacity */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                ช่องว่างพร้อมจัดเก็บ (Available)
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {stats.emptySlots} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>ช่อง</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: '#334155', marginTop: '4px', fontWeight: 600 }}>
                พร้อมรับสินค้าเข้าคลังทันที
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              border: '1.5px solid #86efac'
            }}>
              <CheckCircle2 size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.totalSlots > 0 ? ((stats.emptySlots / stats.totalSlots) * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 3: Total Load Weight */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>
                น้ำหนักสินค้ารวม (Total Weight)
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {stats.totalWeight} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>kg</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: '#334155', marginTop: '4px', fontWeight: 600 }}>
                พิกัดรับน้ำหนักสูงสุด 150 kg
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
              border: '1.5px solid #ddd6fe'
            }}>
              <TrendingUp size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (Number(stats.totalWeight) / 150) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 4: AS/RS Crane Status */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: craneState.status === 'IDLE' ? '#059669' : '#d97706', textTransform: 'uppercase' }}>
                สถานะเครน AS/RS (Crane Status)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: craneState.status === 'IDLE' ? '#059669' : '#d97706', marginTop: '6px' }}>
                {craneState.status}
              </div>
              <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '4px', fontWeight: 700 }}>
                พิกัด: X:{craneState.currentX.toFixed(1)} Y:{craneState.currentY.toFixed(1)} Z:{craneState.currentZ.toFixed(1)}
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: craneState.status === 'IDLE' ? '#dcfce7' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: craneState.status === 'IDLE' ? '#059669' : '#d97706',
              border: `1.5px solid ${craneState.status === 'IDLE' ? '#86efac' : '#fde68a'}`
            }}>
              <Activity size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '18px' }}>
            <div style={{ width: `${craneState.stepProgress || 0}%`, height: '100%', background: '#0284c7', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Middle Grid: Category Breakdown & Machine Live Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Category Distribution Card */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Boxes size={22} color="#0284c7" />
            สัดส่วนสินค้าตามหมวดหมู่ (Category Breakdown)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryCounts.map(cat => {
              const pct = stats.occupiedSlots > 0 ? ((cat.count / stats.occupiedSlots) * 100).toFixed(0) : 0;
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '6px' }}>
                    <span style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                    </span>
                    <span style={{ color: '#334155', fontWeight: 700 }}>
                      <strong style={{ color: '#0284c7' }}>{cat.count}</strong> รายการ ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: '5px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time AS/RS Diagnostics */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} color="#059669" />
            การสื่อสารฮาร์ดแวร์ & IoT Diagnostics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>โหมดควบคุมเครน:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.85rem' }}>ESP32 Step-Interpolation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>MQTT Broker:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 800 }}>{mqttStatus.broker}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>สถานะก้ามปู (Fork):</span>
              <span style={{ color: craneState.forkExtended ? '#d97706' : '#059669', fontWeight: 800 }}>
                {craneState.forkExtended ? '👉 ยืดออก (Extended)' : '👈 หดกลับ (Retracted)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>ขั้นตอนปัจจุบัน:</span>
              <span style={{ color: '#0f172a', fontWeight: 800 }}>{craneState.stepDescription}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Feed */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={22} color="#0284c7" />
            ประวัติการทำรายการล่าสุด (Recent Activity Stream)
          </h3>
          <button 
            onClick={() => setActiveTab('history')}
            className="btn btn-outline"
            style={{ padding: '8px 18px', fontSize: '0.9rem', fontWeight: 700 }}
          >
            ดูประวัติทั้งหมด →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>วันและเวลา</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>ประเภท</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>ช่องจัดเก็บ</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>สินค้า</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>รหัส QR</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>ผู้ทำรายการ</th>
                <th style={{ padding: '14px 16px', fontWeight: 800 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 16px', color: '#334155', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {new Date(t.created_at).toLocaleString('th-TH', { hour12: false })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${t.transaction_type === 'STORE_IN' ? 'badge-emerald' : 'badge-cyan'}`}>
                      {t.transaction_type === 'STORE_IN' ? '📥 นำเข้า' : '📤 เบิกจ่าย'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#0284c7' }}>
                    {t.slot_code || `Slot #${t.slot_id}`}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                    {t.product_name}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: '#334155', fontWeight: 600 }}>
                    {t.qr_code}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: 600 }}>
                    {t.operator_name}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-emerald">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
