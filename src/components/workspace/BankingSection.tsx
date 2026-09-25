import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  Calendar,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, BankAccount, BankTransaction } from '../../types.ts';

interface BankingSectionProps {
  business: Business;
  userBusinesses: Business[];
}

export const BankingSection: React.FC<BankingSectionProps> = ({
  business,
  userBusinesses,
}) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Bank Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('Checking');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [scope, setScope] = useState<'individual' | 'multiple'>('individual');
  const [selectedBizIds, setSelectedBizIds] = useState<number[]>([business.id]);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Bank Account Modal
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountTitle, setEditAccountTitle] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountType, setEditAccountType] = useState('Checking');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Bank Account Modal (Accidental Deletion & Financial Protection)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Scope Conversion Modal
  const [convertingAccount, setConvertingAccount] = useState<BankAccount | null>(null);
  const [targetScope, setTargetScope] = useState<'individual' | 'multiple'>('individual');
  const [targetBizId, setTargetBizId] = useState<number>(business.id);
  const [additionalBizIds, setAdditionalBizIds] = useState<number[]>([]);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  // Bank Statement Modal
  const [statementAccount, setStatementAccount] = useState<BankAccount | null>(null);
  const [statementScope, setStatementScope] = useState<'combined' | 'business'>('business');
  const [statementFrom, setStatementFrom] = useState('');
  const [statementTo, setStatementTo] = useState('');
  const [statementTxns, setStatementTxns] = useState<BankTransaction[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.getBankAccounts(business.id);
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [business.id]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      await api.createBankAccount(business.id, {
        bank_name: bankName,
        account_title: accountTitle,
        account_number: accountNumber,
        account_type: accountType,
        opening_balance: parseFloat(openingBalance) || 0,
        scope,
        connected_business_ids: scope === 'multiple' ? selectedBizIds : [business.id],
      });
      setShowAddModal(false);
      resetAddForm();
      loadAccounts();
      setActionNotice({
        type: 'success',
        message: `Bank account "${accountTitle}" successfully created.`,
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setAddError(err.message);
    }
  };

  const resetAddForm = () => {
    setBankName('');
    setAccountTitle('');
    setAccountNumber('');
    setAccountType('Checking');
    setOpeningBalance('0');
    setScope('individual');
    setSelectedBizIds([business.id]);
    setAddError(null);
  };

  // Open Edit Account Modal
  const openEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setEditBankName(acc.bank_name);
    setEditAccountTitle(acc.account_title);
    setEditAccountNumber(acc.account_number);
    setEditAccountType(acc.account_type);
    setEditError(null);
  };

  // Submit Edit Account
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditError(null);

    try {
      await api.updateBankAccount(business.id, editingAccount.id, {
        bank_name: editBankName,
        account_title: editAccountTitle,
        account_number: editAccountNumber,
        account_type: editAccountType,
      });

      setEditingAccount(null);
      loadAccounts();
      setActionNotice({
        type: 'success',
        message: `Account "${editAccountTitle}" updated successfully.`,
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update bank account details.');
    }
  };

  // Open Protected Deletion Modal
  const openDeleteAccount = (acc: BankAccount) => {
    setDeletingAccount(acc);
    setDeleteError(null);
  };

  // Submit Safe Deletion
  const handleConfirmDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await api.deleteBankAccount(business.id, deletingAccount.id);
      setDeletingAccount(null);
      loadAccounts();
      setActionNotice({
        type: 'success',
        message: res.message || `Bank account safely removed.`,
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setDeleteError(err.message || 'Could not delete bank account due to audit restrictions.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openConvertModal = (acc: BankAccount) => {
    setConvertingAccount(acc);
    setConvertError(null);
    setConvertSuccess(null);
    if (acc.scope === 'multiple') {
      setTargetScope('individual');
      setTargetBizId(business.id);
    } else {
      setTargetScope('multiple');
      setAdditionalBizIds(
        userBusinesses.filter((b) => b.id !== business.id).map((b) => b.id)
      );
    }
  };

  const handleExecuteConvert = async () => {
    if (!convertingAccount) return;
    setConvertLoading(true);
    setConvertError(null);
    setConvertSuccess(null);

    try {
      if (convertingAccount.scope === 'multiple') {
        const res = await api.convertAccountToIndividual(business.id, {
          bank_account_id: convertingAccount.id,
          target_business_id: targetBizId,
        });
        setConvertSuccess(res.message);
      } else {
        const fullBizList = Array.from(new Set([business.id, ...additionalBizIds]));
        const res = await api.convertAccountToMultiple(business.id, {
          bank_account_id: convertingAccount.id,
          business_ids: fullBizList,
        });
        setConvertSuccess(res.message);
      }
      loadAccounts();
      setTimeout(() => {
        setConvertingAccount(null);
      }, 1500);
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert account scope.');
    } finally {
      setConvertLoading(false);
    }
  };

  const openStatement = async (acc: BankAccount, defaultScope: 'combined' | 'business' = 'business') => {
    setStatementAccount(acc);
    setStatementScope(defaultScope);
    setStatementLoading(true);
    try {
      const res = await api.getBankStatement(
        business.id,
        acc.id,
        defaultScope,
        statementFrom,
        statementTo
      );
      setStatementTxns(res.transactions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStatementLoading(false);
    }
  };

  const reloadStatement = async (overrideScope?: 'combined' | 'business') => {
    if (!statementAccount) return;
    setStatementLoading(true);
    const useScope = overrideScope || statementScope;
    try {
      const res = await api.getBankStatement(
        business.id,
        statementAccount.id,
        useScope,
        statementFrom,
        statementTo
      );
      setStatementTxns(res.transactions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setStatementLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Landmark className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Banking & Multi-Business Accounts</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage individual or shared multi-business treasury bank accounts, statements, and scope conversion
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setShowAddModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="add-bank-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2.5 text-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isMultiple = acc.scope === 'multiple';
          return (
            <div
              key={acc.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all flex flex-col justify-between ${
                isMultiple ? 'border-purple-200 ring-1 ring-purple-100' : 'border-slate-200/90'
              }`}
              id={`bank-account-card-${acc.id}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">
                      {acc.bank_name} &bull; {acc.account_type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{acc.account_title}</h3>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {acc.account_number}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span
                      className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                        isMultiple
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {isMultiple ? 'Multiple' : 'Individual'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Edit Bank Account Details"
                      id={`edit-bank-btn-${acc.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Bank Account (Protected)"
                      id={`delete-bank-btn-${acc.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isMultiple && (
                  <div className="mb-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
                    <div className="font-semibold mb-1 flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      <span>Shared across {acc.connected_business_ids.length} businesses:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {acc.connected_business_ids.map((bId) => {
                        const bObj = userBusinesses.find((ub) => ub.id === bId);
                        return (
                          <span
                            key={bId}
                            className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-slate-700 text-xs font-medium"
                          >
                            {bObj?.icon || '🏢'} {bObj?.name || `Biz #${bId}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl my-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200/70">
                    <span>Opening Balance</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {business.currency} {acc.opening_balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Current Ledger Balance</div>
                    <div
                      className={`text-xl font-bold font-mono mt-0.5 ${
                        acc.current_balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                      }`}
                    >
                      {business.currency} {acc.current_balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <button
                  onClick={() => openConvertModal(acc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Convert Scope"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                  <span>Convert Scope</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openStatement(acc, 'business')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Statement</span>
                  </button>
                  {isMultiple && (
                    <button
                      onClick={() => openStatement(acc, 'combined')}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-xs transition-colors"
                      title="View all businesses combined statement"
                    >
                      Combined
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Bank Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Bank Account</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {addError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {addError}
              </div>
            )}
            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Account Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="e.g. Current Operations"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Treasury">Treasury</option>
                    <option value="Merchant">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1029384756"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Opening Balance ({business.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Scope Selection */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-sm font-semibold text-slate-800">
                  Account Scope Model
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setScope('individual')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      scope === 'individual'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Individual Business</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Dedicated exclusively to {business.name}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('multiple')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      scope === 'multiple'
                        ? 'bg-purple-50 border-purple-500 text-purple-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Multiple Businesses</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Shared treasury across chosen businesses
                    </div>
                  </button>
                </div>

                {scope === 'multiple' && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Connect to your other businesses:
                    </span>
                    <div className="space-y-1">
                      {userBusinesses.map((ub) => (
                        <label
                          key={ub.id}
                          className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBizIds.includes(ub.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBizIds([...selectedBizIds, ub.id]);
                              } else {
                                if (selectedBizIds.length > 1) {
                                  setSelectedBizIds(selectedBizIds.filter((id) => id !== ub.id));
                                }
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            {ub.icon} {ub.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Edit Bank Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Account Title *
                </label>
                <input
                  type="text"
                  required
                  value={editAccountTitle}
                  onChange={(e) => setEditAccountTitle(e.target.value)}
                  placeholder="e.g. Operational Treasury Account"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={editAccountType}
                    onChange={(e) => setEditAccountType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Treasury">Treasury</option>
                    <option value="Merchant">Merchant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    placeholder="e.g. 9812-4412-001"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Note:</span> Scope and opening balance remain governed by the multi-business ledger architecture. To convert between individual and shared multi-business access, use the "Convert Scope" tool.
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Bank Account Modal (With Financial Audit & Accidental Deletion Protection) */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Protected Bank Account Deletion</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm deletion for account: <span className="text-slate-800 font-semibold">{deletingAccount.account_title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError ? (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 space-y-2">
                <div className="font-semibold flex items-center space-x-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Deletion Blocked by Financial Safety Protection:</span>
                </div>
                <p className="leading-relaxed">{deleteError}</p>
                <div className="text-xs text-rose-700 pt-1 border-t border-rose-200">
                  To preserve accounting integrity and avoid breaking historical balance records, bank accounts with linked transaction entries cannot be removed.
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank & Type:</span>
                    <span className="text-slate-800 font-medium">{deletingAccount.bank_name} ({deletingAccount.account_type})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="text-slate-800 font-mono">{deletingAccount.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance:</span>
                    <span className="text-slate-900 font-mono font-bold">
                      {business.currency} {deletingAccount.current_balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scope:</span>
                    <span className="text-purple-700 uppercase text-xs font-semibold">
                      {deletingAccount.scope}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5 text-amber-800">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Audit Safety Check Active</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    The backend verifies whether this account has recorded deposits, withdrawals, customer receipts, or supplier payments. If any linked transactions exist, deletion will be safely rejected to prevent breaking historical records.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              {!deleteError && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDeleteAccount}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {isDeleting ? 'Verifying & Deleting...' : 'Confirm Safe Deletion'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scope Conversion Modal */}
      {convertingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>Convert Account Scope</span>
              </h3>
              <button
                onClick={() => setConvertingAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Converting <strong>{convertingAccount.account_title}</strong> (
              {convertingAccount.bank_name})
            </div>

            {convertError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{convertError}</span>
              </div>
            )}
            {convertSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{convertSuccess}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {convertingAccount.scope === 'multiple' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Rule Enforcement:</strong> A shared multiple-business bank account can
                    only be converted into an individual account if <em>no transactions</em> have
                    been processed under any of the other businesses.
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Assign to Sole Business:
                    </label>
                    <select
                      value={targetBizId}
                      onChange={(e) => setTargetBizId(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                    >
                      {userBusinesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.icon} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                    Converting to <strong>Multiple Businesses</strong> will allow you to share this
                    treasury account across several of your registered companies.
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Select additional businesses to grant access:
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {userBusinesses.map((b) => (
                        <label
                          key={b.id}
                          className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={additionalBizIds.includes(b.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdditionalBizIds([...additionalBizIds, b.id]);
                              } else {
                                setAdditionalBizIds(additionalBizIds.filter((id) => id !== b.id));
                              }
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>
                            {b.icon} {b.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingAccount(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={convertLoading}
                  onClick={handleExecuteConvert}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs"
                >
                  {convertLoading ? 'Verifying & Converting...' : 'Execute Conversion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <span>Bank Statement: {statementAccount.account_title}</span>
                  <span className="text-sm font-normal text-slate-500">({statementAccount.bank_name})</span>
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Total Ledger Balance:{' '}
                  <strong className="text-slate-900 font-mono">
                    {business.currency} {statementAccount.current_balance.toFixed(2)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setStatementAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Toggle & Date Filter */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                {statementAccount.scope === 'multiple' && (
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => {
                        setStatementScope('business');
                        reloadStatement('business');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        statementScope === 'business'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {business.name} Only
                    </button>
                    <button
                      onClick={() => {
                        setStatementScope('combined');
                        reloadStatement('combined');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        statementScope === 'combined'
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Combined (All Businesses)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>From:</span>
                <input
                  type="date"
                  value={statementFrom}
                  onChange={(e) => setStatementFrom(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
                <span>To:</span>
                <input
                  type="date"
                  value={statementTo}
                  onChange={(e) => setStatementTo(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
                <button
                  onClick={() => reloadStatement()}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    {statementScope === 'combined' && (
                      <th className="py-3 px-3">Originating Business</th>
                    )}
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Reference #</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Debit (Withdrawal)</th>
                    <th className="py-3 px-3 text-right">Credit (Deposit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {statementTxns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{tx.transaction_date}</td>
                      {statementScope === 'combined' && (
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                            {tx.business_name}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 px-3 uppercase text-xs font-semibold text-slate-500">
                        {tx.transaction_type}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600 font-semibold">{tx.reference_id}</td>
                      <td className="py-2.5 px-3 text-slate-700">{tx.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                        {tx.transaction_type === 'withdrawal' ? tx.amount.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {tx.transaction_type === 'deposit' ? tx.amount.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                  {statementTxns.length === 0 && (
                    <tr>
                      <td
                        colSpan={statementScope === 'combined' ? 7 : 6}
                        className="py-8 text-center text-slate-500 text-sm"
                      >
                        No bank transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
