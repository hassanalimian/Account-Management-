import React from 'react';
import {
  Building2,
  Shield,
  LogOut,
  FolderCode,
  LayoutGrid,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { User, Business } from '../types.ts';

interface NavbarProps {
  user: User | null;
  activeBusiness: Business | null;
  onOpenAdmin: () => void;
  onOpenPhpSource: () => void;
  onOpenAccountSettings: () => void;
  onReturnToBusinesses: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeBusiness,
  onOpenAdmin,
  onOpenPhpSource,
  onOpenAccountSettings,
  onReturnToBusinesses,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: App Title and Business Context */}
        <div className="flex items-center space-x-3">
          <div
            onClick={onReturnToBusinesses}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            id="nav-brand-button"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                AccountingERP
              </span>
              <span className="text-xs uppercase font-mono text-blue-600 block font-semibold tracking-wider">
                Multi-Business Core
              </span>
            </div>
          </div>

          {activeBusiness && (
            <div className="hidden sm:flex items-center pl-3 border-l border-slate-200 space-x-2">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <button
                onClick={onReturnToBusinesses}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Switch business"
                id="nav-active-business-pill"
              >
                <span className="text-base">{activeBusiness.icon || '🏢'}</span>
                <span className="max-w-[180px] truncate">{activeBusiness.name}</span>
                <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {activeBusiness.currency}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions and User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {activeBusiness && (
            <button
              onClick={onReturnToBusinesses}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              id="nav-switch-biz-btn"
            >
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">All Businesses</span>
            </button>
          )}

          {/* PHP + MySQL Source Code Exporter */}
          <button
            onClick={onOpenPhpSource}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            id="nav-php-export-btn"
            title="Inspect & export complete PHP + MySQL source code"
          >
            <FolderCode className="w-4 h-4 text-emerald-600" />
            <span>PHP+MySQL Code</span>
          </button>

          {/* Admin Panel button */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              id="nav-admin-panel-btn"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* User profile & settings badge */}
          {user && (
            <div className="flex items-center pl-2 space-x-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onOpenAccountSettings}
                className="flex items-center space-x-2.5 p-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
                id="nav-account-settings-btn"
                title="Account Settings & Security"
              >
                <div className="relative">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Google provider badge indicator */}
                  {(user.auth_provider === 'google' || user.auth_provider === 'linked') && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-200"
                      title={user.auth_provider === 'linked' ? 'Google Account Linked' : 'Google Account'}
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="hidden lg:block text-left">
                  <span className="block text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="block text-xs text-slate-500 capitalize">
                    {user.auth_provider === 'linked' ? 'Linked Google' : user.auth_provider === 'google' ? 'Google User' : user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Logout"
                id="nav-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
