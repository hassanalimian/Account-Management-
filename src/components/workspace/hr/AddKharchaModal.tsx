import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, DollarSign, Wallet, Users, Plus, Check } from 'lucide-react';
import { Employee, BankAccount } from '../../../types.ts';
import { api } from '../../../api.ts';

interface AddKharchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  employees: Employee[];
  accounts: BankAccount[];
  preselectedEmployee?: Employee | null;
  currency: string;
}

export const AddKharchaModal: React.FC<AddKharchaModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  businessId,
  employees,
  accounts,
  preselectedEmployee,
  currency,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single form state
  const [employeeId, setEmployeeId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('Daily Food & Tea allowance');
  const [referenceNo, setReferenceNo] = useState('');

  // Bulk form state
  const [bulkRows, setBulkRows] = useState<{ employeeId: number; amount: string; note: string }[]>([]);
  const [bulkAccountId, setBulkAccountId] = useState<string>('');
  const [bulkMethod, setBulkMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (preselectedEmployee) {
      setEmployeeId(String(preselectedEmployee.id));
    } else if (employees.length > 0 && !employeeId) {
      setEmployeeId(String(employees[0].id));
    }

    if (accounts.length > 0) {
      if (!paymentAccountId) setPaymentAccountId(String(accounts[0].id));
      if (!bulkAccountId) setBulkAccountId(String(accounts[0].id));
    }

    // Initialize bulk rows for active employees
    const activeEmps = employees.filter((e) => e.status === 'active');
    setBulkRows(
      activeEmps.map((e) => ({
        employeeId: e.id,
        amount: '',
        note: 'Weekly Advance Salary',
      }))
    );
    setError(null);
  }, [isOpen, preselectedEmployee, employees, accounts]);

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || Number(amount) <= 0) {
      setError('Please select an employee and enter a valid amount.');
      return;
    }
    if (!paymentAccountId) {
      setError('Please select a payment account to disburse funds.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createKharcha(businessId, {
        employee_id: parseInt(employeeId, 10),
        amount: parseFloat(amount),
        payment_account_id: parseInt(paymentAccountId, 10),
        payment_method: paymentMethod,
        date,
        description,
        reference_no: referenceNo,
        payroll_month: date.slice(0, 7),
      });
      if (!res.success) throw new Error((res as any).error || 'Failed to record weekly advance salary');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = bulkRows
      .filter((r) => r.amount && Number(r.amount) > 0)
      .map((r) => ({
        employee_id: r.employeeId,
        amount: parseFloat(r.amount),
        payment_account_id: parseInt(bulkAccountId, 10),
        payment_method: bulkMethod,
        note: r.note || 'Bulk weekly advance salary',
        date: bulkDate,
      }));

    if (validItems.length === 0) {
      setError('Please enter an amount for at least one employee.');
      return;
    }

    if (!bulkAccountId) {
      setError('Please select a payment account.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createBulkKharcha(businessId, { items: validItems });
      if (!res.success) throw new Error((res as any).error || 'Failed to record bulk weekly advance salary');
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
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-inner text-base">
              💸
            </div>
            <div>
              <h2 className="text-lg font-bold">Weekly Advance Salary</h2>
              <p className="text-xs text-slate-300">
                Direct cash/bank payout to staff that automatically deducts from monthly salary
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              mode === 'single' ? 'border-amber-600 text-amber-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Single Employee Weekly Advance</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              mode === 'bulk' ? 'border-amber-600 text-amber-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bulk / Team Weekly Advance Salary</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* SINGLE WEEKLY ADVANCE SALARY FORM */}
        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code}) - {emp.designation} [{emp.department}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Weekly Advance Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pay From Cash / Bank Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Weekly staff advance / food allowance"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
              <span>💡</span>
              <span>
                This payment immediately updates the selected Cash/Bank balance and is automatically deducted from monthly salary during payroll compilation.
              </span>
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
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Recording...' : 'Disburse Weekly Advance Salary'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* BULK WEEKLY ADVANCE FORM */
          <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pay From Account</label>
                <select
                  value={bulkAccountId}
                  onChange={(e) => setBulkAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} ({currency} {(acc.balance ?? acc.current_balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={bulkMethod}
                  onChange={(e) => setBulkMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2 w-36">Advance ({currency})</th>
                    <th className="px-3 py-2">Note / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((row, idx) => {
                    const emp = employees.find((e) => e.id === row.employeeId);
                    return (
                      <tr key={row.employeeId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {emp?.name} <span className="text-[10px] text-slate-400">({emp?.employee_code})</span>
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            placeholder="0"
                            value={row.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, amount: val } : r))
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, note: val } : r))
                              );
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Processing...' : 'Disburse Bulk Weekly Advance Salary'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
