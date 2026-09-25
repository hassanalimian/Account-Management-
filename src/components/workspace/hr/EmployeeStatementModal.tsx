import React, { useState, useEffect } from 'react';
import { X, Printer, Calendar, RefreshCw, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Employee, Business } from '../../../types.ts';
import { api } from '../../../api.ts';

interface EmployeeStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  business: Business;
}

export const EmployeeStatementModal: React.FC<EmployeeStatementModalProps> = ({
  isOpen,
  onClose,
  employee,
  business,
}) => {
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statementData, setStatementData] = useState<{
    summary: { total_earned: number; total_paid: number; total_kharcha: number; advance_balance: number; net_balance: number };
    transactions: any[];
  } | null>(null);

  const currency = business.currency || 'PKR';

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'salary_earned':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Salary Earned</span>;
      case 'daily_wage':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Daily Wage</span>;
      case 'salary_paid':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Salary Payment</span>;
      case 'overtime':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Overtime</span>;
      case 'kharcha':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kharcha</span>;
      case 'advance':
      case 'advance_given':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Advance</span>;
      case 'advance_deduction':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Advance Deduction</span>;
      case 'bonus':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Bonus</span>;
      case 'other_addition':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Other Addition</span>;
      case 'other_deduction':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Other Deduction</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  const fetchStatement = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const data = await api.getEmployeeStatement(business.id, employee.id, fromDate, toDate);
      setStatementData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employee) {
      fetchStatement();
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Employee Financial Statement & Ledger</h2>
              <p className="text-xs text-slate-300">
                {employee.name} ({employee.employee_code}) - {employee.designation}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">From Date:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
            <span className="font-semibold text-slate-600">To Date:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
            <button
              onClick={fetchStatement}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0">
          {/* Printable Header */}
          <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase">{business.name}</h1>
              <p className="text-xs text-slate-600">{business.address}, {business.city}</p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">EMPLOYEE STATEMENT OF ACCOUNT</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-800">Employee: {employee.name}</p>
              <p className="font-mono text-indigo-700 font-semibold">{employee.employee_code} | {employee.designation}</p>
              <p className="text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {statementData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Total Earned</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currency} {statementData.summary.total_earned.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Paid Out</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currency} {statementData.summary.total_paid.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Weekly Advance Salary</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currency} {statementData.summary.total_kharcha.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Advance Outstanding</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currency} {statementData.summary.advance_balance.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Type / Category</th>
                  <th className="px-3.5 py-2.5">Description & Reference</th>
                  <th className="px-3.5 py-2.5 text-right">Debit (-)</th>
                  <th className="px-3.5 py-2.5 text-right">Credit (+)</th>
                  <th className="px-3.5 py-2.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {statementData?.transactions && statementData.transactions.length > 0 ? (
                  statementData.transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-600 font-mono whitespace-nowrap">{tx.date}</td>
                      <td className="px-3.5 py-2.5">
                        {getTypeBadge(tx.type)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">{tx.description}</td>
                      <td className="px-3.5 py-2.5 text-right text-rose-600 font-mono font-semibold">
                        {tx.debit > 0 ? `${currency} ${tx.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-emerald-600 font-mono font-semibold">
                        {tx.credit > 0 ? `${currency} ${tx.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                        {currency} {tx.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      {loading ? 'Compiling financial ledger...' : 'No statement activity found for this period.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
