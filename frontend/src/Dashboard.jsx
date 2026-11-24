import React, { useState, useEffect } from 'react';
import { Command } from 'lucide-react';
import { WarehouseProvider } from './context/WarehouseContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DashboardOverview } from './components/DashboardOverview';
import { StoreInPanel } from './components/StoreInPanel';
import { StoreOutPanel } from './components/StoreOutPanel';
import { TransactionHistory } from './components/TransactionHistory';
import { IoTController } from './components/IoTController';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { soundFx } from './utils/soundFx';
import './App.css';

function SmartWarehouseApp({ autoOpenProfile }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preSelectedSlotForInbound, setPreSelectedSlotForInbound] = useState(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShortcutsDismissed, setIsShortcutsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('asrs_shortcuts_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [hasActiveDomModal, setHasActiveDomModal] = useState(false);
  const { isLoginModalOpen, isProfileModalOpen, setIsProfileModalOpen } = useAuth();

  useEffect(() => {
    if (autoOpenProfile) {
      setIsProfileModalOpen(true);
    }
  }, [autoOpenProfile, setIsProfileModalOpen]);

  // Detect any open modals, dialogs, drawers or full-screen overlays anywhere in the DOM
  useEffect(() => {
    const checkDomModals = () => {
      const active = Boolean(
        document.querySelector('.mobile-drawer-overlay, [role="dialog"], [aria-modal="true"], .modal-overlay, .modal-backdrop, [data-modal="true"]')
      );
      setHasActiveDomModal(active);
    };

    checkDomModals();
    const observer = new MutationObserver(checkDomModals);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, []);

  const isAnyOverlayActive = isMobileMenuOpen || isLoginModalOpen || isProfileModalOpen || showShortcutsModal || hasActiveDomModal;

  // Keyboard navigation & power-user shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept shortcuts when user is typing in inputs or textareas
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }

      if (e.key === '1') {
        setActiveTab('dashboard');
        soundFx.playClick();
      } else if (e.key === '2') {
        setActiveTab('store-in');
        soundFx.playClick();
      } else if (e.key === '3') {
        setActiveTab('store-out');
        soundFx.playClick();
      } else if (e.key === '4') {
        setActiveTab('history');
        soundFx.playClick();
      } else if (e.key === '5') {
        setActiveTab('iot');
        soundFx.playClick();
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        setShowShortcutsModal(prev => !prev);
        soundFx.playClick();
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSlotForAction = (slot) => {
    setPreSelectedSlotForInbound(slot);
    setActiveTab('store-in');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    soundFx.playClick();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Tab Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardOverview setActiveTab={handleTabChange} />
        )}

        {(activeTab === 'store-in' || activeTab === 'matrix') && (
          <StoreInPanel 
            preSelectedSlot={preSelectedSlotForInbound} 
            onFinished={() => setPreSelectedSlotForInbound(null)} 
          />
        )}

        {activeTab === 'store-out' && (
          <StoreOutPanel />
        )}

        {activeTab === 'history' && (
          <TransactionHistory onBack={() => handleTabChange('dashboard')} />
        )}

        {activeTab === 'iot' && (
          <IoTController />
        )}
      </main>

      {/* Floating Keyboard Shortcuts Trigger Button */}
      {!isAnyOverlayActive && !isShortcutsDismissed && (
        <div className="floating-shortcuts-container">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowShortcutsModal(true);
                soundFx.playClick();
              }}
              className="floating-shortcuts-btn"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0 }}
              title="กด ? เพื่อดูคีย์ลัดศูนย์ควบคุมทั้งหมด"
            >
              <Command size={14} color="var(--accent-sky)" />
              <span className="shortcuts-full-label">คีย์ลัด <kbd style={{ padding: '0 4px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>?</kbd></span>
              <span className="shortcuts-compact-label" style={{ display: 'none' }}><kbd>?</kbd></span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsShortcutsDismissed(true);
                try {
                  sessionStorage.setItem('asrs_shortcuts_dismissed', 'true');
                } catch (err) {}
                soundFx.playClick();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid var(--border-color)',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, color 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="ซ่อนปุ่มคีย์ลัดนี้ (สามารถกดปุ่ม ? บนแป้นพิมพ์เพื่อเปิดดูได้ตลอดเวลา)"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Profile Edit, Role Switcher, & Shortcuts Modals */}
      <UserProfileModal />
      <LoginModal />
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <WarehouseProvider>
      <SmartWarehouseApp />
    </WarehouseProvider>
  );
}
