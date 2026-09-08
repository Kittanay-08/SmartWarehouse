import React, { useState } from 'react';
import { WarehouseProvider } from './context/WarehouseContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DashboardOverview } from './components/DashboardOverview';
import { StoreInPanel } from './components/StoreInPanel';
import { StoreOutPanel } from './components/StoreOutPanel';
import { TransactionHistory } from './components/TransactionHistory';
import './App.css';

function SmartWarehouseApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preSelectedSlotForInbound, setPreSelectedSlotForInbound] = useState(null);

  const handleSelectSlotForAction = (slot) => {
    setPreSelectedSlotForInbound(slot);
    setActiveTab('store-in');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardOverview setActiveTab={setActiveTab} />
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
          <TransactionHistory />
        )}
      </main>

      {/* Profile Edit & Role Switcher Modals */}
      <UserProfileModal />
      <LoginModal />
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
