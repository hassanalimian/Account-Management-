import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Landmark,
  ArrowRight,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, BankAccount, BankTransfer } from '../../types.ts';

interface BankTransfersSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const BankTransfersSection: React.FC<BankTransfersSectionProps> = ({
  business,
  autoOpenCreate,
}) => {
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View, Edit, Delete State
  const [viewingTransfer, setViewingTransfer] = useState<BankTransfer | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<BankTransfer | null>(null);
  const [deletingTransfer, setDeletingTransfer] = useState<BankTransfer | null>(null);
  const [editFromAccountId, setEditFromAccountId] = useState('');
  const [editToAccountId, setEditToAccountId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editTransferDate, setEditTransferDate] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleOpenEdit = (t: BankTransfer) => {
    setEditingTransfer(t);
    setEditFromAccountId(t.from_account_id ? t.from_account_id.toString() : '');
    setEditToAccountId(t.to_account_id ? t.to_account_id.toString() : '');
    setEditAmount(t.amount.toString());
    setEditTransferDate(t.transfer_date);
    setEditReference(t.reference || '');
    setEditNotes(t.notes || '');
    setEditError(null);
  };

  const handleUpdateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;
    if (!editFromAccountId || !editToAccountId) {
      setEditError('Please select both source and destination accounts.');
      return;
    }
    if (editFromAccountId === editToAccountId) {
      setEditError('Source and destination accounts must be different.');
      return;
    }
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError('Please enter a valid transfer amount.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.updateBankTransfer(business.id, editingTransfer.id, {
        from_account_id: parseInt(editFromAccountId, 10),
        to_account_id: parseInt(editToAccountId, 10),
        amount: amt,
        transfer_date: editTransferDate,
        reference: editReference.trim(),
        notes: editNotes.trim(),
      });
      setEditingTransfer(null);
      setSuccessMessage(`Transfer #${editingTransfer.transfer_number} updated successfully. Bank balances recalculated.`);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update transfer.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!deletingTransfer) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteBankTransfer(business.id, deletingTransfer.id);
      setSuccessMessage(`Transfer #${deletingTransfer.transfer_number} deleted. Funds returned to source account and deducted from destination.`);
      setDeletingTransfer(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transfer.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      if (accounts.length >= 2) {
        setFromAccountId(accounts[0].id.toString());
        setToAccountId(accounts[1].id.toString());
      } else if (accounts.length === 1) {
        setFromAccountId(accounts[0].id.toString());
        setToAccountId('');
      }
      setAmount('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setReference('');
      setNotes('');
      setFormError(null);
      setShowModal(true);
    }
  }, [autoOpenCreate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transRes, accRes] = await Promise.all([
        api.getBankTransfers(business.id),
        api.getBankAccounts(business.id),
      ]);
      setTransfers(transRes.transfers || []);
      const accList: BankAccount[] = accRes.accounts || [];
      setAccounts(accList);
      if (accList.length >= 2) {
        if (!fromAccountId) setFromAccountId(accList[0].id.toString());
        if (!toAccountId) setToAccountId(accList[1].id.toString());
      } else if (accList.length === 1) {
        if (!fromAccountId) setFromAccountId(accList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load bank transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const selectedFromAccount = accounts.find((a) => a.id.toString() === fromAccountId);
  const selectedToAccount = accounts.find((a) => a.id.toString() === toAccountId);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setFormError('Please select both source and destination accounts.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setFormError('Source and destination accounts must be different.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid transfer amount.');
      return;
    }
    if (selectedFromAccount && amt > selectedFromAccount.current_balance) {
      setFormError(
        `Transfer amount ($${amt.toFixed(2)}) exceeds available balance in ${selectedFromAccount.bank_name} ($${selectedFromAccount.current_balance.toFixed(2)}).`
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createBankTransfer(business.id, {
        from_account_id: parseInt(fromAccountId, 10),
        to_account_id: parseInt(toAccountId, 10),
        amount: amt,
        transfer_date: transferDate,
        reference: reference.trim(),
        notes: notes.trim(),
      });

      setShowModal(false);
      setSuccessMessage(
        `Transfer of $${amt.toFixed(2)} from ${res.transfer.from_account_name} to ${res.transfer.to_account_name} completed successfully.`
      );
      setAmount('');
      setReference('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete bank transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    return (
      (t.transfer_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.from_account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.to_account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalTransferVolume = transfers.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bank Transfers</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer liquidity between internal bank accounts, cash drawers, and merchant balances.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            disabled={accounts.length < 2}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            title={
              accounts.length < 2
                ? 'Requires at least 2 bank or cash accounts to transfer funds'
                : 'Initiate Transfer'
            }
          >
            <Plus className="w-4 h-4" />
            <span>New Bank Transfer</span>
          </button>
        </div>
      </div>

      {accounts.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You need at least two bank/cash accounts registered in "Bank Accounts" to perform fund transfers between accounts.
          </span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Transfers</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{transfers.length} Transactions</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Total Volume Moved</span>
          <div className="text-xl font-bold text-blue-700 mt-1 font-mono">
            ${totalTransferVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available Accounts</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{accounts.length} Accounts</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transfer #, account, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredTransfers.length} records
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            Loading transfer history...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No bank transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4"></th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Transfer Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {t.transfer_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{t.transfer_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.from_account_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-blue-700 font-medium">
                        <Landmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{t.to_account_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {t.reference || '—'}
                      {t.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{t.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingTransfer(t)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Transfer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTransfer(t)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Transfer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECORD BANK TRANSFER MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">New Account-to-Account Transfer</h3>
                  <p className="text-xs text-slate-500">Move funds between registered bank/cash accounts</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="py-4 space-y-4 text-xs">
              {/* From Account */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  From (Source Account) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bank_name} ({a.account_title || a.account_number}) — Bal: ${a.current_balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedFromAccount && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Available balance: <strong>${selectedFromAccount.current_balance.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* To Account */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  To (Destination Account) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bank_name} ({a.account_title || a.account_number}) — Bal: ${a.current_balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedToAccount && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Current balance: <strong>${selectedToAccount.current_balance.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference # (UTR / Deposit Slip / Check)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRF-1029, NEFT-99120"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Purpose / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cash deposit to bank, branch liquidity rebalance..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Transferring...' : 'Execute Bank Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW BANK TRANSFER MODAL */}
      {/* ========================================================================= */}
      {viewingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Transfer Details</h3>
                  <p className="text-xs font-mono text-slate-500">{viewingTransfer.transfer_number}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Transfer Date</span>
                <span className="font-semibold text-slate-800">{viewingTransfer.transfer_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">From Account</span>
                <span className="font-semibold text-slate-800">{viewingTransfer.from_account_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">To Account</span>
                <span className="font-semibold text-blue-700">{viewingTransfer.to_account_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reference #</span>
                <span className="font-mono text-slate-700">{viewingTransfer.reference || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Amount Transferred</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${viewingTransfer.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {viewingTransfer.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Notes / Description</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 text-xs border border-slate-100">
                    {viewingTransfer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const t = viewingTransfer;
                  setViewingTransfer(null);
                  handleOpenEdit(t);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Transfer
              </button>
              <button
                type="button"
                onClick={() => setViewingTransfer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT BANK TRANSFER MODAL */}
      {/* ========================================================================= */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Bank Transfer</h3>
                  <p className="text-xs text-slate-500">
                    Reverses original transfer effect and applies new balances atomically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTransfer} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    From Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editFromAccountId}
                    onChange={(e) => setEditFromAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bank_name} ({acc.account_title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    To Account <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={editToAccountId}
                    onChange={(e) => setEditToAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bank_name} ({acc.account_title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editTransferDate}
                    onChange={(e) => setEditTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference #</label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE BANK TRANSFER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Bank Transfer?</h3>
                <p className="text-xs text-slate-500 font-mono">{deletingTransfer.transfer_number}</p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 my-4 text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold text-rose-900">Atomic Financial Reversal Notice:</p>
              <p>
                Deleting this transfer will reverse the transaction: <strong>${deletingTransfer.amount.toFixed(2)}</strong> will be restored to <strong>{deletingTransfer.from_account_name}</strong> and deducted from <strong>{deletingTransfer.to_account_name}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTransfer(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTransfer}
                disabled={deleteSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? 'Reversing...' : 'Confirm Delete & Reverse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
