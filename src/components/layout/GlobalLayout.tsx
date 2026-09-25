import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ReceiptText,
  FileText,
  CreditCard,
  Package,
  Users,
  Truck,
  Landmark,
  BarChart3,
  Building2,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  Maximize2,
  Minimize2,
  Gem,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Store,
  Layers,
  Sparkles,
  ArrowLeftRight,
  SlidersHorizontal,
  Receipt,
  Tag,
  Warehouse,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
} from 'lucide-react';
import { User, Business } from '../../types.ts';

interface GlobalLayoutProps {
  user: User | null;
  activeBusiness: Business | null;
  userBusinesses: Business[];
  activeSection: string;
  onSelectSection: (section: string) => void;
  onSelectBusiness: (business: Business | null) => void;
  onQuickAccess?: (action: string) => void;
  onOpenAddBusiness: () => void;
  onOpenAdmin: () => void;
  onOpenPhpSource: () => void;
  onOpenAccountSettings: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({
  user,
  activeBusiness,
  userBusinesses,
  activeSection,
  onSelectSection,
  onSelectBusiness,
  onQuickAccess,
  onOpenAddBusiness,
  onOpenAdmin,
  onOpenPhpSource,
  onOpenAccountSettings,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  // Expandable Menu Groups state - open if activeSection matches
  const [salesExpanded, setSalesExpanded] = useState(
    ['sales_orders', 'invoices', 'receipts'].includes(activeSection)
  );
  const [purchaseExpanded, setPurchaseExpanded] = useState(
    ['purchase_orders', 'bills', 'payments'].includes(activeSection)
  );
  const [productStockExpanded, setProductStockExpanded] = useState(
    ['products', 'categories', 'warehouses', 'stock_transfers', 'stock_adjustments'].includes(activeSection)
  );
  const [bankPaymentsExpanded, setBankPaymentsExpanded] = useState(
    ['banking', 'other_payments', 'other_receipts', 'bank_transfers'].includes(activeSection)
  );

  useEffect(() => {
    if (['products', 'categories', 'warehouses', 'stock_transfers', 'stock_adjustments'].includes(activeSection)) {
      setProductStockExpanded(true);
    }
    if (['sales_orders', 'invoices', 'receipts'].includes(activeSection)) {
      setSalesExpanded(true);
    }
    if (['purchase_orders', 'bills', 'payments'].includes(activeSection)) {
      setPurchaseExpanded(true);
    }
    if (['banking', 'other_payments', 'other_receipts', 'bank_transfers'].includes(activeSection)) {
      setBankPaymentsExpanded(true);
    }
  }, [activeSection]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-profile-dropdown-container')) {
        setShowUserDropdown(false);
      }
      if (!target.closest('#business-switch-container')) {
        setShowBusinessDropdown(false);
      }
      if (!target.closest('#quick-access-dropdown-container')) {
        setShowQuickAccess(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNavClick = (sectionKey: string) => {
    onSelectSection(sectionKey);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (LIGHT, CLEAN, HIGH-CONTRAST PROFESSIONAL SIDEBAR) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white text-slate-700 flex flex-col justify-between transition-all duration-300 border-r border-slate-200/90 shadow-xs ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden md:flex`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand / Logo Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
            <div
              onClick={() => onSelectSection('dashboard')}
              className="flex items-center space-x-3 cursor-pointer group overflow-hidden"
              title="Multi-Business Accounting System"
            >
              {/* Golden Diamond Logo matching visual reference */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-sm shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Gem className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>

              {sidebarOpen && (
                <div className="truncate">
                  <div className="flex items-center space-x-1">
                    <span className="text-base font-black text-slate-900 tracking-tight leading-none block truncate">
                      Jewellery Billing
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 tracking-wider block mt-1 uppercase truncate font-mono">
                    Smart Business Core
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle button on sidebar header */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="truncate">Dashboard</span>}
            </button>

            {/* 2. Sales Group (Expandable) */}
            <div>
              <button
                onClick={() => setSalesExpanded(!salesExpanded)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-500" />
                  {sidebarOpen && <span>Sales</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-slate-400">
                    {salesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </button>

              {salesExpanded && sidebarOpen && (
                <div className="pl-7 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('sales_orders')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'sales_orders'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="truncate">Sales Order</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('invoices')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'invoices'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="truncate">Sales Invoice</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('receipts')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'receipts'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">Sales Receipts</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Purchase Group (Expandable) */}
            <div>
              <button
                onClick={() => setPurchaseExpanded(!purchaseExpanded)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 shrink-0 text-slate-500" />
                  {sidebarOpen && <span>Purchase</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-slate-400">
                    {purchaseExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </button>

              {purchaseExpanded && sidebarOpen && (
                <div className="pl-7 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('purchase_orders')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'purchase_orders'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="truncate">Purchase Order</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('bills')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'bills'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="truncate">Purchase Bills</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('payments')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'payments'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="truncate">Purchase Payments</span>
                  </button>
                </div>
              )}
            </div>

            {/* HR Management */}
            <button
              onClick={() => handleNavClick('hr_management')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'hr_management'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="HR Management"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="truncate">HR Management</span>}
            </button>

            {/* 4. Bank & Payments Group (Expandable) */}
            <div>
              <button
                onClick={() => setBankPaymentsExpanded(!bankPaymentsExpanded)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Bank & Payments"
              >
                <div className="flex items-center space-x-3">
                  <Landmark className="w-4 h-4 shrink-0 text-slate-500" />
                  {sidebarOpen && <span>Bank & Payments</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-slate-400">
                    {bankPaymentsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </button>

              {bankPaymentsExpanded && sidebarOpen && (
                <div className="pl-7 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('banking')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'banking'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="truncate">Bank Accounts</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('other_payments')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'other_payments'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="truncate">Other Payments</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('other_receipts')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'other_receipts'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">Other Receipts</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('bank_transfers')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'bank_transfers'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="truncate">Transfers</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Product & Stock Group (Expandable) */}
            <div>
              <button
                onClick={() => setProductStockExpanded(!productStockExpanded)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Product & Stock"
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-4 h-4 shrink-0 text-slate-500" />
                  {sidebarOpen && <span>Product & Stock</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-slate-400">
                    {productStockExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </button>

              {productStockExpanded && sidebarOpen && (
                <div className="pl-7 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('products')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'products'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="truncate">Product</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('warehouses')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'warehouses'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="truncate">Warehouse</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('stock_transfers')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'stock_transfers'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="truncate">Stock Transfers</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('stock_adjustments')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer ${
                      activeSection === 'stock_adjustments'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="truncate">Stock Adjustments</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Customers -> Customer List */}
            <button
              onClick={() => handleNavClick('customers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'customers'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Customer List"
            >
              <Users className="w-4 h-4 shrink-0 text-slate-500" />
              {sidebarOpen && <span className="truncate">Customer List</span>}
            </button>

            {/* 7. Suppliers -> Supplier List */}
            <button
              onClick={() => handleNavClick('suppliers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Supplier List"
            >
              <Truck className="w-4 h-4 shrink-0 text-slate-500" />
              {sidebarOpen && <span className="truncate">Supplier List</span>}
            </button>

            {/* 8. Ledger, Statement & Reports */}
            <button
              onClick={() => handleNavClick('reports')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Ledger, Statement & Reports"
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-slate-500" />
              {sidebarOpen && <span className="truncate">Ledger, Statement & Reports</span>}
            </button>

            {/* Divider */}
            <div className="pt-2 pb-1 border-t border-slate-200" />

            {/* 10. Admin Panel (if admin) */}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors cursor-pointer"
                title="System Admin Panel"
              >
                <Shield className="w-4 h-4 shrink-0 text-purple-600" />
                {sidebarOpen && <span>Admin Panel</span>}
              </button>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white text-slate-900 transform transition-transform duration-300 md:hidden flex flex-col justify-between shadow-2xl border-r border-slate-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Gem className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold block text-slate-900">Jewellery Billing</span>
              <span className="text-xs text-amber-600 font-mono font-semibold">Smart Business Core</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
              activeSection === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Sales */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Sales
          </div>
          <button
            onClick={() => handleNavClick('sales_orders')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'sales_orders' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sales Order</span>
          </button>
          <button
            onClick={() => handleNavClick('invoices')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'invoices' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sales Invoice</span>
          </button>
          <button
            onClick={() => handleNavClick('receipts')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'receipts' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Sales Receipts</span>
          </button>

          {/* Purchase */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Purchase
          </div>
          <button
            onClick={() => handleNavClick('purchase_orders')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'purchase_orders' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase Order</span>
          </button>
          <button
            onClick={() => handleNavClick('bills')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'bills' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase Bills</span>
          </button>
          <button
            onClick={() => handleNavClick('payments')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'payments' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Purchase Payments</span>
          </button>

          {/* HR Management */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            HR Management
          </div>
          <button
            onClick={() => handleNavClick('hr_management')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'hr_management' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>HR Management</span>
          </button>

          {/* Bank & Payments */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Bank & Payments
          </div>
          <button
            onClick={() => handleNavClick('banking')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'banking' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Bank Accounts</span>
          </button>
          <button
            onClick={() => handleNavClick('other_payments')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'other_payments' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Other Payments</span>
          </button>
          <button
            onClick={() => handleNavClick('other_receipts')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'other_receipts' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Other Receipts</span>
          </button>
          <button
            onClick={() => handleNavClick('bank_transfers')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'bank_transfers' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfers</span>
          </button>

          {/* Product & Stock */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Product & Stock
          </div>
          <button
            onClick={() => handleNavClick('products')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'products' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product</span>
          </button>
          <button
            onClick={() => handleNavClick('warehouses')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'warehouses' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Warehouse</span>
          </button>
          <button
            onClick={() => handleNavClick('stock_transfers')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'stock_transfers' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Stock Transfers</span>
          </button>
          <button
            onClick={() => handleNavClick('stock_adjustments')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'stock_adjustments' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Stock Adjustments</span>
          </button>

          {/* Contacts */}
          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Contacts
          </div>
          <button
            onClick={() => handleNavClick('customers')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'customers' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer List</span>
          </button>
          <button
            onClick={() => handleNavClick('suppliers')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'suppliers' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Supplier List</span>
          </button>

          <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
            Reports
          </div>
          <button
            onClick={() => handleNavClick('reports')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg ${
              activeSection === 'reports' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ledger, Statement & Reports</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT (HEADER + BREADCRUMBS + PAGE CONTENT) */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'md:pl-64' : 'md:pl-20'
        }`}
      >
        {/* TOP HEADER (CLEAN WHITE NAVBAR) */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-2xs px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Mobile hamburger & Global Search Bar */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-xl">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active Business Switcher Pill */}
            <div className="relative" id="business-switch-container">
              <button
                type="button"
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 flex items-center justify-center text-xs" data-app-icon="true">
                  {activeBusiness?.icon || '🏢'}
                </div>
                <span className="truncate max-w-[130px] sm:max-w-[180px]">
                  {activeBusiness?.name || 'All Businesses'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Business Switcher Dropdown */}
              {showBusinessDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Active Business</span>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">
                      {userBusinesses.length} Registered
                    </span>
                  </div>

                  {/* Return to Multi-Business Management Hub */}
                  <div className="px-2 pb-1.5 mb-1 border-b border-slate-100">
                    <button
                      onClick={() => {
                        onSelectBusiness(null);
                        setShowBusinessDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-left text-xs font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Multi-Business Hub</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {userBusinesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBusiness(b);
                          setShowBusinessDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                          activeBusiness?.id === b.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span>{b.icon || '🏢'}</span>
                          <span className="truncate">{b.name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 uppercase">{b.currency}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 px-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onOpenAddBusiness();
                        setShowBusinessDropdown(false);
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Business</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Global Search Bar */}
            <div className="relative flex-1 hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, products, customers..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Access, Fullscreen Toggle, User Profile Pill */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Quick Access Action Button & Dropdown */}
            <div className="relative" id="quick-access-dropdown-container">
              <button
                type="button"
                onClick={() => setShowQuickAccess(!showQuickAccess)}
                className="h-9 flex items-center space-x-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
                title="Quick Access"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 shrink-0" />
                <span className="hidden xs:inline">Quick Access</span>
                <ChevronDown className="w-3 h-3 text-indigo-500 shrink-0" />
              </button>

              {showQuickAccess && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 divide-y divide-slate-100">
                  {/* 1. Sales */}
                  <div className="p-1.5">
                    <div className="px-2.5 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Sales
                    </div>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_sales_order');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Sale Order</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_sales_invoice');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer text-left"
                    >
                      <Receipt className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Sale Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_sales_receipt');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer text-left"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Sale Receipt</span>
                    </button>
                  </div>

                  {/* 2. Purchase */}
                  <div className="p-1.5">
                    <div className="px-2.5 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Purchase
                    </div>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_purchase_order');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-700 hover:bg-orange-50 transition-colors cursor-pointer text-left"
                    >
                      <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>Purchase Order</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_purchase_bill');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer text-left"
                    >
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Purchase Bill</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_purchase_payment');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <CreditCard className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Purchase Payment</span>
                    </button>
                  </div>

                  {/* 3. Other Transactions */}
                  <div className="p-1.5">
                    <div className="px-2.5 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Other Transactions
                    </div>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_other_payment');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <ArrowUpRight className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Other Payment</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_other_receipt');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer text-left"
                    >
                      <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Other Receipts</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAccess(false);
                        onQuickAccess?.('new_bank_transfer');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer text-left"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Bank Receipts</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors hidden sm:flex cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* 6. User Profile Chip */}
            <div className="relative pl-1 border-l border-slate-200" id="user-profile-dropdown-container">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                {/* Profile Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                  )}
                </div>

                <div className="hidden sm:block leading-tight">
                  <span className="block text-sm font-bold text-slate-900 truncate max-w-[120px]">
                    {user?.name || 'Admin'}
                  </span>
                  <span className="block text-xs font-semibold text-emerald-600 capitalize truncate max-w-[120px]">
                    {activeBusiness?.name ? 'Main Branch' : user?.role || 'Admin'}
                  </span>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900 block truncate">{user?.name}</span>
                    <span className="text-xs text-slate-500 block truncate">{user?.email}</span>
                  </div>

                  <div className="py-1 text-sm">
                    <button
                      onClick={() => {
                        onOpenAccountSettings();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          onOpenAdmin();
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectBusiness(null);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Store className="w-4 h-4 text-indigo-600" />
                      <span>Multi-Business Hub</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 text-sm font-semibold"
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

        {/* MAIN PAGE BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
