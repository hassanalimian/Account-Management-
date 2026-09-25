const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('accounting_token');
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem('accounting_token', token);
  else localStorage.removeItem('accounting_token');
}

export function clearStoredToken() {
  localStorage.removeItem('accounting_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Google OAuth 2.0 Auth & Account Linking
  getGoogleAuthUrl: (action: 'login' | 'link' = 'login') =>
    request<{
      url: string;
      state: string;
      redirect_uri: string;
      is_configured: boolean;
      client_id: string;
      app_url: string;
    }>(`/auth/google/url?action=${action}`),
  verifyGoogleAuth: (payload: { credential?: string; testUser?: any }) =>
    request<{ token: string; user: any; is_new?: boolean; linked?: boolean }>('/auth/google/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  linkGoogleAccount: (payload: { googleId: string; email?: string; profileImage?: string }) =>
    request<{ success: boolean; message: string; user: any }>('/auth/google/link', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  unlinkGoogleAccount: () =>
    request<{ success: boolean; message: string; user: any }>('/auth/google/unlink', {
      method: 'POST',
    }),
  setPassword: (password: string) =>
    request<{ success: boolean; message: string; user: any }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  updateGlobalLimit: (limit: number) =>
    request<any>('/admin/global-limit', { method: 'POST', body: JSON.stringify({ limit }) }),
  updateUserLimit: (userId: number, limit: number | null) =>
    request<any>('/admin/user-limit', { method: 'POST', body: JSON.stringify({ userId, limit }) }),
  updateBusinessStatus: (businessId: number, status: 'active' | 'inactive') =>
    request<any>('/admin/business-status', { method: 'POST', body: JSON.stringify({ businessId, status }) }),

  // Businesses
  getBusinesses: () => request<any>('/businesses'),
  createBusiness: (payload: any) => request<any>('/businesses', { method: 'POST', body: JSON.stringify(payload) }),
  getBusiness: (id: number) => request<any>(`/businesses/${id}`),
  updateBusiness: (id: number, payload: any) =>
    request<any>(`/businesses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getSalaries: (bizId: number) => request<{ salaries: any[] }>(`/businesses/${bizId}/salaries`),
  createSalaryPayment: (bizId: number, payload: any) =>
    request<{ success: boolean; salary: any }>(`/businesses/${bizId}/salaries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Categories
  getCategories: (bizId: number) => request<any>(`/businesses/${bizId}/categories`),
  createCategory: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/categories`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (bizId: number, catId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/categories/${catId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (bizId: number, catId: number, reassignToCategoryId?: number) =>
    request<any>(
      `/businesses/${bizId}/categories/${catId}${
        reassignToCategoryId ? `?reassign_to_category_id=${reassignToCategoryId}` : ''
      }`,
      { method: 'DELETE' }
    ),

  // Products
  getProducts: (bizId: number) => request<any>(`/businesses/${bizId}/products`),
  createProduct: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/products`, { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (bizId: number, prodId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/products/${prodId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (bizId: number, prodId: number) =>
    request<any>(`/businesses/${bizId}/products/${prodId}`, { method: 'DELETE' }),
  uploadProductImage: (bizId: number, base64Image: string) =>
    request<{ success: boolean; url: string }>(`/businesses/${bizId}/upload-image`, {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    }),

  // Unified Parties (Customers & Suppliers)
  getParties: (bizId: number) => request<{ parties: any[] }>(`/businesses/${bizId}/parties`),
  getPartyProfile: (bizId: number, partyKey: string) => request<{ party: any }>(`/businesses/${bizId}/parties/${partyKey}/profile`),
  getPartyLedger: (bizId: number, partyKey: string, from?: string, to?: string) =>
    request<any>(`/businesses/${bizId}/parties/${partyKey}/ledger?from=${from || ''}&to=${to || ''}`),
  togglePartyRole: (bizId: number, payload: { partyKey: string; role: 'customer' | 'supplier'; action: 'add' | 'remove' }) =>
    request<any>(`/businesses/${bizId}/parties/toggle-role`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteUnifiedParty: (bizId: number, payload: { partyKey: string; forceDelete?: boolean }) =>
    request<any>(`/businesses/${bizId}/parties/delete`, { method: 'POST', body: JSON.stringify(payload) }),
  designateCustomerAsSupplier: (bizId: number, custId: number) =>
    request<any>(`/businesses/${bizId}/customers/${custId}/designate-supplier`, { method: 'POST' }),
  removeCustomerRole: (bizId: number, custId: number) =>
    request<any>(`/businesses/${bizId}/customers/${custId}/remove-role`, { method: 'POST' }),
  designateSupplierAsCustomer: (bizId: number, suppId: number) =>
    request<any>(`/businesses/${bizId}/suppliers/${suppId}/designate-customer`, { method: 'POST' }),
  removeSupplierRole: (bizId: number, suppId: number) =>
    request<any>(`/businesses/${bizId}/suppliers/${suppId}/remove-role`, { method: 'POST' }),

  // Customers
  getCustomers: (bizId: number) => request<any>(`/businesses/${bizId}/customers`),
  createCustomer: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/customers`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (bizId: number, custId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/customers/${custId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomer: (bizId: number, custId: number) =>
    request<any>(`/businesses/${bizId}/customers/${custId}`, { method: 'DELETE' }),
  getCustomerLedger: (bizId: number, custId: number, from?: string, to?: string) =>
    request<any>(`/businesses/${bizId}/customers/${custId}/ledger?from=${from || ''}&to=${to || ''}`),

  // Suppliers
  getSuppliers: (bizId: number) => request<any>(`/businesses/${bizId}/suppliers`),
  createSupplier: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/suppliers`, { method: 'POST', body: JSON.stringify(payload) }),
  updateSupplier: (bizId: number, suppId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/suppliers/${suppId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSupplier: (bizId: number, suppId: number) =>
    request<any>(`/businesses/${bizId}/suppliers/${suppId}`, { method: 'DELETE' }),
  getSupplierLedger: (bizId: number, suppId: number, from?: string, to?: string) =>
    request<any>(`/businesses/${bizId}/suppliers/${suppId}/ledger?from=${from || ''}&to=${to || ''}`),

  // Bank Accounts & Multi-Business
  getAccounts: (bizId: number) => request<any>(`/businesses/${bizId}/bank-accounts`),
  getBankAccounts: (bizId: number) => request<any>(`/businesses/${bizId}/bank-accounts`),
  createBankAccount: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bank-accounts`, { method: 'POST', body: JSON.stringify(payload) }),
  updateBankAccount: (bizId: number, accId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bank-accounts/${accId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteBankAccount: (bizId: number, accId: number) =>
    request<any>(`/businesses/${bizId}/bank-accounts/${accId}`, {
      method: 'DELETE',
    }),
  convertBankAccount: (bizId: number, accId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bank-accounts/${accId}/convert`, { method: 'POST', body: JSON.stringify(payload) }),
  convertAccountToIndividual: (bizId: number, payload: { bank_account_id: number; target_business_id?: number }) =>
    request<any>(`/businesses/${bizId}/bank-accounts/${payload.bank_account_id}/convert`, {
      method: 'POST',
      body: JSON.stringify({
        target_scope: 'individual',
        target_business_id: payload.target_business_id,
      }),
    }),
  convertAccountToMultiple: (bizId: number, payload: { bank_account_id: number; business_ids: number[] }) =>
    request<any>(`/businesses/${bizId}/bank-accounts/${payload.bank_account_id}/convert`, {
      method: 'POST',
      body: JSON.stringify({
        target_scope: 'multiple',
        additional_business_ids: payload.business_ids,
      }),
    }),
  getBankStatement: (bizId: number, accId: number, scope: 'combined' | 'business', from?: string, to?: string) =>
    request<any>(
      `/businesses/${bizId}/bank-accounts/${accId}/statement?scope=${scope}&from=${from || ''}&to=${to || ''}`
    ),

  // Sales Orders
  getSalesOrders: (bizId: number) => request<any>(`/businesses/${bizId}/sales-orders`),
  createSalesOrder: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/sales-orders`, { method: 'POST', body: JSON.stringify(payload) }),
  updateSalesOrder: (bizId: number, orderId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/sales-orders/${orderId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateSalesOrderStatus: (bizId: number, orderId: number, status: string) =>
    request<any>(`/businesses/${bizId}/sales-orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSalesOrder: (bizId: number, orderId: number) =>
    request<any>(`/businesses/${bizId}/sales-orders/${orderId}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (bizId: number) => request<any>(`/businesses/${bizId}/invoices`),
  createInvoice: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/invoices`, { method: 'POST', body: JSON.stringify(payload) }),
  updateInvoice: (bizId: number, invId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/invoices/${invId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteInvoice: (bizId: number, invId: number) =>
    request<any>(`/businesses/${bizId}/invoices/${invId}`, { method: 'DELETE' }),
  cancelInvoice: (bizId: number, invId: number) =>
    request<any>(`/businesses/${bizId}/invoices/${invId}/cancel`, { method: 'POST' }),

  // Receipts
  getReceipts: (bizId: number) => request<any>(`/businesses/${bizId}/receipts`),
  createReceipt: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/receipts`, { method: 'POST', body: JSON.stringify(payload) }),
  updateReceipt: (bizId: number, rcptId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/receipts/${rcptId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReceipt: (bizId: number, rcptId: number) =>
    request<any>(`/businesses/${bizId}/receipts/${rcptId}`, { method: 'DELETE' }),

  // Purchase Orders
  getPurchaseOrders: (bizId: number) => request<any>(`/businesses/${bizId}/purchase-orders`),
  createPurchaseOrder: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/purchase-orders`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePurchaseOrder: (bizId: number, orderId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/purchase-orders/${orderId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updatePurchaseOrderStatus: (bizId: number, orderId: number, status: string) =>
    request<any>(`/businesses/${bizId}/purchase-orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deletePurchaseOrder: (bizId: number, orderId: number) =>
    request<any>(`/businesses/${bizId}/purchase-orders/${orderId}`, { method: 'DELETE' }),

  // Bills
  getBills: (bizId: number) => request<any>(`/businesses/${bizId}/bills`),
  createBill: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bills`, { method: 'POST', body: JSON.stringify(payload) }),
  updateBill: (bizId: number, billId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bills/${billId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBill: (bizId: number, billId: number) =>
    request<any>(`/businesses/${bizId}/bills/${billId}`, { method: 'DELETE' }),

  // Payments
  getPayments: (bizId: number) => request<any>(`/businesses/${bizId}/payments`),
  createPayment: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/payments`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePayment: (bizId: number, payId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/payments/${payId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePayment: (bizId: number, payId: number) =>
    request<any>(`/businesses/${bizId}/payments/${payId}`, { method: 'DELETE' }),

  // Warehouses
  getWarehouses: (bizId: number) => request<{ warehouses: any[] }>(`/businesses/${bizId}/warehouses`),
  createWarehouse: (bizId: number, payload: any) =>
    request<{ success: boolean; warehouse: any }>(`/businesses/${bizId}/warehouses`, { method: 'POST', body: JSON.stringify(payload) }),
  updateWarehouse: (bizId: number, warehouseId: number, payload: any) =>
    request<{ success: boolean; warehouse: any }>(`/businesses/${bizId}/warehouses/${warehouseId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWarehouse: (bizId: number, warehouseId: number) =>
    request<{ success: boolean }>(`/businesses/${bizId}/warehouses/${warehouseId}`, { method: 'DELETE' }),
  getWarehouseStock: (bizId: number, warehouseId: number) =>
    request<{ warehouse: any; inventory: any[] }>(`/businesses/${bizId}/warehouses/${warehouseId}/stock`),

  // Stock Transfers & Adjustments
  getStockTransfers: (bizId: number) => request<any>(`/businesses/${bizId}/stock-transfers`),
  createStockTransfer: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/stock-transfers`, { method: 'POST', body: JSON.stringify(payload) }),
  updateStockTransfer: (bizId: number, trfId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/stock-transfers/${trfId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStockTransfer: (bizId: number, trfId: number) =>
    request<any>(`/businesses/${bizId}/stock-transfers/${trfId}`, { method: 'DELETE' }),
  getStockAdjustments: (bizId: number) => request<any>(`/businesses/${bizId}/stock-adjustments`),
  createStockAdjustment: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/stock-adjustments`, { method: 'POST', body: JSON.stringify(payload) }),
  updateStockAdjustment: (bizId: number, adjId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/stock-adjustments/${adjId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStockAdjustment: (bizId: number, adjId: number) =>
    request<any>(`/businesses/${bizId}/stock-adjustments/${adjId}`, { method: 'DELETE' }),

  // Other Payments & Receipts & Transfers
  getOtherPayments: (bizId: number) => request<any>(`/businesses/${bizId}/other-payments`),
  createOtherPayment: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/other-payments`, { method: 'POST', body: JSON.stringify(payload) }),
  updateOtherPayment: (bizId: number, id: number, payload: any) =>
    request<any>(`/businesses/${bizId}/other-payments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOtherPayment: (bizId: number, id: number) =>
    request<any>(`/businesses/${bizId}/other-payments/${id}`, { method: 'DELETE' }),
  getOtherReceipts: (bizId: number) => request<any>(`/businesses/${bizId}/other-receipts`),
  createOtherReceipt: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/other-receipts`, { method: 'POST', body: JSON.stringify(payload) }),
  updateOtherReceipt: (bizId: number, id: number, payload: any) =>
    request<any>(`/businesses/${bizId}/other-receipts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOtherReceipt: (bizId: number, id: number) =>
    request<any>(`/businesses/${bizId}/other-receipts/${id}`, { method: 'DELETE' }),
  getBankTransfers: (bizId: number) => request<any>(`/businesses/${bizId}/bank-transfers`),
  createBankTransfer: (bizId: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bank-transfers`, { method: 'POST', body: JSON.stringify(payload) }),
  updateBankTransfer: (bizId: number, id: number, payload: any) =>
    request<any>(`/businesses/${bizId}/bank-transfers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBankTransfer: (bizId: number, id: number) =>
    request<any>(`/businesses/${bizId}/bank-transfers/${id}`, { method: 'DELETE' }),

  // Reports
  getSummaryReport: (bizId: number, from?: string, to?: string) =>
    request<any>(`/businesses/${bizId}/reports/summary?from=${from || ''}&to=${to || ''}`),
  getStockMovements: (bizId: number, productId?: number) =>
    request<any>(`/businesses/${bizId}/reports/stock-movement?productId=${productId || ''}`),

  // PHP Source Export
  getPhpFiles: () => request<{ files: any[] }>('/php-export/files'),

  // ==========================================
  // HR & PAYROLL SYSTEM API
  // ==========================================
  // Employees
  getEmployees: (bizId: number) => request<{ employees: any[] }>(`/businesses/${bizId}/employees`),
  getEmployee: (bizId: number, empId: number) => request<{ employee: any }>(`/businesses/${bizId}/employees/${empId}`),
  createEmployee: (bizId: number, payload: any) =>
    request<{ success: boolean; employee: any }>(`/businesses/${bizId}/employees`, { method: 'POST', body: JSON.stringify(payload) }),
  updateEmployee: (bizId: number, empId: number, payload: any) =>
    request<{ success: boolean; employee: any }>(`/businesses/${bizId}/employees/${empId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEmployee: (bizId: number, empId: number) =>
    request<{ success: boolean }>(`/businesses/${bizId}/employees/${empId}`, { method: 'DELETE' }),

  // Attendance
  getAttendances: (bizId: number, month?: string, date?: string, employeeId?: number) =>
    request<{ attendances: any[] }>(`/businesses/${bizId}/attendances?month=${month || ''}&date=${date || ''}&employeeId=${employeeId || ''}`),
  saveAttendance: (bizId: number, payload: any) =>
    request<{ success: boolean; attendance: any }>(`/businesses/${bizId}/attendances`, { method: 'POST', body: JSON.stringify(payload) }),
  saveBulkAttendance: (bizId: number, payload: { date: string; records: any[] }) =>
    request<{ success: boolean; count: number }>(`/businesses/${bizId}/attendances/bulk`, { method: 'POST', body: JSON.stringify(payload) }),

  // Public Holidays
  getPublicHolidays: (bizId: number) => request<{ holidays: any[] }>(`/businesses/${bizId}/public-holidays`),
  createPublicHoliday: (bizId: number, payload: any) =>
    request<{ success: boolean; holiday: any }>(`/businesses/${bizId}/public-holidays`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePublicHoliday: (bizId: number, holId: number, payload: any) =>
    request<{ success: boolean; holiday: any }>(`/businesses/${bizId}/public-holidays/${holId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePublicHoliday: (bizId: number, holId: number) =>
    request<{ success: boolean }>(`/businesses/${bizId}/public-holidays/${holId}`, { method: 'DELETE' }),

  // Kharchas (Employee Expenses)
  getKharchas: (bizId: number, employeeId?: number, month?: string) =>
    request<{ kharchas: any[] }>(`/businesses/${bizId}/kharchas?employeeId=${employeeId || ''}&month=${month || ''}`),
  createKharcha: (bizId: number, payload: any) =>
    request<{ success: boolean; kharcha: any }>(`/businesses/${bizId}/kharchas`, { method: 'POST', body: JSON.stringify(payload) }),
  createBulkKharcha: (bizId: number, payload: { items: any[] }) =>
    request<{ success: boolean; count: number; totalAmount: number }>(`/businesses/${bizId}/kharchas/bulk`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteKharcha: (bizId: number, kharchaId: number) =>
    request<{ success: boolean }>(`/businesses/${bizId}/kharchas/${kharchaId}`, { method: 'DELETE' }),

  // Advances
  getAdvances: (bizId: number, employeeId?: number) =>
    request<{ advances: any[] }>(`/businesses/${bizId}/advances?employeeId=${employeeId || ''}`),
  createAdvance: (bizId: number, payload: any) =>
    request<{ success: boolean; advance: any }>(`/businesses/${bizId}/advances`, { method: 'POST', body: JSON.stringify(payload) }),
  settleAdvance: (bizId: number, advanceId: number, amount?: number) =>
    request<{ success: boolean }>(`/businesses/${bizId}/advances/${advanceId}/settle`, { method: 'POST', body: JSON.stringify({ amount }) }),

  // Bonuses
  getBonuses: (bizId: number, employeeId?: number, month?: string) =>
    request<{ bonuses: any[] }>(`/businesses/${bizId}/bonuses?employeeId=${employeeId || ''}&month=${month || ''}`),
  createBonus: (bizId: number, payload: any) =>
    request<{ success: boolean; bonus: any }>(`/businesses/${bizId}/bonuses`, { method: 'POST', body: JSON.stringify(payload) }),
  createBulkBonus: (bizId: number, payload: { items: any[] }) =>
    request<{ success: boolean; count: number; totalAmount: number }>(`/businesses/${bizId}/bonuses/bulk`, { method: 'POST', body: JSON.stringify(payload) }),

  // Other Deductions
  getOtherDeductions: (bizId: number, employeeId?: number, month?: string) =>
    request<{ deductions: any[] }>(`/businesses/${bizId}/other-deductions?employeeId=${employeeId || ''}&month=${month || ''}`),
  createOtherDeduction: (bizId: number, payload: any) =>
    request<{ success: boolean; deduction: any }>(`/businesses/${bizId}/other-deductions`, { method: 'POST', body: JSON.stringify(payload) }),

  // Payroll
  getMonthlyPayroll: (bizId: number, month?: string) =>
    request<{ payroll: any; items: any[] }>(`/businesses/${bizId}/payroll?month=${month || ''}`),
  calculatePayroll: (bizId: number, month: string) =>
    request<{ success: boolean; payroll: any; items: any[] }>(`/businesses/${bizId}/payroll/calculate`, { method: 'POST', body: JSON.stringify({ month }) }),
  finalizePayroll: (bizId: number, month: string) =>
    request<{ success: boolean; payroll: any }>(`/businesses/${bizId}/payroll/finalize`, { method: 'POST', body: JSON.stringify({ month }) }),
  reopenPayroll: (bizId: number, month: string) =>
    request<{ success: boolean; payroll: any }>(`/businesses/${bizId}/payroll/reopen`, { method: 'POST', body: JSON.stringify({ month }) }),
  paySalary: (bizId: number, payload: any) =>
    request<{ success: boolean; item: any }>(`/businesses/${bizId}/payroll/pay`, { method: 'POST', body: JSON.stringify(payload) }),
  payBulkSalaries: (bizId: number, payload: { month: string; payment_account_id: number; payment_method: string; item_ids: number[] }) =>
    request<{ success: boolean; count: number; totalPaid: number }>(`/businesses/${bizId}/payroll/pay-bulk`, { method: 'POST', body: JSON.stringify(payload) }),

  // Employee Statement & Audit
  getEmployeeStatement: (bizId: number, employeeId: number, from?: string, to?: string) =>
    request<any>(`/businesses/${bizId}/employees/${employeeId}/statement?from=${from || ''}&to=${to || ''}`),
  getHRSummary: (bizId: number, month?: string) =>
    request<any>(`/businesses/${bizId}/hr-summary?month=${month || ''}`),
  getHRAuditLogs: (bizId: number, employeeId?: number) =>
    request<{ logs: any[] }>(`/businesses/${bizId}/hr-audit-logs?employeeId=${employeeId || ''}`),
};
