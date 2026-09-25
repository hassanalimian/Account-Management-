import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  Info,
  Sparkles,
} from 'lucide-react';
import { api, setStoredToken } from '../api.ts';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google OAuth State
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [googleConfigInfo, setGoogleConfigInfo] = useState<any>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.login({ email, password });
      } else {
        res = await api.register({ name, email, password });
      }

      if (res.token) {
        setStoredToken(res.token);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: userEmail, password: userPass });
      if (res.token) {
        setStoredToken(res.token);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const config = await api.getGoogleAuthUrl('login');
      setGoogleConfigInfo(config);

      if (config.is_configured && config.url) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          config.url,
          'google_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
        );

        if (!popup) {
          throw new Error('Popup blocked by browser. Please allow popups for this site to log in with Google.');
        }

        const handleAuthMessage = (event: MessageEvent) => {
          if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token) {
            setStoredToken(event.data.token);
            window.removeEventListener('message', handleAuthMessage);
            onSuccess();
          } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
            setError(event.data.error || 'Google authentication failed');
            window.removeEventListener('message', handleAuthMessage);
            setGoogleLoading(false);
          }
        };

        window.addEventListener('message', handleAuthMessage);
      } else {
        setShowGoogleConfigModal(true);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google authentication');
      setGoogleLoading(false);
    }
  };

  const handleExecuteGoogleTestProfile = async (profile: {
    name: string;
    email: string;
    profileImage?: string;
  }) => {
    setError(null);
    setGoogleLoading(true);
    setShowGoogleConfigModal(false);
    try {
      const res = await api.verifyGoogleAuth({
        testUser: profile,
      });
      if (res.token) {
        setStoredToken(res.token);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center mb-3 shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            PHP & MySQL Multi-Business Accounting Management System
          </p>
        </div>

        {/* Quick Demo Login Credentials */}
        <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700 mb-2">
            <span>Quick Login Profiles</span>
            <span className="text-xs text-blue-600 font-bold">Instant Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('merchant@example.com', 'merchant123')}
              className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-left transition-colors shadow-2xs cursor-pointer"
              id="quick-login-merchant"
            >
              <div className="font-bold text-slate-900">Hassan (Merchant)</div>
              <div className="text-xs text-slate-500 mt-0.5">2 Active Businesses</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@accounting.com', 'admin123')}
              className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-slate-800 text-left transition-colors shadow-2xs cursor-pointer"
              id="quick-login-admin"
            >
              <div className="font-bold text-slate-900">System Admin</div>
              <div className="text-xs text-slate-500 mt-0.5">Global Limit Controls</div>
            </button>
          </div>
        </div>

        {/* Primary Continue with Google OAuth Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={googleLoading}
            id="continue-with-google-btn"
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl shadow-2xs border border-slate-200 transition-all flex items-center justify-center space-x-3 disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-slate-700">
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-5">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink-0 mx-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">
            or continue with email
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                  id="auth-name-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                id="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                id="auth-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            id="auth-submit-btn"
          >
            <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {isLogin ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="text-blue-600 hover:underline font-semibold"
                id="toggle-to-signup"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-blue-600 hover:underline font-semibold"
                id="toggle-to-login"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Google OAuth Configuration & Testing Dialog */}
      {showGoogleConfigModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Google OAuth 2.0 Authentication</h3>
                  <p className="text-xs text-slate-500">Production OAuth flow & Test Account Simulation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Production Credentials Guide */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs space-y-2">
              <div className="flex items-center text-amber-700 font-semibold space-x-1.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>Google OAuth 2.0 Configuration</span>
              </div>
              <p className="text-slate-600">
                To connect real live Google accounts, configure <code className="bg-slate-200/80 px-1 py-0.5 rounded text-blue-700 font-mono">GOOGLE_CLIENT_ID</code> and <code className="bg-slate-200/80 px-1 py-0.5 rounded text-blue-700 font-mono">GOOGLE_CLIENT_SECRET</code> in the project settings.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Authorized Redirect URI:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={googleConfigInfo?.redirect_uri || `${window.location.origin}/api/auth/google/callback`}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        googleConfigInfo?.redirect_uri ||
                          `${window.location.origin}/api/auth/google/callback`
                      )
                    }
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center space-x-1 font-semibold"
                  >
                    {copiedRedirect ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRedirect ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 1-Click Real Database Testing */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Instant Test Accounts (Full Database & Session Flow)
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Real DB Records</span>
              </div>

              <div className="space-y-2.5">
                {/* 1. New Google User Profile */}
                <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80"
                        alt="Sarah Chen"
                        className="w-9 h-9 rounded-full object-cover border border-blue-400/40"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">Sarah Chen (First-Time Google User)</div>
                        <div className="text-xs text-slate-500 font-mono">sarah.chen@gmail.com</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteGoogleTestProfile({
                          name: 'Sarah Chen',
                          email: 'sarah.chen@gmail.com',
                          profileImage:
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
                        })
                      }
                      id="test-login-sarah"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      New Account Flow
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-200/80 pt-1.5">
                    ✨ Tests first-time Google sign-up: auto-creates user in DB, stores Google ID, profile avatar, no password required, and redirects to dashboard to create first business.
                  </div>
                </div>

                {/* 2. Existing User Account Linking */}
                <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                        HM
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">Hassan Merchant (Account Linking)</div>
                        <div className="text-xs text-slate-500 font-mono">merchant@example.com</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleExecuteGoogleTestProfile({
                          name: 'Hassan Merchant',
                          email: 'merchant@example.com',
                          profileImage:
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
                        })
                      }
                      id="test-login-hassan-link"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Link Account Flow
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-200/80 pt-1.5">
                    🔗 Tests existing account linking: connects Google ID to Hassan's existing account with 2 businesses, sets auth_provider to 'linked', and retains business access.
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Google Email Test */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Test with Custom Google Email:</span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Alex Rivera)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                />
                <input
                  type="email"
                  placeholder="google.user@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
              <button
                type="button"
                disabled={!customGoogleEmail}
                onClick={() =>
                  handleExecuteGoogleTestProfile({
                    name: customGoogleName || customGoogleEmail.split('@')[0],
                    email: customGoogleEmail,
                  })
                }
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Sign In with Custom Google Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
