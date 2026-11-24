import React from 'react';
import { X, Command, Sparkles, Volume2, VolumeX, Moon, Sun, Laptop } from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export const KeyboardShortcutsModal = ({ isOpen, onClose, onToggleSound, isSoundOn }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: '🚀 สลับแท็บ',
      items: [
        { key: '1', label: 'ภาพรวมแดชบอร์ด' },
        { key: '2', label: 'นำเข้าสินค้า' },
        { key: '3', label: 'เบิกจ่ายสินค้า' },
        { key: '4', label: 'ประวัติการทำรายการ' },
        { key: '5', label: 'ควบคุม IoT' },
      ]
    },
    {
      category: '⚙️ ระบบและการแสดงผล',
      items: [
        { key: '?', label: 'เปิด/ปิดหน้าต่างคีย์ลัด' },
        { key: 'Esc', label: 'ปิดหน้าต่างที่เปิดอยู่' },
      ]
    }
  ];

  return (
    <div 
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          padding: '28px 24px',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-sky)',
            border: '1.5px solid var(--border-color)'
          }}>
            <Command size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              คีย์ลัดระบบ
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', margin: '2px 0 0 0', fontWeight: 600 }}>
              กดปุ่มบนแป้นพิมพ์เพื่อสั่งการอย่างรวดเร็วระดับพาวเวอร์ยูสเซอร์
            </p>
          </div>
        </div>

        {/* Shortcuts Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {shortcuts.map((cat, idx) => (
            <div key={idx}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent-sky)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}>
                {cat.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {item.label}
                    </span>
                    <kbd style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '28px',
                      height: '26px',
                      padding: '0 8px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1.5px solid var(--border-color)',
                      boxShadow: '0 2px 0 var(--border-color)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--accent-sky)'
                    }}>
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip Footer */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>
          <Sparkles size={16} color="var(--accent-sky)" style={{ flexShrink: 0 }} />
          <span>
            เคล็ดลับ: สามารถกด <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>?</kbd> เพื่อเปิดดูคีย์ลัดนี้ได้ตลอดเวลาจากทุกหน้า
          </span>
        </div>
      </div>
    </div>
  );
};
