import React, { useState, useEffect } from 'react';
import { api, clearStoredToken } from './api.ts';
import { User, Business } from './types.ts';
import { GlobalLayout } from './components/layout/GlobalLayout.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { MultiBusinessPage } from './components/MultiBusinessPage.tsx';
import { AddBusinessModal } from './components/AddBusinessModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { PhpSourceModal } from './components/PhpSourceModal.tsx';
import { AccountSettingsModal } from './components/AccountSettingsModal.tsx';
import { BusinessWorkspace } from './components/workspace/BusinessWorkspace.tsx';
import { IconSizeProvider } from './context/IconSizeContext.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [effectiveLimit, setEffectiveLimit] = useState<number>(5);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [remainingSlots, setRemainingSlots] = useState<number>(5);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const [loading, setLoading] = useState<boolean>(true);
  const [showAddBusinessModal, setShowAddBusinessModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showPhpSourceModal, setShowPhpSourceModal] = useState<boolean>(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState<boolean>(false);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    try {
      const meRes = await api.getMe();
      if (meRes.user) {
        setUser(meRes.user);
        await loadBusinesses();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const res = await api.getBusinesses();
      const list: Business[] = res.businesses || [];
      setBusinesses(list);
      setEffectiveLimit(res.effective_limit);
      setCurrentCount(res.current_count);
      setRemainingSlots(res.remaining_slots);

      // Do NOT auto-select a business on initial login!
      // User must always see Multi-Business Management first.
      // If a business was already selected by the user in this session, keep it updated.
      setSelectedBusiness((prev) => {
        if (prev) {
          const found = list.find((b) => b.id === prev.id);
          return found || null;
        }
        return null;
      });
    } catch (err) {
      console.error('Failed to load businesses', err);
    }
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setSelectedBusiness(null);
    setBusinesses([]);
    setActiveSection('dashboard');
  };

  const handleBusinessCreated = (newBiz: Business) => {
    loadBusinesses();
    setSelectedBusiness(newBiz);
    setActiveSection('dashboard');
  };

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
  };

  const [quickAction, setQuickAction] = useState<{ action: string; timestamp: number } | null>(null);

  const handleQuickAccess = (action: string) => {
    setQuickAction({ action, timestamp: Date.now() });
    const sectionMap: Record<string, string> = {
      new_sales_order: 'sales_orders',
      new_sales_invoice: 'invoices',
      new_sales_receipt: 'receipts',
      new_purchase_order: 'purchase_orders',
      new_purchase_bill: 'bills',
      new_purchase_payment: 'payments',
      new_other_payment: 'other_payments',
      new_other_receipt: 'other_receipts',
      new_bank_transfer: 'bank_transfers',
    };
    const target = sectionMap[action];
    if (target) {
      setActiveSection(target);
    }
  };

  const handleSelectBusiness = (biz: Business | null) => {
    setSelectedBusiness(biz);
    if (biz) {
      setActiveSection('dashboard');
    }
  };

  const handleBusinessUpdated = (updated: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (selectedBusiness && selectedBusiness.id === updated.id) {
      setSelectedBusiness(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-semibold tracking-wide text-slate-800 font-mono">
          Loading Multi-Business ERP System...
        </p>
      </div>
    );
  }

  // If user is not logged in, render authentication modal
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
        <AuthModal onSuccess={checkAuthAndLoad} />
      </div>
    );
  }

  // Multi-Business Management Page (clean independent layout, no top nav, no sidebar)
  // Displayed after login and whenever no business is selected.
  if (!selectedBusiness) {
    return (
      <IconSizeProvider>
        <MultiBusinessPage
          user={user}
          businesses={businesses}
          effectiveLimit={effectiveLimit}
          currentCount={currentCount}
          remainingSlots={remainingSlots}
          onOpenAddModal={() => setShowAddBusinessModal(true)}
          onSelectBusiness={handleSelectBusiness}
          onOpenAdmin={() => setShowAdminModal(true)}
          onOpenPhpSource={() => setShowPhpSourceModal(true)}
          onOpenAccountSettings={() => setShowAccountSettingsModal(true)}
          onLogout={handleLogout}
          onBusinessUpdated={handleBusinessUpdated}
        />

        {/* Add Business Modal */}
        <AddBusinessModal
          isOpen={showAddBusinessModal}
          remainingSlots={remainingSlots}
          effectiveLimit={effectiveLimit}
          onClose={() => setShowAddBusinessModal(false)}
          onCreated={handleBusinessCreated}
        />

        {/* Admin Panel Modal */}
        {showAdminModal && <AdminPanel onClose={() => setShowAdminModal(false)} />}

        {/* Account Settings & Google Link Modal */}
        {showAccountSettingsModal && user && (
          <AccountSettingsModal
            user={user}
            onClose={() => setShowAccountSettingsModal(false)}
            onUserUpdated={checkAuthAndLoad}
          />
        )}

        {/* PHP + MySQL Source Code Exporter Modal */}
        {showPhpSourceModal && <PhpSourceModal onClose={() => setShowPhpSourceModal(false)} />}
      </IconSizeProvider>
    );
  }

  // Active business workspace: Top Navigation, Left Navigation, and business-specific modules
  return (
    <IconSizeProvider>
      <GlobalLayout
        user={user}
        activeBusiness={selectedBusiness}
        userBusinesses={businesses}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onSelectBusiness={handleSelectBusiness}
        onQuickAccess={handleQuickAccess}
        onOpenAddBusiness={() => setShowAddBusinessModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenPhpSource={() => setShowPhpSourceModal(true)}
        onOpenAccountSettings={() => setShowAccountSettingsModal(true)}
        onLogout={handleLogout}
      >
        <BusinessWorkspace
          business={selectedBusiness}
          userBusinesses={businesses}
          activeTab={activeSection}
          onSelectTab={setActiveSection}
          onBackToDashboard={() => setSelectedBusiness(null)}
          quickAction={quickAction}
        />
      </GlobalLayout>

      {/* Add Business Modal */}
      <AddBusinessModal
        isOpen={showAddBusinessModal}
        remainingSlots={remainingSlots}
        effectiveLimit={effectiveLimit}
        onClose={() => setShowAddBusinessModal(false)}
        onCreated={handleBusinessCreated}
      />

      {/* Admin Panel Modal */}
      {showAdminModal && <AdminPanel onClose={() => setShowAdminModal(false)} />}

      {/* Account Settings & Google Link Modal */}
      {showAccountSettingsModal && user && (
        <AccountSettingsModal
          user={user}
          onClose={() => setShowAccountSettingsModal(false)}
          onUserUpdated={checkAuthAndLoad}
        />
      )}

      {/* PHP + MySQL Source Code Exporter Modal */}
      {showPhpSourceModal && <PhpSourceModal onClose={() => setShowPhpSourceModal(false)} />}
    </IconSizeProvider>
  );
}
