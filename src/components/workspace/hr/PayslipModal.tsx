import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { PayrollItem, Business } from '../../../types.ts';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollItem: PayrollItem | null;
  business: Business;
  month: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  payrollItem,
  business,
  month,
}) => {
  if (!isOpen || !payrollItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = business.currency || 'PKR';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Action Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">Salary Pay Slip & Payment Voucher</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white text-slate-900 font-sans print:p-0">
          {/* Company Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {business.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{business.address || 'Industrial Zone'}, {business.city}</p>
              <p className="text-xs text-slate-600">Phone: {business.phone} | Email: {business.email}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider">
                Salary Pay Slip
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1 font-mono">Period: {month}</p>
              <p className="text-[11px] text-slate-500 font-mono">Date: {payrollItem.paid_date || new Date().toISOString().slice(0, 10)}</p>
            </div>
          </div>

          {/* Employee & Job Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500">Employee Name:</span>
                <span className="font-bold text-slate-900">{payrollItem.employee_name}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-indigo-700">{payrollItem.employee_code}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Designation:</span>
                <span className="font-semibold text-slate-800">{payrollItem.department} Staff</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500">Salary Type:</span>
                <span className="font-bold capitalize text-slate-900">{payrollItem.salary_type.replace('_', ' ')}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Days / Hours:</span>
                <span className="font-semibold text-slate-800">{payrollItem.working_days} Days ({payrollItem.worked_hours} Hours)</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Payment Status:</span>
                <span className="font-bold uppercase text-emerald-600">{payrollItem.status}</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200">
                Gross Earnings
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Basic / Rate Wages:</td>
                    <td className="px-3 py-2 text-right font-semibold">{currency} {payrollItem.earned_basic.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Overtime ({payrollItem.overtime_hours} hrs):</td>
                    <td className="px-3 py-2 text-right font-semibold">{currency} {payrollItem.overtime_amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Bonuses & Allowances:</td>
                    <td className="px-3 py-2 text-right font-semibold">{currency} {payrollItem.bonus_amount.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="px-3 py-2">Total Gross Earnings:</td>
                    <td className="px-3 py-2 text-right text-indigo-700">{currency} {(payrollItem.gross_salary ?? payrollItem.gross_amount ?? 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200">
                Deductions & Offsets
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Weekly Advance Salary Deductions:</td>
                    <td className="px-3 py-2 text-right font-semibold text-amber-700">{currency} {(payrollItem.kharcha_deduction ?? payrollItem.kharcha_amount ?? 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Advance Installment:</td>
                    <td className="px-3 py-2 text-right font-semibold text-purple-700">{currency} {payrollItem.advance_deduction.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Absence & Short Hours Cut:</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-600">{currency} {(payrollItem.absence_deduction + payrollItem.short_hours_deduction).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600">Other Deductions / Fines:</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-600">{currency} {payrollItem.other_deductions.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="px-3 py-2">Total Deductions:</td>
                    <td className="px-3 py-2 text-right text-rose-600">{currency} {(payrollItem.total_deductions ?? ((payrollItem.kharcha_deduction ?? payrollItem.kharcha_amount ?? 0) + payrollItem.advance_deduction + payrollItem.absence_deduction + payrollItem.short_hours_deduction + payrollItem.other_deductions)).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* NET PAYABLE HIGHLIGHT */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Net Salary Paid</span>
              <p className="text-xs text-slate-300">Method: {payrollItem.payment_method || 'Bank Transfer'} | Ref: {payrollItem.reference_no || 'Direct Payroll'}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                {currency} {payrollItem.net_payable.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-800">Employer / Authorized Signature</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Accountant & Management</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center">
              <p className="font-bold text-slate-800">Employee Signature</p>
              <p className="text-[10px] text-slate-400 mt-0.5">I acknowledge receipt of the stated amount</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
