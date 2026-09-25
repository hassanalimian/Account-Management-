import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowRight,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Gem,
  Store,
  LogOut,
  Building2,
  ChevronDown,
  Pencil,
} from 'lucide-react';
import { Business, User } from '../types.ts';
import { EditBusinessModal } from './EditBusinessModal.tsx';

interface MultiBusinessPageProps {
  user: User;
  businesses: Business[];
  effectiveLimit: number;
  currentCount: number;
  remainingSlots: number;
  onOpenAddModal: () => void;
  onSelectBusiness: (business: Business) => void;
  onOpenAdmin: () => void;
  onOpenPhpSource: () => void;
  onOpenAccountSettings: () => void;
  onLogout: () => void;
  onBusinessUpdated?: (updated: Business) => void;
}

export const MultiBusinessPage: React.FC<MultiBusinessPageProps> = ({
  user,
  businesses,
  effectiveLimit,
  currentCount,
  remainingSlots,
  onOpenAddModal,
  onSelectBusiness,
  onOpenAdmin,
  onOpenPhpSource,
  onOpenAccountSettings,
  onLogout,
  onBusinessUpdated,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#multibiz-user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Top Navigation Bar: Contains ONLY the logged-in user's name (with Logout in the user/account interface) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-end">
          <div className="relative" id="multibiz-user-dropdown-container">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium">Logged in as</span>
                  <span className="font-bold text-sm text-slate-900 block truncate">{user.name}</span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner / Instructions & Quotas */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Multi-Business Management
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Signed in as <strong className="text-slate-700">{user.name}</strong> ({user.email})
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2.5 max-w-2xl leading-relaxed">
              Select one of your registered businesses below to open its dedicated dashboard, isolated
              inventory, multi-warehouse stock, POS sales, and accounting records.
            </p>
          </div>

          {/* Quota Info & Add Business Button */}
          <div className="flex items-center space-x-3.5 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
              <div className="text-xs text-slate-400 uppercase font-mono tracking-wider font-bold">
                Business Quota
              </div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                <span className="text-indigo-600 font-extrabold">{currentCount}</span> / {effectiveLimit} Used
                <span
                  className={`ml-2 text-xs font-bold ${
                    remainingSlots > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({remainingSlots} left)
                </span>
              </div>
            </div>

            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              id="add-business-hub-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Business</span>
            </button>
          </div>
        </div>

        {/* Quota reached notification banner */}
        {remainingSlots <= 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center space-x-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <strong>Business Limit Reached:</strong> You have reached your quota of {effectiveLimit} registered businesses.
              Existing businesses remain fully operational. Contact system admin if you need additional business allocations.
            </div>
          </div>
        )}

        {/* Available Businesses Heading */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Your Available Businesses ({businesses.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click any business card to launch workspace
          </span>
        </div>

        {/* Business Cards Grid - Reduced size by ~50% with all details visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              onClick={() => onSelectBusiness(biz)}
              className="group bg-white border border-slate-200/90 hover:border-indigo-400 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              id={`business-card-${biz.id}`}
            >
              <div>
                {/* Header with Icon/Logo, Name, Currency and Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden"
                      data-app-icon="true"
                    >
                      {biz.logo ? (
                        <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{biz.icon || '🏢'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {biz.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {biz.currency}
                        </span>
                        {biz.tax_number && (
                          <span className="text-[10px] text-slate-500 font-mono truncate">Tax: {biz.tax_number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      biz.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {biz.status}
                  </span>
                </div>

                {/* Business Details info (compact, clean readability) */}
                <div className="space-y-1 my-2 text-xs text-slate-600">
                  {biz.address && (
                    <div className="flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.address}</span>
                    </div>
                  )}
                  {biz.phone && (
                    <div className="flex items-center space-x-1.5 truncate">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.phone}</span>
                    </div>
                  )}
                  {biz.email && (
                    <div className="flex items-center space-x-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit Business & Open Business */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="flex items-center space-x-1 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-medium truncate">Isolated Scoped</span>
                </span>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBusiness(biz);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Edit Business Information"
                  >
                    <Pencil className="w-3 h-3 text-slate-500" />
                    <span>Edit Business</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBusiness(biz);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <span>Open Business</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Business Card - Reduced height matching 50% scale */}
          {remainingSlots > 0 && (
            <div
              onClick={onOpenAddModal}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/90 transition-all min-h-[165px] bg-white/40 group"
              id="empty-add-business-card"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Register New Business
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-[200px]">
                {remainingSlots} available slot{remainingSlots > 1 ? 's' : ''} remaining in account.
              </p>
            </div>
          )}
        </div>

        {/* Zero-state if user has 0 businesses */}
        {businesses.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Businesses Registered Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Welcome to the ERP system! To start generating invoices, managing inventory, and tracking sales,
              create your first business profile.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20"
            >
              + Create First Business
            </button>
          </div>
        )}
      </main>

      {/* 3. Independent Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Authenticated Session: <strong className="text-slate-700">{user.email}</strong></span>
          </div>
          <div>Multi-Entity Core Architecture &bull; All data isolated per business</div>
        </div>
      </footer>
      {/* 4. Edit Business Modal */}
      <EditBusinessModal
        isOpen={Boolean(editingBusiness)}
        business={editingBusiness}
        onClose={() => setEditingBusiness(null)}
        onSaved={(updated) => {
          onBusinessUpdated?.(updated);
          setEditingBusiness(null);
        }}
      />
    </div>
  );
};
