import React from 'react';
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Gem,
  Store,
} from 'lucide-react';
import { Business } from '../types.ts';

interface BusinessDashboardProps {
  businesses: Business[];
  effectiveLimit: number;
  currentCount: number;
  remainingSlots: number;
  onOpenAddModal: () => void;
  onSelectBusiness: (business: Business) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  businesses,
  effectiveLimit,
  currentCount,
  remainingSlots,
  onOpenAddModal,
  onSelectBusiness,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Hero (Modern Clean White Card) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
              <Gem className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Multi-Business Management
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
              Multi-Entity Core
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Select a business branch below to launch its dedicated ERP workspace with isolated
            inventory, general ledger, customers, suppliers, sales invoices, and banking.
          </p>
        </div>

        {/* Limit Info & Add Business Button */}
        <div className="flex items-center space-x-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
            <div className="text-xs text-slate-400 uppercase font-mono tracking-wider font-bold">
              Business Quota
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              <span className="text-blue-600 font-extrabold">{currentCount}</span> / {effectiveLimit} Used
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
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            id="add-business-main-btn"
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
            <strong>Business Limit Reached:</strong> You have reached your maximum limit of{' '}
            {effectiveLimit} registered businesses. Existing businesses remain fully active. Contact
            the system administrator to increase your business quota.
          </div>
        </div>
      )}

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((biz) => (
          <div
            key={biz.id}
            onClick={() => onSelectBusiness(biz)}
            className="group bg-white border border-slate-200/90 hover:border-blue-500/80 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col justify-between"
            id={`business-card-${biz.id}`}
          >
            <div>
              {/* Header with Icon, Name, Currency and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
                    data-app-icon="true"
                  >
                    {biz.icon || '🏢'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {biz.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {biz.currency}
                      </span>
                      {biz.tax_number && (
                        <span className="text-xs text-slate-500 font-mono">Tax: {biz.tax_number}</span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    biz.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {biz.status}
                </span>
              </div>

              {/* Logo Preview if available */}
              {biz.logo && (
                <div className="mb-4 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <img
                    src={biz.logo}
                    alt={biz.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all"
                  />
                </div>
              )}

              {/* Business Details info */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                {biz.address && (
                  <div className="flex items-center space-x-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.address}</span>
                  </div>
                )}
                {biz.phone && (
                  <div className="flex items-center space-x-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.phone}</span>
                  </div>
                )}
                {biz.email && (
                  <div className="flex items-center space-x-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enter Button Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-500 font-medium">Isolated Database Scoped</span>
              </span>
              <div className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                <span>Enter Business</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}

        {/* Empty state or Add another card */}
        {remainingSlots > 0 && (
          <div
            onClick={onOpenAddModal}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/80 transition-all min-h-[220px] bg-white/40"
            id="empty-add-business-card"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Register Another Business</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
              You have {remainingSlots} available business slot{remainingSlots > 1 ? 's' : ''}{' '}
              remaining in your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
