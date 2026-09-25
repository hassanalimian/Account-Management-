import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Calendar,
  DollarSign,
  Clock,
  Search,
  Filter,
  CreditCard,
  Plus,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Building,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileText,
  Landmark,
  Coins,
  ChevronDown,
  ChevronRight,
  Check,
  Award,
} from 'lucide-react';
import {
  Business,
  Employee,
  AttendanceRecord,
  PublicHoliday,
  KharchaRecord,
  AdvanceRecord,
  BonusRecord,
  OtherDeductionRecord,
  MonthlyPayroll,
  PayrollItem,
  BankAccount,
} from '../../types.ts';
import { api } from '../../api.ts';
import { EmployeeModal } from './hr/EmployeeModal.tsx';
import { EmployeeDetailModal } from './hr/EmployeeDetailModal.tsx';
import { AddKharchaModal } from './hr/AddKharchaModal.tsx';
import { AddAdvanceModal } from './hr/AddAdvanceModal.tsx';
import { AddBonusModal } from './hr/AddBonusModal.tsx';
import { AddDeductionModal } from './hr/AddDeductionModal.tsx';
import { PaySalaryModal } from './hr/PaySalaryModal.tsx';
import { PayslipModal } from './hr/PayslipModal.tsx';
import { EmployeeStatementModal } from './hr/EmployeeStatementModal.tsx';
import { PublicHolidayModal } from './hr/PublicHolidayModal.tsx';

interface HRManagementSectionProps {
  business: Business;
}

export const HRManagementSection: React.FC<HRManagementSectionProps> = ({ business }) => {
  const currency = business.currency || 'PKR';
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Active top-level subtab
  const [activeTab, setActiveTab] = useState<
    'employees' | 'attendance' | 'payroll' | 'kharcha' | 'advances' | 'bonuses' | 'deductions' | 'holidays' | 'audit'
  >('employees');

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [kharchas, setKharchas] = useState<KharchaRecord[]>([]);
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionRecord[]>([]);
  const [hrSummary, setHrSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Attendance Tab State
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [attEditing, setAttEditing] = useState<Record<number, Partial<AttendanceRecord>>>({});
  const [attSaving, setAttSaving] = useState(false);

  // Payroll Tab State
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [currentPayroll, setCurrentPayroll] = useState<MonthlyPayroll | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [payrollCalculating, setPayrollCalculating] = useState(false);

  // Employee Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterEmploymentType, setFilterEmploymentType] = useState('all');
  const [filterSalaryType, setFilterSalaryType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals Control State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

  const [showKharchaModal, setShowKharchaModal] = useState(false);
  const [targetEmployeeForKharcha, setTargetEmployeeForKharcha] = useState<Employee | null>(null);

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetEmployeeForAdvance, setTargetEmployeeForAdvance] = useState<Employee | null>(null);

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [targetEmployeeForBonus, setTargetEmployeeForBonus] = useState<Employee | null>(null);

  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [targetEmployeeForDeduction, setTargetEmployeeForDeduction] = useState<Employee | null>(null);

  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
  const [targetPayrollItemForPay, setTargetPayrollItemForPay] = useState<PayrollItem | null>(null);

  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [targetPayrollItemForSlip, setTargetPayrollItemForSlip] = useState<PayrollItem | null>(null);

  const [showStatementModal, setShowStatementModal] = useState(false);
  const [targetEmployeeForStatement, setTargetEmployeeForStatement] = useState<Employee | null>(null);

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayToEdit, setHolidayToEdit] = useState<PublicHoliday | null>(null);

  // Bulk Salary Disbursement Modal
  const [showBulkPayModal, setShowBulkPayModal] = useState(false);
  const [bulkPayAccountId, setBulkPayAccountId] = useState('');
  const [bulkPayMethod, setBulkPayMethod] = useState<'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [bulkPaySubmitting, setBulkPaySubmitting] = useState(false);

  // Notification helper
  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Main data loader
  const loadAllHRData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        empRes,
        accRes,
        holRes,
        kharchaRes,
        advRes,
        bonusRes,
        dedRes,
        payrollRes,
        sumRes,
        logsRes,
      ] = await Promise.all([
        api.getEmployees(business.id).catch(() => ({ employees: [] })),
        (api.getAccounts ? api.getAccounts(business.id) : api.getBankAccounts(business.id)).catch(() => ({ accounts: [] })),
        api.getPublicHolidays(business.id).catch(() => ({ holidays: [] })),
        api.getKharchas(business.id).catch(() => ({ kharchas: [] })),
        api.getAdvances(business.id).catch(() => ({ advances: [] })),
        api.getBonuses(business.id).catch(() => ({ bonuses: [] })),
        api.getOtherDeductions(business.id).catch(() => ({ deductions: [] })),
        api.getMonthlyPayroll(business.id, selectedMonth).catch(() => ({ payroll: null, items: [] })),
        api.getHRSummary(business.id, selectedMonth).catch(() => null),
        api.getHRAuditLogs(business.id).catch(() => ({ logs: [] })),
      ]);

      const empList: Employee[] = empRes.employees || [];
      setEmployees(empList);
      setAccounts(accRes.accounts || []);
      setHolidays(holRes.holidays || []);
      setKharchas(kharchaRes.kharchas || []);
      setAdvances(advRes.advances || []);
      setBonuses(bonusRes.bonuses || []);
      setOtherDeductions(dedRes.deductions || []);
      setCurrentPayroll(payrollRes.payroll || null);
      setPayrollItems(payrollRes.items || []);
      setHrSummary(sumRes);
      setAuditLogs(logsRes.logs || []);

      if (accRes.accounts?.length > 0 && !bulkPayAccountId) {
        setBulkPayAccountId(String(accRes.accounts[0].id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load HR data.');
    } finally {
      setLoading(false);
    }
  };

  // Load Attendances whenever date changes
  const loadDailyAttendance = async () => {
    try {
      const res = await api.getAttendances(business.id, undefined, attDate);
      const list: AttendanceRecord[] = res.attendances || [];
      setAttendances(list);

      // Pre-populate editing map
      const initialMap: Record<number, Partial<AttendanceRecord>> = {};
      employees.forEach((emp) => {
        const existing = list.find((a) => a.employee_id === emp.id);
        if (existing) {
          initialMap[emp.id] = { ...existing };
        } else {
          initialMap[emp.id] = {
            employee_id: emp.id,
            date: attDate,
            status: 'present',
            standard_hours: emp.salary_type === 'monthly' ? emp.standard_hours_per_day : emp.daily_standard_hours,
            worked_hours: emp.salary_type === 'monthly' ? emp.standard_hours_per_day : emp.daily_standard_hours,
            overtime_hours: 0,
            short_hours: 0,
            notes: '',
          };
        }
      });
      setAttEditing(initialMap);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Payroll whenever selectedMonth changes
  const loadPayrollForMonth = async () => {
    setPayrollCalculating(true);
    try {
      const res = await api.getMonthlyPayroll(business.id, selectedMonth);
      setCurrentPayroll(res.payroll || null);
      setPayrollItems(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPayrollCalculating(false);
    }
  };

  useEffect(() => {
    loadAllHRData();
  }, [business.id]);

  useEffect(() => {
    if (employees.length > 0) {
      loadDailyAttendance();
    }
  }, [business.id, attDate, employees.length]);

  useEffect(() => {
    loadPayrollForMonth();
  }, [business.id, selectedMonth]);

  // Recalculate Monthly Payroll
  const handleCalculatePayroll = async () => {
    setPayrollCalculating(true);
    try {
      const res = await api.calculatePayroll(business.id, selectedMonth);
      if (res.success) {
        setCurrentPayroll(res.payroll);
        setPayrollItems(res.items || []);
        notify(`Payroll for ${selectedMonth} compiled successfully!`);
        // Refresh HR summary
        api.getHRSummary(business.id, selectedMonth).then(setHrSummary);
      } else {
        setError((res as any).error || 'Failed to calculate payroll');
      }
    } catch (err: any) {
      setError(err.message || 'Payroll compilation error');
    } finally {
      setPayrollCalculating(false);
    }
  };

  // Finalize / Reopen Payroll
  const handleFinalizePayroll = async () => {
    try {
      const res = await api.finalizePayroll(business.id, selectedMonth);
      if (res.success) {
        setCurrentPayroll(res.payroll);
        notify(`Payroll for ${selectedMonth} is now finalized.`);
      }
    } catch (err: any) {
      setError(err.message || 'Finalization error');
    }
  };

  const handleReopenPayroll = async () => {
    try {
      const res = await api.reopenPayroll(business.id, selectedMonth);
      if (res.success) {
        setCurrentPayroll(res.payroll);
        notify(`Payroll for ${selectedMonth} reopened for adjustments.`);
      }
    } catch (err: any) {
      setError(err.message || 'Reopen error');
    }
  };

  // Bulk Mark All Present
  const handleMarkAllPresent = () => {
    const updated = { ...attEditing };
    employees.forEach((emp) => {
      const std = emp.salary_type === 'monthly' ? (emp.standard_hours_per_day || 8) : (emp.daily_standard_hours || 8);
      updated[emp.id] = {
        ...updated[emp.id],
        status: 'present',
        standard_hours: std,
        worked_hours: std,
        overtime_hours: 0,
        short_hours: 0,
      };
    });
    setAttEditing(updated);
  };

  // Save Bulk Attendance Sheet
  const handleSaveAttendanceSheet = async () => {
    setAttSaving(true);
    try {
      const recordsToSave = Object.values(attEditing).map((r) => ({
        employee_id: r.employee_id,
        status: r.status || 'present',
        check_in: r.check_in,
        check_out: r.check_out,
        worked_hours: r.worked_hours,
        overtime_hours: r.overtime_hours,
        short_hours: r.short_hours,
        notes: r.notes,
      }));

      const res = await api.saveBulkAttendance(business.id, {
        date: attDate,
        records: recordsToSave,
      });

      if (res.success) {
        notify(`Attendance sheet for ${attDate} saved! (${res.count} records)`);
        loadDailyAttendance();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setAttSaving(false);
    }
  };

  // Bulk Salary Disbursement
  const handleExecuteBulkSalaryPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPayAccountId) {
      setError('Please select a payment account.');
      return;
    }
    const unpaidItems = payrollItems.filter((i) => i.status !== 'paid');
    if (unpaidItems.length === 0) {
      setError('All employee salaries for this month are already paid.');
      return;
    }

    setBulkPaySubmitting(true);
    try {
      const res = await api.payBulkSalaries(business.id, {
        month: selectedMonth,
        payment_account_id: parseInt(bulkPayAccountId, 10),
        payment_method: bulkPayMethod,
        item_ids: unpaidItems.map((i) => i.id),
      });

      if (res.success) {
        notify(`Successfully disbursed ${res.count} salaries totaling ${currency} ${res.totalPaid?.toLocaleString()}!`);
        setShowBulkPayModal(false);
        loadAllHRData();
      }
    } catch (err: any) {
      setError(err.message || 'Bulk salary payment failed');
    } finally {
      setBulkPaySubmitting(false);
    }
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchCode = (emp.employee_code || '').toLowerCase().includes(q);
        const matchDesignation = (emp.designation || '').toLowerCase().includes(q);
        const matchPhone = (emp.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesignation && !matchPhone) return false;
      }

      if (filterDepartment !== 'all' && emp.department !== filterDepartment) return false;
      if (filterEmploymentType !== 'all' && emp.employment_type !== filterEmploymentType) return false;
      if (filterSalaryType !== 'all' && emp.salary_type !== filterSalaryType) return false;
      if (filterStatus !== 'all' && emp.status !== filterStatus) return false;

      return true;
    });
  }, [employees, searchQuery, filterDepartment, filterEmploymentType, filterSalaryType, filterStatus]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Direct row action dispatcher from Employee list
  const handleEmployeeAction = (action: string, emp: Employee) => {
    switch (action) {
      case 'view':
        setSelectedEmployeeForDetail(emp);
        setShowDetailModal(true);
        break;
      case 'edit':
        setEmployeeToEdit(emp);
        setShowEmployeeModal(true);
        break;
      case 'attendance':
        setActiveTab('attendance');
        break;
      case 'payroll':
        setActiveTab('payroll');
        break;
      case 'kharcha':
        setTargetEmployeeForKharcha(emp);
        setShowKharchaModal(true);
        break;
      case 'advance':
        setTargetEmployeeForAdvance(emp);
        setShowAdvanceModal(true);
        break;
      case 'bonus':
        setTargetEmployeeForBonus(emp);
        setShowBonusModal(true);
        break;
      case 'deductions':
        setTargetEmployeeForDeduction(emp);
        setShowDeductionModal(true);
        break;
      case 'statement':
        setTargetEmployeeForStatement(emp);
        setShowStatementModal(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & PRIMARY CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">HR Management</h1>
              <p className="text-xs text-slate-500 font-medium">
                Integrated Employees, Daily Attendance, Overtime, Weekly Advance Salary, Advances & Monthly Payroll
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEmployeeToEdit(null);
              setShowEmployeeModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>

          <button
            onClick={() => {
              setTargetEmployeeForKharcha(null);
              setShowKharchaModal(true);
            }}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>💸 Weekly Advance Salary</span>
          </button>

          <button
            onClick={() => {
              setTargetEmployeeForAdvance(null);
              setShowAdvanceModal(true);
            }}
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>🤝 Staff Advance</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('payroll');
              handleCalculatePayroll();
            }}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            &times;
          </button>
        </div>
      )}

      {/* TOP KPI CARDS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Staff
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {hrSummary?.total_employees || employees.length}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {hrSummary?.active_employees || employees.filter((e) => e.status === 'active').length} Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Monthly Base Salary
          </span>
          <p className="text-xl font-bold text-indigo-700 mt-1">
            {currency} {(hrSummary?.total_monthly_basic || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Standard liability</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Weekly Advance Salary
          </span>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {currency} {(hrSummary?.current_month_kharcha || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">Deducted from salary</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Advances
          </span>
          <p className="text-xl font-bold text-purple-700 mt-1">
            {currency} {(hrSummary?.total_advances_outstanding || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-purple-600 font-medium block mt-0.5">Outstanding balance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Bonuses / Rewards
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {currency} {(hrSummary?.current_month_bonus || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Paid this month</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Net Payroll ({selectedMonth})
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {currency} {(currentPayroll?.total_net || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5 capitalize">
            {currentPayroll?.status || 'Draft'}
          </span>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'employees'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employees ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance & Overtime</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Monthly Payroll & Slips</span>
        </button>

        <button
          onClick={() => setActiveTab('kharcha')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'kharcha'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>💸 Weekly Advance Salary</span>
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'advances'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>🤝 Staff Advances</span>
        </button>

        <button
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'bonuses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>⭐ Bonuses & Allowances</span>
        </button>

        <button
          onClick={() => setActiveTab('deductions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'deductions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Fines & Damages</span>
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'holidays'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Public Holidays</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>HR Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filters & Search Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 min-w-[240px] items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee name, code, phone, designation..."
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs">
                  &times;
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Department */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>

              {/* Employment Type */}
              <select
                value={filterEmploymentType}
                onChange={(e) => setFilterEmploymentType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
                <option value="daily_worker">Daily Worker</option>
                <option value="contract">Contract</option>
              </select>

              {/* Salary Type */}
              <select
                value={filterSalaryType}
                onChange={(e) => setFilterSalaryType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Salary Types</option>
                <option value="monthly">Monthly Salary</option>
                <option value="daily_wage">Daily Wage</option>
              </select>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print List</span>
              </button>
            </div>
          </div>

          {/* Master Employee Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-3 py-3.5">Designation & Dept</th>
                    <th className="px-3 py-3.5">Employment & Pay</th>
                    <th className="px-3 py-3.5">Basic / Rate</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5">Joining / Contact</th>
                    <th className="px-3 py-3.5 text-right">Weekly Adv. (Cur.)</th>
                    <th className="px-3 py-3.5 text-right">Adv. Bal</th>
                    <th className="px-4 py-3.5 text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => {
                      // Compute current month kharcha for this employee
                      const empKharchas = kharchas.filter(
                        (k) => k.employee_id === emp.id && (k.payroll_month === currentMonthStr || k.date.startsWith(currentMonthStr))
                      );
                      const currentMonthKharchaTotal = empKharchas.reduce((s, k) => s + k.amount, 0);

                      // Compute active advance balance
                      const empAdvances = advances.filter(
                        (a) => a.employee_id === emp.id && a.status === 'active'
                      );
                      const outstandingAdvTotal = empAdvances.reduce((s, a) => s + a.remaining_balance, 0);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Employee Name & Avatar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-indigo-700 shrink-0 text-xs shadow-xs">
                                {emp.photo ? (
                                  <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  emp.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => handleEmployeeAction('view', emp)}>
                                  {emp.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1.5">
                                  <span>{emp.employee_code}</span>
                                  {emp.father_name && <span>• s/o {emp.father_name}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Designation & Dept */}
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-800">{emp.designation}</div>
                            <div className="text-[11px] text-slate-500">{emp.department}</div>
                          </td>

                          {/* Employment & Salary Type */}
                          <td className="px-3 py-3">
                            <span className="capitalize font-semibold text-slate-700 block text-[11px]">
                              {emp.employment_type?.replace('_', ' ')}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              emp.salary_type === 'monthly' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {emp.salary_type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}
                            </span>
                          </td>

                          {/* Basic / Daily Rate */}
                          <td className="px-3 py-3 font-bold text-slate-900 font-mono">
                            {currency} {((emp.salary_type === 'monthly' ? emp.monthly_salary : emp.daily_rate) || 0).toLocaleString()}
                            <span className="block text-[10px] font-normal text-slate-400">
                              {emp.salary_type === 'monthly' ? '/ month' : '/ day'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                emp.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {emp.status}
                            </span>
                          </td>

                          {/* Contact & Join Date */}
                          <td className="px-3 py-3 text-slate-600">
                            <div>{emp.phone || '—'}</div>
                            <div className="text-[10px] text-slate-400">Joined: {emp.join_date || '—'}</div>
                          </td>

                          {/* Current Month Kharcha */}
                          <td className="px-3 py-3 text-right font-mono font-semibold text-amber-700">
                            {currentMonthKharchaTotal > 0 ? `${currency} ${currentMonthKharchaTotal.toLocaleString()}` : '—'}
                          </td>

                          {/* Advance Balance */}
                          <td className="px-3 py-3 text-right font-mono font-semibold text-purple-700">
                            {outstandingAdvTotal > 0 ? `${currency} ${outstandingAdvTotal.toLocaleString()}` : '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleEmployeeAction('view', emp)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="View Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEmployeeAction('edit', emp)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Employee"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEmployeeAction('kharcha', emp)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Record Weekly Advance Salary"
                              >
                                💸
                              </button>
                              <button
                                onClick={() => handleEmployeeAction('advance', emp)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                title="Issue Advance"
                              >
                                🤝
                              </button>
                              <button
                                onClick={() => handleEmployeeAction('bonus', emp)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Grant Bonus"
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => handleEmployeeAction('statement', emp)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Employee Statement"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        {loading ? 'Loading employee records...' : 'No employees matched the specified filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE & OVERTIME */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Attendance Date:</span>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-medium">
                Day: {new Date(attDate).toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendanceSheet}
                disabled={attSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${attSaving ? 'animate-spin' : ''}`} />
                <span>{attSaving ? 'Saving...' : 'Save Daily Sheet'}</span>
              </button>
            </div>
          </div>

          {/* Daily Attendance Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-3 py-3 w-44">Status</th>
                  <th className="px-3 py-3 w-28">Std Hours</th>
                  <th className="px-3 py-3 w-28">Worked Hours</th>
                  <th className="px-3 py-3 w-28">Overtime (hrs)</th>
                  <th className="px-3 py-3 w-28">Short (hrs)</th>
                  <th className="px-4 py-3">Notes / Leave Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const item = attEditing[emp.id] || { status: 'present', worked_hours: 8, overtime_hours: 0, short_hours: 0 };
                  const stdHours = emp.salary_type === 'monthly' ? (emp.standard_hours_per_day || 8) : (emp.daily_standard_hours || 8);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.employee_code} • {emp.salary_type === 'monthly' ? 'Monthly' : 'Daily Worker'}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="px-3 py-2">
                        <select
                          value={item.status || 'present'}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            const isPresent = newStatus === 'present';
                            const isHalf = newStatus === 'half_day';
                            setAttEditing((prev) => ({
                              ...prev,
                              [emp.id]: {
                                ...prev[emp.id],
                                status: newStatus,
                                worked_hours: isPresent ? stdHours : isHalf ? stdHours / 2 : 0,
                                short_hours: isHalf ? stdHours / 2 : 0,
                              },
                            }));
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none ${
                            item.status === 'present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.status === 'absent'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : item.status === 'half_day'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="half_day">Half Day</option>
                          <option value="absent">Absent</option>
                          <option value="paid_leave">Paid Leave</option>
                          <option value="unpaid_leave">Unpaid Leave</option>
                          <option value="public_holiday">Public Holiday</option>
                        </select>
                      </td>

                      {/* Std Hours */}
                      <td className="px-3 py-2 text-slate-600 font-mono font-semibold">
                        {stdHours} hrs
                      </td>

                      {/* Worked Hours */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={item.worked_hours ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const diff = stdHours - val;
                            setAttEditing((prev) => ({
                              ...prev,
                              [emp.id]: {
                                ...prev[emp.id],
                                worked_hours: val,
                                short_hours: diff > 0 ? diff : 0,
                                overtime_hours: val > stdHours ? val - stdHours : 0,
                              },
                            }));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-xs"
                        />
                      </td>

                      {/* Overtime Hours */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.overtime_hours ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setAttEditing((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], overtime_hours: val },
                            }));
                          }}
                          className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded text-xs"
                        />
                      </td>

                      {/* Short Hours */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.short_hours ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setAttEditing((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], short_hours: val },
                            }));
                          }}
                          className="w-full px-2 py-1 bg-rose-50 border border-rose-300 text-rose-800 font-bold rounded text-xs"
                        />
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.notes ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttEditing((prev) => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], notes: val },
                            }));
                          }}
                          placeholder="Reason or notes..."
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONTHLY PAYROLL & PAYSLIPS */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Payroll Header Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Payroll Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
              {currentPayroll && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentPayroll.status === 'finalized'
                      ? 'bg-purple-100 text-purple-800'
                      : currentPayroll.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentPayroll.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCalculatePayroll}
                disabled={payrollCalculating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${payrollCalculating ? 'animate-spin' : ''}`} />
                <span>{payrollCalculating ? 'Calculating...' : 'Recalculate Month Payroll'}</span>
              </button>

              {currentPayroll?.status === 'draft' ? (
                <button
                  type="button"
                  onClick={handleFinalizePayroll}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Finalize Payroll
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReopenPayroll}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Re-Open Draft
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowBulkPayModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bulk Disburse Salaries</span>
              </button>
            </div>
          </div>

          {/* Month Financial Overview Bar */}
          {currentPayroll && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Wages</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currency} {currentPayroll.total_gross.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Weekly Advances Cut</span>
                <p className="text-base font-bold text-amber-900 mt-0.5">
                  -{currency} {(currentPayroll.total_kharchas ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Advances Cut</span>
                <p className="text-base font-bold text-purple-900 mt-0.5">
                  -{currency} {(currentPayroll.total_advances ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Absence Cut</span>
                <p className="text-base font-bold text-rose-900 mt-0.5">
                  -{currency} {(currentPayroll.total_absences || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Bonuses Paid</span>
                <p className="text-base font-bold text-emerald-900 mt-0.5">
                  +{currency} {(currentPayroll.total_bonuses || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-900 text-white p-3 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-indigo-300 uppercase">Net Payable</span>
                <p className="text-base font-black text-white mt-0.5">
                  {currency} {currentPayroll.total_net.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-900 text-white p-3 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Total Paid</span>
                <p className="text-base font-black text-emerald-300 mt-0.5">
                  {currency} {currentPayroll.total_paid.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Detailed Payroll Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Employee</th>
                    <th className="px-2.5 py-3">Type</th>
                    <th className="px-2.5 py-3">Base / Rate</th>
                    <th className="px-2.5 py-3">Days/Hrs</th>
                    <th className="px-2.5 py-3 text-right">OT / Bonus</th>
                    <th className="px-2.5 py-3 text-right">Gross</th>
                    <th className="px-2.5 py-3 text-right">Weekly Adv. Cut</th>
                    <th className="px-2.5 py-3 text-right">Adv. Cut</th>
                    <th className="px-2.5 py-3 text-right">Absence Cut</th>
                    <th className="px-3 py-3 text-right font-black">Net Payable</th>
                    <th className="px-2.5 py-3 text-center">Status</th>
                    <th className="px-3.5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payrollItems.length > 0 ? (
                    payrollItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <div className="font-bold text-slate-900">{item.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.employee_code} • {item.department}</div>
                        </td>

                        <td className="px-2.5 py-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                            item.salary_type === 'monthly' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {item.salary_type.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-2.5 py-2.5 font-mono">
                          {currency} {item.basic_or_daily_rate.toLocaleString()}
                        </td>

                        <td className="px-2.5 py-2.5 font-mono text-[11px] text-slate-600">
                          {item.working_days}d ({item.worked_hours}h)
                        </td>

                        <td className="px-2.5 py-2.5 text-right font-mono text-emerald-700">
                          +{(item.overtime_amount + item.bonus_amount).toLocaleString()}
                        </td>

                        <td className="px-2.5 py-2.5 text-right font-mono font-semibold text-slate-900">
                          {currency} {(item.gross_salary ?? item.gross_amount ?? 0).toLocaleString()}
                        </td>

                        <td className="px-2.5 py-2.5 text-right font-mono text-amber-700">
                          {(item.kharcha_deduction ?? item.kharcha_amount ?? 0) > 0 ? `-${(item.kharcha_deduction ?? item.kharcha_amount ?? 0).toLocaleString()}` : '—'}
                        </td>

                        <td className="px-2.5 py-2.5 text-right font-mono text-purple-700">
                          {item.advance_deduction > 0 ? `-${item.advance_deduction.toLocaleString()}` : '—'}
                        </td>

                        <td className="px-2.5 py-2.5 text-right font-mono text-rose-600">
                          {(item.absence_deduction + item.short_hours_deduction) > 0
                            ? `-${(item.absence_deduction + item.short_hours_deduction).toLocaleString()}`
                            : '—'}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 text-sm">
                          {currency} {item.net_payable.toLocaleString()}
                        </td>

                        <td className="px-2.5 py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-3.5 py-2.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {item.status !== 'paid' ? (
                              <button
                                onClick={() => {
                                  setTargetPayrollItemForPay(item);
                                  setShowPaySalaryModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold px-1.5">Paid ✓</span>
                            )}

                            <button
                              onClick={() => {
                                setTargetPayrollItemForSlip(item);
                                setShowPayslipModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold cursor-pointer transition-colors flex items-center space-x-1"
                              title="Print Payslip Voucher"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                        {payrollCalculating ? 'Compiling monthly payroll...' : 'No payroll compiled for this month yet. Click "Recalculate Month Payroll" above.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEEKLY ADVANCE SALARY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'kharcha' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Weekly Advance Salary (Employee Kharcha)</h2>
              <p className="text-xs text-slate-500">Record micro-expenses and weekly advances paid in cash/bank to staff, automatically deducted at month-end payroll</p>
            </div>
            <button
              onClick={() => {
                setTargetEmployeeForKharcha(null);
                setShowKharchaModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Record Weekly Advance Salary
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Paid From Account</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3 text-right">Amount ({currency})</th>
                  <th className="px-3 py-3 text-center">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kharchas.length > 0 ? (
                  kharchas.map((kh) => (
                    <tr key={kh.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{kh.date}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{kh.employee_name}</td>
                      <td className="px-3 py-3 text-slate-700">{kh.description}</td>
                      <td className="px-3 py-3 text-slate-600">{kh.payment_account_name || 'Cash Account'}</td>
                      <td className="px-3 py-3 text-slate-600">{kh.payment_method}</td>
                      <td className="px-3 py-3 text-right font-bold text-amber-700 font-mono">
                        {currency} {kh.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-500">
                        {kh.payroll_month}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No weekly advance salary records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STAFF ADVANCES & LOANS */}
      {/* ========================================================================= */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Staff Advances & Loans Ledger</h2>
              <p className="text-xs text-slate-500">Track disbursed advances and automated monthly installment repayments</p>
            </div>
            <button
              onClick={() => {
                setTargetEmployeeForAdvance(null);
                setShowAdvanceModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Disburse New Advance
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date Disbursed</th>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3 text-right">Total Advance</th>
                  <th className="px-3 py-3 text-right">Monthly Cut</th>
                  <th className="px-3 py-3 text-right">Remaining Balance</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.length > 0 ? (
                  advances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{adv.date}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{adv.employee_name}</td>
                      <td className="px-3 py-3 text-slate-700">{adv.reason}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900">
                        {currency} {adv.advance_amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-purple-700">
                        {currency} {adv.monthly_deduction.toLocaleString()} / mo
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                        {currency} {adv.remaining_balance.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            adv.status === 'active'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {adv.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {adv.status === 'active' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Settle remaining balance of ${currency} ${adv.remaining_balance.toLocaleString()} for ${adv.employee_name}?`)) {
                                await api.settleAdvance(business.id, adv.id);
                                notify(`Advance settled!`);
                                loadAllHRData();
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Settle Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No employee advances found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BONUSES & SPECIAL ALLOWANCES */}
      {/* ========================================================================= */}
      {activeTab === 'bonuses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bonuses & Performance Rewards</h2>
              <p className="text-xs text-slate-500">Eid bonuses, performance awards, incentives, and festive allowances</p>
            </div>
            <button
              onClick={() => {
                setTargetEmployeeForBonus(null);
                setShowBonusModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Disburse Bonus
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Occasion / Category</th>
                  <th className="px-3 py-3">Disbursed From Account</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3 text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bonuses.length > 0 ? (
                  bonuses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{b.date}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{b.employee_name}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-800">{b.bonus_type}</td>
                      <td className="px-3 py-3 text-slate-600">{b.payment_account_name || 'Cash Account'}</td>
                      <td className="px-3 py-3 text-slate-600">{b.note}</td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-600 font-mono">
                        +{currency} {b.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No bonus records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: FINES & OTHER DEDUCTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Equipment Damages & Disciplinary Fines</h2>
              <p className="text-xs text-slate-500">Record machinery breakage, missing parts, or disciplinary deductions</p>
            </div>
            <button
              onClick={() => {
                setTargetEmployeeForDeduction(null);
                setShowDeductionModal(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Record Deduction
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3">Authorized By</th>
                  <th className="px-3 py-3 text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {otherDeductions.length > 0 ? (
                  otherDeductions.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{d.date}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">{d.employee_name}</td>
                      <td className="px-3 py-3 font-semibold text-rose-800">{d.deduction_type}</td>
                      <td className="px-3 py-3 text-slate-700">{d.reason}</td>
                      <td className="px-3 py-3 text-slate-600">{d.authorized_by}</td>
                      <td className="px-3 py-3 text-right font-bold text-rose-600 font-mono">
                        -{currency} {d.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No disciplinary deductions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PUBLIC HOLIDAYS CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Government & Gazetted Public Holidays</h2>
              <p className="text-xs text-slate-500">Configure public holidays so absence does not cause automated salary deductions</p>
            </div>
            <button
              onClick={() => {
                setHolidayToEdit(null);
                setShowHolidayModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Add Public Holiday
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Holiday Date</th>
                  <th className="px-3 py-3">Holiday Title</th>
                  <th className="px-3 py-3 text-center">Paid Holiday?</th>
                  <th className="px-3 py-3 text-center">Special Holiday?</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holidays.length > 0 ? (
                  holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{h.date}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{h.name}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.is_special ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {h.is_special ? 'Special' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{h.notes || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setHolidayToEdit(h);
                              setShowHolidayModal(true);
                            }}
                            className="p-1 text-slate-600 hover:text-indigo-600 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete holiday "${h.name}"?`)) {
                                await api.deletePublicHoliday(business.id, h.id);
                                notify('Holiday removed.');
                                loadAllHRData();
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No public holidays registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">HR Operational Audit Trail</h2>
            <p className="text-xs text-slate-500">Every wage change, attendance submission, kharcha payment, and advance transaction is logged</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="px-3 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-slate-900">{log.action}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-800">{log.employee_name || 'All Staff'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{log.details}</td>
                      <td className="px-3 py-2.5 text-indigo-700 font-semibold">{log.performed_by || 'Admin'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No audit events recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEmployeeToEdit(null);
        }}
        onSaved={() => {
          notify(employeeToEdit ? 'Employee updated!' : 'New employee registered!');
          loadAllHRData();
        }}
        businessId={business.id}
        employeeToEdit={employeeToEdit}
        currency={currency}
        existingEmployees={employees}
      />

      {/* Employee Detail Profile Modal */}
      <EmployeeDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEmployeeForDetail(null);
        }}
        employee={selectedEmployeeForDetail}
        currency={currency}
        onEdit={(emp) => {
          setEmployeeToEdit(emp);
          setShowEmployeeModal(true);
        }}
        onAction={handleEmployeeAction}
      />

      {/* Add Kharcha Modal */}
      <AddKharchaModal
        isOpen={showKharchaModal}
        onClose={() => {
          setShowKharchaModal(false);
          setTargetEmployeeForKharcha(null);
        }}
        onSaved={() => {
          notify('Weekly Advance Salary recorded & debited from account!');
          loadAllHRData();
        }}
        businessId={business.id}
        employees={employees}
        accounts={accounts}
        preselectedEmployee={targetEmployeeForKharcha}
        currency={currency}
      />

      {/* Add Advance Modal */}
      <AddAdvanceModal
        isOpen={showAdvanceModal}
        onClose={() => {
          setShowAdvanceModal(false);
          setTargetEmployeeForAdvance(null);
        }}
        onSaved={() => {
          notify('Staff advance disbursed!');
          loadAllHRData();
        }}
        businessId={business.id}
        employees={employees}
        accounts={accounts}
        preselectedEmployee={targetEmployeeForAdvance}
        currency={currency}
      />

      {/* Add Bonus Modal */}
      <AddBonusModal
        isOpen={showBonusModal}
        onClose={() => {
          setShowBonusModal(false);
          setTargetEmployeeForBonus(null);
        }}
        onSaved={() => {
          notify('Bonus disbursed!');
          loadAllHRData();
        }}
        businessId={business.id}
        employees={employees}
        accounts={accounts}
        preselectedEmployee={targetEmployeeForBonus}
        currency={currency}
      />

      {/* Add Deduction Modal */}
      <AddDeductionModal
        isOpen={showDeductionModal}
        onClose={() => {
          setShowDeductionModal(false);
          setTargetEmployeeForDeduction(null);
        }}
        onSaved={() => {
          notify('Deduction logged!');
          loadAllHRData();
        }}
        businessId={business.id}
        employees={employees}
        preselectedEmployee={targetEmployeeForDeduction}
        currency={currency}
      />

      {/* Pay Single Salary Modal */}
      <PaySalaryModal
        isOpen={showPaySalaryModal}
        onClose={() => {
          setShowPaySalaryModal(false);
          setTargetPayrollItemForPay(null);
        }}
        onPaid={() => {
          notify('Salary paid & recorded in accounts ledger!');
          loadAllHRData();
        }}
        businessId={business.id}
        payrollItem={targetPayrollItemForPay}
        accounts={accounts}
        currency={currency}
      />

      {/* Printable Payslip Voucher Modal */}
      <PayslipModal
        isOpen={showPayslipModal}
        onClose={() => {
          setShowPayslipModal(false);
          setTargetPayrollItemForSlip(null);
        }}
        payrollItem={targetPayrollItemForSlip}
        business={business}
        month={selectedMonth}
      />

      {/* Printable Employee Statement Modal */}
      <EmployeeStatementModal
        isOpen={showStatementModal}
        onClose={() => {
          setShowStatementModal(false);
          setTargetEmployeeForStatement(null);
        }}
        employee={targetEmployeeForStatement}
        business={business}
      />

      {/* Public Holiday Modal */}
      <PublicHolidayModal
        isOpen={showHolidayModal}
        onClose={() => {
          setShowHolidayModal(false);
          setHolidayToEdit(null);
        }}
        onSaved={() => {
          notify(holidayToEdit ? 'Holiday updated!' : 'New holiday added!');
          loadAllHRData();
        }}
        businessId={business.id}
        holidayToEdit={holidayToEdit}
      />

      {/* Bulk Disburse Salaries Modal */}
      {showBulkPayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Bulk Disburse Salaries</h3>
              </div>
              <button
                onClick={() => setShowBulkPayModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteBulkSalaryPay} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                You are about to pay all pending salaries for month <strong>{selectedMonth}</strong>.
                Total pending: <strong>{payrollItems.filter((i) => i.status !== 'paid').length} employees</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pay From Cash / Bank Account <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={bulkPayAccountId}
                  onChange={(e) => setBulkPayAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
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
                  value={bulkPayMethod}
                  onChange={(e) => setBulkPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkPayModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkPaySubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {bulkPaySubmitting ? 'Disbursing...' : 'Disburse All Salaries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
