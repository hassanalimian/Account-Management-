import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Plus,
  Landmark,
  X,
  Truck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Payment, Supplier, BankAccount } from '../../types.ts';

interface PaymentsSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({ business, autoOpenCreate }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [supplierId, setSupplierId] = useState('');
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
      setSupplierId(suppliers.length > 0 ? suppliers[0].id.toString() : '');
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
      const [payRes, suppRes, bankRes] = await Promise.all([
        api.getPayments(business.id),
        api.getSuppliers(business.id),
        api.getBankAccounts(business.id),
      ]);
      setPayments(payRes.payments || []);
      setSuppliers(suppRes.suppliers || []);
      setBankAccounts(bankRes.accounts || []);
      if (suppRes.suppliers && suppRes.suppliers.length > 0 && !supplierId) {
        setSupplierId(suppRes.suppliers[0].id.toString());
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
    setEditingPayment(null);
    setSupplierId(suppliers.length > 0 ? suppliers[0].id.toString() : '');
    setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setRefNumber('');
    setNotes('');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setSupplierId(payment.supplier_id.toString());
    setBankAccountId(payment.bank_account_id.toString());
    setAmount(payment.amount.toString());
    setPaymentDate(payment.payment_date);
    setRefNumber(payment.reference_number || '');
    setNotes(payment.notes || '');
    setError(null);
    setShowModal(true);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this payment? This will restore the bank account balance and reverse the supplier ledger debit.'
      )
    ) {
      return;
    }

    try {
      await api.deletePayment(business.id, paymentId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment.');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please specify a positive payment amount');
      return;
    }
    if (!supplierId) {
      setError('Please select a supplier');
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
        supplier_id: parseInt(supplierId, 10),
        bank_account_id: parseInt(bankAccountId, 10),
        amount: parseFloat(amount),
        payment_date: paymentDate,
        reference_number: refNumber,
        notes,
      };

      if (editingPayment) {
        await api.updatePayment(business.id, editingPayment.id, payload);
      } else {
        await api.createPayment(business.id, payload);
      }

      setShowModal(false);
      setEditingPayment(null);
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
            <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Supplier Payments & Bank Outflow</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Disburse funds to suppliers, reduce payables in ledger, and withdraw from treasury bank accounts
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="create-payment-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier Payment</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Payment #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier / Payee</th>
                <th className="py-3.5 px-4">Paid From Bank</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {p.payment_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{p.payment_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{p.supplier_name}</td>
                  <td className="py-3.5 px-4 text-slate-700 flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{p.bank_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                    {p.reference_number || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                    {business.currency} {p.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {/* Edit Payment (Requirement #18) */}
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Payment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete Payment (Requirement #18) */}
                    <button
                      onClick={() => handleDeletePayment(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No supplier payments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New / Edit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPayment ? `Edit Payment: ${editingPayment.payment_number}` : 'Create Supplier Payment'}
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
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: {business.currency} {s.current_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Withdraw From Bank Account *
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} – {b.account_title} (Bal: {business.currency}{' '}
                      {b.current_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Amount to Pay ({business.currency}) *
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
                  Cheque / Wire Ref #
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. CHQ-99014"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment remarks"
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
                  {saving ? 'Processing...' : editingPayment ? 'Update Payment & Reconcile' : 'Disburse & Deduct Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
