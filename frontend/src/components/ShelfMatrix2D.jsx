import React, { useState } from 'react';
import { 
  Grid3X3, 
  Layers, 
  Box, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  QrCode, 
  Info,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWarehouse } from '../context/WarehouseContext';

export const ShelfMatrix2D = ({ onSelectSlotForStoreIn }) => {
  const { slots, storeOut, craneState } = useWarehouse();
  const [inspectSlot, setInspectSlot] = useState(null);

  const maxLevel = Math.max(3, ...slots.map(s => Number(s.level) || 1));
  const levels = Array.from({ length: maxLevel }, (_, i) => maxLevel - i);
  const bays = [1, 2, 3];
  const occupiedCount = slots.filter(s => s.is_occupied).length;

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1180px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan">Visual Matrix</span>
            <span className="badge badge-emerald">AS/RS Grid ({slots.length} Slots)</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
            ผังชั้นวางสินค้าอัจฉริยะ ({slots.length} ช่อง)
          </h2>
          <p style={{ color: '#334155', fontSize: '0.95rem', fontWeight: 600 }}>
            แสดงรหัส QR Code ประจำช่องจัดเก็บ — โครงสร้าง {maxLevel} ชั้น x 3 ช่อง
          </p>
        </div>

        <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800, background: '#ffffff', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #bae6fd' }}>
          ใช้งานอยู่ <strong style={{ color: '#0284c7' }}>{occupiedCount}</strong> / {slots.length} ช่อง
        </div>
      </div>

      {/* 3x3 Shelf Grid */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '20px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {levels.map(lvl => (
            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Level Indicator Badge */}
              <div style={{
                width: '64px',
                textAlign: 'center',
                fontSize: '0.9rem',
                fontWeight: 900,
                color: '#0369a1',
                background: '#e0f2fe',
                padding: '14px 4px',
                borderRadius: '10px',
                border: '1.5px solid #7dd3fc',
                flexShrink: 0
              }}>
                ชั้น {lvl}
              </div>

              {/* 3 Bays per level */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flex: 1 }}>
                {bays.map(bay => {
                  const slot = slots.find(s => s.level === lvl && s.bay === bay);
                  if (!slot) return null;

                  const isOccupied = slot.is_occupied;
                  const isCurrentTarget = craneState.targetSlotId === slot.slot_id;

                  return (
                    <div
                      key={slot.slot_id}
                      onClick={() => setInspectSlot(slot)}
                      style={{
                        padding: '10px 10px',
                        borderRadius: '10px',
                        background: isCurrentTarget
                          ? '#fef3c7'
                          : isOccupied 
                          ? '#fee2e2' 
                          : '#dcfce7',
                        border: `2px solid ${
                          isCurrentTarget 
                            ? '#f59e0b' 
                            : isOccupied 
                            ? '#fca5a5' 
                            : '#86efac'
                        }`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        minHeight: '74px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          color: isOccupied ? '#b91c1c' : '#15803d',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {slot.slot_code}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>
                          X:{slot.x_axis} Y:{slot.y_axis}
                        </span>
                      </div>

                      {isOccupied ? (
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
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
                        }} title={`สินค้า: ${slot.product_name}`}>
                          🔲 {slot.qr_code || 'QR-CODE'}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#15803d', fontSize: '0.8rem', fontWeight: 800 }}>
                          ✨ ว่าง (คลิก)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Slot Modal */}
      {inspectSlot && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            background: '#ffffff',
            border: '2px solid #0284c7',
            boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
            borderRadius: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={22} color="#0284c7" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  รายละเอียดช่อง {inspectSlot.slot_code}
                </h3>
              </div>
              <button 
                onClick={() => setInspectSlot(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>สถานะ:</span>
                <span className={`badge ${inspectSlot.is_occupied ? 'badge-rose' : 'badge-emerald'}`}>
                  {inspectSlot.is_occupied ? 'มีสินค้าจัดเก็บอยู่' : 'ว่างพร้อมใช้งาน'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>พิกัดเครน AS/RS:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 900 }}>
                  X:{inspectSlot.x_axis} | Y:{inspectSlot.y_axis} | Z:{inspectSlot.z_axis}
                </span>
              </div>

              {inspectSlot.is_occupied && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>ชื่อสินค้า:</span>
                    <strong style={{ color: '#0f172a', fontWeight: 800 }}>{inspectSlot.product_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>รหัส QR Code / SKU:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7', fontWeight: 800 }}>{inspectSlot.qr_code}</span>
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
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {inspectSlot.is_occupied ? (
                <button
                  onClick={async () => {
                    await storeOut(inspectSlot.slot_id);
                    setInspectSlot(null);
                  }}
                  disabled={craneState.status !== 'IDLE'}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 900 }}
                >
                  <ArrowUpFromLine size={18} /> สั่งเบิกจ่ายสินค้านี้
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onSelectSlotForStoreIn) onSelectSlotForStoreIn(inspectSlot);
                    setInspectSlot(null);
                  }}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 900 }}
                >
                  <ArrowDownToLine size={18} /> นำสินค้าเข้าช่องนี้
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
