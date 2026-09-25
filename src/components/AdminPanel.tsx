import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  Sliders,
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../api.ts';
import { AdminUserOverview, Business } from '../types.ts';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [globalLimit, setGlobalLimit] = useState<number>(5);
  const [newGlobalLimit, setNewGlobalLimit] = useState<number>(5);
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserBusinesses, setSelectedUserBusinesses] = useState<{
    userName: string;
    businesses: Business[];
  } | null>(null);
  const [savingLimit, setSavingLimit] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [customLimitVal, setCustomLimitVal] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOverview();
      setGlobalLimit(data.global_limit);
      setNewGlobalLimit(data.global_limit);
      setUsers(data.users);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveGlobalLimit = async () => {
    setSavingLimit(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.updateGlobalLimit(newGlobalLimit);
      setGlobalLimit(newGlobalLimit);
      setSuccessMsg(`Global business limit updated to ${newGlobalLimit}.`);
      fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update global limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleSetUserLimit = async (userId: number, limit: number | null) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.updateUserLimit(userId, limit);
      setSuccessMsg(`User limit updated successfully.`);
      setEditingUserId(null);
      fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user limit');
    }
  };

  const handleToggleBusinessStatus = async (businessId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateBusinessStatus(businessId, nextStatus);
      fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-5xl w-full shadow-2xl p-6 text-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Admin Panel – Business Limits & Enterprise Oversight
              </h2>
              <p className="text-xs text-slate-500">
                Configure global limits, override individual user quotas, and audit registered businesses
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

        {/* Notifications */}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="overflow-y-auto flex-1 mt-4 space-y-6 pr-1">
          {/* Section 1: Global Business Limit Control */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Global Maximum Businesses Limit per User</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Sets the default ceiling for all users. Reducing this limit never disables or
                  deletes existing user businesses; users simply cannot create new businesses until
                  their count drops below the limit.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <span className="text-xs text-slate-500 font-semibold">Limit:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newGlobalLimit}
                    onChange={(e) => setNewGlobalLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-transparent text-sm font-bold text-slate-900 text-center focus:outline-none"
                    id="admin-global-limit-input"
                  />
                </div>
                <button
                  onClick={handleSaveGlobalLimit}
                  disabled={savingLimit || newGlobalLimit === globalLimit}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
                  id="admin-save-global-limit-btn"
                >
                  {savingLimit ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Users & Individual Business Quotas */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>User Accounts & Custom Quotas</span>
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Auth Provider</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Limit</th>
                    <th className="py-3 px-4">Current Businesses</th>
                    <th className="py-3 px-4">Remaining Slots</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isEditing = editingUserId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {u.profile_image ? (
                              <img
                                src={u.profile_image}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{u.name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {u.auth_provider === 'google' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>Google</span>
                            </span>
                          ) : u.auth_provider === 'linked' ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Linked (Google + Email)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <span>Email/Password</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder={globalLimit.toString()}
                                value={customLimitVal}
                                onChange={(e) => setCustomLimitVal(e.target.value)}
                                className="w-16 px-2 py-1 bg-white border border-purple-500 rounded-lg text-sm text-slate-900 focus:outline-none"
                              />
                              <button
                                onClick={() =>
                                  handleSetUserLimit(
                                    u.id,
                                    customLimitVal === '' ? null : parseInt(customLimitVal)
                                  )
                                }
                                className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs"
                                title="Apply"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-800">
                                {u.assigned_limit !== null ? (
                                  <strong className="text-purple-700 font-bold">{u.assigned_limit}</strong>
                                ) : (
                                  <span className="text-slate-500">
                                    {globalLimit} (Global)
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setCustomLimitVal(
                                    u.assigned_limit !== null ? u.assigned_limit.toString() : ''
                                  );
                                }}
                                className="text-xs font-semibold text-purple-600 hover:underline ml-1"
                              >
                                Edit
                              </button>
                              {u.assigned_limit !== null && (
                                <button
                                  onClick={() => handleSetUserLimit(u.id, null)}
                                  className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                                  title="Reset to global limit"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              setSelectedUserBusinesses({
                                userName: u.name,
                                businesses: u.businesses,
                              })
                            }
                            className="flex items-center space-x-1.5 text-blue-600 hover:underline font-semibold text-sm cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>{u.current_count} businesses</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              u.remaining_slots > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {u.remaining_slots} slots
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setSelectedUserBusinesses({
                                userName: u.name,
                                businesses: u.businesses,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Businesses</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Businesses Modal popup */}
        {selectedUserBusinesses && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="text-base font-bold text-slate-900">
                  Businesses owned by {selectedUserBusinesses.userName}
                </h4>
                <button
                  onClick={() => setSelectedUserBusinesses(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-3 max-h-80 overflow-y-auto">
                {selectedUserBusinesses.businesses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No businesses created by this user yet.
                  </div>
                ) : (
                  selectedUserBusinesses.businesses.map((biz) => (
                    <div key={biz.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{biz.icon || '🏢'}</span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{biz.name}</div>
                          <div className="text-xs text-slate-500">
                            Currency: {biz.currency} &bull; Reg:{' '}
                            {new Date(biz.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                            biz.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {biz.status}
                        </span>
                        <button
                          onClick={() => handleToggleBusinessStatus(biz.id, biz.status)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          Toggle Status
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
