import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Landmark, Calendar, ShieldCheck } from 'lucide-react';
import { Employee, BankAccount } from '../../../types.ts';
import { api } from '../../../api.ts';

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  employees: Employee[];
  accounts: BankAccount[];
  preselectedEmployee?: Employee | null;
  currency: string;
}

export const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  businessId,
  employees,
  accounts,
  preselectedEmployee,
  currency,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [monthlyDeduction, setMonthlyDeduction] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startMonth, setStartMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reason, setReason] = useState('Personal family requirement');

  useEffect(() => {
    if (preselectedEmployee) {
      setEmployeeId(String(preselectedEmployee.id));
    } else if (employees.length > 0 && !employeeId) {
      setEmployeeId(String(employees[0].id));
    }
    if (accounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(String(accounts[0].id));
    }
    setError(null);
  }, [isOpen, preselectedEmployee, employees, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !advanceAmount || Number(advanceAmount) <= 0) {
      setError('Please select an employee and enter a valid advance amount.');
      return;
    }
    if (!paymentAccountId) {
      setError('Please select a payment account to disburse funds.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createAdvance(businessId, {
        employee_id: parseInt(employeeId, 10),
        advance_amount: parseFloat(advanceAmount),
        monthly_deduction: parseFloat(monthlyDeduction || advanceAmount),
        payment_account_id: parseInt(paymentAccountId, 10),
        payment_method: paymentMethod,
        date,
        start_month: startMonth,
        reason,
      });
      if (!res.success) throw new Error((res as any).error || 'Failed to issue advance');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-inner">
              🤝
            </div>
            <div>
              <h2 className="text-lg font-bold">Issue Employee Advance / Loan</h2>
              <p className="text-xs text-slate-300">
                Track long-term advances and auto-deduct monthly installments from payroll
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code}) - {emp.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advance / Loan Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={advanceAmount}
                onChange={(e) => {
                  setAdvanceAmount(e.target.value);
                  if (!monthlyDeduction) setMonthlyDeduction(e.target.value);
                }}
                placeholder="e.g. 20000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Cut Installment ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={monthlyDeduction}
                onChange={(e) => setMonthlyDeduction(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deductions Start Month <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disburse From Account <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
                <option value="">-- Choose Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.account_title} (Bal: {currency} {(acc.balance ?? acc.current_balance ?? 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer / Online</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Advance Reason / Notes
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical emergency, house construction, wedding advance"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs">
            💡 <strong>Automatic Repayment:</strong> The monthly cut of <strong>{currency} {Number(monthlyDeduction || 0).toLocaleString()}</strong> will automatically deduct on each monthly payroll until the balance reaches 0.
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
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Disbursing...' : 'Disburse Advance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
