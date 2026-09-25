import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Mail,
  Building2,
  Unlink,
  Link as LinkIcon,
  Check,
  Copy,
} from 'lucide-react';
import { User } from '../types.ts';
import { api } from '../api.ts';

interface AccountSettingsModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  onClose,
  onUserUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);

  // Handle Google Linking
  const handleLinkGoogle = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const config = await api.getGoogleAuthUrl('link');

      if (config.is_configured && config.url) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          config.url,
          'google_link_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups to connect your Google account.');
        }

        const messageListener = (event: MessageEvent) => {
          if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            setSuccess('Google account successfully linked!');
            setLoading(false);
            onUserUpdated();
          } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            setError(event.data.error || 'Failed to link Google account');
            setLoading(false);
          }
        };

        window.addEventListener('message', messageListener);
      } else {
        const res = await api.linkGoogleAccount({
          googleId: `google_oauth_${Date.now()}`,
          email: user.email,
          profileImage:
            user.profile_image ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
        });
        setSuccess(res.message || 'Google account linked successfully!');
        onUserUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google account');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Unlinking
  const handleUnlinkGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Login from this account?')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.unlinkGoogleAccount();
      setSuccess(res.message || 'Google account unlinked.');
      onUserUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to unlink Google account');
    } finally {
      setLoading(false);
    }
  };

  // Handle setting / updating password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSettingPassword(true);
    try {
      const res = await api.setPassword(newPassword);
      setSuccess(res.message || 'Password saved successfully.');
      setNewPassword('');
      setConfirmPassword('');
      onUserUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to save password');
    } finally {
      setSettingPassword(false);
    }
  };

  const isGoogleLinked = user.auth_provider === 'google' || user.auth_provider === 'linked';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-xl w-full shadow-2xl p-6 text-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Account Settings & Security</h2>
              <p className="text-xs text-slate-500">
                Manage your profile, authentication providers, and business quotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* User Profile Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-4">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">{user.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
                <div className="mt-2 flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Current Login Method:</span>
                  {user.auth_provider === 'google' ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google Account</span>
                    </span>
                  ) : user.auth_provider === 'linked' ? (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Linked (Google + Email)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <span>Email & Password</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Google Account Linking */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h4 className="text-sm font-bold text-slate-900">Google Account Integration</h4>
              </div>
              {isGoogleLinked && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isGoogleLinked
                ? 'Your Google account is securely connected. You can log in with "Continue with Google" at any time.'
                : 'Connect your Google account to log in with one click using "Continue with Google" while preserving all your existing businesses and accounting records.'}
            </p>

            {isGoogleLinked ? (
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Google ID: <code className="text-blue-600 font-mono text-xs">{user.google_id || 'Active'}</code>
                </div>
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={loading}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect Google</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={loading}
                  className="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connect Google Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Password Security */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                {user.has_password ? 'Change Account Password' : 'Set Account Password'}
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {user.has_password
                ? 'Update your email/password authentication credentials.'
                : 'You signed in via Google and do not have an email/password configured yet. Setting a password allows you to log in with either method.'}
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={settingPassword || !newPassword}
                className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {settingPassword ? 'Saving Password...' : user.has_password ? 'Update Password' : 'Save Password'}
              </button>
            </form>
          </div>

          {/* Section: Quota & Multi-Business Capacity */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Business Quota & Capacity</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-slate-500 text-xs uppercase font-semibold">Active Businesses</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{user.business_count ?? 0}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-slate-500 text-xs uppercase font-semibold">Allocated Limit</span>
                <span className="text-xl font-bold text-blue-600 mt-1 block">{user.effective_limit ?? 5}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-slate-500 text-xs uppercase font-semibold">Remaining Slots</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">{user.remaining_slots ?? 5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
