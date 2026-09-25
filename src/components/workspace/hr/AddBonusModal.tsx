import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Award, Users, DollarSign } from 'lucide-react';
import { Employee, BankAccount } from '../../../types.ts';
import { api } from '../../../api.ts';

interface AddBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  employees: Employee[];
  accounts: BankAccount[];
  preselectedEmployee?: Employee | null;
  currency: string;
}

export const AddBonusModal: React.FC<AddBonusModalProps> = ({
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

  // Single form
  const [employeeId, setEmployeeId] = useState<string>('');
  const [bonusType, setBonusType] = useState('Eid Bonus');
  const [amount, setAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('Annual festive celebration bonus');

  // Bulk form
  const [bulkRows, setBulkRows] = useState<{ employeeId: number; amount: string }[]>([]);
  const [bulkBonusType, setBulkBonusType] = useState('Eid Bonus');
  const [bulkAccountId, setBulkAccountId] = useState<string>('');
  const [bulkMethod, setBulkMethod] = useState<'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));
  const [bulkCommonAmount, setBulkCommonAmount] = useState('');

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

    const activeEmps = employees.filter((e) => e.status === 'active');
    setBulkRows(activeEmps.map((e) => ({ employeeId: e.id, amount: '' })));
    setError(null);
  }, [isOpen, preselectedEmployee, employees, accounts]);

  const applyCommonToAll = () => {
    if (!bulkCommonAmount) return;
    setBulkRows((prev) => prev.map((r) => ({ ...r, amount: bulkCommonAmount })));
  };

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || Number(amount) <= 0) {
      setError('Please select an employee and enter a valid bonus amount.');
      return;
    }
    if (!paymentAccountId) {
      setError('Please select a payment account.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createBonus(businessId, {
        employee_id: parseInt(employeeId, 10),
        bonus_type: bonusType,
        amount: parseFloat(amount),
        payment_account_id: parseInt(paymentAccountId, 10),
        payment_method: paymentMethod,
        date,
        note,
        payroll_month: date.slice(0, 7),
      });
      if (!res.success) throw new Error((res as any).error || 'Failed to issue bonus');
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
        bonus_type: bulkBonusType,
        amount: parseFloat(r.amount),
        payment_account_id: parseInt(bulkAccountId, 10),
        payment_method: bulkMethod,
        note: `Bulk ${bulkBonusType}`,
        date: bulkDate,
      }));

    if (validItems.length === 0) {
      setError('Please enter bonus amounts for employees.');
      return;
    }
    if (!bulkAccountId) {
      setError('Please select a payment account.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createBulkBonus(businessId, { items: validItems });
      if (!res.success) throw new Error((res as any).error || 'Failed to disburse bulk bonus');
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
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-inner">
              ⭐
            </div>
            <div>
              <h2 className="text-lg font-bold">Disburse Employee Bonus & Allowance</h2>
              <p className="text-xs text-slate-300">
                Performance incentives, Eid bonus, overtime rewards & special allowances
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
              mode === 'single' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Single Employee Bonus</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              mode === 'bulk' ? 'border-emerald-600 text-emerald-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bulk Company-Wide Bonus (e.g. Eid)</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                  Bonus Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bonusType}
                  onChange={(e) => setBonusType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Eid Bonus">Eid Bonus</option>
                  <option value="Performance Bonus">Performance Bonus</option>
                  <option value="Production Incentive">Production Incentive</option>
                  <option value="Annual Bonus">Annual Bonus</option>
                  <option value="Special Allowance">Special Allowance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bonus Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
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
                  Disbursement Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For outstanding performance on project XYZ"
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
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Disbursing...' : 'Disburse Bonus'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bonus Occasion</label>
                <select
                  value={bulkBonusType}
                  onChange={(e) => setBulkBonusType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Eid Bonus">Eid Bonus</option>
                  <option value="Quarterly Performance">Quarterly Performance</option>
                  <option value="Annual Bonus">Annual Bonus</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Disburse From</label>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-xs text-emerald-900 font-medium">Quick Fill Same Amount to All:</span>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={bulkCommonAmount}
                  onChange={(e) => setBulkCommonAmount(e.target.value)}
                  className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded text-xs"
                />
                <button
                  type="button"
                  onClick={applyCommonToAll}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Apply to All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2 w-36">Bonus Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((row, idx) => {
                    const emp = employees.find((e) => e.id === row.employeeId);
                    return (
                      <tr key={row.employeeId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {emp?.name} <span className="text-[10px] text-slate-400 font-mono">({emp?.employee_code})</span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{emp?.department}</td>
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
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:border-emerald-500 focus:outline-none"
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Disbursing...' : 'Disburse Bulk Bonus'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
