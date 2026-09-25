import React, { useState, useEffect, useRef } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  X,
  Landmark,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Receipt, Customer, BankAccount } from '../../types.ts';

interface ReceiptsSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const ReceiptsSection: React.FC<ReceiptsSectionProps> = ({ business, autoOpenCreate }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Receipt Modal
  const [showModal, setShowModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      setCustomerId(customers.length > 0 ? customers[0].id.toString() : '');
      setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '');
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setRefNumber('');
      setNotes('');
      setError(null);
      setShowModal(true);
    }
  }, [autoOpenCreate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, custRes, bankRes] = await Promise.all([
        api.getReceipts(business.id),
        api.getCustomers(business.id),
        api.getBankAccounts(business.id),
      ]);
      setReceipts(recRes.receipts || []);
      setCustomers(custRes.customers || []);
      setBankAccounts(bankRes.accounts || []);
      if (custRes.customers && custRes.customers.length > 0 && !customerId) {
        setCustomerId(custRes.customers[0].id.toString());
      }
      if (bankRes.accounts && bankRes.accounts.length > 0 && !bankAccountId) {
        setBankAccountId(bankRes.accounts[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const openCreateModal = () => {
    setEditingReceipt(null);
    setCustomerId(customers.length > 0 ? customers[0].id.toString() : '');
    setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setRefNumber('');
    setNotes('');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setCustomerId(receipt.customer_id.toString());
    setBankAccountId(receipt.bank_account_id.toString());
    setAmount(receipt.amount.toString());
    setPaymentDate(receipt.payment_date);
    setRefNumber(receipt.reference_number || '');
    setNotes(receipt.notes || '');
    setError(null);
    setShowModal(true);
  };

  const handleDeleteReceipt = async (receiptId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this receipt? This will reverse the bank account balance and restore the customer balance.'
      )
    ) {
      return;
    }

    try {
      await api.deleteReceipt(business.id, receiptId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete receipt.');
    }
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please specify a positive receipt payment amount');
      return;
    }
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (!bankAccountId) {
      setError('Please select a bank/cash account');
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const payload = {
        customer_id: parseInt(customerId, 10),
        bank_account_id: parseInt(bankAccountId, 10),
        amount: parseFloat(amount),
        payment_date: paymentDate,
        reference_number: refNumber,
        notes,
      };

      if (editingReceipt) {
        await api.updateReceipt(business.id, editingReceipt.id, payload);
      } else {
        await api.createReceipt(business.id, payload);
      }

      setShowModal(false);
      setEditingReceipt(null);
      setAmount('');
      setRefNumber('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <ReceiptText className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Customer Receipts & Bank Inflow</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Log incoming customer payments, credit receivables, and deposit into treasury bank accounts
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="create-receipt-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Receipt</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Deposited To Bank</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {receipts.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {rec.receipt_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{rec.payment_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{rec.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-700 flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{rec.bank_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                    {rec.reference_number || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                    {business.currency} {rec.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {/* Edit Receipt */}
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Receipt"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete Receipt */}
                    <button
                      onClick={() => handleDeleteReceipt(rec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Receipt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No customer payment receipts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New / Edit Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingReceipt ? `Edit Receipt: ${editingReceipt.receipt_number}` : 'Create Customer Receipt'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSaveReceipt} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Receivable: {business.currency} {c.current_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Deposit to Bank Account *
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} – {b.account_title} (
                      {b.scope === 'multiple' ? 'Shared' : 'Individual'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Amount Received ({business.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Cheque / Online Ref #
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. TXN-881299"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment description"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Processing...' : editingReceipt ? 'Update Receipt & Reconcile' : 'Save & Deposit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
