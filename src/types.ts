export type AuthProvider = 'email' | 'google' | 'linked';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  business_limit: number | null;
  google_id?: string | null;
  profile_image?: string | null;
  auth_provider: AuthProvider;
  email_verified?: boolean | number;
  has_password?: boolean;
  effective_limit?: number;
  business_count?: number;
  remaining_slots?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Business {
  id: number;
  user_id: number;
  name: string;
  logo: string;
  icon: string;
  address: string;
  city?: string;
  phone: string;
  email: string;
  currency: string;
  tax_number: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface ProductCategory {
  id: number;
  business_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Product {
  id: number;
  business_id: number;
  category_id: number;
  category_name?: string;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  sale_price?: number;
  weight: string;
  image: string;
  opening_stock: number;
  current_stock: number;
  created_at: string;
}

export interface Customer {
  id: number;
  business_id: number;
  party_id?: number;
  name: string;
  company_name?: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  tax_number?: string;
  notes?: string;
  opening_balance: number;
  current_balance: number;
  is_customer?: boolean;
  is_supplier?: boolean;
  linked_supplier_id?: number | null;
  status?: 'active' | 'inactive';
  created_at: string;
}

export interface Supplier {
  id: number;
  business_id: number;
  party_id?: number;
  name: string;
  company_name?: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  tax_number?: string;
  notes?: string;
  opening_balance: number;
  current_balance: number;
  is_customer?: boolean;
  is_supplier?: boolean;
  linked_customer_id?: number | null;
  status?: 'active' | 'inactive';
  created_at: string;
}

export interface UnifiedParty {
  id: number; // party_id
  business_id: number;
  customer_id?: number | null;
  supplier_id?: number | null;
  name: string;
  company_name?: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  tax_number?: string;
  notes?: string;
  status: 'active' | 'inactive';
  is_customer: boolean;
  is_supplier: boolean;
  customer_balance: number;
  supplier_balance: number;
  net_balance: number;
  created_at: string;
}

export interface UnifiedLedgerRow {
  id: string | number;
  date: string;
  transaction_type: 'invoice' | 'bill' | 'receipt' | 'payment' | 'opening';
  type_label: string;
  reference_no: string;
  description: string;
  receivable_amount?: number;
  payable_amount?: number;
  debit: number;
  credit: number;
  net_change: number;
  running_balance: number;
}

export interface BankAccount {
  id: number;
  user_id: number;
  primary_business_id: number;
  bank_name: string;
  account_title: string;
  account_number: string;
  account_type: string;
  opening_balance: number;
  current_balance: number;
  balance?: number;
  scope: 'individual' | 'multiple';
  connected_business_ids: number[];
  created_at: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  business_id: number;
  business_name?: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  reference_type: 'receipt' | 'payment' | 'opening' | 'manual';
  reference_id: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: number;
  business_id: number;
  customer_id: number;
  customer_name?: string;
  sales_order_id?: number | null;
  warehouse_id?: number | null;
  warehouse_name?: string;
  warehouse_code?: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes: string;
  status: 'confirmed' | 'cancelled';
  items?: InvoiceItem[];
  created_at: string;
}

export interface Receipt {
  id: number;
  business_id: number;
  customer_id: number;
  customer_name?: string;
  bank_account_id: number;
  bank_name?: string;
  receipt_number: string;
  amount: number;
  payment_date: string;
  reference_number: string;
  notes: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface BillItem {
  id: number;
  bill_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Bill {
  id: number;
  business_id: number;
  supplier_id: number;
  supplier_name?: string;
  purchase_order_id?: number | null;
  warehouse_id?: number | null;
  warehouse_name?: string;
  warehouse_code?: string;
  bill_number: string;
  bill_date: string;
  subtotal: number;
  tax: number;
  grand_total: number;
  notes: string;
  status: 'confirmed' | 'cancelled';
  items?: BillItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  business_id: number;
  supplier_id: number;
  supplier_name?: string;
  bank_account_id: number;
  bank_name?: string;
  payment_number: string;
  amount: number;
  payment_date: string;
  reference_number: string;
  notes: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  business_id: number;
  entity_type: 'customer' | 'supplier' | 'bank' | 'sales' | 'purchases';
  entity_id: number;
  reference_type: 'invoice' | 'receipt' | 'bill' | 'payment' | 'opening';
  reference_id: string;
  transaction_date: string;
  debit: number;
  credit: number;
  running_balance: number;
  description: string;
  created_at: string;
}

export interface StockTransaction {
  id: number;
  business_id: number;
  warehouse_id?: number | null;
  warehouse_name?: string;
  warehouse_code?: string;
  product_id: number;
  product_name?: string;
  transaction_type: 'in' | 'out' | 'opening' | 'reversal_in' | 'reversal_out';
  quantity: number;
  unit_cost: number;
  reference_type: 'invoice' | 'bill' | 'opening' | 'manual';
  reference_id: string;
  notes: string;
  created_at: string;
}

export interface AdminUserOverview {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  google_id?: string | null;
  profile_image?: string | null;
  auth_provider: AuthProvider;
  email_verified?: boolean | number;
  assigned_limit: number | null;
  effective_limit: number;
  current_count: number;
  remaining_slots: number;
  businesses: Business[];
  created_at: string;
  updated_at?: string;
}

export interface PhpFileRecord {
  filename: string;
  category: string;
  description: string;
  content: string;
}

export type OrderStatus = 'In Process' | 'Approved' | 'Rejected' | 'Complete';

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalesOrder {
  id: number;
  business_id: number;
  customer_id: number;
  customer_name?: string;
  warehouse_id?: number | null;
  warehouse_name?: string;
  warehouse_code?: string;
  order_number: string;
  order_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes: string;
  status: OrderStatus;
  invoice_id?: number | null;
  items?: SalesOrderItem[];
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrder {
  id: number;
  business_id: number;
  supplier_id: number;
  supplier_name?: string;
  warehouse_id?: number | null;
  warehouse_name?: string;
  warehouse_code?: string;
  order_number: string;
  order_date: string;
  subtotal: number;
  tax: number;
  grand_total: number;
  notes: string;
  status: OrderStatus;
  bill_id?: number | null;
  items?: PurchaseOrderItem[];
  created_at: string;
}

export interface Warehouse {
  id: number;
  business_id: number;
  name: string;
  code: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: string;
  capacity?: string;
  notes?: string;
  status: 'active' | 'inactive';
  is_default?: boolean;
  total_products?: number;
  total_stock?: number;
  created_at: string;
}

export interface StockTransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
}

export interface StockTransfer {
  id: number;
  business_id: number;
  from_warehouse_id: number;
  from_warehouse_name?: string;
  from_warehouse_code?: string;
  to_warehouse_id: number;
  to_warehouse_name?: string;
  to_warehouse_code?: string;
  transfer_number: string;
  transfer_date: string;
  reference?: string;
  notes: string;
  status: 'completed';
  total_quantity: number;
  items?: StockTransferItem[];
  created_at: string;
  // Legacy / single product compatibility
  source_business_id?: number;
  source_business_name?: string;
  destination_business_id?: number;
  destination_business_name?: string;
  product_id?: number;
  product_name?: string;
  product_sku?: string;
  quantity?: number;
}

export interface StockAdjustment {
  id: number;
  business_id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  adjustment_number: string;
  adjustment_date: string;
  adjustment_type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  notes: string;
  created_at: string;
}

export interface OtherPayment {
  id: number;
  business_id: number;
  bank_account_id: number;
  bank_name?: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payee: string;
  category: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

export interface OtherReceipt {
  id: number;
  business_id: number;
  bank_account_id: number;
  bank_name?: string;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payer: string;
  category: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

export interface BankTransfer {
  id: number;
  transfer_number: string;
  transfer_date: string;
  from_account_id: number;
  from_account_name?: string;
  to_account_id: number;
  to_account_name?: string;
  amount: number;
  reference: string;
  notes: string;
  created_at: string;
}

export type EmploymentType = 'permanent' | 'temporary' | 'daily_worker' | 'contract' | 'other';
export type SalaryType = 'monthly' | 'daily_wage' | 'daily';

export interface Employee {
  id: number;
  business_id: number;
  employee_code: string; // EMP-001
  name: string;
  father_name: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  join_date: string;
  photo?: string;
  emergency_contact: string;
  designation: string;
  department: string;
  employment_type: EmploymentType;
  salary_type: SalaryType;
  status: 'active' | 'inactive';
  job_status?: 'probation' | 'confirmed' | 'notice_period' | 'resigned' | 'terminated';

  // Monthly Salary Configuration
  monthly_salary: number;
  standard_hours_per_day: number;
  standard_days_per_month: number;
  overtime_enabled: boolean;
  overtime_rate_type: 'salary_based' | 'fixed_hourly' | 'disabled';
  overtime_hourly_rate: number;
  holiday_overtime_rate: number; // multiplier or rate
  late_deduction_rule: 'hourly' | 'daily' | 'fixed' | 'disabled';
  late_deduction_amount: number;
  short_hours_rule: 'hourly' | 'daily' | 'fixed' | 'disabled';
  absence_deduction_rule: 'per_day' | 'fixed' | 'unpaid' | 'disabled' | 'paid' | 'per_hour';
  absence_deduction_amount: number;
  weekly_off_day: string;
  paid_leaves_per_month: number;

  // Daily Wage Configuration
  daily_rate: number;
  daily_standard_hours: number;
  daily_overtime_rate: number;

  created_at: string;
  updated_at?: string;
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'leave'
  | 'paid_leave'
  | 'unpaid_leave'
  | 'public_holiday'
  | 'late'
  | 'rest_day';

export interface AttendanceRecord {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  check_in?: string;
  check_out?: string;
  standard_hours: number;
  worked_hours: number;
  overtime_hours: number;
  short_hours: number;
  notes?: string;
  created_at: string;
}

export interface PublicHoliday {
  id: number;
  business_id: number;
  name: string;
  date: string; // YYYY-MM-DD
  is_paid: boolean;
  is_special: boolean;
  recurring: boolean;
  notes?: string;
  created_at: string;
}

export interface KharchaRecord {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  payment_account_id: number;
  payment_account_name?: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque';
  description: string;
  reference_no: string;
  entered_by?: string;
  payroll_month?: string; // e.g. '2026-09'
  status: 'approved' | 'deducted' | 'cancelled';
  created_at: string;
}

export interface AdvanceRecord {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  advance_amount: number;
  date: string;
  payment_account_id: number;
  payment_account_name?: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque';
  reason: string;
  monthly_deduction: number;
  start_month: string; // YYYY-MM
  total_repaid: number;
  remaining_balance: number;
  status: 'active' | 'settled';
  created_at: string;
}

export interface BonusRecord {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  bonus_type: 'Eid Bonus' | 'Performance Bonus' | 'Festival Bonus' | 'Special Bonus' | 'Other Bonus';
  amount: number;
  date: string;
  payment_account_id: number;
  payment_account_name?: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque';
  note: string;
  payroll_month?: string; // YYYY-MM
  created_at: string;
}

export interface OtherDeductionRecord {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  deduction_type: 'Damage' | 'Loan' | 'Fine' | 'Missing Item' | 'Other';
  amount: number;
  date: string;
  reason: string;
  authorized_by: string;
  payroll_month: string; // YYYY-MM
  created_at: string;
}

export interface MonthlyPayroll {
  id: number;
  business_id: number;
  month: string; // YYYY-MM
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_paid: number;
  total_kharchas?: number;
  total_advances?: number;
  total_absences?: number;
  total_bonuses?: number;
  status: 'draft' | 'finalized' | 'paid';
  finalized_at?: string;
  finalized_by?: string;
  reopened_at?: string;
  reopened_by?: string;
  created_at: string;
}

export interface PayrollItem {
  id: number;
  payroll_id: number;
  business_id: number;
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  department: string;
  salary_type: SalaryType;
  basic_or_daily_rate: number;
  working_days: number;
  worked_hours: number;
  earned_basic: number;
  overtime_hours: number;
  overtime_amount: number;
  bonus_amount: number;
  kharcha_amount: number;
  kharcha_deduction?: number;
  advance_deduction: number;
  absence_deduction: number;
  short_hours_deduction: number;
  other_deductions: number;
  gross_amount: number;
  gross_salary?: number;
  net_payable: number;
  paid_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  status?: 'unpaid' | 'partial' | 'paid';
  paid_date?: string;
  total_deductions?: number;
  payment_date?: string;
  payment_account_id?: number;
  payment_account_name?: string;
  payment_method?: string;
  reference_no?: string;
  calculation_details?: string;
  created_at: string;
}

export interface HRAuditLog {
  id: number;
  business_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  description: string;
  performed_by: string;
  created_at: string;
}

export interface EmployeeStatementEntry {
  date: string;
  type:
    | 'salary_earned'
    | 'salary_paid'
    | 'daily_wage'
    | 'overtime'
    | 'kharcha'
    | 'advance'
    | 'advance_given'
    | 'advance_deduction'
    | 'bonus'
    | 'other_addition'
    | 'other_deduction';
  description: string;
  debit: number; // reductions / money received by employee
  credit: number; // earnings
  balance: number;
  reference?: string;
}

export interface SalaryPayment {
  id: number;
  business_id: number;
  employee_id: number;
  employee_name?: string;
  month: string;
  salary_amount: number;
  bonus: number;
  deduction: number;
  net_paid: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque';
  payment_date: string;
  status: 'paid' | 'pending';
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export interface TransactionAuditLog {
  id: number;
  business_id: number;
  transaction_type: string;
  transaction_id: number | string;
  reference_no?: string;
  action: 'create' | 'edit' | 'delete' | 'copy' | 'cancel' | 'role_add' | 'role_remove';
  description: string;
  performed_by: string;
  details?: string;
  created_at: string;
}


