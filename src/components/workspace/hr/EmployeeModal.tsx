import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Briefcase, DollarSign, Calendar, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { Employee } from '../../../types.ts';
import { api } from '../../../api.ts';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  employeeToEdit?: Employee | null;
  currency: string;
  existingEmployees?: Employee[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  businessId,
  employeeToEdit,
  currency,
  existingEmployees = [],
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'employment' | 'salary_rules'>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to auto allot next unique employee code (e.g. EMP-001, EMP-002, ...)
  const generateNextEmployeeCode = (list: Employee[] = []) => {
    let maxNum = 0;
    for (const emp of list) {
      if (!emp.employee_code) continue;
      const match = emp.employee_code.match(/EMP-(\d+)/i) || emp.employee_code.match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) maxNum = val;
      }
    }
    let nextNum = Math.max(list.length + 1, maxNum + 1);
    let candidate = `EMP-${String(nextNum).padStart(3, '0')}`;
    while (list.some((e) => e.employee_code?.trim().toUpperCase() === candidate.toUpperCase())) {
      nextNum++;
      candidate = `EMP-${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  };

  // Form state - Basic Info
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Employment Info
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Production');
  const [employmentType, setEmploymentType] = useState<'permanent' | 'temporary' | 'daily_worker' | 'contract' | 'other'>('permanent');
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily_wage'>('monthly');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [jobStatus, setJobStatus] = useState<'probation' | 'confirmed' | 'notice_period' | 'resigned' | 'terminated'>('confirmed');

  // Salary & Rules - Monthly
  const [monthlySalary, setMonthlySalary] = useState('');
  const [standardHoursPerDay, setStandardHoursPerDay] = useState('8');
  const [standardDaysPerMonth, setStandardDaysPerMonth] = useState('26');
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [overtimeRateType, setOvertimeRateType] = useState<'salary_based' | 'fixed_hourly' | 'disabled'>('salary_based');
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState('');
  const [holidayOvertimeRate, setHolidayOvertimeRate] = useState('1.5');
  const [lateDeductionRule, setLateDeductionRule] = useState<'hourly' | 'daily' | 'fixed' | 'disabled'>('hourly');
  const [lateDeductionAmount, setLateDeductionAmount] = useState('');
  const [shortHoursRule, setShortHoursRule] = useState<'hourly' | 'daily' | 'fixed' | 'disabled'>('hourly');
  const [absenceDeductionRule, setAbsenceDeductionRule] = useState<'per_day' | 'per_hour' | 'fixed' | 'paid' | 'unpaid' | 'disabled'>('per_day');
  const [absenceDeductionAmount, setAbsenceDeductionAmount] = useState('');
  const [weeklyOffDay, setWeeklyOffDay] = useState('Sunday');
  const [paidLeavesPerMonth, setPaidLeavesPerMonth] = useState('1');

  // Daily Wage Specific
  const [dailyRate, setDailyRate] = useState('');
  const [dailyStandardHours, setDailyStandardHours] = useState('8');
  const [dailyOvertimeRate, setDailyOvertimeRate] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name || '');
      setFatherName(employeeToEdit.father_name || '');
      setEmployeeCode(employeeToEdit.employee_code || '');
      setCnic(employeeToEdit.cnic || '');
      setPhone(employeeToEdit.phone || '');
      setEmail(employeeToEdit.email || '');
      setAddress(employeeToEdit.address || '');
      setDob(employeeToEdit.dob || '');
      setJoinDate(employeeToEdit.join_date || new Date().toISOString().slice(0, 10));
      setPhoto(employeeToEdit.photo || '');
      setEmergencyContact(employeeToEdit.emergency_contact || '');

      setDesignation(employeeToEdit.designation || '');
      setDepartment(employeeToEdit.department || 'Production');
      setEmploymentType(employeeToEdit.employment_type || 'permanent');
      setSalaryType((employeeToEdit.salary_type === 'daily' || employeeToEdit.salary_type === 'daily_wage') ? 'daily_wage' : 'monthly');
      setStatus(employeeToEdit.status || 'active');
      setJobStatus(employeeToEdit.job_status || 'confirmed');

      setMonthlySalary(employeeToEdit.monthly_salary ? String(employeeToEdit.monthly_salary) : '');
      setStandardHoursPerDay(String(employeeToEdit.standard_hours_per_day || 8));
      setStandardDaysPerMonth(String(employeeToEdit.standard_days_per_month || 26));
      setOvertimeEnabled(Boolean(employeeToEdit.overtime_enabled));
      setOvertimeRateType(employeeToEdit.overtime_rate_type || 'salary_based');
      setOvertimeHourlyRate(employeeToEdit.overtime_hourly_rate ? String(employeeToEdit.overtime_hourly_rate) : '');
      setHolidayOvertimeRate(String(employeeToEdit.holiday_overtime_rate || 1.5));
      setLateDeductionRule(employeeToEdit.late_deduction_rule || 'hourly');
      setLateDeductionAmount(employeeToEdit.late_deduction_amount ? String(employeeToEdit.late_deduction_amount) : '');
      setShortHoursRule(employeeToEdit.short_hours_rule || 'hourly');
      setAbsenceDeductionRule(employeeToEdit.absence_deduction_rule || 'per_day');
      setAbsenceDeductionAmount(employeeToEdit.absence_deduction_amount ? String(employeeToEdit.absence_deduction_amount) : '');
      setWeeklyOffDay(employeeToEdit.weekly_off_day || 'Sunday');
      setPaidLeavesPerMonth(String(employeeToEdit.paid_leaves_per_month || 1));

      setDailyRate(employeeToEdit.daily_rate ? String(employeeToEdit.daily_rate) : '');
      setDailyStandardHours(String(employeeToEdit.daily_standard_hours || 8));
      setDailyOvertimeRate(employeeToEdit.daily_overtime_rate ? String(employeeToEdit.daily_overtime_rate) : '');
    } else {
      // Defaults for new employee
      setName('');
      setFatherName('');
      setEmployeeCode(generateNextEmployeeCode(existingEmployees));
      setCnic('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDob('');
      setJoinDate(new Date().toISOString().slice(0, 10));
      setPhoto('');
      setEmergencyContact('');
      setDesignation('');
      setDepartment('Production');
      setEmploymentType('permanent');
      setSalaryType('monthly');
      setStatus('active');
      setJobStatus('confirmed');
      setMonthlySalary('');
      setStandardHoursPerDay('8');
      setStandardDaysPerMonth('26');
      setOvertimeEnabled(true);
      setOvertimeRateType('salary_based');
      setOvertimeHourlyRate('');
      setHolidayOvertimeRate('1.5');
      setLateDeductionRule('hourly');
      setLateDeductionAmount('');
      setShortHoursRule('hourly');
      setAbsenceDeductionRule('per_day');
      setAbsenceDeductionAmount('');
      setWeeklyOffDay('Sunday');
      setPaidLeavesPerMonth('1');
      setDailyRate('');
      setDailyStandardHours('8');
      setDailyOvertimeRate('');
    }
    setError(null);
    setActiveTab('basic');
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter employee name.');
      setActiveTab('basic');
      return;
    }

    if (salaryType === 'monthly' && (!monthlySalary || Number(monthlySalary) <= 0)) {
      setError('Please enter a valid monthly basic salary.');
      setActiveTab('salary_rules');
      return;
    }

    if (salaryType === 'daily_wage' && (!dailyRate || Number(dailyRate) <= 0)) {
      setError('Please enter a valid daily wage rate.');
      setActiveTab('salary_rules');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      father_name: fatherName.trim(),
      employee_code: employeeCode.trim() || generateNextEmployeeCode(existingEmployees),
      cnic: cnic.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      dob,
      join_date: joinDate,
      photo: photo.trim(),
      emergency_contact: emergencyContact.trim(),

      designation: designation.trim() || 'Staff',
      department: department.trim() || 'General',
      employment_type: employmentType,
      salary_type: salaryType,
      status,
      job_status: jobStatus,

      monthly_salary: salaryType === 'monthly' ? Number(monthlySalary) || 0 : 0,
      standard_hours_per_day: Number(standardHoursPerDay) || 8,
      standard_days_per_month: Number(standardDaysPerMonth) || 26,
      overtime_enabled: overtimeEnabled,
      overtime_rate_type: overtimeRateType,
      overtime_hourly_rate: Number(overtimeHourlyRate) || 0,
      holiday_overtime_rate: Number(holidayOvertimeRate) || 1.5,
      late_deduction_rule: lateDeductionRule,
      late_deduction_amount: Number(lateDeductionAmount) || 0,
      short_hours_rule: shortHoursRule,
      absence_deduction_rule: absenceDeductionRule,
      absence_deduction_amount: Number(absenceDeductionAmount) || 0,
      weekly_off_day: weeklyOffDay,
      paid_leaves_per_month: Number(paidLeavesPerMonth) || 1,

      daily_rate: salaryType === 'daily_wage' ? Number(dailyRate) || 0 : 0,
      daily_standard_hours: Number(dailyStandardHours) || 8,
      daily_overtime_rate: Number(dailyOvertimeRate) || 0,
    };

    try {
      if (employeeToEdit) {
        const res = await api.updateEmployee(businessId, employeeToEdit.id, payload);
        if (!res.success) throw new Error((res as any).error || 'Failed to update employee');
      } else {
        const res = await api.createEmployee(businessId, payload);
        if (!res.success) throw new Error((res as any).error || 'Failed to create employee');
      }
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
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {employeeToEdit ? 'Edit Employee Details' : 'Add New Employee'}
              </h2>
              <p className="text-xs text-slate-300">
                {employeeToEdit ? `Updating ${employeeToEdit.name} (${employeeToEdit.employee_code})` : 'Register a new employee with flexible salary rules'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'basic'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Basic Information</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'employment'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>2. Employment Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary_rules')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'salary_rules'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Salary & Overtime Rules</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Tariq"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Abdul Rehman"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Employee ID / Code
                    </label>
                    {!employeeToEdit && (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                          Auto-Allotted
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmployeeCode(generateNextEmployeeCode(existingEmployees))}
                          title="Generate new unique code"
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Re-allot</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Auto-allotted (e.g. EMP-001)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Automatically assigned unique sequential ID. You may also customize it if needed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CNIC / Identification No
                  </label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="e.g. 35201-1234567-1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. worker@business.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential / Local Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Area, City"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Brother: +92 321 7654321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT INFORMATION */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Machine Operator / Senior Accountant"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Production">Production & Workshop</option>
                    <option value="Management">Management & Executive</option>
                    <option value="Finance">Finance & Accounts</option>
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Inventory">Inventory & Warehouse</option>
                    <option value="Maintenance">Maintenance & Technical</option>
                    <option value="Security">Security & Logistics</option>
                    <option value="General">General Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="permanent">Permanent Employee</option>
                    <option value="temporary">Temporary Worker</option>
                    <option value="daily_worker">Daily Worker</option>
                    <option value="contract">Contractor / Fixed Term</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Salary Compensation Structure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-indigo-50 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="monthly">Monthly Fixed Salary</option>
                    <option value="daily_wage">Daily Wage Rate (Per Day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="active">Active (Currently Working)</option>
                    <option value="inactive">Inactive / On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Tenure Status
                  </label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="probation">Probation Period</option>
                    <option value="notice_period">Notice Period</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY RULES & OVERTIME */}
          {activeTab === 'salary_rules' && (
            <div className="space-y-6">
              {/* If Monthly Salary */}
              {salaryType === 'monthly' ? (
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      <span>Monthly Salary Configuration</span>
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Fixed Monthly System
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Monthly Basic Salary ({currency}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={monthlySalary}
                        onChange={(e) => setMonthlySalary(e.target.value)}
                        placeholder="e.g. 60000"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Std Working Hours / Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={standardHoursPerDay}
                        onChange={(e) => setStandardHoursPerDay(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Std Working Days / Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={standardDaysPerMonth}
                        onChange={(e) => setStandardDaysPerMonth(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Overtime Settings */}
                  <div className="pt-3 border-t border-indigo-200/60">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overtimeEnabled}
                          onChange={(e) => setOvertimeEnabled(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Enable Overtime Calculation for this Employee</span>
                      </label>
                    </div>

                    {overtimeEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Overtime Calculation Method
                          </label>
                          <select
                            value={overtimeRateType}
                            onChange={(e) => setOvertimeRateType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                          >
                            <option value="salary_based">Salary-Based (Auto Hourly Formula)</option>
                            <option value="fixed_hourly">Fixed Hourly Rate</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>

                        {overtimeRateType === 'fixed_hourly' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Fixed Overtime Rate / Hour ({currency})
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={overtimeHourlyRate}
                              onChange={(e) => setOvertimeHourlyRate(e.target.value)}
                              placeholder="e.g. 350"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Holiday Overtime Multiplier
                          </label>
                          <select
                            value={holidayOvertimeRate}
                            onChange={(e) => setHolidayOvertimeRate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                          >
                            <option value="1.0">1.0x (Standard rate)</option>
                            <option value="1.25">1.25x (Quarter extra)</option>
                            <option value="1.5">1.5x (Time and half)</option>
                            <option value="2.0">2.0x (Double rate)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deduction Rules */}
                  <div className="pt-3 border-t border-indigo-200/60 space-y-3">
                    <p className="text-xs font-bold text-slate-800">Deduction Rules (Short Hours, Late & Absence)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Short Hours Deduction
                        </label>
                        <select
                          value={shortHoursRule}
                          onChange={(e) => setShortHoursRule(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                        >
                          <option value="hourly">Hourly Auto Rate (from salary)</option>
                          <option value="disabled">Disabled (No deduction)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Absence Deduction Rule
                        </label>
                        <select
                          value={absenceDeductionRule}
                          onChange={(e) => setAbsenceDeductionRule(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                        >
                          <option value="per_day">Per-Day Salary Cut</option>
                          <option value="fixed">Fixed Deduction Amount</option>
                          <option value="paid">Paid (No salary cut)</option>
                          <option value="unpaid">Strict Unpaid</option>
                        </select>
                      </div>

                      {absenceDeductionRule === 'fixed' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Fixed Cut / Absence ({currency})
                          </label>
                          <input
                            type="number"
                            value={absenceDeductionAmount}
                            onChange={(e) => setAbsenceDeductionAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Weekly Off Day
                        </label>
                        <select
                          value={weeklyOffDay}
                          onChange={(e) => setWeeklyOffDay(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                        >
                          <option value="Sunday">Sunday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="None">None (7 Days)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* DAILY WAGE CONFIGURATION */
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Daily Wage Employee Configuration</span>
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Pay Per Day Worked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Daily Wage Rate ({currency}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-amber-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Standard Hours Per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={dailyStandardHours}
                        onChange={(e) => setDailyStandardHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Daily Overtime Rate / Hour ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dailyOvertimeRate}
                        onChange={(e) => setDailyOvertimeRate(e.target.value)}
                        placeholder="e.g. 250"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-100/50 rounded-xl text-amber-900 text-xs">
                    💡 <strong>Daily Worker Logic:</strong> Worker is paid according to the days they are marked present plus approved half-days. Absences do not trigger separate fines, as basic pay is only credited on present days.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls inside Form */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex space-x-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'salary_rules' ? 'employment' : 'basic')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              {activeTab !== 'salary_rules' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'basic' ? 'employment' : 'salary_rules')}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Next Step &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : employeeToEdit ? 'Update Employee' : 'Save Employee'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
