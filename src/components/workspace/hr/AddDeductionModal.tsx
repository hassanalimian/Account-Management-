import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShieldAlert } from 'lucide-react';
import { Employee } from '../../../types.ts';
import { api } from '../../../api.ts';

interface AddDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  employees: Employee[];
  preselectedEmployee?: Employee | null;
  currency: string;
}

export const AddDeductionModal: React.FC<AddDeductionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  businessId,
  employees,
  preselectedEmployee,
  currency,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState<string>('');
  const [deductionType, setDeductionType] = useState<'Damage' | 'Loan' | 'Fine' | 'Missing Item' | 'Other'>('Fine');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (preselectedEmployee) {
      setEmployeeId(String(preselectedEmployee.id));
    } else if (employees.length > 0 && !employeeId) {
      setEmployeeId(String(employees[0].id));
    }
    setError(null);
  }, [isOpen, preselectedEmployee, employees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || Number(amount) <= 0) {
      setError('Please select an employee and enter a valid deduction amount.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the deduction.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createOtherDeduction(businessId, {
        employee_id: parseInt(employeeId, 10),
        deduction_type: deductionType,
        amount: parseFloat(amount),
        date,
        reason: reason.trim(),
        payroll_month: date.slice(0, 7),
      });
      if (!res.success) throw new Error((res as any).error || 'Failed to record deduction');
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Salary Deduction / Penalty</h2>
              <p className="text-xs text-slate-300">
                Tool damage, missing inventory, late penalties, or disciplinary fines
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
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
                Deduction Type
              </label>
              <select
                value={deductionType}
                onChange={(e) => setDeductionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
              >
                <option value="Fine">Disciplinary Fine</option>
                <option value="Damage">Equipment / Machine Damage</option>
                <option value="Missing Item">Missing Tool / Raw Material</option>
                <option value="Loan">Special Loan Deduction</option>
                <option value="Other">Other Deduction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deduction Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-rose-700 focus:bg-white focus:border-rose-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken lathe cutting blade due to negligence"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
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
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Applying...' : 'Apply Deduction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
