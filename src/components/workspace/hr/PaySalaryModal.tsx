import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, CreditCard, DollarSign } from 'lucide-react';
import { PayrollItem, BankAccount } from '../../../types.ts';
import { api } from '../../../api.ts';

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaid: () => void;
  businessId: number;
  payrollItem: PayrollItem | null;
  accounts: BankAccount[];
  currency: string;
}

export const PaySalaryModal: React.FC<PaySalaryModalProps> = ({
  isOpen,
  onClose,
  onPaid,
  businessId,
  payrollItem,
  accounts,
  currency,
}) => {
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(String(accounts[0].id));
    }
    if (payrollItem) {
      setReferenceNo(`SAL-${payrollItem.employee_code}-${new Date().toISOString().slice(5, 7)}${new Date().toISOString().slice(8, 10)}`);
      setNotes(`Monthly salary disbursement for ${payrollItem.employee_name}`);
    }
    setError(null);
  }, [isOpen, payrollItem, accounts]);

  if (!isOpen || !payrollItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAccountId) {
      setError('Please select a payment account to disburse funds.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.paySalary(businessId, {
        payroll_item_id: payrollItem.id,
        payment_account_id: parseInt(paymentAccountId, 10),
        payment_method: paymentMethod,
        reference_no: referenceNo,
        notes,
      });
      if (!res.success) throw new Error((res as any).error || 'Failed to disburse salary');
      onPaid();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Disburse Salary Payment</h2>
              <p className="text-xs text-slate-300">
                {payrollItem.employee_name} ({payrollItem.employee_code}) - {payrollItem.department}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Salary Breakdown Summary Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Basic / Rate Earned:</span>
              <span className="font-semibold">{currency} {payrollItem.earned_basic.toLocaleString()}</span>
            </div>
            {payrollItem.overtime_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Overtime ({payrollItem.overtime_hours} hrs):</span>
                <span className="font-semibold">+{currency} {payrollItem.overtime_amount.toLocaleString()}</span>
              </div>
            )}
            {payrollItem.bonus_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Bonuses / Incentives:</span>
                <span className="font-semibold">+{currency} {payrollItem.bonus_amount.toLocaleString()}</span>
              </div>
            )}
            {(payrollItem.kharcha_deduction ?? payrollItem.kharcha_amount ?? 0) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Weekly Advance Deducted:</span>
                <span className="font-semibold">-{currency} {(payrollItem.kharcha_deduction ?? payrollItem.kharcha_amount ?? 0).toLocaleString()}</span>
              </div>
            )}
            {payrollItem.advance_deduction > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>Advance Deducted:</span>
                <span className="font-semibold">-{currency} {payrollItem.advance_deduction.toLocaleString()}</span>
              </div>
            )}
            {payrollItem.absence_deduction > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Absence / Late Cut:</span>
                <span className="font-semibold">-{currency} {payrollItem.absence_deduction.toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Net Payable Salary:</span>
              <span className="text-emerald-600 text-base">{currency} {payrollItem.net_payable.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Disburse From Cash / Bank Account <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="">-- Choose Payment Account --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bank_name} - {acc.account_title} (Available: {currency} {(acc.balance ?? acc.current_balance ?? 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer / Online</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference / Voucher #
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Disbursing...' : 'Confirm & Pay Salary'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
