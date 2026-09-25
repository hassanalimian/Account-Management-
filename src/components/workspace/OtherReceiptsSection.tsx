import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Landmark,
  ArrowDownLeft,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, BankAccount, OtherReceipt } from '../../types.ts';

interface OtherReceiptsSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const OtherReceiptsSection: React.FC<OtherReceiptsSectionProps> = ({
  business,
  autoOpenCreate,
}) => {
  const [receipts, setReceipts] = useState<OtherReceipt[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [payer, setPayer] = useState('');
  const [category, setCategory] = useState('General Income');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View, Edit, Delete State
  const [viewingReceipt, setViewingReceipt] = useState<OtherReceipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<OtherReceipt | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<OtherReceipt | null>(null);
  const [editBankAccountId, setEditBankAccountId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editReceiptDate, setEditReceiptDate] = useState('');
  const [editPayer, setEditPayer] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleOpenEdit = (r: OtherReceipt) => {
    setEditingReceipt(r);
    setEditBankAccountId(r.bank_account_id ? r.bank_account_id.toString() : (accounts[0]?.id?.toString() || ''));
    setEditAmount(r.amount.toString());
    setEditReceiptDate(r.receipt_date);
    setEditPayer(r.payer);
    setEditCategory(r.category);
    setEditReferenceNumber(r.reference_number || '');
    setEditNotes(r.notes || '');
    setEditError(null);
  };

  const handleUpdateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError('Please enter a valid positive receipt amount.');
      return;
    }
    if (!editPayer.trim()) {
      setEditError('Please enter payer or customer source name.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.updateOtherReceipt(business.id, editingReceipt.id, {
        bank_account_id: parseInt(editBankAccountId, 10),
        amount: amt,
        receipt_date: editReceiptDate,
        payer: editPayer.trim(),
        category: editCategory,
        reference_number: editReferenceNumber.trim(),
        notes: editNotes.trim(),
      });
      setEditingReceipt(null);
      setSuccessMessage(`Receipt #${editingReceipt.receipt_number} updated successfully. Bank balance and ledger reconciled.`);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update receipt.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!deletingReceipt) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteOtherReceipt(business.id, deletingReceipt.id);
      setSuccessMessage(`Receipt #${deletingReceipt.receipt_number} deleted. Bank balance and ledger effect atomically reversed.`);
      setDeletingReceipt(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete receipt.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      setBankAccountId(accounts.length > 0 ? accounts[0].id.toString() : '');
      setAmount('');
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setPayer('');
      setCategory('General Income');
      setReferenceNumber('');
      setNotes('');
      setFormError(null);
      setShowModal(true);
    }
  }, [autoOpenCreate]);

  const categories = [
    'General Income',
    'Capital Investment / Equity',
    'Owner / Partner Deposit',
    'Bank Interest Income',
    'Scrap & Asset Sales',
    'Supplier Refund / Rebate',
    'Commission & Brokerage',
    'Rental / Sublet Income',
    'Loan Disbursement Received',
    'Miscellaneous Income',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, accRes] = await Promise.all([
        api.getOtherReceipts(business.id),
        api.getBankAccounts(business.id),
      ]);
      setReceipts(recRes.receipts || []);
      setAccounts(accRes.accounts || []);
      if (accRes.accounts && accRes.accounts.length > 0 && !bankAccountId) {
        setBankAccountId(accRes.accounts[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load other receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const selectedAccount = accounts.find((a) => a.id.toString() === bankAccountId);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId) {
      setFormError('Please select a receiving bank/cash account.');
      return;
    }
    if (!payer.trim()) {
      setFormError('Please enter payer or contributor name.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid receipt amount.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createOtherReceipt(business.id, {
        bank_account_id: parseInt(bankAccountId, 10),
        amount: amt,
        receipt_date: receiptDate,
        payer: payer.trim(),
        category,
        reference_number: referenceNumber.trim(),
        notes: notes.trim(),
      });

      setShowModal(false);
      setSuccessMessage(
        `Other receipt of $${amt.toFixed(2)} from ${payer} recorded successfully. Bank balance updated.`
      );
      setAmount('');
      setPayer('');
      setReferenceNumber('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record other receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      (r.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.payer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reference_number && r.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalReceiptsAmount = receipts.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Other Receipts</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record capital injections, interest, rebates, partner deposits, and non-customer income.
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
            disabled={accounts.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Record Other Receipt</span>
          </button>
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Please create at least one Bank or Cash Account in "Bank Accounts" before recording receipts.</span>
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
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Inflows</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{receipts.length} Receipts</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Total Amount Received</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            +${totalReceiptsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Deposit Accounts</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{accounts.length} Accounts</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, payer, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">All Income Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            Loading receipts...
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No other receipts found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payer / Source</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Deposited Into Account</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {r.receipt_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{r.receipt_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.payer}</div>
                      {r.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{r.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{r.bank_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {r.reference_number || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      +${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingReceipt(r)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Receipt"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingReceipt(r)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Receipt"
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
      {/* RECORD OTHER RECEIPT MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Other Receipt</h3>
                  <p className="text-xs text-slate-500">Post non-customer income and credit to bank/cash account</p>
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

            <form onSubmit={handleCreateReceipt} className="py-4 space-y-4 text-xs">
              {/* Bank Account */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deposit Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bank_name} ({a.account_title || a.account_number}) — Bal: ${a.current_balance.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Current balance: <strong>${selectedAccount.current_balance.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {/* Payer & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payer / Contributor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Partner Deposit, National Bank"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Income Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Receipt Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference # (Cheque / Transaction / Deposit Slip ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEP-4001, NEFT-88392"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details or contribution description..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW RECEIPT MODAL */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Receipt Details</h3>
                  <p className="text-xs font-mono text-slate-500">{viewingReceipt.receipt_number}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Receipt Date</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.receipt_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payer / Source</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.payer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Category</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {viewingReceipt.category}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Deposited Into</span>
                <span className="font-semibold text-slate-800">{viewingReceipt.bank_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reference #</span>
                <span className="font-mono text-slate-700">{viewingReceipt.reference_number || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Amount Received</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  +${viewingReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {viewingReceipt.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Notes / Description</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 text-xs border border-slate-100">
                    {viewingReceipt.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const r = viewingReceipt;
                  setViewingReceipt(null);
                  handleOpenEdit(r);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT OTHER RECEIPT MODAL */}
      {/* ========================================================================= */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Other Receipt</h3>
                  <p className="text-xs text-slate-500">
                    Updating this receipt will automatically reconcile the receiving bank account balance and ledger.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingReceipt(null)}
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

            <form onSubmit={handleUpdateReceipt} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deposit Account <span className="text-emerald-500">*</span>
                </label>
                <select
                  value={editBankAccountId}
                  onChange={(e) => setEditBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} ({acc.account_title}) — Bal: ${acc.current_balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Received ($) <span className="text-emerald-500">*</span>
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
                    Receipt Date <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editReceiptDate}
                    onChange={(e) => setEditReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payer / Contributor <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPayer}
                  onChange={(e) => setEditPayer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Income Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference #</label>
                <input
                  type="text"
                  value={editReferenceNumber}
                  onChange={(e) => setEditReferenceNumber(e.target.value)}
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
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE OTHER RECEIPT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Other Receipt?</h3>
                <p className="text-xs text-slate-500 font-mono">{deletingReceipt.receipt_number}</p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 my-4 text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold text-rose-900">Atomic Financial Reversal Notice:</p>
              <p>
                Deleting this receipt will atomically deduct <strong>${deletingReceipt.amount.toFixed(2)}</strong> from the receiving account <strong>{deletingReceipt.bank_name}</strong> and reverse associated financial ledger entries.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingReceipt(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReceipt}
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
