import React, { useEffect, useRef, useState } from 'react';
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

// ตัวเลขนับขึ้นจาก 0 พร้อมกับหลอด (จังหวะเดียวกับ .bar-grow ใน index.css)
const COUNT_DELAY_MS = 450;
const COUNT_DURATION_MS = 1100;
// เส้นความเร็วเดียวกับ cubic-bezier(0.22, 1, 0.36, 1) ของหลอด เพื่อให้ตัวเลขกับหลอดไปพร้อมกัน
const easeOut = (() => {
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
  const bez = (t, a, b) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 20; i += 1) {
      t = (lo + hi) / 2;
      if (bez(t, x1, x2) < x) lo = t; else hi = t;
    }
    return bez(t, y1, y2);
  };
})();

const CountUp = ({ value }) => {
  const target = Number(value) || 0;
  const decimals = String(value).includes('.') ? String(value).split('.')[1].length : 0;
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const mountedAt = useRef(performance.now());

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const from = shownRef.current;
    // ตอนเพิ่งเปิดหน้า รอให้การ์ดเด้งขึ้นก่อน แล้วนับพร้อมหลอด / ถ้าค่าเปลี่ยนทีหลังให้เลื่อนไปค่าใหม่เร็ว ๆ
    const delay = Math.max(0, mountedAt.current + COUNT_DELAY_MS - performance.now());
    const duration = (from === 0 || delay > 0) ? COUNT_DURATION_MS : 600;
    const start = performance.now() + delay;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const v = from + (target - from) * easeOut(t);
      shownRef.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{shown.toFixed(decimals)}</>;
};

export const DashboardOverview = ({ setActiveTab }) => {
  const { slots, stats, craneState, transactions, esp32Connected } = useWarehouse();
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

  const getShiftGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'ยินดีต้อนรับสู่กะเช้า';
    if (hour >= 12 && hour < 18) return 'ยินดีต้อนรับสู่กะบ่าย';
    return 'ยินดีต้อนรับสู่กะดึก';
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Welcome Hero Banner (Adaptive Dual Theme Gradient) */}
      <div className="glass-panel hero-banner" style={{
        padding: '30px 34px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'var(--bg-card, linear-gradient(135deg, #e8f4fd 0%, #ffffff 55%, #f0fdf4 100%))',
        border: '1.5px solid var(--border-color, #bae6fd)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-emerald">ระบบทำงานปกติ</span>
            <span className="badge badge-cyan">{esp32Connected ? 'ESP32 IoT Online' : 'ESP32 Standby'}</span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '20px',
              background: deptInfo?.bg || 'rgba(2, 132, 199, 0.12)',
              color: deptInfo?.color || '#0284c7',
              border: `1px solid ${deptInfo?.border || '#bae6fd'}`
            }}>
              {deptInfo?.badge || user?.roleLabel || 'ผู้ปฏิบัติงาน'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, background: 'linear-gradient(135deg, #0284c7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.01em' }}>
            สวัสดีคุณ{user?.name || 'ผู้ปฏิบัติงาน'}, {getShiftGreeting()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '6px', maxWidth: '850px', fontWeight: 600 }}>
            {user?.role === 'engineer' 
              ? `🔧 สถานะวิศวกรรม: เครน AS/RS พิกัด (X:${craneState.currentX.toFixed(1)}, Y:${craneState.currentY.toFixed(1)}, Z:${craneState.currentZ.toFixed(1)}) — พร้อมสำหรับการทดสอบและขยายผังแร็ค`
              : user?.role === 'admin'
                ? `👑 สิทธิ์บริหารสูงสุด: ติดตามการจัดเก็บ เบิกจ่าย และควบคุมระบบเครน AS/RS ทั้งหมด ${slots.length} ช่องอย่างปลอดภัย`
                : `📦 กะปฏิบัติการ: จัดเก็บแล้ว ${stats.occupiedSlots} ช่อง (ว่างพร้อมรับสินค้า ${stats.emptySlots} ช่อง) — สแกน QR และพิมพ์ฉลากได้ทันที`}
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('store-in')}
            className="btn btn-primary"
            style={{ 
              padding: '13px 22px', 
              fontSize: '0.98rem', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <ArrowDownToLine size={20} /> นำเข้าสินค้า & ผังชั้นวาง
          </button>
          <button 
            onClick={() => setActiveTab('store-out')}
            className={`btn ${isOutboundAllowed ? 'btn-success' : 'btn-secondary'}`}
            style={{ 
              padding: '13px 22px', 
              fontSize: '0.98rem', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isOutboundAllowed ? 'linear-gradient(135deg, #059669, #047857)' : '#f1f5f9',
              color: isOutboundAllowed ? '#ffffff' : '#334155',
              border: isOutboundAllowed ? 'none' : '1.5px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: isOutboundAllowed ? '0 4px 14px rgba(5, 150, 105, 0.35)' : 'none',
              cursor: 'pointer'
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* KPI 1: Occupancy Rate */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-sky)', textTransform: 'uppercase' }}>
                อัตราการใช้พื้นที่
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #0284c7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '6px' }}>
                <CountUp value={stats.occupancyRate} />%
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                ใช้งาน <strong style={{ color: 'var(--accent-sky)' }}>{stats.occupiedSlots}</strong> จากทั้งหมด {stats.totalSlots} ช่อง
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2,132,199,0.1), rgba(6,182,212,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-sky)',
              border: '1.5px solid var(--border-color)'
            }}>
              <Layers size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div className="bar-grow" style={{ width: `${stats.occupancyRate}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 2: Available Capacity */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>
                ช่องว่างพร้อมใช้
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #059669, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '6px' }}>
                <CountUp value={stats.emptySlots} /> <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>ช่อง</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                พร้อมรับสินค้าเข้าคลังทันที
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2,132,199,0.1), rgba(6,182,212,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              border: '1.5px solid var(--border-color)'
            }}>
              <CheckCircle2 size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div className="bar-grow" style={{ width: `${stats.totalSlots > 0 ? ((stats.emptySlots / stats.totalSlots) * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 3: Stored Items Count */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                สินค้าในคลัง
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '6px' }}>
                <CountUp value={stats.occupiedSlots} /> <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>รายการ</span>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                ประวัติการทำรายการ {transactions.length} รายการ
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(2,132,199,0.1), rgba(6,182,212,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
              border: '1.5px solid var(--border-color)'
            }}>
              <Boxes size={30} />
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', marginTop: '18px', overflow: 'hidden' }}>
            <div className="bar-grow" style={{ width: `${stats.totalSlots > 0 ? ((stats.occupiedSlots / stats.totalSlots) * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: '4px' }} />
          </div>
        </div>

        {/* KPI 4: AS/RS Crane Status */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          position: 'relative', 
          overflow: 'hidden',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: craneState.status === 'IDLE' ? '#059669' : craneState.status === 'EMERGENCY_STOP' ? '#e11d48' : '#d97706', textTransform: 'uppercase' }}>
                สถานะเครน AS/RS
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: craneState.status === 'IDLE' ? '#059669' : craneState.status === 'EMERGENCY_STOP' ? '#e11d48' : '#d97706', marginTop: '6px' }}>
                {craneState.status}
              </div>
              <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px', fontWeight: 700 }}>
                พิกัด: X:{craneState.currentX.toFixed(1)} Y:{craneState.currentY.toFixed(1)} Z:{craneState.currentZ.toFixed(1)}
              </div>
            </div>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: craneState.status === 'IDLE' ? 'rgba(16, 185, 129, 0.15)' : craneState.status === 'EMERGENCY_STOP' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(217, 119, 6, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: craneState.status === 'IDLE' ? '#059669' : craneState.status === 'EMERGENCY_STOP' ? '#e11d48' : '#d97706',
              border: `1.5px solid ${craneState.status === 'IDLE' ? '#34d399' : craneState.status === 'EMERGENCY_STOP' ? '#fb7185' : '#fbbf24'}`
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Category Distribution Card */}
        <div className="glass-panel" style={{ 
          padding: '28px',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Boxes size={22} color="#0284c7" />
            สัดส่วนสินค้าตามหมวดหมู่
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
                      <strong style={{ color: '#0284c7' }}><CountUp value={cat.count} /></strong> รายการ (<CountUp value={pct} />%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div className="bar-grow" style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: '5px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time AS/RS Diagnostics */}
        <div className="glass-panel" style={{ 
          padding: '28px',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #bae6fd)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} color="#059669" />
            การสื่อสารฮาร์ดแวร์ & IoT Diagnostics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>โหมดควบคุมเครน:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.85rem' }}>ESP32 Step-Interpolation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>สถานะก้ามปู:</span>
              <span style={{ color: craneState.forkExtended ? '#d97706' : '#059669', fontWeight: 600 }}>
                {craneState.forkExtended ? 'ยืดออก' : 'หดกลับ'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>ขั้นตอนปัจจุบัน:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{craneState.stepDescription}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Feed */}
      <div className="glass-panel" style={{ 
        padding: '28px',
        background: 'var(--bg-card, #ffffff)',
        border: '1.5px solid var(--border-color, #bae6fd)',
        borderRadius: '18px',
        boxShadow: 'var(--shadow-card, 0 10px 30px -5px rgba(2, 132, 199, 0.08))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={22} color="#0284c7" />
            ประวัติการทำรายการล่าสุด
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
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>วันและเวลา</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ประเภท</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ช่องจัดเก็บ</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>สินค้า</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>รหัส QR</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ผู้ทำรายการ</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>สถานะ</th>
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
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
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
