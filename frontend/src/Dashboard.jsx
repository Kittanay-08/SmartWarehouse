import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeSection, setActiveSection] = useState('shelf');

  const [qrCode, setQrCode] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const [inputBarcode, setInputBarcode] = useState('8851950001015');
  const [hybridName, setHybridName] = useState('น้ำดื่มคริสตัล 600ml');

  const [newSlotX, setNewSlotX] = useState('');
  const [newSlotY, setNewSlotY] = useState('');
  const [newSlotZ, setNewSlotZ] = useState('1');

  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const userRole = localStorage.getItem('role') || 'student';
  const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher';

  const roleLabel = { admin: 'แอดมิน', teacher: 'อาจารย์', student: 'นักศึกษา', external: 'บุคคลภายนอก' };
  const avatarChar = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const fetchSlots = async () => {
    try {
      const res = await axios.get('/api/slots');
      setSlots(res.data);
      setLoading(false);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } });
      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.qrCode && data.name) {
              setQrCode(data.qrCode);
              setProductName(data.name);
            } else { setQrCode(decodedText); }
          } catch (e) { setQrCode(decodedText); }
          setShowScanner(false);
          scanner.clear();
        },
        () => {}
      );
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [showScanner]);

  const handleStoreIn = async (e) => {
    e.preventDefault();
    if (!qrCode || !productName || !selectedSlot) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    try {
      await axios.post('/api/store-in', { qrCode, productName, slotId: parseInt(selectedSlot) });
      setStatusMessage('✅ จัดเก็บสินค้าสำเร็จ!');
      setTimeout(() => setStatusMessage(''), 3000);
      setQrCode(''); setProductName(''); setSelectedSlot('');
      fetchSlots();
    } catch (err) { alert('เกิดข้อผิดพลาดในการจัดเก็บ'); }
  };

  const handleVendingOut = async (slot) => {
    if (processing) return;
    setProcessing(true);
    setStatusMessage(`🤖 กลไก ASRS กำลังไปหยิบสินค้าที่ Slot #${slot.slot_id} (X:${slot.x_axis}, Y:${slot.y_axis})...`);
    try {
      await axios.post('/api/store-out', { slotId: slot.slot_id });
      setTimeout(() => {
        setStatusMessage(`✅ จ่ายสินค้า "${slot.product_name}" เรียบร้อย! กรุณารับสินค้าที่ช่องรับ`);
        setProcessing(false);
        fetchSlots();
        setTimeout(() => setStatusMessage(''), 5000);
      }, 3000);
    } catch (err) {
      setStatusMessage('❌ เกิดข้อผิดพลาดในการนำสินค้าออก');
      setProcessing(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotX || !newSlotY || !newSlotZ) return alert('กรอกข้อมูลให้ครบ');
    try {
      await axios.post('/api/slots', { x_axis: newSlotX, y_axis: newSlotY, z_axis: newSlotZ });
      setNewSlotX(''); setNewSlotY('');
      fetchSlots();
    } catch (err) { alert(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('ยืนยันการลบช่องสินค้านี้?')) return;
    try {
      await axios.delete(`/api/slots/${slotId}`);
      fetchSlots();
    } catch (err) { alert(err.response?.data?.error || 'เกิดข้อผิดพลาด'); }
  };

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.is_occupied).length;
  const emptySlots = totalSlots - occupiedSlots;
  const occupancyPct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const navItems = [
    { key: 'shelf', icon: '📦', label: 'ชั้นวางสินค้า' },
    { key: 'storein', icon: '📥', label: 'นำสินค้าเข้า' },
    { key: 'label', icon: '🏷️', label: 'พิมพ์ฉลาก' },
    ...(isAdminOrTeacher ? [{ key: 'manage', icon: '⚙️', label: 'จัดการชั้นวาง' }] : []),
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏭</div>
          <div>
            <div className="sidebar-logo-title">ASRS Warehouse</div>
            <div className="sidebar-logo-sub">Smart Shelf System</div>
          </div>
        </div>

        <div className="sidebar-section-label">เมนูหลัก</div>

        {navItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-nav-item ${activeSection === item.key ? 'active' : ''}`}
            onClick={() => setActiveSection(item.key)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div className="sidebar-spacer" />

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{avatarChar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
            <div className="sidebar-user-role">{roleLabel[userRole] || userRole}</div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="ออกจากระบบ">↩</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Status Banner */}
        {statusMessage && (
          <div className={`status-banner ${processing ? 'processing' : 'success'}`}>
            {statusMessage}
          </div>
        )}

        {/* SHELF VIEW */}
        {activeSection === 'shelf' && (
          <>
            <div className="page-header">
              <h1 className="page-title">ผังชั้นวางสินค้า</h1>
              <p className="page-subtitle">Smart Shelf Matrix — อัปเดตทุก 3 วินาที</p>
            </div>

            <div className="stats-bar">
              <div className="stat-card">
                <div className="stat-dot" style={{ background: 'var(--accent-blue)' }} />
                <div className="stat-value">{totalSlots}</div>
                <div className="stat-label">ช่องทั้งหมด</div>
              </div>
              <div className="stat-card">
                <div className="stat-dot" style={{ background: 'var(--accent-red)' }} />
                <div className="stat-value">{occupiedSlots}</div>
                <div className="stat-label">มีสินค้าอยู่</div>
              </div>
              <div className="stat-card">
                <div className="stat-dot" style={{ background: 'var(--accent-green)' }} />
                <div className="stat-value">{emptySlots}</div>
                <div className="stat-label">ช่องว่าง</div>
              </div>
              <div className="stat-card">
                <div className="stat-dot" style={{ background: 'var(--accent-cyan)' }} />
                <div className="stat-value">{occupancyPct}%</div>
                <div className="stat-label">อัตราการใช้งาน</div>
              </div>
            </div>

            {loading ? (
              <div className="shelf-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" />)}
              </div>
            ) : (
              <div className="shelf-grid">
                {slots.map((slot) => (
                  <div key={slot.slot_id} className={`slot-card ${slot.is_occupied ? 'occupied' : 'empty'}`}>
                    <div className="slot-header">
                      <span className="slot-id">Slot #{slot.slot_id}</span>
                      <div className={`slot-status-dot ${slot.is_occupied ? 'occupied' : 'empty'}`} />
                    </div>
                    <div className="slot-coords">X:{slot.x_axis} Y:{slot.y_axis} Z:{slot.z_axis}</div>

                    {slot.is_occupied ? (
                      <div className="product-info-box">
                        <strong className="product-name">{slot.product_name}</strong>
                        <div className="qr-code-wrapper">
                          <QRCodeSVG value={JSON.stringify({ qrCode: slot.qr_code, name: slot.product_name })} size={72} />
                        </div>
                        <button className="btn-vending-out" onClick={() => handleVendingOut(slot)} disabled={processing}>
                          🥤 เบิกสินค้า
                        </button>
                      </div>
                    ) : (
                      <div className="empty-slot-box">
                        ว่าง — พร้อมใช้งาน
                        {isAdminOrTeacher && (
                          <button className="btn-delete-slot" onClick={() => handleDeleteSlot(slot.slot_id)}>
                            🗑️ ลบช่องนี้
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STORE-IN VIEW */}
        {activeSection === 'storein' && (
          <>
            <div className="page-header">
              <h1 className="page-title">นำสินค้าเข้าคลัง</h1>
              <p className="page-subtitle">Store-In — บันทึกสินค้าเข้าช่องวาง</p>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon blue">📥</div>
                <div>
                  <div className="panel-title">ข้อมูลสินค้า</div>
                  <div className="panel-subtitle">กรอกรายละเอียดหรือสแกน QR Code</div>
                </div>
              </div>

              <button className="btn-camera" onClick={() => setShowScanner(!showScanner)}>
                {showScanner ? '❌ ปิดกล้อง' : '📷 สแกน QR Code'}
              </button>
              {showScanner && <div id="reader" className="scanner-container" />}

              <form onSubmit={handleStoreIn}>
                <div className="input-row" style={{ marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="รหัส QR / บาร์โค้ดสินค้า"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="ชื่อสินค้า"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="input-row">
                  <select className="field-select" value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                    <option value="">— เลือกช่องวางที่ว่าง —</option>
                    {slots.filter(s => !s.is_occupied).map(s => (
                      <option key={s.slot_id} value={s.slot_id}>
                        Slot #{s.slot_id} — ชั้น {s.y_axis}, แถว {s.x_axis}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-action green">📦 เก็บเข้าคลัง</button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* LABEL VIEW */}
        {activeSection === 'label' && (
          <>
            <div className="page-header">
              <h1 className="page-title">ออกฉลาก Hybrid Label</h1>
              <p className="page-subtitle">สร้างฉลากที่มีทั้ง QR Code และบาร์โค้ด</p>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon blue">🏷️</div>
                <div>
                  <div className="panel-title">ตั้งค่าฉลาก</div>
                  <div className="panel-subtitle">กรอกข้อมูลสินค้าเพื่อสร้างฉลาก</div>
                </div>
              </div>

              <div className="input-row" style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="รหัสบาร์โค้ดเดิม"
                  value={inputBarcode}
                  onChange={(e) => setInputBarcode(e.target.value)}
                />
                <input
                  type="text"
                  className="field-input"
                  placeholder="ชื่อสินค้า"
                  value={hybridName}
                  onChange={(e) => setHybridName(e.target.value)}
                />
              </div>

              <div className="label-card">
                <div className="label-product-name">{hybridName || 'ชื่อสินค้า'}</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <QRCodeSVG
                    value={JSON.stringify({ qrCode: inputBarcode, name: hybridName })}
                    size={140}
                  />
                </div>
                <div className="label-barcode-text">BARCODE: {inputBarcode}</div>
                <div className="label-footer">Smart ASRS Hybrid Label</div>
              </div>
            </div>
          </>
        )}

        {/* MANAGE SLOTS VIEW (admin/teacher) */}
        {activeSection === 'manage' && isAdminOrTeacher && (
          <>
            <div className="page-header">
              <h1 className="page-title">จัดการชั้นวางสินค้า</h1>
              <p className="page-subtitle">
                เพิ่มหรือลบช่องวางสินค้าในฐานข้อมูล &nbsp;
                <span className="admin-badge">⚙️ Admin / Teacher Only</span>
              </p>
            </div>

            <div className="panel admin-panel">
              <div className="panel-header">
                <div className="panel-icon orange">➕</div>
                <div>
                  <div className="panel-title">เพิ่มช่องวางใหม่</div>
                  <div className="panel-subtitle">ระบุพิกัดของช่องวางสินค้าที่ต้องการเพิ่ม</div>
                </div>
              </div>

              <form onSubmit={handleAddSlot}>
                <div className="input-row">
                  <input
                    type="number"
                    className="field-input"
                    placeholder="แถว (X)"
                    value={newSlotX}
                    onChange={(e) => setNewSlotX(e.target.value)}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    className="field-input"
                    placeholder="ชั้น (Y)"
                    value={newSlotY}
                    onChange={(e) => setNewSlotY(e.target.value)}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    className="field-input"
                    placeholder="ความลึก (Z)"
                    value={newSlotZ}
                    onChange={(e) => setNewSlotZ(e.target.value)}
                    min="1"
                    required
                  />
                  <button type="submit" className="btn-action orange">➕ เพิ่มช่อง</button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon red">🗑️</div>
                <div>
                  <div className="panel-title">รายการช่องวางทั้งหมด ({totalSlots} ช่อง)</div>
                  <div className="panel-subtitle">กดลบเพื่อนำช่องว่างออกจากฐานข้อมูล</div>
                </div>
              </div>

              <div className="shelf-grid">
                {slots.map(slot => (
                  <div key={slot.slot_id} className={`slot-card ${slot.is_occupied ? 'occupied' : 'empty'}`}>
                    <div className="slot-header">
                      <span className="slot-id">Slot #{slot.slot_id}</span>
                      <div className={`slot-status-dot ${slot.is_occupied ? 'occupied' : 'empty'}`} />
                    </div>
                    <div className="slot-coords">X:{slot.x_axis} Y:{slot.y_axis} Z:{slot.z_axis}</div>
                    {slot.is_occupied ? (
                      <div style={{ fontSize: '12px', color: 'var(--accent-red)', marginTop: '8px', padding: '6px', background: 'hsla(0,80%,60%,0.1)', borderRadius: '6px', textAlign:'center' }}>
                        🔒 มีสินค้าอยู่ — ลบไม่ได้
                      </div>
                    ) : (
                      <button className="btn-delete-slot" style={{ marginTop: '8px' }} onClick={() => handleDeleteSlot(slot.slot_id)}>
                        🗑️ ลบช่องนี้
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
