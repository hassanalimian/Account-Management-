import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Clock, DollarSign, Award, AlertTriangle, ShieldCheck, Briefcase } from 'lucide-react';
import { Employee } from '../../../types.ts';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currency: string;
  onEdit: (emp: Employee) => void;
  onAction: (action: string, emp: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  currency,
  onEdit,
  onAction,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/90 border-2 border-indigo-400/40 flex items-center justify-center text-white shadow-xl text-xl font-bold">
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                employee.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{employee.name}</h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    employee.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {employee.status}
                </span>
              </div>
              <p className="text-xs text-indigo-200 flex items-center space-x-2 mt-0.5">
                <span className="font-mono bg-indigo-900/80 px-1.5 py-0.5 rounded border border-indigo-700/50">
                  {employee.employee_code}
                </span>
                <span>•</span>
                <span>{employee.designation}</span>
                <span>•</span>
                <span className="text-slate-300">{employee.department}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase">
                {employee.salary_type === 'monthly' ? 'Basic Salary' : 'Daily Rate'}
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {currency} {((employee.salary_type === 'monthly' ? employee.monthly_salary : employee.daily_rate) || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 capitalize">
                {employee.salary_type === 'monthly' ? 'Fixed monthly' : 'Per day rate'}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Employment</span>
              <p className="text-sm font-bold text-slate-900 mt-1 capitalize">
                {employee.employment_type?.replace('_', ' ')}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium capitalize">
                {employee.job_status || 'Confirmed'}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-700 uppercase">Overtime</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {employee.overtime_enabled ? 'Enabled' : 'Disabled'}
              </p>
              <span className="text-[10px] text-amber-700 truncate block">
                {employee.overtime_rate_type === 'fixed_hourly'
                  ? `${currency} ${employee.overtime_hourly_rate}/hr`
                  : 'Salary formula'}
              </span>
            </div>

            <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
              <span className="text-[11px] font-semibold text-purple-700 uppercase">Std Schedule</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {employee.standard_hours_per_day || 8} hrs / day
              </p>
              <span className="text-[10px] text-purple-600">
                Off: {employee.weekly_off_day || 'Sunday'}
              </span>
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5 pb-1 border-b border-slate-200">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Personal Information</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Father's Name:</span>
                <span className="font-semibold text-slate-800">{employee.father_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">CNIC / ID:</span>
                <span className="font-mono font-semibold text-slate-800">{employee.cnic || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800">{employee.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-800">{employee.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency:</span>
                <span className="font-semibold text-rose-700">{employee.emergency_contact || '—'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5 pb-1 border-b border-slate-200">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Job & Salary Rules</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joining Date:</span>
                <span className="font-semibold text-slate-800">{employee.join_date || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{employee.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Absence Rule:</span>
                <span className="capitalize font-semibold text-slate-800">
                  {employee.absence_deduction_rule?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Short Hours Cut:</span>
                <span className="capitalize font-semibold text-slate-800">
                  {employee.short_hours_rule || 'hourly'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-800 truncate max-w-[180px]">{employee.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Direct HR Operations for this Employee
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onAction('kharcha', employee);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>💸 Weekly Advance Salary</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAction('advance', employee);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>🤝 Disburse Advance</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAction('bonus', employee);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>⭐ Give Bonus</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAction('statement', employee);
                }}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>📄 View Statement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onEdit(employee);
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Edit Employee Record
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
