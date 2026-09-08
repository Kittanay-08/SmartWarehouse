import React, { useState } from 'react';
import { QrCode, Printer, Copy, Check, MapPin, Layers, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWarehouse } from '../context/WarehouseContext';

export const HybridLabelMaker = () => {
  const { slots } = useWarehouse();

  const [productName, setProductName] = useState('น้ำดื่มคริสตัล 600ml (Pack 12)');
  const [barcode, setBarcode] = useState('8851950001015');
  const [category, setCategory] = useState('Beverages');
  const [lotNumber, setLotNumber] = useState(`LOT-${new Date().getFullYear()}-089`);
  const [selectedSlotCode, setSelectedSlotCode] = useState('A-1-1');
  const [copied, setCopied] = useState(false);

  // Find slot data or compute coordinate
  const currentSlot = slots.find(s => s.slot_code === selectedSlotCode) || {
    slot_code: selectedSlotCode,
    rack: selectedSlotCode.split('-')[0] || 'A',
    level: parseInt(selectedSlotCode.split('-')[1]) || 1,
    bay: parseInt(selectedSlotCode.split('-')[2]) || 1,
    x_axis: 1,
    y_axis: 1,
    z_axis: 1
  };

  // Structured QR Payload containing complete item metadata + coordinate/slot information
  const qrPayload = JSON.stringify({
    qrCode: barcode,
    name: productName,
    category,
    lot: lotNumber,
    slotCode: currentSlot.slot_code,
    rack: currentSlot.rack,
    level: currentSlot.level,
    bay: currentSlot.bay,
    coordinates: {
      x: currentSlot.x_axis,
      y: currentSlot.y_axis,
      z: currentSlot.z_axis
    },
    ts: Date.now()
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-purple">Smart Label Studio</span>
            <span className="badge badge-emerald">QR + Coordinate Mapping</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            ออกฉลากสินค้าอัจฉริยะระบุพิกัด (QR Code with AS/RS Coordinate)
          </h2>
          <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600 }}>
            สร้างฉลากติดสินค้าพร้อมบรรจุข้อมูลรหัสสินค้า และ <strong>พิกัดตำแหน่งช่องจัดเก็บ (X, Y, Z)</strong> ลงใน QR Code สำหรับสั่งการเครนอัตโนมัติ
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="btn btn-primary"
          style={{ padding: '13px 24px', fontSize: '1rem', fontWeight: 800 }}
        >
          <Printer size={20} /> สั่งพิมพ์ฉลาก (Print Label)
        </button>
      </div>

      {/* Grid: Editor & Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '28px'
      }}>
        {/* Editor Form */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <QrCode size={22} color="#0284c7" /> ตั้งค่าข้อมูลสินค้าและพิกัดจัดเก็บ
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Slot & Coordinate Selector */}
            <div style={{
              background: '#f0f7ff',
              padding: '18px',
              borderRadius: '12px',
              border: '1.5px solid #bae6fd'
            }}>
              <label style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={20} color="#0284c7" /> กำหนดพิกัดตำแหน่งช่องจัดเก็บ (Target Storage Slot) *
              </label>
              <select
                className="form-input"
                value={selectedSlotCode}
                onChange={(e) => setSelectedSlotCode(e.target.value)}
                style={{ borderColor: '#0284c7', background: '#ffffff', fontWeight: 700 }}
              >
                {slots.map(s => (
                  <option key={s.slot_id} value={s.slot_code}>
                    ช่อง {s.slot_code} — (Rack {s.rack} | ชั้น {s.level} | ช่อง {s.bay}) ➔ พิกัด X:{s.x_axis} Y:{s.y_axis} Z:{s.z_axis} {s.is_occupied ? '⚠️ (มีของอยู่)' : '✨ (ว่าง)'}
                  </option>
                ))}
              </select>

              <div style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: '#0f172a',
                fontWeight: 700
              }}>
                <span>พิกัดเครน AS/RS:</span>
                <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  X: {currentSlot.x_axis} | Y: {currentSlot.y_axis} | Z: {currentSlot.z_axis}
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                ชื่อสินค้า (Product Name)
              </label>
              <input
                type="text"
                className="form-input"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                รหัสบาร์โค้ดเดิม / SKU (Code128 Barcode)
              </label>
              <input
                type="text"
                className="form-input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  หมวดหมู่
                </label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Beverages">เครื่องดื่ม (Beverages)</option>
                  <option value="Electronics">อิเล็กทรอนิกส์</option>
                  <option value="Snacks">อาหาร/ขนม</option>
                  <option value="Parts">ชิ้นส่วนอะไหล่</option>
                  <option value="General">ทั่วไป</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  ล็อตสินค้า (Lot No.)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
              </div>
            </div>

            {/* QR JSON Payload Viewer */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
                  JSON Payload ใน QR Code (พร้อมพิกัด X, Y, Z):
                </span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="btn btn-outline"
                  style={{ padding: '4px 12px', fontSize: '0.8rem', fontWeight: 800 }}
                >
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  {copied ? 'คัดลอกแล้ว' : 'Copy'}
                </button>
              </div>
              <pre style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                color: '#0284c7',
                overflowX: 'auto',
                border: '1.5px solid #cbd5e1',
                fontWeight: 700,
                lineHeight: 1.5
              }}>
                {qrPayload}
              </pre>
            </div>
          </div>
        </div>

        {/* Live Label Printable Preview */}
        <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', background: '#ffffff', border: '1.5px solid #bae6fd' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>
            ตัวอย่างฉลากจริง (Print Preview)
          </h3>

          <div id="printable-label-area" style={{
            background: '#ffffff',
            color: '#000000',
            padding: '24px 20px',
            borderRadius: '14px',
            maxWidth: '360px',
            margin: '0 auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            border: '2.5px solid #000000',
            textAlign: 'center'
          }}>
            {/* Header */}
            <div style={{
              fontSize: '8.5pt',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderBottom: '2px solid #000000',
              paddingBottom: '5px',
              marginBottom: '10px'
            }}>
              SMART WAREHOUSE AS/RS HYBRID
            </div>

            {/* Product Name */}
            <div style={{
              fontWeight: 900,
              fontSize: '13pt',
              lineHeight: 1.25,
              marginBottom: '12px',
              minHeight: '34px',
              color: '#000000'
            }}>
              {productName || 'ชื่อสินค้า'}
            </div>

            {/* Coordinate Highlight Banner */}
            <div style={{
              background: '#000000',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ fontSize: '11pt', fontWeight: 900, letterSpacing: '0.05em' }}>
                📍 พิกัดตำแหน่ง: ช่อง {currentSlot.slot_code}
              </div>
              <div style={{ fontSize: '8.5pt', fontWeight: 700, fontFamily: 'monospace', color: '#67e8f9' }}>
                AS/RS Coordinates: [X: {currentSlot.x_axis}, Y: {currentSlot.y_axis}, Z: {currentSlot.z_axis}]
              </div>
            </div>

            {/* QR Code SVG */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <QRCodeSVG 
                value={qrPayload} 
                size={145} 
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Barcode representation */}
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11pt',
              fontWeight: 900,
              letterSpacing: '0.12em',
              marginBottom: '6px',
              color: '#000000'
            }}>
              * {barcode || '0000000000000'} *
            </div>

            {/* Bottom Meta */}
            <div style={{
              fontSize: '8pt',
              color: '#1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1.5px dashed #475569',
              paddingTop: '8px',
              marginTop: '10px',
              fontWeight: 800
            }}>
              <span>LOT: {lotNumber}</span>
              <span>CAT: {category}</span>
              <span>RACK {currentSlot.rack}-L{currentSlot.level}</span>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '360px', margin: '0 auto', padding: '14px', fontSize: '1.05rem', fontWeight: 900 }}
            >
              <Printer size={20} /> สั่งพิมพ์ฉลากสติ๊กเกอร์
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
