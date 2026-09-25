import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Business,
  ProductCategory,
  Product,
  Customer,
  Supplier,
  BankAccount,
  BusinessBankAccount,
  BankTransaction,
  Invoice,
  InvoiceItem,
  Receipt,
  Bill,
  BillItem,
  Payment,
  LedgerEntry,
  StockTransaction,
  SystemSetting,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  StockTransfer,
  StockAdjustment,
  OtherPayment,
  OtherReceipt,
  BankTransfer,
  Warehouse,
  WarehouseProductStock,
  StockTransferItem,
  Employee,
  SalaryPayment,
  AttendanceRecord,
  PublicHoliday,
  KharchaRecord,
  AdvanceRecord,
  BonusRecord,
  OtherDeductionRecord,
  MonthlyPayroll,
  PayrollItem,
  HRAuditLog,
  EmployeeStatementEntry,
  AttendanceStatus,
  UnifiedParty,
  UnifiedLedgerRow,
  TransactionAuditLog,
} from './types.ts';

interface DatabaseSchema {
  users: User[];
  businesses: Business[];
  product_categories: ProductCategory[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  bank_accounts: BankAccount[];
  business_bank_accounts: BusinessBankAccount[];
  bank_transactions: BankTransaction[];
  invoices: Invoice[];
  invoice_items: InvoiceItem[];
  receipts: Receipt[];
  bills: Bill[];
  bill_items: BillItem[];
  payments: Payment[];
  ledger_entries: LedgerEntry[];
  stock_transactions: StockTransaction[];
  system_settings: SystemSetting[];
  sales_orders?: SalesOrder[];
  sales_order_items?: SalesOrderItem[];
  purchase_orders?: PurchaseOrder[];
  purchase_order_items?: PurchaseOrderItem[];
  stock_transfers?: StockTransfer[];
  stock_adjustments?: StockAdjustment[];
  other_payments?: OtherPayment[];
  other_receipts?: OtherReceipt[];
  bank_transfers?: BankTransfer[];
  warehouses?: Warehouse[];
  warehouse_stocks?: WarehouseProductStock[];
  stock_transfer_items?: StockTransferItem[];
  employees?: Employee[];
  salary_payments?: SalaryPayment[];
  attendances?: AttendanceRecord[];
  public_holidays?: PublicHoliday[];
  kharchas?: KharchaRecord[];
  advances?: AdvanceRecord[];
  bonuses?: BonusRecord[];
  other_deductions?: OtherDeductionRecord[];
  monthly_payrolls?: MonthlyPayroll[];
  payroll_items?: PayrollItem[];
  hr_audit_logs?: HRAuditLog[];
  transaction_audit_logs?: TransactionAuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'accounting_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function hashPassword(password: string): string {
  const salt = 'php_accounting_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  const adminPassword = hashPassword('admin123');
  const merchantPassword = hashPassword('merchant123');

  return {
    users: [
      {
        id: 1,
        name: 'Super Administrator',
        email: 'admin@accounting.com',
        password_hash: adminPassword,
        google_id: null,
        profile_image: null,
        auth_provider: 'email',
        email_verified: true,
        role: 'admin',
        business_limit: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'Hassan Merchant',
        email: 'merchant@example.com',
        password_hash: merchantPassword,
        google_id: null,
        profile_image: null,
        auth_provider: 'email',
        email_verified: true,
        role: 'user',
        business_limit: 5,
        created_at: now,
        updated_at: now,
      },
    ],
    businesses: [
      {
        id: 1,
        user_id: 2,
        name: 'Apex Electronics Store',
        logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=160&auto=format&fit=crop&q=80',
        icon: '⚡',
        address: '104 Tech Boulevard, Silicon Valley',
        phone: '+1 (555) 234-5678',
        email: 'contact@apexelectronics.com',
        currency: 'USD',
        tax_number: 'TX-998231',
        status: 'active',
        created_at: now,
      },
      {
        id: 2,
        user_id: 2,
        name: 'BlueWave Lifestyle & Goods',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=160&auto=format&fit=crop&q=80',
        icon: '🌊',
        address: '77 Ocean Marina Avenue, Suite 4',
        phone: '+1 (555) 876-5432',
        email: 'info@bluewavegoods.com',
        currency: 'USD',
        tax_number: 'TX-774412',
        status: 'active',
        created_at: now,
      },
    ],
    product_categories: [
      {
        id: 1,
        business_id: 1,
        name: 'Laptops & Devices',
        description: 'High performance portable workstations and computers',
        created_at: now,
      },
      {
        id: 2,
        business_id: 1,
        name: 'Audio & Peripherals',
        description: 'Headphones, monitors, keyboards and accessories',
        created_at: now,
      },
      {
        id: 3,
        business_id: 2,
        name: 'Apparel & Outerwear',
        description: 'Sustainable cotton hoodies and jackets',
        created_at: now,
      },
    ],
    products: [
      {
        id: 1,
        business_id: 1,
        category_id: 1,
        name: 'MacBook Pro M3 Max 16"',
        sku: 'APX-MBP-16',
        purchase_price: 2100.0,
        selling_price: 2699.0,
        weight: '2.1 kg',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
        opening_stock: 15,
        current_stock: 14,
        created_at: now,
      },
      {
        id: 2,
        business_id: 1,
        category_id: 2,
        name: 'Studio Wireless Headphones',
        sku: 'APX-SND-01',
        purchase_price: 180.0,
        selling_price: 299.0,
        weight: '0.4 kg',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        opening_stock: 30,
        current_stock: 28,
        created_at: now,
      },
      {
        id: 3,
        business_id: 1,
        category_id: 2,
        name: 'Mechanical RGB Keyboard',
        sku: 'APX-KEY-99',
        purchase_price: 85.0,
        selling_price: 149.0,
        weight: '0.9 kg',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
        opening_stock: 25,
        current_stock: 25,
        created_at: now,
      },
      {
        id: 4,
        business_id: 2,
        category_id: 3,
        name: 'Organic Crewneck Sweatshirt',
        sku: 'BW-CRW-BLU',
        purchase_price: 32.0,
        selling_price: 78.0,
        weight: '0.5 kg',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
        opening_stock: 50,
        current_stock: 50,
        created_at: now,
      },
    ],
    customers: [
      {
        id: 1,
        business_id: 1,
        name: 'Acme Digital Agency',
        phone: '+1 (555) 432-1098',
        email: 'billing@acmedigital.com',
        address: '500 Market St, Floor 12, San Francisco',
        opening_balance: 0,
        current_balance: 1498.0, // Invoice of 2998 - receipt of 1500
        created_at: now,
      },
      {
        id: 2,
        business_id: 1,
        name: 'Nexus Tech Labs',
        phone: '+1 (555) 654-9870',
        email: 'accounts@nexuslabs.io',
        address: '12 Innovation Way, Austin, TX',
        opening_balance: 500.0,
        current_balance: 500.0,
        created_at: now,
      },
      {
        id: 3,
        business_id: 2,
        name: 'Pacific Surf Club',
        phone: '+1 (555) 789-0123',
        email: 'crew@pacificsurf.com',
        address: '22 Boardwalk, Malibu, CA',
        opening_balance: 0,
        current_balance: 0,
        created_at: now,
      },
    ],
    suppliers: [
      {
        id: 1,
        business_id: 1,
        name: 'Global Chip & Logistics Corp',
        phone: '+1 (555) 901-2345',
        email: 'orders@globalchip.com',
        address: '888 Industrial Park, Chicago, IL',
        opening_balance: 2000.0,
        current_balance: 2000.0,
        created_at: now,
      },
      {
        id: 2,
        business_id: 2,
        name: 'EcoWeave Textiles Ltd',
        phone: '+1 (555) 345-6789',
        email: 'supply@ecoweave.org',
        address: '45 Textile Mill Rd, Portland, OR',
        opening_balance: 800.0,
        current_balance: 800.0,
        created_at: now,
      },
    ],
    bank_accounts: [
      {
        id: 1,
        user_id: 2,
        primary_business_id: 1,
        bank_name: 'Silicon Commercial Bank',
        account_title: 'Apex Electronics Operating Account',
        account_number: '9841-3320-1120',
        account_type: 'Checking',
        opening_balance: 12500.0,
        current_balance: 14000.0, // 12500 + 1500 receipt
        scope: 'individual',
        connected_business_ids: [1],
        created_at: now,
      },
      {
        id: 2,
        user_id: 2,
        primary_business_id: 1,
        bank_name: 'Metro Treasury Bank',
        account_title: 'Multi-Business Master Treasury',
        account_number: '5566-7788-9900',
        account_type: 'Treasury / Multi-Entity',
        opening_balance: 25000.0,
        current_balance: 25000.0,
        scope: 'multiple',
        connected_business_ids: [1, 2],
        created_at: now,
      },
    ],
    business_bank_accounts: [
      { id: 1, bank_account_id: 1, business_id: 1, created_at: now },
      { id: 2, bank_account_id: 2, business_id: 1, created_at: now },
      { id: 3, bank_account_id: 2, business_id: 2, created_at: now },
    ],
    bank_transactions: [
      {
        id: 1,
        bank_account_id: 1,
        business_id: 1,
        transaction_type: 'deposit',
        amount: 1500.0,
        reference_type: 'receipt',
        reference_id: 'REC-1001',
        description: 'Customer payment received from Acme Digital Agency',
        transaction_date: now.slice(0, 10),
        created_at: now,
      },
    ],
    invoices: [
      {
        id: 1,
        business_id: 1,
        customer_id: 1,
        invoice_number: 'INV-1001',
        invoice_date: now.slice(0, 10),
        subtotal: 2998.0,
        discount: 0,
        tax: 0,
        grand_total: 2998.0,
        notes: 'Thank you for your order! Net 30 payment terms.',
        status: 'confirmed',
        created_at: now,
      },
    ],
    invoice_items: [
      {
        id: 1,
        invoice_id: 1,
        product_id: 1,
        product_name: 'MacBook Pro M3 Max 16"',
        product_sku: 'APX-MBP-16',
        quantity: 1,
        unit_price: 2699.0,
        total_price: 2699.0,
      },
      {
        id: 2,
        invoice_id: 1,
        product_id: 2,
        product_name: 'Studio Wireless Headphones',
        product_sku: 'APX-SND-01',
        quantity: 1,
        unit_price: 299.0,
        total_price: 299.0,
      },
    ],
    receipts: [
      {
        id: 1,
        business_id: 1,
        customer_id: 1,
        bank_account_id: 1,
        receipt_number: 'REC-1001',
        amount: 1500.0,
        payment_date: now.slice(0, 10),
        reference_number: 'WIRE-ACME-4421',
        notes: 'Partial payment on INV-1001 via Silicon Commercial Bank',
        status: 'confirmed',
        created_at: now,
      },
    ],
    bills: [],
    bill_items: [],
    payments: [],
    ledger_entries: [
      {
        id: 1,
        business_id: 1,
        entity_type: 'customer',
        entity_id: 1,
        reference_type: 'invoice',
        reference_id: 'INV-1001',
        transaction_date: now.slice(0, 10),
        debit: 2998.0,
        credit: 0,
        running_balance: 2998.0,
        description: 'Sales Invoice INV-1001',
        created_at: now,
      },
      {
        id: 2,
        business_id: 1,
        entity_type: 'customer',
        entity_id: 1,
        reference_type: 'receipt',
        reference_id: 'REC-1001',
        transaction_date: now.slice(0, 10),
        debit: 0,
        credit: 1500.0,
        running_balance: 1498.0,
        description: 'Customer Payment Received REC-1001',
        created_at: now,
      },
    ],
    stock_transactions: [
      {
        id: 1,
        business_id: 1,
        product_id: 1,
        transaction_type: 'out',
        quantity: 1,
        unit_cost: 2100.0,
        reference_type: 'invoice',
        reference_id: 'INV-1001',
        notes: 'Sold on invoice INV-1001',
        created_at: now,
      },
      {
        id: 2,
        business_id: 1,
        product_id: 2,
        transaction_type: 'out',
        quantity: 1,
        unit_cost: 180.0,
        reference_type: 'invoice',
        reference_id: 'INV-1001',
        notes: 'Sold on invoice INV-1001',
        created_at: now,
      },
    ],
    system_settings: [
      {
        id: 1,
        setting_key: 'max_businesses_per_user',
        setting_value: '5',
        updated_at: now,
      },
    ],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        // Normalize users for Google OAuth fields
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users.forEach((u) => {
            if (!u.auth_provider) u.auth_provider = 'email';
            if (u.google_id === undefined) u.google_id = null;
            if (u.profile_image === undefined) u.profile_image = null;
            if (u.email_verified === undefined) u.email_verified = true;
            if (!u.updated_at) u.updated_at = u.created_at;
          });
        }

        // Reconcile bank account balances to guarantee accounting audit-trail integrity and prevent double-counting
        if (parsed.bank_accounts && Array.isArray(parsed.bank_accounts)) {
          let dirty = false;
          parsed.bank_accounts.forEach((acc) => {
            const accTxns = (parsed.bank_transactions || []).filter((t) => t.bank_account_id === acc.id);
            const hasOpeningTxn = accTxns.some((t) => t.reference_type === 'opening');
            let balance = hasOpeningTxn ? 0 : Number(acc.opening_balance || 0);
            for (const t of accTxns) {
              if (t.transaction_type === 'deposit') {
                balance += Number(t.amount || 0);
              } else {
                balance -= Number(t.amount || 0);
              }
            }
            if (acc.current_balance !== balance) {
              acc.current_balance = balance;
              dirty = true;
            }
          });
          if (dirty) {
            this.save(parsed);
          }
        }

        parsed.sales_orders = parsed.sales_orders || [];
        parsed.sales_order_items = parsed.sales_order_items || [];
        parsed.purchase_orders = parsed.purchase_orders || [];
        parsed.purchase_order_items = parsed.purchase_order_items || [];
        parsed.stock_transfers = parsed.stock_transfers || [];
        parsed.stock_adjustments = parsed.stock_adjustments || [];
        parsed.other_payments = parsed.other_payments || [];
        parsed.other_receipts = parsed.other_receipts || [];
        parsed.bank_transfers = parsed.bank_transfers || [];
        parsed.employees = parsed.employees || [];
        parsed.salary_payments = parsed.salary_payments || [];
        parsed.attendances = parsed.attendances || [];
        parsed.public_holidays = parsed.public_holidays || [];
        parsed.kharchas = parsed.kharchas || [];
        parsed.advances = parsed.advances || [];
        parsed.bonuses = parsed.bonuses || [];
        parsed.other_deductions = parsed.other_deductions || [];
        parsed.monthly_payrolls = parsed.monthly_payrolls || [];
        parsed.payroll_items = parsed.payroll_items || [];
        parsed.hr_audit_logs = parsed.hr_audit_logs || [];
        parsed.transaction_audit_logs = parsed.transaction_audit_logs || [];

        // Ensure party normalization
        if (parsed.customers && Array.isArray(parsed.customers)) {
          parsed.customers.forEach((c) => {
            if (!c.party_id) c.party_id = c.id;
            if (c.is_customer === undefined) c.is_customer = true;
            if (!c.status) c.status = 'active';
          });
        }
        if (parsed.suppliers && Array.isArray(parsed.suppliers)) {
          parsed.suppliers.forEach((s) => {
            if (!s.party_id) {
              const matchedCustomer = (parsed.customers || []).find(
                (c) => c.business_id === s.business_id && c.name.toLowerCase().trim() === s.name.toLowerCase().trim()
              );
              if (matchedCustomer) {
                s.party_id = matchedCustomer.party_id;
                s.is_customer = true;
                s.is_supplier = true;
                s.linked_customer_id = matchedCustomer.id;
                matchedCustomer.is_supplier = true;
                matchedCustomer.linked_supplier_id = s.id;
              } else {
                s.party_id = 50000 + s.id;
                s.is_supplier = true;
              }
            }
            if (s.is_supplier === undefined) s.is_supplier = true;
            if (!s.status) s.status = 'active';
          });
        }

        return parsed;
      }
    } catch (e) {
      console.error('Failed to load database file, initializing fresh:', e);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const payload = JSON.stringify(dataToSave || this.data, null, 2);
      fs.writeFileSync(DB_FILE, payload, 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file:', e);
    }
  }

  // System Settings
  getGlobalBusinessLimit(): number {
    const s = this.data.system_settings.find((x) => x.setting_key === 'max_businesses_per_user');
    return s ? parseInt(s.setting_value, 10) : 5;
  }

  setGlobalBusinessLimit(limit: number) {
    const s = this.data.system_settings.find((x) => x.setting_key === 'max_businesses_per_user');
    if (s) {
      s.setting_value = limit.toString();
      s.updated_at = new Date().toISOString();
    } else {
      this.data.system_settings.push({
        id: Date.now(),
        setting_key: 'max_businesses_per_user',
        setting_value: limit.toString(),
        updated_at: new Date().toISOString(),
      });
    }
    this.save();
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserByGoogleId(googleId: string): User | undefined {
    return this.data.users.find((u) => u.google_id === googleId);
  }

  createUser(
    name: string,
    email: string,
    passwordHash: string | null,
    role: 'admin' | 'user' = 'user',
    authProvider: 'email' | 'google' | 'linked' = 'email',
    googleId: string | null = null,
    profileImage: string | null = null
  ): User {
    const id = this.data.users.length ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1;
    const now = new Date().toISOString();
    const user: User = {
      id,
      name,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role,
      business_limit: null,
      auth_provider: authProvider,
      google_id: googleId,
      profile_image: profileImage,
      email_verified: true,
      created_at: now,
      updated_at: now,
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  createOrLoginGoogleUser(params: {
    googleId: string;
    email: string;
    name: string;
    profileImage?: string | null;
  }): { user: User; isNew: boolean; linked: boolean } {
    const normEmail = params.email.trim().toLowerCase();
    const now = new Date().toISOString();

    // 1. Check if user already exists with this google_id
    const existingGoogleUser = this.getUserByGoogleId(params.googleId);
    if (existingGoogleUser) {
      if (params.profileImage && !existingGoogleUser.profile_image) {
        existingGoogleUser.profile_image = params.profileImage;
      }
      existingGoogleUser.updated_at = now;
      this.save();
      return { user: existingGoogleUser, isNew: false, linked: false };
    }

    // 2. Check if user already exists with this email (Account Linking flow)
    const existingEmailUser = this.getUserByEmail(normEmail);
    if (existingEmailUser) {
      existingEmailUser.google_id = params.googleId;
      if (params.profileImage && !existingEmailUser.profile_image) {
        existingEmailUser.profile_image = params.profileImage;
      }
      existingEmailUser.auth_provider = existingEmailUser.password_hash ? 'linked' : 'google';
      existingEmailUser.email_verified = true;
      existingEmailUser.updated_at = now;
      this.save();
      return { user: existingEmailUser, isNew: false, linked: true };
    }

    // 3. First-time Google user -> create new account
    const id = this.data.users.length ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id,
      name: params.name || normEmail.split('@')[0],
      email: normEmail,
      password_hash: null,
      google_id: params.googleId,
      profile_image: params.profileImage || null,
      auth_provider: 'google',
      email_verified: true,
      role: 'user',
      business_limit: null, // respects global limit
      created_at: now,
      updated_at: now,
    };
    this.data.users.push(newUser);
    this.save();
    return { user: newUser, isNew: true, linked: false };
  }

  linkGoogleAccount(
    userId: number,
    googleId: string,
    googleEmail: string,
    profileImage?: string | null
  ): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    // Check if googleId is already taken by another user
    const existingWithGoogle = this.getUserByGoogleId(googleId);
    if (existingWithGoogle && existingWithGoogle.id !== userId) {
      return {
        success: false,
        error: `This Google account is already connected to another user account (${existingWithGoogle.email}).`,
      };
    }

    user.google_id = googleId;
    if (profileImage && !user.profile_image) {
      user.profile_image = profileImage;
    }
    user.auth_provider = user.password_hash ? 'linked' : 'google';
    user.email_verified = true;
    user.updated_at = new Date().toISOString();
    this.save();
    return { success: true, user };
  }

  unlinkGoogleAccount(userId: number): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    if (!user.password_hash) {
      return {
        success: false,
        error: 'You cannot disconnect your Google account without first setting an email password, or you would be locked out.',
      };
    }

    user.google_id = null;
    user.auth_provider = 'email';
    user.updated_at = new Date().toISOString();
    this.save();
    return { success: true, user };
  }

  setUserPassword(userId: number, newPasswordHash: string): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    user.password_hash = newPasswordHash;
    user.auth_provider = user.google_id ? 'linked' : 'email';
    user.updated_at = new Date().toISOString();
    this.save();
    return { success: true, user };
  }

  updateUserLimit(userId: number, limit: number | null): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.business_limit = limit;
    this.save();
    return user;
  }

  // Effective limit for a user
  getUserEffectiveLimit(userId: number): number {
    const user = this.getUserById(userId);
    if (!user) return this.getGlobalBusinessLimit();
    if (user.business_limit !== null && user.business_limit !== undefined) {
      return user.business_limit;
    }
    return this.getGlobalBusinessLimit();
  }

  // Businesses
  getBusinessesByUserId(userId: number): Business[] {
    return this.data.businesses.filter((b) => b.user_id === userId);
  }

  getBusinessById(id: number): Business | undefined {
    return this.data.businesses.find((b) => b.id === id);
  }

  getAllBusinesses(): Business[] {
    return this.data.businesses;
  }

  createBusiness(params: {
    userId: number;
    name: string;
    logo?: string;
    icon?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
    taxNumber?: string;
  }): { success: boolean; business?: Business; error?: string } {
    const userBusinesses = this.getBusinessesByUserId(params.userId);
    const limit = this.getUserEffectiveLimit(params.userId);

    if (userBusinesses.length >= limit) {
      return {
        success: false,
        error: `Business creation limit reached. Your current limit is ${limit} business${limit === 1 ? '' : 'es'}. Please contact administrator to increase your limit.`,
      };
    }

    const id = this.data.businesses.length ? Math.max(...this.data.businesses.map((b) => b.id)) + 1 : 1;
    const business: Business = {
      id,
      user_id: params.userId,
      name: params.name.trim(),
      logo: params.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
      icon: params.icon || '🏢',
      address: params.address || '',
      phone: params.phone || '',
      email: params.email || '',
      currency: params.currency || 'USD',
      tax_number: params.taxNumber || '',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.data.businesses.push(business);

    // Pre-create standard default product categories for ease of start
    this.createProductCategory(id, 'General Inventory', 'Standard retail items');

    this.save();
    return { success: true, business };
  }

  updateBusinessStatus(businessId: number, status: 'active' | 'inactive'): Business | undefined {
    const b = this.getBusinessById(businessId);
    if (b) {
      b.status = status;
      this.save();
    }
    return b;
  }

  updateBusiness(
    businessId: number,
    params: {
      name?: string;
      logo?: string;
      icon?: string;
      address?: string;
      phone?: string;
      email?: string;
      currency?: string;
      tax_number?: string;
      status?: 'active' | 'inactive';
    }
  ): Business | undefined {
    const b = this.getBusinessById(businessId);
    if (!b) return undefined;
    if (params.name !== undefined && params.name.trim()) b.name = params.name.trim();
    if (params.logo !== undefined) b.logo = params.logo;
    if (params.icon !== undefined) b.icon = params.icon;
    if (params.address !== undefined) b.address = params.address;
    if (params.phone !== undefined) b.phone = params.phone;
    if (params.email !== undefined) b.email = params.email;
    if (params.currency !== undefined) b.currency = params.currency;
    if (params.tax_number !== undefined) b.tax_number = params.tax_number;
    if (params.status !== undefined) b.status = params.status;
    this.save();
    return b;
  }

  getSalaryPayments(businessId: number): SalaryPayment[] {
    this.data.salary_payments = this.data.salary_payments || [];
    return this.data.salary_payments.filter((s) => s.business_id === businessId);
  }

  createSalaryPayment(
    businessId: number,
    params: {
      employeeId: number;
      employeeName?: string;
      month: string;
      salaryAmount: number;
      bonus?: number;
      deduction?: number;
      paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
      paymentDate?: string;
      referenceNo?: string;
      notes?: string;
    }
  ): SalaryPayment {
    this.data.salary_payments = this.data.salary_payments || [];
    const id = this.data.salary_payments.length ? Math.max(...this.data.salary_payments.map((s) => s.id)) + 1 : 1;
    const bonus = params.bonus || 0;
    const deduction = params.deduction || 0;
    const netPaid = Math.max(0, params.salaryAmount + bonus - deduction);

    const payment: SalaryPayment = {
      id,
      business_id: businessId,
      employee_id: params.employeeId,
      employee_name: params.employeeName,
      month: params.month,
      salary_amount: params.salaryAmount,
      bonus,
      deduction,
      net_paid: netPaid,
      payment_method: params.paymentMethod,
      payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
      status: 'paid',
      reference_no: params.referenceNo || `SAL-${Date.now().toString().slice(-6)}`,
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };
    this.data.salary_payments.push(payment);
    this.save();
    return payment;
  }

  // Product Categories
  getCategories(businessId: number): ProductCategory[] {
    return this.data.product_categories.filter((c) => c.business_id === businessId);
  }

  createProductCategory(businessId: number, name: string, description: string = ''): ProductCategory {
    const id = this.data.product_categories.length ? Math.max(...this.data.product_categories.map((c) => c.id)) + 1 : 1;
    const cat: ProductCategory = {
      id,
      business_id: businessId,
      name: name.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
    };
    this.data.product_categories.push(cat);
    this.save();
    return cat;
  }

  updateProductCategory(id: number, businessId: number, name: string, description: string): ProductCategory | undefined {
    const cat = this.data.product_categories.find((c) => c.id === id && c.business_id === businessId);
    if (!cat) return undefined;
    cat.name = name.trim();
    cat.description = description.trim();
    this.save();
    return cat;
  }

  deleteProductCategory(
    id: number,
    businessId: number,
    reassignToCategoryId?: number
  ): { success: boolean; reassignedCount: number; targetCategoryId?: number; error?: string } {
    const idx = this.data.product_categories.findIndex((c) => c.id === id && c.business_id === businessId);
    if (idx === -1) return { success: false, reassignedCount: 0, error: 'Category not found' };

    // Find all products currently in this category
    const assignedProducts = this.data.products.filter(
      (p) => p.category_id === id && p.business_id === businessId
    );

    let targetCatId = reassignToCategoryId;

    if (assignedProducts.length > 0) {
      // Validate or resolve target category
      let targetCat = targetCatId
        ? this.data.product_categories.find(
            (c) => c.id === targetCatId && c.id !== id && c.business_id === businessId
          )
        : undefined;

      // If no valid target specified, find any other category or create "General Inventory"
      if (!targetCat) {
        targetCat = this.data.product_categories.find(
          (c) => c.id !== id && c.business_id === businessId
        );
      }

      if (!targetCat) {
        // Create a default fallback category so no data is ever lost
        targetCat = this.createProductCategory(businessId, 'General Inventory', 'Default category for unassigned products');
      }

      targetCatId = targetCat.id;

      // Safely reassign all products
      for (const prod of assignedProducts) {
        prod.category_id = targetCatId;
      }
    }

    // Now safe to delete the category
    this.data.product_categories.splice(idx, 1);
    this.save();

    return {
      success: true,
      reassignedCount: assignedProducts.length,
      targetCategoryId: targetCatId,
    };
  }

  // Products
  getProducts(businessId: number): Product[] {
    const cats = this.getCategories(businessId);
    const catMap = new Map(cats.map((c) => [c.id, c.name]));
    return this.data.products
      .filter((p) => p.business_id === businessId)
      .map((p) => ({
        ...p,
        category_name: catMap.get(p.category_id) || 'Uncategorized',
      }));
  }

  getProductById(id: number, businessId: number): Product | undefined {
    return this.getProducts(businessId).find((p) => p.id === id);
  }

  createProduct(params: {
    businessId: number;
    categoryId: number;
    name: string;
    sku: string;
    purchasePrice: number;
    sellingPrice: number;
    weight: string;
    image: string;
    openingStock: number;
  }): Product {
    const id = this.data.products.length ? Math.max(...this.data.products.map((p) => p.id)) + 1 : 1;
    const product: Product = {
      id,
      business_id: params.businessId,
      category_id: params.categoryId,
      name: params.name.trim(),
      sku: params.sku.trim(),
      purchase_price: Number(params.purchasePrice) || 0,
      selling_price: Number(params.sellingPrice) || 0,
      weight: params.weight.trim(),
      image: params.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
      opening_stock: Number(params.openingStock) || 0,
      current_stock: Number(params.openingStock) || 0,
      created_at: new Date().toISOString(),
    };

    this.data.products.push(product);

    if (product.opening_stock > 0) {
      this.recordStockTransaction({
        businessId: params.businessId,
        productId: id,
        transactionType: 'opening',
        quantity: product.opening_stock,
        unitCost: product.purchase_price,
        referenceType: 'opening',
        referenceId: `STOCK-INIT-${id}`,
        notes: 'Initial opening stock',
      });
    }

    this.save();
    return product;
  }

  updateProduct(id: number, businessId: number, params: Partial<Product>): Product | undefined {
    const p = this.data.products.find((prod) => prod.id === id && prod.business_id === businessId);
    if (!p) return undefined;
    if (params.name !== undefined) p.name = params.name.trim();
    if (params.category_id !== undefined) p.category_id = params.category_id;
    if (params.sku !== undefined) p.sku = params.sku.trim();
    if (params.purchase_price !== undefined) p.purchase_price = Number(params.purchase_price);
    if (params.selling_price !== undefined) p.selling_price = Number(params.selling_price);
    if (params.weight !== undefined) p.weight = params.weight.trim();
    if (params.image !== undefined) p.image = params.image;
    this.save();
    return p;
  }

  deleteProduct(id: number, businessId: number): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id && p.business_id === businessId);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // Audit Log helper
  recordTransactionAuditLog(params: {
    businessId: number;
    transactionType: string;
    transactionId: number | string;
    referenceNo?: string;
    action: 'create' | 'edit' | 'delete' | 'copy' | 'cancel' | 'role_add' | 'role_remove';
    description: string;
    performedBy?: string;
    details?: string;
  }): TransactionAuditLog {
    this.data.transaction_audit_logs = this.data.transaction_audit_logs || [];
    const id = this.data.transaction_audit_logs.length
      ? Math.max(...this.data.transaction_audit_logs.map((l) => l.id)) + 1
      : 1;
    const log: TransactionAuditLog = {
      id,
      business_id: params.businessId,
      transaction_type: params.transactionType,
      transaction_id: params.transactionId,
      reference_no: params.referenceNo,
      action: params.action,
      description: params.description,
      performed_by: params.performedBy || 'System/Admin',
      details: params.details,
      created_at: new Date().toISOString(),
    };
    this.data.transaction_audit_logs.push(log);
    this.save();
    return log;
  }

  // --- UNIFIED PARTY / ENTITY MANAGEMENT ---
  private normalizeParties(businessId: number) {
    const customers = this.data.customers.filter((c) => c.business_id === businessId);
    const suppliers = this.data.suppliers.filter((s) => s.business_id === businessId);

    for (const c of customers) {
      if (!c.party_id) c.party_id = c.id;
      if (c.is_customer === undefined) c.is_customer = true;
      if (!c.status) c.status = 'active';

      // Check if there is a matching supplier by name or phone
      if (!c.linked_supplier_id) {
        const matchingSupp = suppliers.find(
          (s) =>
            s.id !== c.id &&
            (s.name.toLowerCase().trim() === c.name.toLowerCase().trim() ||
              (c.phone && s.phone && c.phone.trim() === s.phone.trim()))
        );
        if (matchingSupp) {
          matchingSupp.party_id = c.party_id;
          matchingSupp.is_customer = true;
          matchingSupp.is_supplier = true;
          matchingSupp.linked_customer_id = c.id;
          c.is_supplier = true;
          c.linked_supplier_id = matchingSupp.id;
        }
      }
    }

    for (const s of suppliers) {
      if (!s.party_id) s.party_id = 50000 + s.id;
      if (s.is_supplier === undefined) s.is_supplier = true;
      if (!s.status) s.status = 'active';
    }
  }

  getUnifiedParties(businessId: number): UnifiedParty[] {
    this.normalizeParties(businessId);
    const customers = this.data.customers.filter((c) => c.business_id === businessId);
    const suppliers = this.data.suppliers.filter((s) => s.business_id === businessId);
    const partyMap = new Map<number, UnifiedParty>();

    for (const c of customers) {
      const pId = c.party_id || c.id;
      partyMap.set(pId, {
        id: pId,
        business_id: businessId,
        customer_id: c.id,
        supplier_id: c.linked_supplier_id || null,
        name: c.name,
        company_name: c.company_name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        tax_number: c.tax_number,
        notes: c.notes,
        status: c.status || 'active',
        is_customer: c.is_customer !== false,
        is_supplier: !!c.is_supplier,
        customer_balance: c.current_balance,
        supplier_balance: 0,
        net_balance: c.current_balance,
        created_at: c.created_at,
      });
    }

    for (const s of suppliers) {
      const pId = s.party_id || s.id;
      const existing = partyMap.get(pId);
      if (existing) {
        existing.supplier_id = s.id;
        existing.is_supplier = s.is_supplier !== false;
        existing.supplier_balance = s.current_balance;
        existing.net_balance = existing.customer_balance - s.current_balance;
        if (!existing.company_name && s.company_name) existing.company_name = s.company_name;
        if (!existing.tax_number && s.tax_number) existing.tax_number = s.tax_number;
        if (!existing.city && s.city) existing.city = s.city;
        if (!existing.notes && s.notes) existing.notes = s.notes;
      } else {
        partyMap.set(pId, {
          id: pId,
          business_id: businessId,
          customer_id: s.linked_customer_id || null,
          supplier_id: s.id,
          name: s.name,
          company_name: s.company_name,
          phone: s.phone,
          email: s.email,
          address: s.address,
          city: s.city,
          tax_number: s.tax_number,
          notes: s.notes,
          status: s.status || 'active',
          is_customer: !!s.is_customer,
          is_supplier: s.is_supplier !== false,
          customer_balance: 0,
          supplier_balance: s.current_balance,
          net_balance: -s.current_balance,
          created_at: s.created_at,
        });
      }
    }

    return Array.from(partyMap.values());
  }

  getUnifiedPartyProfile(businessId: number, identifier: string | number): UnifiedParty | undefined {
    const list = this.getUnifiedParties(businessId);
    const idNum = typeof identifier === 'number' ? identifier : parseInt(identifier, 10);
    return list.find((p) => {
      if (idNum && (p.id === idNum || p.customer_id === idNum || p.supplier_id === idNum)) return true;
      if (p.id.toString() === identifier.toString()) return true;
      const strId = identifier.toString();
      if (strId.startsWith('c_') && p.customer_id === parseInt(strId.replace('c_', ''), 10)) return true;
      if (strId.startsWith('s_') && p.supplier_id === parseInt(strId.replace('s_', ''), 10)) return true;
      return false;
    });
  }

  // Combined Single Ledger for unified Customer + Supplier entity
  getUnifiedPartyLedger(
    businessId: number,
    identifier: string | number,
    fromDate?: string,
    toDate?: string
  ): {
    party: UnifiedParty | null;
    customer?: Customer;
    supplier?: Supplier;
    summary: {
      opening_receivable: number;
      opening_payable: number;
      opening_net: number;
      total_invoiced: number;
      total_received: number;
      total_billed: number;
      total_paid: number;
      current_receivable: number;
      current_payable: number;
      current_net: number;
    };
    rows: UnifiedLedgerRow[];
  } {
    const party = this.getUnifiedPartyProfile(businessId, identifier) || null;
    const idNum = typeof identifier === 'number' ? identifier : parseInt(identifier, 10);
    const customer = party?.customer_id
      ? this.getCustomerById(party.customer_id, businessId)
      : (idNum ? this.getCustomerById(idNum, businessId) : undefined);
    const supplier = party?.supplier_id
      ? this.getSupplierById(party.supplier_id, businessId)
      : (idNum ? this.getSupplierById(idNum, businessId) : undefined);

    // Retrieve all customer documents
    const invoices = customer
      ? (this.data.invoices || []).filter((i) => i.customer_id === customer.id && i.business_id === businessId && i.status !== 'cancelled')
      : [];
    const receipts = customer
      ? (this.data.receipts || []).filter((r) => r.customer_id === customer.id && r.business_id === businessId && r.status !== 'cancelled')
      : [];

    // Retrieve all supplier documents
    const bills = supplier
      ? (this.data.bills || []).filter((b) => b.supplier_id === supplier.id && b.business_id === businessId && b.status !== 'cancelled')
      : [];
    const payments = supplier
      ? (this.data.payments || []).filter((p) => p.supplier_id === supplier.id && p.business_id === businessId && p.status !== 'cancelled')
      : [];

    interface RawTxn {
      id: string;
      date: string;
      type: 'invoice' | 'bill' | 'receipt' | 'payment' | 'opening';
      typeLabel: string;
      ref: string;
      desc: string;
      receivableAmount?: number;
      payableAmount?: number;
      debit: number;
      credit: number;
      netChange: number;
    }

    const allTxns: RawTxn[] = [];

    // Opening balances
    if (customer && customer.opening_balance !== 0) {
      allTxns.push({
        id: `c-op-${customer.id}`,
        date: customer.created_at ? customer.created_at.slice(0, 10) : '2026-01-01',
        type: 'opening',
        typeLabel: 'Customer Opening Balance',
        ref: `CUST-OP-${customer.id}`,
        desc: 'Initial opening receivable balance',
        receivableAmount: customer.opening_balance,
        debit: customer.opening_balance > 0 ? customer.opening_balance : 0,
        credit: customer.opening_balance < 0 ? Math.abs(customer.opening_balance) : 0,
        netChange: customer.opening_balance,
      });
    }

    if (supplier && supplier.opening_balance !== 0) {
      allTxns.push({
        id: `s-op-${supplier.id}`,
        date: supplier.created_at ? supplier.created_at.slice(0, 10) : '2026-01-01',
        type: 'opening',
        typeLabel: 'Supplier Opening Balance',
        ref: `SUPP-OP-${supplier.id}`,
        desc: 'Initial opening payable balance',
        payableAmount: supplier.opening_balance,
        debit: supplier.opening_balance < 0 ? Math.abs(supplier.opening_balance) : 0,
        credit: supplier.opening_balance > 0 ? supplier.opening_balance : 0,
        netChange: -supplier.opening_balance,
      });
    }

    // Invoices: Party owes us (Receivable increases, Debit)
    for (const inv of invoices) {
      allTxns.push({
        id: `inv-${inv.id}`,
        date: inv.invoice_date,
        type: 'invoice',
        typeLabel: 'Sale Invoice',
        ref: inv.invoice_number,
        desc: inv.notes || `Sale Invoice #${inv.invoice_number}`,
        receivableAmount: inv.grand_total,
        debit: inv.grand_total,
        credit: 0,
        netChange: inv.grand_total,
      });
    }

    // Receipts: Customer payment received (Receivable decreases, Credit)
    for (const rec of receipts) {
      allTxns.push({
        id: `rec-${rec.id}`,
        date: rec.payment_date,
        type: 'receipt',
        typeLabel: 'Customer Payment',
        ref: rec.receipt_number,
        desc: `Received via ${rec.bank_name || 'Bank/Cash'} (Ref: ${rec.reference_number || 'N/A'})`,
        receivableAmount: -rec.amount,
        debit: 0,
        credit: rec.amount,
        netChange: -rec.amount,
      });
    }

    // Bills: We owe party (Payable increases, Credit)
    for (const b of bills) {
      allTxns.push({
        id: `bill-${b.id}`,
        date: b.bill_date,
        type: 'bill',
        typeLabel: 'Purchase Bill',
        ref: b.bill_number,
        desc: b.notes || `Purchase Bill #${b.bill_number}`,
        payableAmount: b.grand_total,
        debit: 0,
        credit: b.grand_total,
        netChange: -b.grand_total,
      });
    }

    // Payments: Supplier payment made (Payable decreases, Debit)
    for (const p of payments) {
      allTxns.push({
        id: `pay-${p.id}`,
        date: p.payment_date,
        type: 'payment',
        typeLabel: 'Supplier Payment',
        ref: p.payment_number,
        desc: `Paid from ${p.bank_name || 'Bank/Cash'} (Ref: ${p.reference_number || 'N/A'})`,
        payableAmount: -p.amount,
        debit: p.amount,
        credit: 0,
        netChange: p.amount,
      });
    }

    // Sort chronologically
    allTxns.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    // Calculate running balance
    let running = 0;
    const computedRows: UnifiedLedgerRow[] = [];

    for (const t of allTxns) {
      running += t.netChange;
      computedRows.push({
        id: t.id,
        date: t.date,
        transaction_type: t.type,
        type_label: t.typeLabel,
        reference_no: t.ref,
        description: t.desc,
        receivable_amount: t.receivableAmount,
        payable_amount: t.payableAmount,
        debit: t.debit,
        credit: t.credit,
        net_change: t.netChange,
        running_balance: running,
      });
    }

    // Filter by date range if provided
    let filteredRows = computedRows;
    if (fromDate) {
      filteredRows = filteredRows.filter((r) => r.date >= fromDate);
    }
    if (toDate) {
      filteredRows = filteredRows.filter((r) => r.date <= toDate);
    }

    const totalInvoiced = invoices.reduce((sum, i) => sum + i.grand_total, 0);
    const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalBilled = bills.reduce((sum, b) => sum + b.grand_total, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const custBal = customer ? customer.current_balance : 0;
    const suppBal = supplier ? supplier.current_balance : 0;

    return {
      party,
      customer,
      supplier,
      summary: {
        opening_receivable: customer?.opening_balance || 0,
        opening_payable: supplier?.opening_balance || 0,
        opening_net: (customer?.opening_balance || 0) - (supplier?.opening_balance || 0),
        total_invoiced: totalInvoiced,
        total_received: totalReceived,
        total_billed: totalBilled,
        total_paid: totalPaid,
        current_receivable: custBal,
        current_payable: suppBal,
        current_net: custBal - suppBal,
      },
      rows: filteredRows,
    };
  }

  // --- CUSTOMERS ---
  getCustomers(businessId: number): Customer[] {
    this.normalizeParties(businessId);
    return this.data.customers
      .filter((c) => c.business_id === businessId && c.is_customer !== false)
      .map((c) => {
        const linkedSupp = c.linked_supplier_id ? this.getSupplierById(c.linked_supplier_id, businessId) : undefined;
        return {
          ...c,
          is_supplier: linkedSupp ? linkedSupp.is_supplier !== false : !!c.is_supplier,
        };
      });
  }

  getCustomerById(id: number, businessId: number): Customer | undefined {
    return this.data.customers.find((c) => c.id === id && c.business_id === businessId);
  }

  createCustomer(params: {
    businessId: number;
    name: string;
    company_name?: string;
    phone: string;
    email: string;
    address: string;
    city?: string;
    tax_number?: string;
    notes?: string;
    openingBalance: number;
    alsoAsSupplier?: boolean;
  }): { customer: Customer; supplier?: Supplier; unifiedParty: UnifiedParty } {
    this.normalizeParties(params.businessId);

    const id = this.data.customers.length ? Math.max(...this.data.customers.map((c) => c.id)) + 1 : 1;
    const partyId = id;
    const opening = Number(params.openingBalance) || 0;
    const trimmedName = params.name.trim();

    let createdSupplier: Supplier | undefined;
    let suppId: number | undefined;

    if (params.alsoAsSupplier) {
      suppId = this.data.suppliers.length ? Math.max(...this.data.suppliers.map((s) => s.id)) + 1 : 1;
      createdSupplier = {
        id: suppId,
        business_id: params.businessId,
        party_id: partyId,
        name: trimmedName,
        company_name: params.company_name?.trim() || '',
        phone: params.phone.trim(),
        email: params.email.trim(),
        address: params.address.trim(),
        city: params.city?.trim() || '',
        tax_number: params.tax_number?.trim() || '',
        notes: params.notes?.trim() || '',
        opening_balance: 0,
        current_balance: 0,
        is_customer: true,
        is_supplier: true,
        linked_customer_id: id,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      this.data.suppliers.push(createdSupplier);
    }

    const customer: Customer = {
      id,
      business_id: params.businessId,
      party_id: partyId,
      name: trimmedName,
      company_name: params.company_name?.trim() || '',
      phone: params.phone.trim(),
      email: params.email.trim(),
      address: params.address.trim(),
      city: params.city?.trim() || '',
      tax_number: params.tax_number?.trim() || '',
      notes: params.notes?.trim() || '',
      opening_balance: opening,
      current_balance: opening,
      is_customer: true,
      is_supplier: !!params.alsoAsSupplier,
      linked_supplier_id: suppId || null,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    this.data.customers.push(customer);

    if (opening !== 0) {
      this.recordLedgerEntry({
        businessId: params.businessId,
        entityType: 'customer',
        entityId: id,
        referenceType: 'opening',
        referenceId: `CUST-OP-${id}`,
        transactionDate: new Date().toISOString().slice(0, 10),
        debit: opening > 0 ? opening : 0,
        credit: opening < 0 ? Math.abs(opening) : 0,
        runningBalance: opening,
        description: 'Customer Opening Balance',
      });
    }

    this.recordTransactionAuditLog({
      businessId: params.businessId,
      transactionType: 'party',
      transactionId: partyId,
      referenceNo: `CUST-${id}`,
      action: 'create',
      description: `Created customer "${customer.name}"${params.alsoAsSupplier ? ' (also designated as Supplier)' : ''}`,
    });

    this.save();

    const unifiedParty = this.getUnifiedPartyProfile(params.businessId, partyId)!;
    return { customer, supplier: createdSupplier, unifiedParty };
  }

  updateCustomer(id: number, businessId: number, params: Partial<Customer>): Customer | undefined {
    const c = this.data.customers.find((cust) => cust.id === id && cust.business_id === businessId);
    if (!c) return undefined;
    if (params.name !== undefined) c.name = params.name.trim();
    if (params.company_name !== undefined) c.company_name = params.company_name.trim();
    if (params.phone !== undefined) c.phone = params.phone.trim();
    if (params.email !== undefined) c.email = params.email.trim();
    if (params.address !== undefined) c.address = params.address.trim();
    if (params.city !== undefined) c.city = params.city.trim();
    if (params.tax_number !== undefined) c.tax_number = params.tax_number.trim();
    if (params.notes !== undefined) c.notes = params.notes.trim();
    if (params.status !== undefined) c.status = params.status;

    // Sync matching fields with linked supplier if exists
    if (c.linked_supplier_id) {
      const s = this.data.suppliers.find((sup) => sup.id === c.linked_supplier_id && sup.business_id === businessId);
      if (s) {
        if (params.name !== undefined) s.name = c.name;
        if (params.company_name !== undefined) s.company_name = c.company_name;
        if (params.phone !== undefined) s.phone = c.phone;
        if (params.email !== undefined) s.email = c.email;
        if (params.address !== undefined) s.address = c.address;
        if (params.city !== undefined) s.city = c.city;
        if (params.tax_number !== undefined) s.tax_number = c.tax_number;
        if (params.status !== undefined) s.status = c.status;
      }
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'customer',
      transactionId: id,
      referenceNo: `CUST-${id}`,
      action: 'edit',
      description: `Updated customer "${c.name}" profile`,
    });

    this.save();
    return c;
  }

  // Designate existing Customer as Supplier
  designateCustomerAsSupplier(
    customerId: number,
    businessId: number
  ): { success: boolean; customer?: Customer; supplier?: Supplier; error?: string } {
    const customer = this.getCustomerById(customerId, businessId);
    if (!customer) return { success: false, error: 'Customer not found.' };

    if (customer.is_supplier && customer.linked_supplier_id) {
      const existingSupp = this.getSupplierById(customer.linked_supplier_id, businessId);
      if (existingSupp) {
        existingSupp.is_supplier = true;
        this.save();
        return { success: true, customer, supplier: existingSupp };
      }
    }

    // Check if supplier record exists with same party_id
    let supplier = this.data.suppliers.find(
      (s) => s.business_id === businessId && (s.party_id === customer.party_id || s.linked_customer_id === customer.id)
    );

    if (supplier) {
      supplier.is_supplier = true;
      supplier.is_customer = true;
      supplier.linked_customer_id = customer.id;
      customer.is_supplier = true;
      customer.linked_supplier_id = supplier.id;
    } else {
      const suppId = this.data.suppliers.length ? Math.max(...this.data.suppliers.map((s) => s.id)) + 1 : 1;
      supplier = {
        id: suppId,
        business_id: businessId,
        party_id: customer.party_id || customer.id,
        name: customer.name,
        company_name: customer.company_name || '',
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city || '',
        tax_number: customer.tax_number || '',
        notes: customer.notes || '',
        opening_balance: 0,
        current_balance: 0,
        is_customer: true,
        is_supplier: true,
        linked_customer_id: customer.id,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      this.data.suppliers.push(supplier);
      customer.is_supplier = true;
      customer.linked_supplier_id = suppId;
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'party',
      transactionId: customer.party_id || customer.id,
      referenceNo: `CUST-${customerId}`,
      action: 'role_add',
      description: `Designated "${customer.name}" as Supplier (Customer + Supplier dual role)`,
    });

    this.save();
    return { success: true, customer, supplier };
  }

  // Remove Customer Role
  removeCustomerRole(
    customerId: number,
    businessId: number
  ): { success: boolean; error?: string } {
    const customer = this.getCustomerById(customerId, businessId);
    if (!customer) return { success: false, error: 'Customer not found.' };

    if (!customer.is_supplier && !customer.linked_supplier_id) {
      return { success: false, error: 'Cannot remove the only role. Use Delete or Deactivate instead.' };
    }

    customer.is_customer = false;
    if (customer.linked_supplier_id) {
      const supp = this.getSupplierById(customer.linked_supplier_id, businessId);
      if (supp) {
        supp.is_customer = false;
      }
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'party',
      transactionId: customer.party_id || customer.id,
      referenceNo: `CUST-${customerId}`,
      action: 'role_remove',
      description: `Removed Customer role from "${customer.name}" (now Supplier only)`,
    });

    this.save();
    return { success: true };
  }

  deleteCustomer(
    id: number,
    businessId: number
  ): { success: boolean; hasTransactions?: boolean; error?: string } {
    const c = this.getCustomerById(id, businessId);
    if (!c) return { success: false, error: 'Customer not found.' };

    // Check if customer has transactions
    const hasInvoices = (this.data.invoices || []).some((i) => i.customer_id === id && i.business_id === businessId);
    const hasReceipts = (this.data.receipts || []).some((r) => r.customer_id === id && r.business_id === businessId);
    const hasOrders = (this.data.sales_orders || []).some((o) => o.customer_id === id && o.business_id === businessId);

    if (hasInvoices || hasReceipts || hasOrders) {
      // Preserve history! Prevent corrupting accounting or inventory
      return {
        success: false,
        hasTransactions: true,
        error: `Customer "${c.name}" has historical accounting/sales transactions. Permanent deletion is prevented to protect ledger integrity. You may deactivate the customer or remove roles instead.`,
      };
    }

    // If dual role without transactions, remove customer role or delete if supplier also has no transactions
    if (c.linked_supplier_id && c.is_supplier) {
      const supp = this.getSupplierById(c.linked_supplier_id, businessId);
      if (supp) {
        const suppHasBills = (this.data.bills || []).some((b) => b.supplier_id === supp.id);
        const suppHasPayments = (this.data.payments || []).some((p) => p.supplier_id === supp.id);
        if (suppHasBills || suppHasPayments) {
          // Keep supplier intact, remove customer role
          c.is_customer = false;
          supp.is_customer = false;
          this.save();
          return { success: true };
        }
        // Both can be deleted
        const suppIdx = this.data.suppliers.findIndex((s) => s.id === supp.id);
        if (suppIdx !== -1) this.data.suppliers.splice(suppIdx, 1);
      }
    }

    const idx = this.data.customers.findIndex((cust) => cust.id === id && cust.business_id === businessId);
    if (idx !== -1) this.data.customers.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'customer',
      transactionId: id,
      referenceNo: `CUST-${id}`,
      action: 'delete',
      description: `Deleted customer "${c.name}" (zero transactions)`,
    });

    this.save();
    return { success: true };
  }

  // --- SUPPLIERS ---
  getSuppliers(businessId: number): Supplier[] {
    this.normalizeParties(businessId);
    return this.data.suppliers
      .filter((s) => s.business_id === businessId && s.is_supplier !== false)
      .map((s) => {
        const linkedCust = s.linked_customer_id ? this.getCustomerById(s.linked_customer_id, businessId) : undefined;
        return {
          ...s,
          is_customer: linkedCust ? linkedCust.is_customer !== false : !!s.is_customer,
        };
      });
  }

  getSupplierById(id: number, businessId: number): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id === id && s.business_id === businessId);
  }

  createSupplier(params: {
    businessId: number;
    name: string;
    company_name?: string;
    phone: string;
    email: string;
    address: string;
    city?: string;
    tax_number?: string;
    notes?: string;
    openingBalance: number;
    alsoAsCustomer?: boolean;
  }): { supplier: Supplier; customer?: Customer; unifiedParty: UnifiedParty } {
    this.normalizeParties(params.businessId);

    const id = this.data.suppliers.length ? Math.max(...this.data.suppliers.map((s) => s.id)) + 1 : 1;
    const partyId = 50000 + id;
    const opening = Number(params.openingBalance) || 0;
    const trimmedName = params.name.trim();

    let createdCustomer: Customer | undefined;
    let custId: number | undefined;

    if (params.alsoAsCustomer) {
      custId = this.data.customers.length ? Math.max(...this.data.customers.map((c) => c.id)) + 1 : 1;
      createdCustomer = {
        id: custId,
        business_id: params.businessId,
        party_id: partyId,
        name: trimmedName,
        company_name: params.company_name?.trim() || '',
        phone: params.phone.trim(),
        email: params.email.trim(),
        address: params.address.trim(),
        city: params.city?.trim() || '',
        tax_number: params.tax_number?.trim() || '',
        notes: params.notes?.trim() || '',
        opening_balance: 0,
        current_balance: 0,
        is_customer: true,
        is_supplier: true,
        linked_supplier_id: id,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      this.data.customers.push(createdCustomer);
    }

    const supplier: Supplier = {
      id,
      business_id: params.businessId,
      party_id: partyId,
      name: trimmedName,
      company_name: params.company_name?.trim() || '',
      phone: params.phone.trim(),
      email: params.email.trim(),
      address: params.address.trim(),
      city: params.city?.trim() || '',
      tax_number: params.tax_number?.trim() || '',
      notes: params.notes?.trim() || '',
      opening_balance: opening,
      current_balance: opening,
      is_customer: !!params.alsoAsCustomer,
      is_supplier: true,
      linked_customer_id: custId || null,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    this.data.suppliers.push(supplier);

    if (opening !== 0) {
      this.recordLedgerEntry({
        businessId: params.businessId,
        entityType: 'supplier',
        entityId: id,
        referenceType: 'opening',
        referenceId: `SUPP-OP-${id}`,
        transactionDate: new Date().toISOString().slice(0, 10),
        debit: opening < 0 ? Math.abs(opening) : 0,
        credit: opening > 0 ? opening : 0,
        runningBalance: opening,
        description: 'Supplier Opening Balance',
      });
    }

    this.recordTransactionAuditLog({
      businessId: params.businessId,
      transactionType: 'party',
      transactionId: partyId,
      referenceNo: `SUPP-${id}`,
      action: 'create',
      description: `Created supplier "${supplier.name}"${params.alsoAsCustomer ? ' (also designated as Customer)' : ''}`,
    });

    this.save();

    const unifiedParty = this.getUnifiedPartyProfile(params.businessId, partyId)!;
    return { supplier, customer: createdCustomer, unifiedParty };
  }

  updateSupplier(id: number, businessId: number, params: Partial<Supplier>): Supplier | undefined {
    const s = this.data.suppliers.find((sup) => sup.id === id && sup.business_id === businessId);
    if (!s) return undefined;
    if (params.name !== undefined) s.name = params.name.trim();
    if (params.company_name !== undefined) s.company_name = params.company_name.trim();
    if (params.phone !== undefined) s.phone = params.phone.trim();
    if (params.email !== undefined) s.email = params.email.trim();
    if (params.address !== undefined) s.address = params.address.trim();
    if (params.city !== undefined) s.city = params.city.trim();
    if (params.tax_number !== undefined) s.tax_number = params.tax_number.trim();
    if (params.notes !== undefined) s.notes = params.notes.trim();
    if (params.status !== undefined) s.status = params.status;

    // Sync matching fields with linked customer if exists
    if (s.linked_customer_id) {
      const c = this.data.customers.find((cust) => cust.id === s.linked_customer_id && cust.business_id === businessId);
      if (c) {
        if (params.name !== undefined) c.name = s.name;
        if (params.company_name !== undefined) c.company_name = s.company_name;
        if (params.phone !== undefined) c.phone = s.phone;
        if (params.email !== undefined) c.email = s.email;
        if (params.address !== undefined) c.address = s.address;
        if (params.city !== undefined) c.city = s.city;
        if (params.tax_number !== undefined) c.tax_number = s.tax_number;
        if (params.status !== undefined) c.status = s.status;
      }
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'supplier',
      transactionId: id,
      referenceNo: `SUPP-${id}`,
      action: 'edit',
      description: `Updated supplier "${s.name}" profile`,
    });

    this.save();
    return s;
  }

  // Designate existing Supplier as Customer
  designateSupplierAsCustomer(
    supplierId: number,
    businessId: number
  ): { success: boolean; customer?: Customer; supplier?: Supplier; error?: string } {
    const supplier = this.getSupplierById(supplierId, businessId);
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    if (supplier.is_customer && supplier.linked_customer_id) {
      const existingCust = this.getCustomerById(supplier.linked_customer_id, businessId);
      if (existingCust) {
        existingCust.is_customer = true;
        this.save();
        return { success: true, supplier, customer: existingCust };
      }
    }

    // Check if customer record exists with same party_id
    let customer = this.data.customers.find(
      (c) => c.business_id === businessId && (c.party_id === supplier.party_id || c.linked_supplier_id === supplier.id)
    );

    if (customer) {
      customer.is_customer = true;
      customer.is_supplier = true;
      customer.linked_supplier_id = supplier.id;
      supplier.is_customer = true;
      supplier.linked_customer_id = customer.id;
    } else {
      const custId = this.data.customers.length ? Math.max(...this.data.customers.map((c) => c.id)) + 1 : 1;
      customer = {
        id: custId,
        business_id: businessId,
        party_id: supplier.party_id || (50000 + supplier.id),
        name: supplier.name,
        company_name: supplier.company_name || '',
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        city: supplier.city || '',
        tax_number: supplier.tax_number || '',
        notes: supplier.notes || '',
        opening_balance: 0,
        current_balance: 0,
        is_customer: true,
        is_supplier: true,
        linked_supplier_id: supplier.id,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      this.data.customers.push(customer);
      supplier.is_customer = true;
      supplier.linked_customer_id = custId;
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'party',
      transactionId: supplier.party_id || supplier.id,
      referenceNo: `SUPP-${supplierId}`,
      action: 'role_add',
      description: `Designated "${supplier.name}" as Customer (Customer + Supplier dual role)`,
    });

    this.save();
    return { success: true, supplier, customer };
  }

  // Remove Supplier Role
  removeSupplierRole(
    supplierId: number,
    businessId: number
  ): { success: boolean; error?: string } {
    const supplier = this.getSupplierById(supplierId, businessId);
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    if (!supplier.is_customer && !supplier.linked_customer_id) {
      return { success: false, error: 'Cannot remove the only role. Use Delete or Deactivate instead.' };
    }

    supplier.is_supplier = false;
    if (supplier.linked_customer_id) {
      const cust = this.getCustomerById(supplier.linked_customer_id, businessId);
      if (cust) {
        cust.is_supplier = false;
      }
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'party',
      transactionId: supplier.party_id || supplier.id,
      referenceNo: `SUPP-${supplierId}`,
      action: 'role_remove',
      description: `Removed Supplier role from "${supplier.name}" (now Customer only)`,
    });

    this.save();
    return { success: true };
  }

  deleteSupplier(
    id: number,
    businessId: number
  ): { success: boolean; hasTransactions?: boolean; error?: string } {
    const s = this.getSupplierById(id, businessId);
    if (!s) return { success: false, error: 'Supplier not found.' };

    // Check if supplier has transactions
    const hasBills = (this.data.bills || []).some((b) => b.supplier_id === id && b.business_id === businessId);
    const hasPayments = (this.data.payments || []).some((p) => p.supplier_id === id && p.business_id === businessId);
    const hasOrders = (this.data.purchase_orders || []).some((o) => o.supplier_id === id && o.business_id === businessId);

    if (hasBills || hasPayments || hasOrders) {
      return {
        success: false,
        hasTransactions: true,
        error: `Supplier "${s.name}" has historical accounting/purchasing transactions. Permanent deletion is prevented to protect ledger integrity. You may deactivate the supplier or remove roles instead.`,
      };
    }

    // If dual role without transactions, remove supplier role or delete if customer also has no transactions
    if (s.linked_customer_id && s.is_customer) {
      const cust = this.getCustomerById(s.linked_customer_id, businessId);
      if (cust) {
        const custHasInvoices = (this.data.invoices || []).some((i) => i.customer_id === cust.id);
        const custHasReceipts = (this.data.receipts || []).some((r) => r.customer_id === cust.id);
        if (custHasInvoices || custHasReceipts) {
          s.is_supplier = false;
          cust.is_supplier = false;
          this.save();
          return { success: true };
        }
        const custIdx = this.data.customers.findIndex((c) => c.id === cust.id);
        if (custIdx !== -1) this.data.customers.splice(custIdx, 1);
      }
    }

    const idx = this.data.suppliers.findIndex((sup) => sup.id === id && sup.business_id === businessId);
    if (idx !== -1) this.data.suppliers.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'supplier',
      transactionId: id,
      referenceNo: `SUPP-${id}`,
      action: 'delete',
      description: `Deleted supplier "${s.name}" (zero transactions)`,
    });

    this.save();
    return { success: true };
  }

  // Toggle role on unified party entity
  togglePartyRole(
    businessId: number,
    params: { partyKey: string; role: 'customer' | 'supplier'; action: 'add' | 'remove' }
  ): { success: boolean; error?: string } {
    const profile = this.getUnifiedPartyProfile(businessId, params.partyKey);
    if (!profile) return { success: false, error: 'Party not found' };

    if (params.role === 'supplier' && params.action === 'add') {
      if (profile.customer_id) {
        return this.designateCustomerAsSupplier(profile.customer_id, businessId);
      }
      return { success: false, error: 'Customer record not found for conversion' };
    }

    if (params.role === 'customer' && params.action === 'add') {
      if (profile.supplier_id) {
        return this.designateSupplierAsCustomer(profile.supplier_id, businessId);
      }
      return { success: false, error: 'Supplier record not found for conversion' };
    }

    if (params.role === 'customer' && params.action === 'remove') {
      if (profile.customer_id) {
        return this.removeCustomerRole(profile.customer_id, businessId);
      }
      return { success: false, error: 'Customer record not found' };
    }

    if (params.role === 'supplier' && params.action === 'remove') {
      if (profile.supplier_id) {
        return this.removeSupplierRole(profile.supplier_id, businessId);
      }
      return { success: false, error: 'Supplier record not found' };
    }

    return { success: false, error: 'Invalid role toggle operation' };
  }

  // Delete Unified Party
  deleteUnifiedParty(
    businessId: number,
    partyKey: string,
    forceDelete?: boolean
  ): { success: boolean; hasTransactions?: boolean; error?: string } {
    const profile = this.getUnifiedPartyProfile(businessId, partyKey);
    if (!profile) return { success: false, error: 'Party not found' };

    let custResult: { success: boolean; hasTransactions?: boolean; error?: string } = { success: true };
    let suppResult: { success: boolean; hasTransactions?: boolean; error?: string } = { success: true };

    if (profile.customer_id) {
      custResult = this.deleteCustomer(profile.customer_id, businessId);
      if (!custResult.success && !forceDelete) {
        return custResult;
      }
    }

    if (profile.supplier_id) {
      suppResult = this.deleteSupplier(profile.supplier_id, businessId);
      if (!suppResult.success && !forceDelete) {
        return suppResult;
      }
    }

    return { success: custResult.success || suppResult.success, error: custResult.error || suppResult.error };
  }

  // Bank Accounts & Multi-Business
  getBankAccountsForBusiness(businessId: number): BankAccount[] {
    // A bank account is available to this business if:
    // 1. scope == 'individual' and primary_business_id == businessId
    // 2. scope == 'multiple' and connected_business_ids contains businessId
    return this.data.bank_accounts.filter((acc) => {
      if (acc.scope === 'individual') {
        return acc.primary_business_id === businessId;
      }
      return acc.connected_business_ids.includes(businessId);
    });
  }

  getBankAccountById(id: number): BankAccount | undefined {
    return this.data.bank_accounts.find((a) => a.id === id);
  }

  createBankAccount(params: {
    userId: number;
    primaryBusinessId: number;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    accountType: string;
    openingBalance: number;
    scope: 'individual' | 'multiple';
    connectedBusinessIds?: number[];
  }): BankAccount {
    const id = this.data.bank_accounts.length ? Math.max(...this.data.bank_accounts.map((a) => a.id)) + 1 : 1;
    const opening = Number(params.openingBalance) || 0;

    let connected = [params.primaryBusinessId];
    if (params.scope === 'multiple' && params.connectedBusinessIds && params.connectedBusinessIds.length) {
      connected = Array.from(new Set([params.primaryBusinessId, ...params.connectedBusinessIds]));
    }

    const account: BankAccount = {
      id,
      user_id: params.userId,
      primary_business_id: params.primaryBusinessId,
      bank_name: params.bankName.trim(),
      account_title: params.accountTitle.trim(),
      account_number: params.accountNumber.trim(),
      account_type: params.accountType.trim() || 'General Checking',
      opening_balance: opening,
      current_balance: 0,
      scope: params.scope,
      connected_business_ids: connected,
      created_at: new Date().toISOString(),
    };

    this.data.bank_accounts.push(account);

    // Add entries to business_bank_accounts relation
    for (const bId of connected) {
      const relId = this.data.business_bank_accounts.length ? Math.max(...this.data.business_bank_accounts.map((x) => x.id)) + 1 : 1;
      this.data.business_bank_accounts.push({
        id: relId,
        bank_account_id: id,
        business_id: bId,
        created_at: new Date().toISOString(),
      });
    }

    if (opening > 0) {
      this.recordBankTransaction({
        bankAccountId: id,
        businessId: params.primaryBusinessId,
        transactionType: 'deposit',
        amount: opening,
        referenceType: 'opening',
        referenceId: `BANK-OP-${id}`,
        description: 'Bank Opening Balance',
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    this.save();
    return account;
  }

  // Convert Individual -> Multiple or Multiple -> Individual with validation
  convertBankAccountScope(params: {
    bankAccountId: number;
    userId: number;
    targetScope: 'individual' | 'multiple';
    targetBusinessId?: number; // for multiple -> individual
    additionalBusinessIds?: number[]; // for individual -> multiple
  }): { success: boolean; error?: string; account?: BankAccount } {
    const acc = this.getBankAccountById(params.bankAccountId);
    if (!acc) return { success: false, error: 'Bank account not found' };

    // Validation for Multiple -> Individual
    if (acc.scope === 'multiple' && params.targetScope === 'individual') {
      const targetBiz = params.targetBusinessId || acc.primary_business_id;

      // Rule: Check if ANY transaction exists for that bank account from any other business
      const otherBizTxns = this.data.bank_transactions.filter(
        (t) => t.bank_account_id === acc.id && t.business_id !== targetBiz
      );

      if (otherBizTxns.length > 0) {
        return {
          success: false,
          error:
            'This bank account cannot be converted to an individual business account because transactions already exist for other businesses.',
        };
      }

      // Safe to convert to individual
      acc.scope = 'individual';
      acc.primary_business_id = targetBiz;
      acc.connected_business_ids = [targetBiz];

      // Clean relations
      this.data.business_bank_accounts = this.data.business_bank_accounts.filter(
        (r) => r.bank_account_id !== acc.id
      );
      this.data.business_bank_accounts.push({
        id: Date.now(),
        bank_account_id: acc.id,
        business_id: targetBiz,
        created_at: new Date().toISOString(),
      });

      this.save();
      return { success: true, account: acc };
    }

    // Convert Individual -> Multiple
    if (acc.scope === 'individual' && params.targetScope === 'multiple') {
      const additional = params.additionalBusinessIds || [];
      const updatedList = Array.from(new Set([acc.primary_business_id, ...additional]));

      acc.scope = 'multiple';
      acc.connected_business_ids = updatedList;

      // Update relations
      for (const bId of updatedList) {
        const exists = this.data.business_bank_accounts.some(
          (r) => r.bank_account_id === acc.id && r.business_id === bId
        );
        if (!exists) {
          this.data.business_bank_accounts.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            bank_account_id: acc.id,
            business_id: bId,
            created_at: new Date().toISOString(),
          });
        }
      }

      this.save();
      return { success: true, account: acc };
    }

    // If updating connected businesses for an existing multiple account
    if (acc.scope === 'multiple' && params.targetScope === 'multiple') {
      const additional = params.additionalBusinessIds || [];
      const updatedList = Array.from(new Set([acc.primary_business_id, ...additional]));
      acc.connected_business_ids = updatedList;
      this.save();
      return { success: true, account: acc };
    }

    return { success: true, account: acc };
  }

  updateBankAccount(
    id: number,
    businessId: number,
    params: {
      bankName?: string;
      accountTitle?: string;
      accountNumber?: string;
      accountType?: string;
    }
  ): { success: boolean; account?: BankAccount; error?: string } {
    const acc = this.getBankAccountById(id);
    if (!acc) return { success: false, error: 'Bank account not found' };

    // Validate access: must be primary or in connected businesses
    const hasAccess =
      acc.primary_business_id === businessId || acc.connected_business_ids.includes(businessId);
    if (!hasAccess) return { success: false, error: 'Unauthorized to update this bank account' };

    if (params.bankName) acc.bank_name = params.bankName.trim();
    if (params.accountTitle) acc.account_title = params.accountTitle.trim();
    if (params.accountNumber) acc.account_number = params.accountNumber.trim();
    if (params.accountType) acc.account_type = params.accountType.trim();

    this.save();
    return { success: true, account: acc };
  }

  deleteBankAccount(
    id: number,
    businessId: number
  ): { success: boolean; error?: string; transactionCount?: number } {
    const acc = this.getBankAccountById(id);
    if (!acc) return { success: false, error: 'Bank account not found' };

    // Validate access
    const hasAccess =
      acc.primary_business_id === businessId || acc.connected_business_ids.includes(businessId);
    if (!hasAccess) return { success: false, error: 'Unauthorized to delete this bank account' };

    // Financial protection check: Check if any transactions, receipts, or payments exist for this account
    const txnCount = this.data.bank_transactions.filter((t) => t.bank_account_id === id).length;
    const receiptCount = this.data.receipts.filter((r) => r.bank_account_id === id).length;
    const paymentCount = this.data.payments.filter((p) => p.bank_account_id === id).length;
    const totalLinked = txnCount + receiptCount + paymentCount;

    if (totalLinked > 0) {
      return {
        success: false,
        transactionCount: totalLinked,
        error: `Cannot delete bank account because it has ${totalLinked} recorded financial transaction(s) (deposits, receipts, or payments). To protect financial records and audit integrity, accounts with transaction history cannot be deleted.`,
      };
    }

    // Safe to delete if 0 transactions
    const idx = this.data.bank_accounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.data.bank_accounts.splice(idx, 1);
    }

    // Remove relations
    this.data.business_bank_accounts = this.data.business_bank_accounts.filter(
      (rel) => rel.bank_account_id !== id
    );

    this.save();
    return { success: true };
  }

  // Bank Transactions & Statement Views
  recordBankTransaction(params: {
    bankAccountId: number;
    businessId: number;
    transactionType: 'deposit' | 'withdrawal';
    amount: number;
    referenceType: 'receipt' | 'payment' | 'opening' | 'manual';
    referenceId: string;
    description: string;
    transactionDate: string;
  }): BankTransaction {
    const id = this.data.bank_transactions.length
      ? Math.max(...this.data.bank_transactions.map((t) => t.id)) + 1
      : 1;

    const biz = this.getBusinessById(params.businessId);

    const txn: BankTransaction = {
      id,
      bank_account_id: params.bankAccountId,
      business_id: params.businessId,
      business_name: biz ? biz.name : 'Unknown Business',
      transaction_type: params.transactionType,
      amount: Number(params.amount),
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      description: params.description,
      transaction_date: params.transactionDate,
      created_at: new Date().toISOString(),
    };

    this.data.bank_transactions.push(txn);

    // Update bank account balance
    const acc = this.getBankAccountById(params.bankAccountId);
    if (acc) {
      if (params.transactionType === 'deposit') {
        acc.current_balance += Number(params.amount);
      } else {
        acc.current_balance -= Number(params.amount);
      }
    }

    this.save();
    return txn;
  }

  getBankStatement(
    bankAccountId: number,
    options: {
      scopeType: 'combined' | 'business';
      businessId?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): {
    account: BankAccount;
    transactions: BankTransaction[];
    totalDeposits: number;
    totalWithdrawals: number;
    netMovement: number;
    openingBalance: number;
    closingBalance: number;
  } {
    const acc = this.getBankAccountById(bankAccountId);
    if (!acc) throw new Error('Bank account not found');

    let txns = this.data.bank_transactions.filter((t) => t.bank_account_id === bankAccountId);

    if (options.scopeType === 'business' && options.businessId) {
      txns = txns.filter((t) => t.business_id === options.businessId);
    }

    if (options.fromDate) {
      txns = txns.filter((t) => t.transaction_date >= options.fromDate!);
    }
    if (options.toDate) {
      txns = txns.filter((t) => t.transaction_date <= options.toDate!);
    }

    // Sort by transaction_date asc
    txns.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date) || a.id - b.id);

    // Attach business names
    const bizMap = new Map(this.data.businesses.map((b) => [b.id, b.name]));
    txns = txns.map((t) => ({
      ...t,
      business_name: bizMap.get(t.business_id) || 'Unknown Business',
    }));

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    for (const t of txns) {
      if (t.transaction_type === 'deposit') totalDeposits += t.amount;
      else totalWithdrawals += t.amount;
    }

    return {
      account: acc,
      transactions: txns,
      totalDeposits,
      totalWithdrawals,
      netMovement: totalDeposits - totalWithdrawals,
      openingBalance: acc.opening_balance,
      closingBalance: acc.current_balance,
    };
  }

  // Stock transactions
  recordStockTransaction(params: {
    businessId: number;
    productId: number;
    transactionType: 'in' | 'out' | 'opening' | 'reversal_in' | 'reversal_out';
    quantity: number;
    unitCost: number;
    referenceType: 'invoice' | 'bill' | 'opening' | 'manual';
    referenceId: string;
    notes: string;
    warehouseId?: number;
  }): StockTransaction {
    const id = this.data.stock_transactions.length
      ? Math.max(...this.data.stock_transactions.map((s) => s.id)) + 1
      : 1;

    this.ensureWarehouses(params.businessId);
    let targetWh: Warehouse | undefined;
    if (params.warehouseId) {
      targetWh = (this.data.warehouses || []).find(
        (w) => w.id === params.warehouseId && w.business_id === params.businessId
      );
    }
    if (!targetWh) {
      targetWh =
        (this.data.warehouses || []).find(
          (w) => w.business_id === params.businessId && w.is_default && w.status === 'active'
        ) ||
        (this.data.warehouses || []).find(
          (w) => w.business_id === params.businessId && w.status === 'active'
        );
    }

    const prod = this.getProductById(params.productId, params.businessId);

    const st: StockTransaction = {
      id,
      business_id: params.businessId,
      warehouse_id: targetWh?.id || null,
      warehouse_name: targetWh?.name,
      warehouse_code: targetWh?.code,
      product_id: params.productId,
      product_name: prod ? prod.name : 'Unknown Product',
      transaction_type: params.transactionType,
      quantity: params.quantity,
      unit_cost: params.unitCost,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    this.data.stock_transactions.push(st);

    // Update product current stock
    if (prod) {
      if (params.transactionType === 'in' || params.transactionType === 'reversal_in') {
        prod.current_stock += params.quantity;
      } else if (params.transactionType === 'out' || params.transactionType === 'reversal_out') {
        prod.current_stock -= params.quantity;
      }
    }

    // Update warehouse stock
    if (targetWh) {
      const currentWhStock = this.getWarehouseStock(targetWh.id, params.productId, params.businessId);
      let newWhStock = currentWhStock;
      if (params.transactionType === 'in' || params.transactionType === 'reversal_in') {
        newWhStock += params.quantity;
      } else if (params.transactionType === 'out' || params.transactionType === 'reversal_out') {
        newWhStock = Math.max(0, currentWhStock - params.quantity);
      }
      this.setWarehouseStock(params.businessId, targetWh.id, params.productId, newWhStock);
    }

    this.save();
    return st;
  }

  // Ledger entries
  recordLedgerEntry(params: {
    businessId: number;
    entityType: 'customer' | 'supplier' | 'bank' | 'sales' | 'purchases';
    entityId: number;
    referenceType: 'invoice' | 'receipt' | 'bill' | 'payment' | 'opening';
    referenceId: string;
    transactionDate: string;
    debit: number;
    credit: number;
    runningBalance: number;
    description: string;
  }): LedgerEntry {
    const id = this.data.ledger_entries.length
      ? Math.max(...this.data.ledger_entries.map((l) => l.id)) + 1
      : 1;

    const entry: LedgerEntry = {
      id,
      business_id: params.businessId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      transaction_date: params.transactionDate,
      debit: Number(params.debit) || 0,
      credit: Number(params.credit) || 0,
      running_balance: Number(params.runningBalance) || 0,
      description: params.description,
      created_at: new Date().toISOString(),
    };

    this.data.ledger_entries.push(entry);
    this.save();
    return entry;
  }

  getLedger(
    businessId: number,
    entityType: 'customer' | 'supplier',
    entityId: number,
    fromDate?: string,
    toDate?: string
  ): {
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  } {
    let entries = this.data.ledger_entries.filter(
      (l) => l.business_id === businessId && l.entity_type === entityType && l.entity_id === entityId
    );

    if (fromDate) {
      entries = entries.filter((e) => e.transaction_date >= fromDate);
    }
    if (toDate) {
      entries = entries.filter((e) => e.transaction_date <= toDate);
    }

    entries.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date) || a.id - b.id);

    let totalDebit = 0;
    let totalCredit = 0;
    let running = 0;

    const calculated = entries.map((e) => {
      totalDebit += e.debit;
      totalCredit += e.credit;
      if (entityType === 'customer') {
        // Customer: Debit increases receivable, Credit decreases
        running += e.debit - e.credit;
      } else {
        // Supplier: Credit increases payable, Debit decreases
        running += e.credit - e.debit;
      }
      return {
        ...e,
        running_balance: running,
      };
    });

    return {
      entries: calculated,
      totalDebit,
      totalCredit,
      closingBalance: running,
    };
  }

  // Invoices / Sales
  getInvoices(businessId: number): Invoice[] {
    this.ensureWarehouses(businessId);
    const custMap = new Map(this.getCustomers(businessId).map((c) => [c.id, c.name]));
    const whMap = new Map((this.data.warehouses || []).map((w) => [w.id, w]));
    return this.data.invoices
      .filter((inv) => inv.business_id === businessId)
      .map((inv) => {
        const wh = inv.warehouse_id ? whMap.get(inv.warehouse_id) : undefined;
        return {
          ...inv,
          customer_name: custMap.get(inv.customer_id) || 'Unknown Customer',
          warehouse_name: wh ? wh.name : inv.warehouse_name,
          warehouse_code: wh ? wh.code : inv.warehouse_code,
          items: this.data.invoice_items.filter((item) => item.invoice_id === inv.id),
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  getInvoiceById(id: number, businessId: number): Invoice | undefined {
    return this.getInvoices(businessId).find((inv) => inv.id === id);
  }

  createInvoice(params: {
    businessId: number;
    customerId: number;
    invoiceDate: string;
    discount: number;
    tax: number;
    notes: string;
    salesOrderId?: number;
    warehouseId?: number;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): { success: boolean; invoice?: Invoice; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Invoice must contain at least one product.' };
    }

    const customer = this.getCustomerById(params.customerId, params.businessId);
    if (!customer) {
      return { success: false, error: 'Selected customer not found in this business.' };
    }

    this.ensureWarehouses(params.businessId);
    this.data.warehouses = this.data.warehouses || [];
    let wh: Warehouse | undefined;
    if (params.warehouseId) {
      wh = this.data.warehouses.find(
        (w) => w.id === params.warehouseId && w.business_id === params.businessId && w.status === 'active'
      );
      if (!wh) {
        return { success: false, error: 'Selected warehouse not found or is inactive.' };
      }
    } else {
      wh =
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.is_default && w.status === 'active') ||
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.status === 'active');
    }

    const invId = this.data.invoices.length ? Math.max(...this.data.invoices.map((i) => i.id)) + 1 : 1;
    const invNumber = `INV-${1000 + invId}`;

    let subtotal = 0;
    const createdItems: InvoiceItem[] = [];

    for (let idx = 0; idx < params.items.length; idx++) {
      const item = params.items[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, params.businessId);
      if (!prod) {
        return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.selling_price ?? prod.sale_price ?? 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * unitPrice;
      subtotal += itemTotal;

      const itemId = this.data.invoice_items.length ? Math.max(...this.data.invoice_items.map((x) => x.id)) + 1 : 1;
      const invItem: InvoiceItem = {
        id: itemId,
        invoice_id: invId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
      };

      createdItems.push(invItem);
      this.data.invoice_items.push(invItem);

      // Decrease product stock and log stock transaction with warehouse deduction
      this.recordStockTransaction({
        businessId: params.businessId,
        productId: prodId,
        transactionType: 'out',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'invoice',
        referenceId: invNumber,
        notes: `Sold on invoice ${invNumber} from ${wh ? wh.name : 'warehouse'}`,
        warehouseId: wh?.id,
      });
    }

    const discount = Number(params.discount) || 0;
    const tax = Number(params.tax) || 0;
    const grandTotal = subtotal - discount + tax;

    const invoice: Invoice = {
      id: invId,
      business_id: params.businessId,
      customer_id: params.customerId,
      customer_name: customer.name,
      sales_order_id: params.salesOrderId || null,
      warehouse_id: wh ? wh.id : null,
      warehouse_name: wh ? wh.name : undefined,
      warehouse_code: wh ? wh.code : undefined,
      invoice_number: invNumber,
      invoice_date: params.invoiceDate || new Date().toISOString().slice(0, 10),
      subtotal,
      discount,
      tax,
      grand_total: grandTotal,
      notes: params.notes || '',
      status: 'confirmed',
      items: createdItems,
      created_at: new Date().toISOString(),
    };

    this.data.invoices.push(invoice);

    // If generated from a Sales Order, mark the Sales Order as Complete
    if (params.salesOrderId) {
      this.data.sales_orders = this.data.sales_orders || [];
      const so = this.data.sales_orders.find(
        (o) => o.id === params.salesOrderId && o.business_id === params.businessId
      );
      if (so) {
        so.status = 'Complete';
        so.invoice_id = invId;
      }
    }

    // Update customer balance & ledger entry
    customer.current_balance += grandTotal;
    this.recordLedgerEntry({
      businessId: params.businessId,
      entityType: 'customer',
      entityId: params.customerId,
      referenceType: 'invoice',
      referenceId: invNumber,
      transactionDate: invoice.invoice_date,
      debit: grandTotal,
      credit: 0,
      runningBalance: customer.current_balance,
      description: `Sales Invoice ${invNumber} (${createdItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})`,
    });

    this.save();
    return { success: true, invoice };
  }

  cancelInvoice(invoiceId: number, businessId: number): { success: boolean; error?: string } {
    const inv = this.data.invoices.find((i) => i.id === invoiceId && i.business_id === businessId);
    if (!inv) return { success: false, error: 'Invoice not found.' };
    if (inv.status === 'cancelled') return { success: false, error: 'Invoice is already cancelled.' };

    if (inv.sales_order_id) {
      this.data.sales_orders = this.data.sales_orders || [];
      const so = this.data.sales_orders.find((o) => o.id === inv.sales_order_id);
      if (so && so.status === 'Complete') {
        so.status = 'Approved';
        so.invoice_id = null;
      }
    }

    const customer = this.getCustomerById(inv.customer_id, businessId);
    if (customer) {
      customer.current_balance -= inv.grand_total;
      this.recordLedgerEntry({
        businessId,
        entityType: 'customer',
        entityId: inv.customer_id,
        referenceType: 'invoice',
        referenceId: `REV-${inv.invoice_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
        debit: 0,
        credit: inv.grand_total,
        runningBalance: customer.current_balance,
        description: `REVERSAL - Cancelled Invoice ${inv.invoice_number}`,
      });
    }

    // Revert stock for all items back to invoice's warehouse
    const items = this.data.invoice_items.filter((i) => i.invoice_id === inv.id);
    for (const item of items) {
      const prod = this.getProductById(item.product_id, businessId);
      this.recordStockTransaction({
        businessId,
        productId: item.product_id,
        transactionType: 'reversal_in',
        quantity: item.quantity,
        unitCost: prod ? prod.purchase_price : 0,
        referenceType: 'invoice',
        referenceId: `REV-${inv.invoice_number}`,
        notes: `Restocked from cancelled invoice ${inv.invoice_number}`,
        warehouseId: inv.warehouse_id || undefined,
      });
    }

    inv.status = 'cancelled';
    this.save();
    return { success: true };
  }

  updateInvoice(
    invoiceId: number,
    businessId: number,
    params: {
      customerId?: number;
      warehouseId?: number;
      invoiceDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
      items?: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ): { success: boolean; invoice?: Invoice; error?: string } {
    const inv = this.data.invoices.find((i) => i.id === invoiceId && i.business_id === businessId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const oldCustomerId = inv.customer_id;
    const oldGrandTotal = inv.grand_total;
    const oldWarehouseId = inv.warehouse_id;

    // STEP 1: Reverse original inventory movements and accounting balance
    const oldItems = this.data.invoice_items.filter((i) => i.invoice_id === invoiceId);
    for (const item of oldItems) {
      const prod = this.getProductById(item.product_id, businessId);
      this.recordStockTransaction({
        businessId,
        productId: item.product_id,
        transactionType: 'reversal_in',
        quantity: item.quantity,
        unitCost: prod ? prod.purchase_price : 0,
        referenceType: 'invoice',
        referenceId: `REV-${inv.invoice_number}`,
        notes: `Stock reversed for edit on invoice ${inv.invoice_number}`,
        warehouseId: oldWarehouseId || undefined,
      });
    }

    const oldCustomer = this.getCustomerById(oldCustomerId, businessId);
    if (oldCustomer) {
      oldCustomer.current_balance -= oldGrandTotal;
    }

    // Clear old invoice items
    this.data.invoice_items = this.data.invoice_items.filter((i) => i.invoice_id !== invoiceId);

    // STEP 2: Apply new details
    const newCustomerId = params.customerId || oldCustomerId;
    const newCustomer = this.getCustomerById(newCustomerId, businessId);
    if (!newCustomer) return { success: false, error: 'Customer not found.' };

    const newWarehouseId = params.warehouseId !== undefined ? params.warehouseId : oldWarehouseId;
    const wh = newWarehouseId ? (this.data.warehouses || []).find((w) => w.id === newWarehouseId && w.business_id === businessId) : undefined;

    const itemsToProcess = params.items && params.items.length > 0
      ? params.items
      : oldItems.map((i) => ({ productId: i.product_id, quantity: i.quantity, unitPrice: i.unit_price }));

    let subtotal = 0;
    const updatedItems: InvoiceItem[] = [];

    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const item = itemsToProcess[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, businessId);
      if (!prod) {
        return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const price = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.selling_price ?? prod.sale_price ?? 0);
      if (isNaN(price) || price < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * price;
      subtotal += itemTotal;

      const itemId = this.data.invoice_items.length ? Math.max(...this.data.invoice_items.map((x) => x.id)) + 1 : 1;
      const invItem: InvoiceItem = {
        id: itemId,
        invoice_id: invoiceId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: price,
        total_price: itemTotal,
      };

      updatedItems.push(invItem);
      this.data.invoice_items.push(invItem);

      // Apply new stock deduction
      this.recordStockTransaction({
        businessId,
        productId: prodId,
        transactionType: 'out',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'invoice',
        referenceId: inv.invoice_number,
        notes: `Sold on updated invoice ${inv.invoice_number} from ${wh ? wh.name : 'warehouse'}`,
        warehouseId: wh?.id,
      });
    }

    const discount = params.discount !== undefined ? Number(params.discount) : inv.discount;
    const tax = params.tax !== undefined ? Number(params.tax) : inv.tax;
    const grandTotal = Math.max(0, subtotal - discount + tax);

    // Update customer balance & ledger entry
    newCustomer.current_balance += grandTotal;
    this.recordLedgerEntry({
      businessId,
      entityType: 'customer',
      entityId: newCustomerId,
      referenceType: 'invoice',
      referenceId: inv.invoice_number,
      transactionDate: params.invoiceDate || inv.invoice_date,
      debit: grandTotal,
      credit: 0,
      runningBalance: newCustomer.current_balance,
      description: `Sales Invoice ${inv.invoice_number} (Updated: ${updatedItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})`,
    });

    inv.customer_id = newCustomerId;
    inv.customer_name = newCustomer.name;
    inv.warehouse_id = wh ? wh.id : null;
    inv.warehouse_name = wh ? wh.name : undefined;
    inv.warehouse_code = wh ? wh.code : undefined;
    if (params.invoiceDate) inv.invoice_date = params.invoiceDate;
    inv.subtotal = subtotal;
    inv.discount = discount;
    inv.tax = tax;
    inv.grand_total = grandTotal;
    if (params.notes !== undefined) inv.notes = params.notes;
    inv.items = updatedItems;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'invoice',
      transactionId: invoiceId,
      referenceNo: inv.invoice_number,
      action: 'edit',
      description: `Edited Sales Invoice ${inv.invoice_number}. Grand total: PKR ${grandTotal.toLocaleString()}`,
    });

    this.save();
    return { success: true, invoice: inv };
  }

  deleteInvoice(invoiceId: number, businessId: number): { success: boolean; error?: string } {
    const inv = this.data.invoices.find((i) => i.id === invoiceId && i.business_id === businessId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    if (inv.status !== 'cancelled') {
      // 1. Reverse stock deduction
      const items = this.data.invoice_items.filter((i) => i.invoice_id === invoiceId);
      for (const item of items) {
        const prod = this.getProductById(item.product_id, businessId);
        this.recordStockTransaction({
          businessId,
          productId: item.product_id,
          transactionType: 'reversal_in',
          quantity: item.quantity,
          unitCost: prod ? prod.purchase_price : 0,
          referenceType: 'invoice',
          referenceId: `REV-${inv.invoice_number}`,
          notes: `Restocked from deleted invoice ${inv.invoice_number}`,
          warehouseId: inv.warehouse_id || undefined,
        });
      }

      // 2. Reverse customer receivable balance
      const customer = this.getCustomerById(inv.customer_id, businessId);
      if (customer) {
        customer.current_balance -= inv.grand_total;
        this.recordLedgerEntry({
          businessId,
          entityType: 'customer',
          entityId: inv.customer_id,
          referenceType: 'invoice',
          referenceId: `DEL-${inv.invoice_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
          debit: 0,
          credit: inv.grand_total,
          runningBalance: customer.current_balance,
          description: `DELETION REVERSAL - Deleted Invoice ${inv.invoice_number}`,
        });
      }

      // Reset linked sales order if applicable
      if (inv.sales_order_id) {
        this.data.sales_orders = this.data.sales_orders || [];
        const so = this.data.sales_orders.find((o) => o.id === inv.sales_order_id);
        if (so && so.status === 'Complete') {
          so.status = 'Approved';
          so.invoice_id = null;
        }
      }
    }

    // Remove invoice items and invoice record
    this.data.invoice_items = this.data.invoice_items.filter((i) => i.invoice_id !== invoiceId);
    const idx = this.data.invoices.findIndex((i) => i.id === invoiceId && i.business_id === businessId);
    if (idx !== -1) this.data.invoices.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'invoice',
      transactionId: invoiceId,
      referenceNo: inv.invoice_number,
      action: 'delete',
      description: `Permanently deleted Sales Invoice ${inv.invoice_number} (inventory & ledger reversed)`,
    });

    this.save();
    return { success: true };
  }

  // Receipts / Customer Payments
  getReceipts(businessId: number): Receipt[] {
    const custMap = new Map(this.getCustomers(businessId).map((c) => [c.id, c.name]));
    const bankMap = new Map(this.data.bank_accounts.map((b) => [b.id, b.bank_name]));
    return this.data.receipts
      .filter((r) => r.business_id === businessId)
      .map((r) => ({
        ...r,
        customer_name: custMap.get(r.customer_id) || 'Unknown Customer',
        bank_name: bankMap.get(r.bank_account_id) || 'Unknown Bank',
      }))
      .sort((a, b) => b.id - a.id);
  }

  createReceipt(params: {
    businessId: number;
    customerId: number;
    bankAccountId: number;
    amount: number;
    paymentDate: string;
    referenceNumber: string;
    notes: string;
  }): { success: boolean; receipt?: Receipt; error?: string } {
    const customer = this.getCustomerById(params.customerId, params.businessId);
    if (!customer) return { success: false, error: 'Customer not found.' };

    const bankAccount = this.getBankAccountById(params.bankAccountId);
    if (!bankAccount) return { success: false, error: 'Bank account not found.' };

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Valid payment amount is required.' };
    }

    // Duplicate check
    const existing = this.data.receipts.find(
      (r) =>
        r.business_id === params.businessId &&
        r.reference_number &&
        params.referenceNumber &&
        r.reference_number.trim().toLowerCase() === params.referenceNumber.trim().toLowerCase() &&
        r.status !== 'cancelled'
    );
    if (existing) {
      return {
        success: false,
        error: `Receipt with reference number "${params.referenceNumber}" already exists.`,
      };
    }

    const recId = this.data.receipts.length ? Math.max(...this.data.receipts.map((r) => r.id)) + 1 : 1;
    const recNumber = `REC-${1000 + recId}`;

    const receipt: Receipt = {
      id: recId,
      business_id: params.businessId,
      customer_id: params.customerId,
      customer_name: customer.name,
      bank_account_id: params.bankAccountId,
      bank_name: bankAccount.bank_name,
      receipt_number: recNumber,
      amount,
      payment_date: params.paymentDate || new Date().toISOString().slice(0, 10),
      reference_number: params.referenceNumber || '',
      notes: params.notes || '',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    this.data.receipts.push(receipt);

    // 1. Customer Ledger: Credit reduces customer receivable
    customer.current_balance -= amount;
    this.recordLedgerEntry({
      businessId: params.businessId,
      entityType: 'customer',
      entityId: params.customerId,
      referenceType: 'receipt',
      referenceId: recNumber,
      transactionDate: receipt.payment_date,
      debit: 0,
      credit: amount,
      runningBalance: customer.current_balance,
      description: `Payment received into ${bankAccount.bank_name} (${receipt.reference_number || 'Cash/Cheque'})`,
    });

    // 2. Bank account: Money deposited
    this.recordBankTransaction({
      bankAccountId: params.bankAccountId,
      businessId: params.businessId,
      transactionType: 'deposit',
      amount,
      referenceType: 'receipt',
      referenceId: recNumber,
      description: `Customer payment received from ${customer.name} (Ref: ${receipt.reference_number || recNumber})`,
      transactionDate: receipt.payment_date,
    });

    this.save();
    return { success: true, receipt };
  }

  updateReceipt(
    receiptId: number,
    businessId: number,
    params: {
      customerId?: number;
      bankAccountId?: number;
      amount?: number;
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): { success: boolean; receipt?: Receipt; error?: string } {
    const rec = this.data.receipts.find((r) => r.id === receiptId && r.business_id === businessId);
    if (!rec) return { success: false, error: 'Receipt not found.' };

    const oldAmount = rec.amount;
    const oldCustomerId = rec.customer_id;
    const oldBankAccountId = rec.bank_account_id;

    // Reverse old customer receivable & bank deposit
    const oldCustomer = this.getCustomerById(oldCustomerId, businessId);
    if (oldCustomer) oldCustomer.current_balance += oldAmount;

    const oldBank = this.getBankAccountById(oldBankAccountId);
    if (oldBank) {
      oldBank.current_balance -= oldAmount;
      this.recordBankTransaction({
        bankAccountId: oldBankAccountId,
        businessId,
        transactionType: 'withdrawal',
        amount: oldAmount,
        referenceType: 'receipt',
        referenceId: `REV-${rec.receipt_number}`,
        description: `Reversal for edit on Receipt ${rec.receipt_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const newCustomerId = params.customerId || oldCustomerId;
    const newCustomer = this.getCustomerById(newCustomerId, businessId);
    if (!newCustomer) return { success: false, error: 'Customer not found.' };

    const newBankAccountId = params.bankAccountId || oldBankAccountId;
    const newBank = this.getBankAccountById(newBankAccountId);
    if (!newBank) return { success: false, error: 'Bank account not found.' };

    const newAmount = params.amount !== undefined ? Number(params.amount) : oldAmount;
    if (isNaN(newAmount) || newAmount <= 0) return { success: false, error: 'Valid amount is required.' };

    // Apply new customer receivable & bank deposit
    newCustomer.current_balance -= newAmount;
    this.recordLedgerEntry({
      businessId,
      entityType: 'customer',
      entityId: newCustomerId,
      referenceType: 'receipt',
      referenceId: rec.receipt_number,
      transactionDate: params.paymentDate || rec.payment_date,
      debit: 0,
      credit: newAmount,
      runningBalance: newCustomer.current_balance,
      description: `Payment received into ${newBank.bank_name} (Updated Ref: ${params.referenceNumber || rec.reference_number || 'Cash/Cheque'})`,
    });

    newBank.current_balance += newAmount;
    this.recordBankTransaction({
      bankAccountId: newBankAccountId,
      businessId,
      transactionType: 'deposit',
      amount: newAmount,
      referenceType: 'receipt',
      referenceId: rec.receipt_number,
      description: `Customer payment received from ${newCustomer.name} (Ref: ${params.referenceNumber || rec.receipt_number})`,
      transactionDate: params.paymentDate || rec.payment_date,
    });

    rec.customer_id = newCustomerId;
    rec.customer_name = newCustomer.name;
    rec.bank_account_id = newBankAccountId;
    rec.bank_name = newBank.bank_name;
    rec.amount = newAmount;
    if (params.paymentDate) rec.payment_date = params.paymentDate;
    if (params.referenceNumber !== undefined) rec.reference_number = params.referenceNumber;
    if (params.notes !== undefined) rec.notes = params.notes;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'receipt',
      transactionId: receiptId,
      referenceNo: rec.receipt_number,
      action: 'edit',
      description: `Edited Receipt ${rec.receipt_number}. Amount: PKR ${newAmount.toLocaleString()}`,
    });

    this.save();
    return { success: true, receipt: rec };
  }

  deleteReceipt(receiptId: number, businessId: number): { success: boolean; error?: string } {
    const rec = this.data.receipts.find((r) => r.id === receiptId && r.business_id === businessId);
    if (!rec) return { success: false, error: 'Receipt not found.' };

    if (rec.status !== 'cancelled') {
      // 1. Reverse customer balance
      const customer = this.getCustomerById(rec.customer_id, businessId);
      if (customer) {
        customer.current_balance += rec.amount;
        this.recordLedgerEntry({
          businessId,
          entityType: 'customer',
          entityId: rec.customer_id,
          referenceType: 'receipt',
          referenceId: `DEL-${rec.receipt_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
          debit: rec.amount,
          credit: 0,
          runningBalance: customer.current_balance,
          description: `DELETION REVERSAL - Deleted Customer Payment ${rec.receipt_number}`,
        });
      }

      // 2. Reverse bank deposit
      const bank = this.getBankAccountById(rec.bank_account_id);
      if (bank) {
        bank.current_balance -= rec.amount;
        this.recordBankTransaction({
          bankAccountId: rec.bank_account_id,
          businessId,
          transactionType: 'withdrawal',
          amount: rec.amount,
          referenceType: 'receipt',
          referenceId: `DEL-${rec.receipt_number}`,
          description: `Reversal for deleted receipt ${rec.receipt_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
        });
      }
    }

    const idx = this.data.receipts.findIndex((r) => r.id === receiptId && r.business_id === businessId);
    if (idx !== -1) this.data.receipts.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'receipt',
      transactionId: receiptId,
      referenceNo: rec.receipt_number,
      action: 'delete',
      description: `Permanently deleted Customer Receipt ${rec.receipt_number} (bank & ledger reversed)`,
    });

    this.save();
    return { success: true };
  }

  // Bills / Purchases
  getBills(businessId: number): Bill[] {
    this.ensureWarehouses(businessId);
    const suppMap = new Map(this.getSuppliers(businessId).map((s) => [s.id, s.name]));
    const whMap = new Map((this.data.warehouses || []).map((w) => [w.id, w]));
    return this.data.bills
      .filter((b) => b.business_id === businessId)
      .map((b) => {
        const wh = b.warehouse_id ? whMap.get(b.warehouse_id) : undefined;
        return {
          ...b,
          supplier_name: suppMap.get(b.supplier_id) || 'Unknown Supplier',
          warehouse_name: wh ? wh.name : b.warehouse_name,
          warehouse_code: wh ? wh.code : b.warehouse_code,
          items: this.data.bill_items.filter((item) => item.bill_id === b.id),
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  createBill(params: {
    businessId: number;
    supplierId: number;
    billDate: string;
    tax: number;
    notes: string;
    purchaseOrderId?: number;
    warehouseId?: number;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): { success: boolean; bill?: Bill; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Bill must contain at least one product.' };
    }

    const supplier = this.getSupplierById(params.supplierId, params.businessId);
    if (!supplier) {
      return { success: false, error: 'Selected supplier not found.' };
    }

    this.ensureWarehouses(params.businessId);
    this.data.warehouses = this.data.warehouses || [];
    let wh: Warehouse | undefined;
    if (params.warehouseId) {
      wh = this.data.warehouses.find(
        (w) => w.id === params.warehouseId && w.business_id === params.businessId && w.status === 'active'
      );
      if (!wh) {
        return { success: false, error: 'Selected warehouse not found or is inactive.' };
      }
    } else {
      wh =
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.is_default && w.status === 'active') ||
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.status === 'active');
    }

    const billId = this.data.bills.length ? Math.max(...this.data.bills.map((b) => b.id)) + 1 : 1;
    const billNumber = `BILL-${2000 + billId}`;

    let subtotal = 0;
    const createdItems: BillItem[] = [];

    for (let idx = 0; idx < params.items.length; idx++) {
      const item = params.items[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, params.businessId);
      if (!prod) {
        return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.purchase_price ?? 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * unitPrice;
      subtotal += itemTotal;

      const itemId = this.data.bill_items.length ? Math.max(...this.data.bill_items.map((x) => x.id)) + 1 : 1;
      const billItem: BillItem = {
        id: itemId,
        bill_id: billId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
      };

      createdItems.push(billItem);
      this.data.bill_items.push(billItem);

      // Increase product stock & log transaction with warehouse addition
      this.recordStockTransaction({
        businessId: params.businessId,
        productId: prodId,
        transactionType: 'in',
        quantity: qty,
        unitCost: unitPrice,
        referenceType: 'bill',
        referenceId: billNumber,
        notes: `Purchased on bill ${billNumber} received at ${wh ? wh.name : 'warehouse'}`,
        warehouseId: wh?.id,
      });
    }

    const tax = Number(params.tax) || 0;
    const grandTotal = subtotal + tax;

    const bill: Bill = {
      id: billId,
      business_id: params.businessId,
      supplier_id: params.supplierId,
      supplier_name: supplier.name,
      purchase_order_id: params.purchaseOrderId || null,
      warehouse_id: wh ? wh.id : null,
      warehouse_name: wh ? wh.name : undefined,
      warehouse_code: wh ? wh.code : undefined,
      bill_number: billNumber,
      bill_date: params.billDate || new Date().toISOString().slice(0, 10),
      subtotal,
      tax,
      grand_total: grandTotal,
      notes: params.notes || '',
      status: 'confirmed',
      items: createdItems,
      created_at: new Date().toISOString(),
    };

    this.data.bills.push(bill);

    // If generated from a Purchase Order, mark the Purchase Order as Complete
    if (params.purchaseOrderId) {
      this.data.purchase_orders = this.data.purchase_orders || [];
      const po = this.data.purchase_orders.find(
        (o) => o.id === params.purchaseOrderId && o.business_id === params.businessId
      );
      if (po) {
        po.status = 'Complete';
        po.bill_id = billId;
      }
    }

    // Update supplier ledger: Credit increases payable
    supplier.current_balance += grandTotal;
    this.recordLedgerEntry({
      businessId: params.businessId,
      entityType: 'supplier',
      entityId: params.supplierId,
      referenceType: 'bill',
      referenceId: billNumber,
      transactionDate: bill.bill_date,
      debit: 0,
      credit: grandTotal,
      runningBalance: supplier.current_balance,
      description: `Purchase Bill ${billNumber} (${createdItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})`,
    });

    this.save();
    return { success: true, bill };
  }

  updateBill(
    billId: number,
    businessId: number,
    params: {
      supplierId?: number;
      warehouseId?: number;
      billDate?: string;
      tax?: number;
      notes?: string;
      items?: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ): { success: boolean; bill?: Bill; error?: string } {
    const bill = this.data.bills.find((b) => b.id === billId && b.business_id === businessId);
    if (!bill) return { success: false, error: 'Bill not found.' };

    const oldSupplierId = bill.supplier_id;
    const oldGrandTotal = bill.grand_total;
    const oldWarehouseId = bill.warehouse_id;

    // STEP 1: Reverse original stock movement (deduct stock back)
    const oldItems = this.data.bill_items.filter((i) => i.bill_id === billId);
    for (const item of oldItems) {
      this.recordStockTransaction({
        businessId,
        productId: item.product_id,
        transactionType: 'reversal_out',
        quantity: item.quantity,
        unitCost: item.unit_price,
        referenceType: 'bill',
        referenceId: `REV-${bill.bill_number}`,
        notes: `Stock reversed for edit on purchase bill ${bill.bill_number}`,
        warehouseId: oldWarehouseId || undefined,
      });
    }

    const oldSupplier = this.getSupplierById(oldSupplierId, businessId);
    if (oldSupplier) {
      oldSupplier.current_balance -= oldGrandTotal;
    }

    this.data.bill_items = this.data.bill_items.filter((i) => i.bill_id !== billId);

    // STEP 2: Apply updated items & details
    const newSupplierId = params.supplierId || oldSupplierId;
    const newSupplier = this.getSupplierById(newSupplierId, businessId);
    if (!newSupplier) return { success: false, error: 'Supplier not found.' };

    const newWarehouseId = params.warehouseId !== undefined ? params.warehouseId : oldWarehouseId;
    const wh = newWarehouseId ? (this.data.warehouses || []).find((w) => w.id === newWarehouseId && w.business_id === businessId) : undefined;

    const itemsToProcess = params.items && params.items.length > 0
      ? params.items
      : oldItems.map((i) => ({ productId: i.product_id, quantity: i.quantity, unitPrice: i.unit_price }));

    let subtotal = 0;
    const updatedItems: BillItem[] = [];

    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const item = itemsToProcess[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, businessId);
      if (!prod) {
        return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const price = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.purchase_price ?? 0);
      if (isNaN(price) || price < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * price;
      subtotal += itemTotal;

      const itemId = this.data.bill_items.length ? Math.max(...this.data.bill_items.map((x) => x.id)) + 1 : 1;
      const bItem: BillItem = {
        id: itemId,
        bill_id: billId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: price,
        total_price: itemTotal,
      };

      updatedItems.push(bItem);
      this.data.bill_items.push(bItem);

      // Add stock to warehouse
      this.recordStockTransaction({
        businessId,
        productId: prodId,
        transactionType: 'in',
        quantity: qty,
        unitCost: price,
        referenceType: 'bill',
        referenceId: bill.bill_number,
        notes: `Purchased on updated bill ${bill.bill_number} received at ${wh ? wh.name : 'warehouse'}`,
        warehouseId: wh?.id,
      });
    }

    const tax = params.tax !== undefined ? Number(params.tax) : bill.tax;
    const grandTotal = subtotal + tax;

    newSupplier.current_balance += grandTotal;
    this.recordLedgerEntry({
      businessId,
      entityType: 'supplier',
      entityId: newSupplierId,
      referenceType: 'bill',
      referenceId: bill.bill_number,
      transactionDate: params.billDate || bill.bill_date,
      debit: 0,
      credit: grandTotal,
      runningBalance: newSupplier.current_balance,
      description: `Purchase Bill ${bill.bill_number} (Updated: ${updatedItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})`,
    });

    bill.supplier_id = newSupplierId;
    bill.supplier_name = newSupplier.name;
    bill.warehouse_id = wh ? wh.id : null;
    bill.warehouse_name = wh ? wh.name : undefined;
    bill.warehouse_code = wh ? wh.code : undefined;
    if (params.billDate) bill.bill_date = params.billDate;
    bill.subtotal = subtotal;
    bill.tax = tax;
    bill.grand_total = grandTotal;
    if (params.notes !== undefined) bill.notes = params.notes;
    bill.items = updatedItems;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'bill',
      transactionId: billId,
      referenceNo: bill.bill_number,
      action: 'edit',
      description: `Edited Purchase Bill ${bill.bill_number}. Grand total: PKR ${grandTotal.toLocaleString()}`,
    });

    this.save();
    return { success: true, bill };
  }

  deleteBill(billId: number, businessId: number): { success: boolean; error?: string } {
    const bill = this.data.bills.find((b) => b.id === billId && b.business_id === businessId);
    if (!bill) return { success: false, error: 'Bill not found.' };

    if (bill.status !== 'cancelled') {
      // 1. Reverse stock addition
      const items = this.data.bill_items.filter((i) => i.bill_id === billId);
      for (const item of items) {
        this.recordStockTransaction({
          businessId,
          productId: item.product_id,
          transactionType: 'reversal_out',
          quantity: item.quantity,
          unitCost: item.unit_price,
          referenceType: 'bill',
          referenceId: `REV-${bill.bill_number}`,
          notes: `Stock removed for deleted purchase bill ${bill.bill_number}`,
          warehouseId: bill.warehouse_id || undefined,
        });
      }

      // 2. Reverse supplier payable balance
      const supplier = this.getSupplierById(bill.supplier_id, businessId);
      if (supplier) {
        supplier.current_balance -= bill.grand_total;
        this.recordLedgerEntry({
          businessId,
          entityType: 'supplier',
          entityId: bill.supplier_id,
          referenceType: 'bill',
          referenceId: `DEL-${bill.bill_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
          debit: bill.grand_total,
          credit: 0,
          runningBalance: supplier.current_balance,
          description: `DELETION REVERSAL - Deleted Purchase Bill ${bill.bill_number}`,
        });
      }

      // Reset linked purchase order if applicable
      if (bill.purchase_order_id) {
        this.data.purchase_orders = this.data.purchase_orders || [];
        const po = this.data.purchase_orders.find((o) => o.id === bill.purchase_order_id);
        if (po && po.status === 'Complete') {
          po.status = 'Approved';
          po.bill_id = undefined;
        }
      }
    }

    this.data.bill_items = this.data.bill_items.filter((i) => i.bill_id !== billId);
    const idx = this.data.bills.findIndex((b) => b.id === billId && b.business_id === businessId);
    if (idx !== -1) this.data.bills.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'bill',
      transactionId: billId,
      referenceNo: bill.bill_number,
      action: 'delete',
      description: `Permanently deleted Purchase Bill ${bill.bill_number} (stock & ledger reversed)`,
    });

    this.save();
    return { success: true };
  }

  // Payments / Supplier Payments
  getPayments(businessId: number): Payment[] {
    const suppMap = new Map(this.getSuppliers(businessId).map((s) => [s.id, s.name]));
    const bankMap = new Map(this.data.bank_accounts.map((b) => [b.id, b.bank_name]));
    return this.data.payments
      .filter((p) => p.business_id === businessId)
      .map((p) => ({
        ...p,
        supplier_name: suppMap.get(p.supplier_id) || 'Unknown Supplier',
        bank_name: bankMap.get(p.bank_account_id) || 'Unknown Bank',
      }))
      .sort((a, b) => b.id - a.id);
  }

  createPayment(params: {
    businessId: number;
    supplierId: number;
    bankAccountId: number;
    amount: number;
    paymentDate: string;
    referenceNumber: string;
    notes: string;
  }): { success: boolean; payment?: Payment; error?: string } {
    const supplier = this.getSupplierById(params.supplierId, params.businessId);
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    const bankAccount = this.getBankAccountById(params.bankAccountId);
    if (!bankAccount) return { success: false, error: 'Bank account not found.' };

    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Valid payment amount is required.' };
    }

    const payId = this.data.payments.length ? Math.max(...this.data.payments.map((p) => p.id)) + 1 : 1;
    const payNumber = `PAY-${3000 + payId}`;

    const payment: Payment = {
      id: payId,
      business_id: params.businessId,
      supplier_id: params.supplierId,
      supplier_name: supplier.name,
      bank_account_id: params.bankAccountId,
      bank_name: bankAccount.bank_name,
      payment_number: payNumber,
      amount,
      payment_date: params.paymentDate || new Date().toISOString().slice(0, 10),
      reference_number: params.referenceNumber || '',
      notes: params.notes || '',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    this.data.payments.push(payment);

    // 1. Supplier ledger: Debit decreases payable
    supplier.current_balance -= amount;
    this.recordLedgerEntry({
      businessId: params.businessId,
      entityType: 'supplier',
      entityId: params.supplierId,
      referenceType: 'payment',
      referenceId: payNumber,
      transactionDate: payment.payment_date,
      debit: amount,
      credit: 0,
      runningBalance: supplier.current_balance,
      description: `Payment to supplier via ${bankAccount.bank_name} (Ref: ${payment.reference_number || payNumber})`,
    });

    // 2. Bank account: Money deducted
    this.recordBankTransaction({
      bankAccountId: params.bankAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'payment',
      referenceId: payNumber,
      description: `Supplier payment to ${supplier.name} (Ref: ${payment.reference_number || payNumber})`,
      transactionDate: payment.payment_date,
    });

    this.save();
    return { success: true, payment };
  }

  updatePayment(
    paymentId: number,
    businessId: number,
    params: {
      supplierId?: number;
      bankAccountId?: number;
      amount?: number;
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): { success: boolean; payment?: Payment; error?: string } {
    const pay = this.data.payments.find((p) => p.id === paymentId && p.business_id === businessId);
    if (!pay) return { success: false, error: 'Payment not found.' };

    const oldAmount = pay.amount;
    const oldSupplierId = pay.supplier_id;
    const oldBankAccountId = pay.bank_account_id;

    // Restore old bank account balance
    const oldBank = this.getBankAccountById(oldBankAccountId);
    if (oldBank) {
      oldBank.current_balance += oldAmount;
      this.recordBankTransaction({
        bankAccountId: oldBankAccountId,
        businessId,
        transactionType: 'deposit',
        amount: oldAmount,
        referenceType: 'payment',
        referenceId: `REV-${pay.payment_number}`,
        description: `Reversal for edit on Payment ${pay.payment_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    // Restore old supplier payable balance
    const oldSupplier = this.getSupplierById(oldSupplierId, businessId);
    if (oldSupplier) oldSupplier.current_balance += oldAmount;

    const newSupplierId = params.supplierId || oldSupplierId;
    const newSupplier = this.getSupplierById(newSupplierId, businessId);
    if (!newSupplier) return { success: false, error: 'Supplier not found.' };

    const newBankAccountId = params.bankAccountId || oldBankAccountId;
    const newBank = this.getBankAccountById(newBankAccountId);
    if (!newBank) return { success: false, error: 'Bank account not found.' };

    const newAmount = params.amount !== undefined ? Number(params.amount) : oldAmount;
    if (isNaN(newAmount) || newAmount <= 0) return { success: false, error: 'Valid payment amount is required.' };

    // Apply updated payment
    newSupplier.current_balance -= newAmount;
    this.recordLedgerEntry({
      businessId,
      entityType: 'supplier',
      entityId: newSupplierId,
      referenceType: 'payment',
      referenceId: pay.payment_number,
      transactionDate: params.paymentDate || pay.payment_date,
      debit: newAmount,
      credit: 0,
      runningBalance: newSupplier.current_balance,
      description: `Payment to supplier via ${newBank.bank_name} (Updated Ref: ${params.referenceNumber || pay.reference_number || pay.payment_number})`,
    });

    newBank.current_balance -= newAmount;
    this.recordBankTransaction({
      bankAccountId: newBankAccountId,
      businessId,
      transactionType: 'withdrawal',
      amount: newAmount,
      referenceType: 'payment',
      referenceId: pay.payment_number,
      description: `Supplier payment to ${newSupplier.name} (Ref: ${params.referenceNumber || pay.reference_number || pay.payment_number})`,
      transactionDate: params.paymentDate || pay.payment_date,
    });

    pay.supplier_id = newSupplierId;
    pay.supplier_name = newSupplier.name;
    pay.bank_account_id = newBankAccountId;
    pay.bank_name = newBank.bank_name;
    pay.amount = newAmount;
    if (params.paymentDate) pay.payment_date = params.paymentDate;
    if (params.referenceNumber !== undefined) pay.reference_number = params.referenceNumber;
    if (params.notes !== undefined) pay.notes = params.notes;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'payment',
      transactionId: paymentId,
      referenceNo: pay.payment_number,
      action: 'edit',
      description: `Edited Supplier Payment ${pay.payment_number}. Amount: PKR ${newAmount.toLocaleString()}`,
    });

    this.save();
    return { success: true, payment: pay };
  }

  deletePayment(paymentId: number, businessId: number): { success: boolean; error?: string } {
    const pay = this.data.payments.find((p) => p.id === paymentId && p.business_id === businessId);
    if (!pay) return { success: false, error: 'Payment not found.' };

    if (pay.status !== 'cancelled') {
      // 1. Restore bank account balance
      const bank = this.getBankAccountById(pay.bank_account_id);
      if (bank) {
        bank.current_balance += pay.amount;
        this.recordBankTransaction({
          bankAccountId: pay.bank_account_id,
          businessId,
          transactionType: 'deposit',
          amount: pay.amount,
          referenceType: 'payment',
          referenceId: `DEL-${pay.payment_number}`,
          description: `Reversal for deleted supplier payment ${pay.payment_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
        });
      }

      // 2. Restore supplier payable balance
      const supplier = this.getSupplierById(pay.supplier_id, businessId);
      if (supplier) {
        supplier.current_balance += pay.amount;
        this.recordLedgerEntry({
          businessId,
          entityType: 'supplier',
          entityId: pay.supplier_id,
          referenceType: 'payment',
          referenceId: `DEL-${pay.payment_number}`,
          transactionDate: new Date().toISOString().slice(0, 10),
          debit: 0,
          credit: pay.amount,
          runningBalance: supplier.current_balance,
          description: `DELETION REVERSAL - Deleted Supplier Payment ${pay.payment_number}`,
        });
      }
    }

    const idx = this.data.payments.findIndex((p) => p.id === paymentId && p.business_id === businessId);
    if (idx !== -1) this.data.payments.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'payment',
      transactionId: paymentId,
      referenceNo: pay.payment_number,
      action: 'delete',
      description: `Permanently deleted Supplier Payment ${pay.payment_number} (bank balance & supplier payable restored)`,
    });

    this.save();
    return { success: true };
  }

  // Reports
  getStockMovements(businessId: number, productId?: number): StockTransaction[] {
    let list = this.data.stock_transactions.filter((s) => s.business_id === businessId);
    if (productId) {
      list = list.filter((s) => s.product_id === productId);
    }
    const prodMap = new Map(this.getProducts(businessId).map((p) => [p.id, p.name]));
    return list
      .map((s) => ({
        ...s,
        product_name: prodMap.get(s.product_id) || 'Unknown Product',
      }))
      .sort((a, b) => b.id - a.id);
  }

  // --- SALES ORDERS ---
  getSalesOrders(businessId: number): SalesOrder[] {
    this.ensureWarehouses(businessId);
    this.data.sales_orders = this.data.sales_orders || [];
    this.data.sales_order_items = this.data.sales_order_items || [];
    const custMap = new Map(this.getCustomers(businessId).map((c) => [c.id, c.name]));
    const whMap = new Map((this.data.warehouses || []).map((w) => [w.id, w]));
    return this.data.sales_orders
      .filter((o) => o.business_id === businessId)
      .map((o) => {
        const wh = o.warehouse_id ? whMap.get(o.warehouse_id) : undefined;
        return {
          ...o,
          customer_name: custMap.get(o.customer_id) || 'Unknown Customer',
          warehouse_name: wh ? wh.name : o.warehouse_name,
          warehouse_code: wh ? wh.code : o.warehouse_code,
          items: this.data.sales_order_items!.filter((i) => i.sales_order_id === o.id),
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  getSalesOrderById(id: number, businessId: number): SalesOrder | undefined {
    return this.getSalesOrders(businessId).find((o) => o.id === id);
  }

  createSalesOrder(params: {
    businessId: number;
    customerId: number;
    orderDate: string;
    discount: number;
    tax: number;
    notes: string;
    warehouseId?: number;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): { success: boolean; order?: SalesOrder; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Sales order must contain at least one item.' };
    }
    const customer = this.getCustomerById(params.customerId, params.businessId);
    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }

    this.ensureWarehouses(params.businessId);
    this.data.warehouses = this.data.warehouses || [];
    let wh: Warehouse | undefined;
    if (params.warehouseId) {
      wh = this.data.warehouses.find(
        (w) => w.id === params.warehouseId && w.business_id === params.businessId && w.status === 'active'
      );
      if (!wh) {
        return { success: false, error: 'Selected warehouse not found or is inactive.' };
      }
    } else {
      wh =
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.is_default && w.status === 'active') ||
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.status === 'active');
    }

    this.data.sales_orders = this.data.sales_orders || [];
    this.data.sales_order_items = this.data.sales_order_items || [];

    const orderId = this.data.sales_orders.length ? Math.max(...this.data.sales_orders.map((o) => o.id)) + 1 : 1;
    const orderNumber = `SO-${1000 + orderId}`;

    let subtotal = 0;
    const createdItems: SalesOrderItem[] = [];

    for (let idx = 0; idx < params.items.length; idx++) {
      const item = params.items[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, params.businessId);
      if (!prod) return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.selling_price ?? prod.sale_price ?? 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * unitPrice;
      subtotal += itemTotal;

      const itemId = this.data.sales_order_items.length ? Math.max(...this.data.sales_order_items.map((i) => i.id)) + 1 : 1;
      const soItem: SalesOrderItem = {
        id: itemId,
        sales_order_id: orderId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
      };
      createdItems.push(soItem);
      this.data.sales_order_items.push(soItem);
    }

    const discount = Number(params.discount) || 0;
    const tax = Number(params.tax) || 0;
    const grandTotal = Math.max(0, subtotal - discount + tax);

    const order: SalesOrder = {
      id: orderId,
      business_id: params.businessId,
      customer_id: params.customerId,
      customer_name: customer.name,
      warehouse_id: wh ? wh.id : null,
      warehouse_name: wh ? wh.name : undefined,
      warehouse_code: wh ? wh.code : undefined,
      order_number: orderNumber,
      order_date: params.orderDate || new Date().toISOString().slice(0, 10),
      subtotal,
      discount,
      tax,
      grand_total: grandTotal,
      notes: params.notes || '',
      status: 'In Process',
      items: createdItems,
      created_at: new Date().toISOString(),
    };

    this.data.sales_orders.push(order);
    this.save();
    return { success: true, order };
  }

  updateSalesOrder(
    id: number,
    businessId: number,
    params: {
      customerId?: number;
      orderDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
      warehouseId?: number;
      items?: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ): { success: boolean; order?: SalesOrder; error?: string } {
    this.data.sales_orders = this.data.sales_orders || [];
    this.data.sales_order_items = this.data.sales_order_items || [];
    const order = this.data.sales_orders.find((o) => o.id === id && o.business_id === businessId);
    if (!order) return { success: false, error: 'Sales order not found.' };

    if (params.customerId) {
      const cust = this.getCustomerById(params.customerId, businessId);
      if (cust) {
        order.customer_id = cust.id;
        order.customer_name = cust.name;
      }
    }
    if (params.warehouseId !== undefined) {
      this.ensureWarehouses(businessId);
      const wh = (this.data.warehouses || []).find(
        (w) => w.id === params.warehouseId && w.business_id === businessId && w.status === 'active'
      );
      if (wh) {
        order.warehouse_id = wh.id;
        order.warehouse_name = wh.name;
        order.warehouse_code = wh.code;
      }
    }
    if (params.orderDate) order.order_date = params.orderDate;
    if (params.notes !== undefined) order.notes = params.notes;

    if (params.items && params.items.length > 0) {
      this.data.sales_order_items = this.data.sales_order_items.filter((i) => i.sales_order_id !== id);
      let subtotal = 0;
      const createdItems: SalesOrderItem[] = [];
      for (let idx = 0; idx < params.items.length; idx++) {
        const item = params.items[idx];
        const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
        const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
        if (!prodId || isNaN(prodId) || prodId <= 0) {
          return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
        }

        const prod = this.getProductById(prodId, businessId);
        if (!prod) return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
        }

        const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.selling_price ?? prod.sale_price ?? 0);
        if (isNaN(unitPrice) || unitPrice < 0) {
          return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
        }

        const itemTotal = qty * unitPrice;
        subtotal += itemTotal;
        const itemId = this.data.sales_order_items.length ? Math.max(...this.data.sales_order_items.map((i) => i.id)) + 1 : 1;
        const soItem: SalesOrderItem = {
          id: itemId,
          sales_order_id: id,
          product_id: prodId,
          product_name: prod.name,
          product_sku: prod.sku,
          quantity: qty,
          unit_price: unitPrice,
          total_price: itemTotal,
        };
        createdItems.push(soItem);
        this.data.sales_order_items.push(soItem);
      }
      order.subtotal = subtotal;
      if (params.discount !== undefined) order.discount = Number(params.discount);
      if (params.tax !== undefined) order.tax = Number(params.tax);
      order.grand_total = Math.max(0, order.subtotal - order.discount + order.tax);
      order.items = createdItems;
    }

    this.save();
    return { success: true, order: this.getSalesOrderById(id, businessId) };
  }

  updateSalesOrderStatus(
    id: number,
    businessId: number,
    status: 'In Process' | 'Approved' | 'Rejected' | 'Complete'
  ): { success: boolean; order?: SalesOrder; error?: string } {
    this.data.sales_orders = this.data.sales_orders || [];
    const order = this.data.sales_orders.find((o) => o.id === id && o.business_id === businessId);
    if (!order) return { success: false, error: 'Sales order not found.' };

    order.status = status;
    this.save();
    return { success: true, order: this.getSalesOrderById(id, businessId) };
  }

  deleteSalesOrder(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.sales_orders = this.data.sales_orders || [];
    this.data.sales_order_items = this.data.sales_order_items || [];
    const idx = this.data.sales_orders.findIndex((o) => o.id === id && o.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Sales order not found.' };

    this.data.sales_orders.splice(idx, 1);
    this.data.sales_order_items = this.data.sales_order_items.filter((i) => i.sales_order_id !== id);
    this.save();
    return { success: true };
  }

  // --- PURCHASE ORDERS ---
  getPurchaseOrders(businessId: number): PurchaseOrder[] {
    this.ensureWarehouses(businessId);
    this.data.purchase_orders = this.data.purchase_orders || [];
    this.data.purchase_order_items = this.data.purchase_order_items || [];
    const suppMap = new Map(this.getSuppliers(businessId).map((s) => [s.id, s.name]));
    const whMap = new Map((this.data.warehouses || []).map((w) => [w.id, w]));
    return this.data.purchase_orders
      .filter((o) => o.business_id === businessId)
      .map((o) => {
        const wh = o.warehouse_id ? whMap.get(o.warehouse_id) : undefined;
        return {
          ...o,
          supplier_name: suppMap.get(o.supplier_id) || 'Unknown Supplier',
          warehouse_name: wh ? wh.name : o.warehouse_name,
          warehouse_code: wh ? wh.code : o.warehouse_code,
          items: this.data.purchase_order_items!.filter((i) => i.purchase_order_id === o.id),
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  getPurchaseOrderById(id: number, businessId: number): PurchaseOrder | undefined {
    return this.getPurchaseOrders(businessId).find((o) => o.id === id);
  }

  createPurchaseOrder(params: {
    businessId: number;
    supplierId: number;
    orderDate: string;
    tax: number;
    notes: string;
    warehouseId?: number;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): { success: boolean; order?: PurchaseOrder; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Purchase order must contain at least one item.' };
    }
    const supplier = this.getSupplierById(params.supplierId, params.businessId);
    if (!supplier) {
      return { success: false, error: 'Supplier not found.' };
    }

    this.ensureWarehouses(params.businessId);
    this.data.warehouses = this.data.warehouses || [];
    let wh: Warehouse | undefined;
    if (params.warehouseId) {
      wh = this.data.warehouses.find(
        (w) => w.id === params.warehouseId && w.business_id === params.businessId && w.status === 'active'
      );
      if (!wh) {
        return { success: false, error: 'Selected warehouse not found or is inactive.' };
      }
    } else {
      wh =
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.is_default && w.status === 'active') ||
        this.data.warehouses.find((w) => w.business_id === params.businessId && w.status === 'active');
    }

    this.data.purchase_orders = this.data.purchase_orders || [];
    this.data.purchase_order_items = this.data.purchase_order_items || [];

    const orderId = this.data.purchase_orders.length ? Math.max(...this.data.purchase_orders.map((o) => o.id)) + 1 : 1;
    const orderNumber = `PO-${1000 + orderId}`;

    let subtotal = 0;
    const createdItems: PurchaseOrderItem[] = [];

    for (let idx = 0; idx < params.items.length; idx++) {
      const item = params.items[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const prod = this.getProductById(prodId, params.businessId);
      if (!prod) return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
      }

      const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.purchase_price ?? 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
      }

      const itemTotal = qty * unitPrice;
      subtotal += itemTotal;

      const itemId = this.data.purchase_order_items.length ? Math.max(...this.data.purchase_order_items.map((i) => i.id)) + 1 : 1;
      const poItem: PurchaseOrderItem = {
        id: itemId,
        purchase_order_id: orderId,
        product_id: prodId,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
        unit_price: unitPrice,
        total_price: itemTotal,
      };
      createdItems.push(poItem);
      this.data.purchase_order_items.push(poItem);
    }

    const tax = Number(params.tax) || 0;
    const grandTotal = subtotal + tax;

    const order: PurchaseOrder = {
      id: orderId,
      business_id: params.businessId,
      supplier_id: params.supplierId,
      supplier_name: supplier.name,
      warehouse_id: wh ? wh.id : null,
      warehouse_name: wh ? wh.name : undefined,
      warehouse_code: wh ? wh.code : undefined,
      order_number: orderNumber,
      order_date: params.orderDate || new Date().toISOString().slice(0, 10),
      subtotal,
      tax,
      grand_total: grandTotal,
      notes: params.notes || '',
      status: 'In Process',
      items: createdItems,
      created_at: new Date().toISOString(),
    };

    this.data.purchase_orders.push(order);
    this.save();
    return { success: true, order };
  }

  updatePurchaseOrder(
    id: number,
    businessId: number,
    params: {
      supplierId?: number;
      orderDate?: string;
      tax?: number;
      notes?: string;
      warehouseId?: number;
      items?: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ): { success: boolean; order?: PurchaseOrder; error?: string } {
    this.data.purchase_orders = this.data.purchase_orders || [];
    this.data.purchase_order_items = this.data.purchase_order_items || [];
    const order = this.data.purchase_orders.find((o) => o.id === id && o.business_id === businessId);
    if (!order) return { success: false, error: 'Purchase order not found.' };

    if (params.supplierId) {
      const supp = this.getSupplierById(params.supplierId, businessId);
      if (supp) {
        order.supplier_id = supp.id;
        order.supplier_name = supp.name;
      }
    }
    if (params.warehouseId !== undefined) {
      this.ensureWarehouses(businessId);
      const wh = (this.data.warehouses || []).find(
        (w) => w.id === params.warehouseId && w.business_id === businessId && w.status === 'active'
      );
      if (wh) {
        order.warehouse_id = wh.id;
        order.warehouse_name = wh.name;
        order.warehouse_code = wh.code;
      }
    }
    if (params.orderDate) order.order_date = params.orderDate;
    if (params.notes !== undefined) order.notes = params.notes;

    if (params.items && params.items.length > 0) {
      this.data.purchase_order_items = this.data.purchase_order_items.filter((i) => i.purchase_order_id !== id);
      let subtotal = 0;
      const createdItems: PurchaseOrderItem[] = [];
      for (let idx = 0; idx < params.items.length; idx++) {
        const item = params.items[idx];
        const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id ?? (item as any).ProductID;
        const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
        if (!prodId || isNaN(prodId) || prodId <= 0) {
          return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
        }

        const prod = this.getProductById(prodId, businessId);
        if (!prod) return { success: false, error: `Product ID #${prodId} for item #${idx + 1} not found in this business.` };

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return { success: false, error: `Invalid quantity for item #${idx + 1} (${prod.name}). Quantity must be greater than zero.` };
        }

        const unitPrice = Number((item as any).unitPrice ?? (item as any).unit_price ?? prod.purchase_price ?? 0);
        if (isNaN(unitPrice) || unitPrice < 0) {
          return { success: false, error: `Invalid unit price for item #${idx + 1} (${prod.name}).` };
        }

        const itemTotal = qty * unitPrice;
        subtotal += itemTotal;
        const itemId = this.data.purchase_order_items.length ? Math.max(...this.data.purchase_order_items.map((i) => i.id)) + 1 : 1;
        const poItem: PurchaseOrderItem = {
          id: itemId,
          purchase_order_id: id,
          product_id: prodId,
          product_name: prod.name,
          product_sku: prod.sku,
          quantity: qty,
          unit_price: unitPrice,
          total_price: itemTotal,
        };
        createdItems.push(poItem);
        this.data.purchase_order_items.push(poItem);
      }
      order.subtotal = subtotal;
      if (params.tax !== undefined) order.tax = Number(params.tax);
      order.grand_total = order.subtotal + order.tax;
      order.items = createdItems;
    }

    this.save();
    return { success: true, order: this.getPurchaseOrderById(id, businessId) };
  }

  updatePurchaseOrderStatus(
    id: number,
    businessId: number,
    status: 'In Process' | 'Approved' | 'Rejected' | 'Complete'
  ): { success: boolean; order?: PurchaseOrder; error?: string } {
    this.data.purchase_orders = this.data.purchase_orders || [];
    const order = this.data.purchase_orders.find((o) => o.id === id && o.business_id === businessId);
    if (!order) return { success: false, error: 'Purchase order not found.' };

    order.status = status;
    this.save();
    return { success: true, order: this.getPurchaseOrderById(id, businessId) };
  }

  deletePurchaseOrder(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.purchase_orders = this.data.purchase_orders || [];
    this.data.purchase_order_items = this.data.purchase_order_items || [];
    const idx = this.data.purchase_orders.findIndex((o) => o.id === id && o.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Purchase order not found.' };

    this.data.purchase_orders.splice(idx, 1);
    this.data.purchase_order_items = this.data.purchase_order_items.filter((i) => i.purchase_order_id !== id);
    this.save();
    return { success: true };
  }

  // --- WAREHOUSES ---
  ensureWarehouses(businessId: number): Warehouse[] {
    this.data.warehouses = this.data.warehouses || [];
    this.data.warehouse_stocks = this.data.warehouse_stocks || [];

    let bizWarehouses = this.data.warehouses.filter((w) => w.business_id === businessId);
    if (bizWarehouses.length === 0) {
      const now = new Date().toISOString();
      const nextId = this.data.warehouses.length ? Math.max(...this.data.warehouses.map((w) => w.id)) + 1 : 1;

      const mainWh: Warehouse = {
        id: nextId,
        business_id: businessId,
        name: 'Main Central Warehouse',
        code: 'WH-MAIN',
        address: 'Building 4, Central Logistics Hub',
        city: 'Metro Hub',
        phone: '+1 (555) 100-2001',
        email: 'warehouse-main@logistics.com',
        manager: 'Marcus Vance',
        capacity: '10,000 Units',
        notes: 'Primary receiving, central storage, and bulk fulfillment center',
        status: 'active',
        is_default: true,
        created_at: now,
      };

      const annexWh: Warehouse = {
        id: nextId + 1,
        business_id: businessId,
        name: 'Distribution & Retail Annex',
        code: 'WH-ANNEX',
        address: 'Suite 18, Commercial Terminal Park',
        city: 'West District',
        phone: '+1 (555) 100-2002',
        email: 'annex-storage@logistics.com',
        manager: 'Elena Rostova',
        capacity: '5,000 Units',
        notes: 'Express dispatch and regional buffer storage outpost',
        status: 'active',
        is_default: false,
        created_at: now,
      };

      this.data.warehouses.push(mainWh, annexWh);
      bizWarehouses = [mainWh, annexWh];

      // Initialize existing products stock in Main Warehouse
      const bizProds = this.getProducts(businessId);
      for (const prod of bizProds) {
        this.data.warehouse_stocks.push({
          id: this.data.warehouse_stocks.length ? Math.max(...this.data.warehouse_stocks.map((ws) => ws.id)) + 1 : 1,
          business_id: businessId,
          warehouse_id: mainWh.id,
          product_id: prod.id,
          stock: prod.current_stock,
        });
      }

      this.save();
    }

    return bizWarehouses;
  }

  getWarehouses(businessId: number): Warehouse[] {
    this.ensureWarehouses(businessId);
    this.data.warehouses = this.data.warehouses || [];
    this.data.warehouse_stocks = this.data.warehouse_stocks || [];
    const prods = this.getProducts(businessId);

    const list = this.data.warehouses.filter((w) => w.business_id === businessId);
    return list.map((w) => {
      let totalStock = 0;
      let totalProducts = 0;

      for (const p of prods) {
        const stk = this.getWarehouseStock(w.id, p.id, businessId);
        if (stk > 0) {
          totalStock += stk;
          totalProducts += 1;
        }
      }

      return {
        ...w,
        total_products: totalProducts,
        total_stock: totalStock,
      };
    }).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0) || a.id - b.id);
  }

  getWarehouseById(id: number, businessId: number): Warehouse | undefined {
    this.ensureWarehouses(businessId);
    this.data.warehouses = this.data.warehouses || [];
    return this.data.warehouses.find((w) => w.id === id && w.business_id === businessId);
  }

  createWarehouse(params: {
    businessId: number;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    manager?: string;
    capacity?: string;
    notes?: string;
    status?: 'active' | 'inactive';
    is_default?: boolean;
  }): Warehouse {
    this.ensureWarehouses(params.businessId);
    this.data.warehouses = this.data.warehouses || [];
    const id = this.data.warehouses.length ? Math.max(...this.data.warehouses.map((w) => w.id)) + 1 : 1;
    const now = new Date().toISOString();
    const code = params.code?.trim() || `WH-0${id}`;

    if (params.is_default) {
      for (const w of this.data.warehouses) {
        if (w.business_id === params.businessId) {
          w.is_default = false;
        }
      }
    }

    const warehouse: Warehouse = {
      id,
      business_id: params.businessId,
      name: params.name.trim(),
      code: code.toUpperCase(),
      address: params.address?.trim() || '',
      city: params.city?.trim() || '',
      phone: params.phone?.trim() || '',
      email: params.email?.trim() || '',
      manager: params.manager?.trim() || '',
      capacity: params.capacity?.trim() || '',
      notes: params.notes?.trim() || '',
      status: params.status || 'active',
      is_default: !!params.is_default,
      created_at: now,
    };

    this.data.warehouses.push(warehouse);
    this.save();
    return warehouse;
  }

  updateWarehouse(
    id: number,
    businessId: number,
    params: Partial<Warehouse>
  ): Warehouse | null {
    this.ensureWarehouses(businessId);
    this.data.warehouses = this.data.warehouses || [];
    const wh = this.data.warehouses.find((w) => w.id === id && w.business_id === businessId);
    if (!wh) return null;

    if (params.is_default) {
      for (const w of this.data.warehouses) {
        if (w.business_id === businessId) {
          w.is_default = false;
        }
      }
    }

    if (params.name !== undefined) wh.name = params.name.trim();
    if (params.code !== undefined) wh.code = params.code.trim().toUpperCase();
    if (params.address !== undefined) wh.address = params.address.trim();
    if (params.city !== undefined) wh.city = params.city.trim();
    if (params.phone !== undefined) wh.phone = params.phone.trim();
    if (params.email !== undefined) wh.email = params.email.trim();
    if (params.manager !== undefined) wh.manager = params.manager.trim();
    if (params.capacity !== undefined) wh.capacity = params.capacity.trim();
    if (params.notes !== undefined) wh.notes = params.notes.trim();
    if (params.status !== undefined) wh.status = params.status;
    if (params.is_default !== undefined) wh.is_default = params.is_default;

    this.save();
    return wh;
  }

  deleteWarehouse(id: number, businessId: number): { success: boolean; error?: string } {
    this.ensureWarehouses(businessId);
    this.data.warehouses = this.data.warehouses || [];
    const idx = this.data.warehouses.findIndex((w) => w.id === id && w.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Warehouse not found.' };

    const wh = this.data.warehouses[idx];
    const bizWarehouses = this.data.warehouses.filter((w) => w.business_id === businessId);
    if (bizWarehouses.length <= 1) {
      return { success: false, error: 'Cannot delete the only warehouse of this business.' };
    }

    // Check if warehouse holds non-zero stock
    const prods = this.getProducts(businessId);
    for (const p of prods) {
      const s = this.getWarehouseStock(wh.id, p.id, businessId);
      if (s > 0) {
        return {
          success: false,
          error: `Cannot delete warehouse "${wh.name}" because it currently holds ${s} unit(s) of ${p.name}. Please transfer all inventory first.`,
        };
      }
    }

    this.data.warehouses.splice(idx, 1);
    this.data.warehouse_stocks = (this.data.warehouse_stocks || []).filter((ws) => ws.warehouse_id !== id);
    this.save();
    return { success: true };
  }

  getWarehouseStock(warehouseId: number, productId: number, businessId?: number): number {
    this.data.warehouse_stocks = this.data.warehouse_stocks || [];
    const entry = this.data.warehouse_stocks.find(
      (ws) => ws.warehouse_id === warehouseId && ws.product_id === productId
    );
    if (entry !== undefined) {
      return entry.stock;
    }

    // Fallback: If not explicitly recorded, check if it's the default warehouse
    const wh = (this.data.warehouses || []).find((w) => w.id === warehouseId);
    const prod = (this.data.products || []).find((p) => p.id === productId);
    if (wh && prod) {
      if (wh.is_default || !this.data.warehouse_stocks.some((ws) => ws.product_id === productId)) {
        // Initialize entry
        const nextId = this.data.warehouse_stocks.length
          ? Math.max(...this.data.warehouse_stocks.map((ws) => ws.id)) + 1
          : 1;
        this.data.warehouse_stocks.push({
          id: nextId,
          business_id: wh.business_id,
          warehouse_id: warehouseId,
          product_id: productId,
          stock: prod.current_stock,
        });
        return prod.current_stock;
      }
    }
    return 0;
  }

  setWarehouseStock(businessId: number, warehouseId: number, productId: number, newStock: number) {
    this.data.warehouse_stocks = this.data.warehouse_stocks || [];
    const entry = this.data.warehouse_stocks.find(
      (ws) => ws.warehouse_id === warehouseId && ws.product_id === productId
    );
    if (entry) {
      entry.stock = newStock;
    } else {
      const nextId = this.data.warehouse_stocks.length
        ? Math.max(...this.data.warehouse_stocks.map((ws) => ws.id)) + 1
        : 1;
      this.data.warehouse_stocks.push({
        id: nextId,
        business_id: businessId,
        warehouse_id: warehouseId,
        product_id: productId,
        stock: newStock,
      });
    }
  }

  getWarehouseInventory(businessId: number, warehouseId: number) {
    this.ensureWarehouses(businessId);
    const prods = this.getProducts(businessId);
    const cats = this.getCategories(businessId);
    const catMap = new Map(cats.map((c: any) => [c.id, c.name]));

    return prods.map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      weight: p.weight,
      image: p.image,
      purchasePrice: p.purchase_price,
      sellingPrice: p.selling_price,
      categoryName: catMap.get(p.category_id) || 'General',
      stock: this.getWarehouseStock(warehouseId, p.id, businessId),
      totalBusinessStock: p.current_stock,
    }));
  }

  // --- STOCK TRANSFERS ---
  getStockTransfers(businessId?: number): StockTransfer[] {
    this.data.stock_transfers = this.data.stock_transfers || [];
    this.data.stock_transfer_items = this.data.stock_transfer_items || [];
    let list = this.data.stock_transfers;
    if (businessId) {
      list = list.filter((t) => t.business_id === businessId || t.source_business_id === businessId);
    }
    return list
      .map((t) => {
        const items = this.data.stock_transfer_items!.filter((i) => i.transfer_id === t.id);
        const fromWh = t.from_warehouse_id
          ? this.data.warehouses?.find((w) => w.id === t.from_warehouse_id)
          : undefined;
        const toWh = t.to_warehouse_id
          ? this.data.warehouses?.find((w) => w.id === t.to_warehouse_id)
          : undefined;

        return {
          ...t,
          items: items.length > 0 ? items : t.product_id ? [
            {
              id: 1,
              transfer_id: t.id,
              product_id: t.product_id,
              product_name: t.product_name || '',
              product_sku: t.product_sku || '',
              quantity: t.quantity || t.total_quantity || 1,
            },
          ] : [],
          from_warehouse_name: fromWh?.name || t.from_warehouse_name || t.source_business_name || 'Central Hub',
          from_warehouse_code: fromWh?.code || t.from_warehouse_code || 'WH-MAIN',
          to_warehouse_name: toWh?.name || t.to_warehouse_name || t.destination_business_name || 'Retail Annex',
          to_warehouse_code: toWh?.code || t.to_warehouse_code || 'WH-ANNEX',
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  createStockTransfer(params: {
    businessId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    items: Array<{ productId: number; quantity: number }>;
    transferDate?: string;
    reference?: string;
    notes?: string;
    // Legacy fallback support:
    sourceBusinessId?: number;
    destinationBusinessId?: number;
    productId?: number;
    quantity?: number;
  }): { success: boolean; transfer?: StockTransfer; error?: string } {
    const bizId = params.businessId || params.sourceBusinessId || 1;
    this.ensureWarehouses(bizId);

    // Normalize items if called in legacy single product format
    let itemsToTransfer: Array<{ productId: number; quantity: number }> = [];
    if (params.items && Array.isArray(params.items) && params.items.length > 0) {
      itemsToTransfer = params.items;
    } else if (params.productId && params.quantity) {
      itemsToTransfer = [{ productId: params.productId, quantity: params.quantity }];
    }

    if (itemsToTransfer.length === 0) {
      return { success: false, error: 'Please select at least one product to transfer.' };
    }

    let fromWhId = params.fromWarehouseId;
    let toWhId = params.toWarehouseId;

    this.ensureWarehouses(bizId);
    this.data.warehouses = this.data.warehouses || [];

    // Fallback if warehouses were not provided: use first 2 warehouses of the business
    const bizWarehouses = this.data.warehouses.filter((w) => w.business_id === bizId);
    if (!fromWhId && bizWarehouses.length > 0) fromWhId = bizWarehouses[0].id;
    if (!toWhId && bizWarehouses.length > 1) toWhId = bizWarehouses[1].id;

    if (!fromWhId || !toWhId) {
      return { success: false, error: 'Please select both source and destination warehouses.' };
    }

    if (fromWhId === toWhId) {
      return { success: false, error: 'From Warehouse and To Warehouse must be different locations.' };
    }

    const fromWh = this.data.warehouses.find((w) => w.id === fromWhId && w.business_id === bizId);
    const toWh = this.data.warehouses.find((w) => w.id === toWhId && w.business_id === bizId);

    if (!fromWh || !toWh) {
      return { success: false, error: 'Invalid source or destination warehouse selected.' };
    }

    // Validate quantities and stock availability for ALL items first
    const validatedItems: Array<{
      product: Product;
      quantity: number;
    }> = [];

    for (let idx = 0; idx < itemsToTransfer.length; idx++) {
      const item = itemsToTransfer[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      if (!prodId || isNaN(prodId) || prodId <= 0) {
        return { success: false, error: `Please select a valid product for item #${idx + 1}.` };
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, error: 'Each transfer item must have a quantity greater than zero.' };
      }

      const prod = this.getProductById(prodId, bizId);
      if (!prod) {
        return { success: false, error: `Product ID #${prodId} not found in this business.` };
      }

      const availableInFromWh = this.getWarehouseStock(fromWh.id, prod.id, bizId);
      if (availableInFromWh < qty) {
        return {
          success: false,
          error: `Insufficient stock in ${fromWh.name} for "${prod.name}" [${prod.sku}]. Available: ${availableInFromWh}, Requested: ${qty}.`,
        };
      }

      validatedItems.push({ product: prod, quantity: qty });
    }

    this.data.stock_transfers = this.data.stock_transfers || [];
    this.data.stock_transfer_items = this.data.stock_transfer_items || [];

    const transferId = this.data.stock_transfers.length
      ? Math.max(...this.data.stock_transfers.map((t) => t.id)) + 1
      : 1;
    const transferNumber = `TRF-${1000 + transferId}`;
    const transferDate = params.transferDate || new Date().toISOString().slice(0, 10);
    const transferNotes = params.notes?.trim() || '';
    const transferRef = params.reference?.trim() || '';

    let totalQty = 0;
    const savedItems: StockTransferItem[] = [];

    // Deduct from source warehouse, add to destination warehouse, record audit log
    for (const validated of validatedItems) {
      const { product, quantity } = validated;
      totalQty += quantity;

      // Deduct from From Warehouse
      const currentFrom = this.getWarehouseStock(fromWh.id, product.id, bizId);
      this.setWarehouseStock(bizId, fromWh.id, product.id, currentFrom - quantity);

      // Add to To Warehouse
      const currentTo = this.getWarehouseStock(toWh.id, product.id, bizId);
      this.setWarehouseStock(bizId, toWh.id, product.id, currentTo + quantity);

      // Stock Transactions for ledger / audit transparency
      this.recordStockTransaction({
        businessId: bizId,
        productId: product.id,
        transactionType: 'out',
        quantity: quantity,
        unitCost: product.purchase_price,
        referenceType: 'manual',
        referenceId: transferNumber,
        notes: `Transfer Out from ${fromWh.name} to ${toWh.name} (${transferNumber}): ${transferNotes || 'Inter-warehouse transfer'}`,
      });

      this.recordStockTransaction({
        businessId: bizId,
        productId: product.id,
        transactionType: 'in',
        quantity: quantity,
        unitCost: product.purchase_price,
        referenceType: 'manual',
        referenceId: transferNumber,
        notes: `Transfer In to ${toWh.name} from ${fromWh.name} (${transferNumber}): ${transferNotes || 'Inter-warehouse transfer'}`,
      });

      const itemId = this.data.stock_transfer_items.length
        ? Math.max(...this.data.stock_transfer_items.map((i) => i.id)) + 1
        : 1;

      const transferItem: StockTransferItem = {
        id: itemId,
        transfer_id: transferId,
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: quantity,
      };

      this.data.stock_transfer_items.push(transferItem);
      savedItems.push(transferItem);
    }

    const firstItem = savedItems[0];
    const transfer: StockTransfer = {
      id: transferId,
      business_id: bizId,
      from_warehouse_id: fromWh.id,
      from_warehouse_name: fromWh.name,
      from_warehouse_code: fromWh.code,
      to_warehouse_id: toWh.id,
      to_warehouse_name: toWh.name,
      to_warehouse_code: toWh.code,
      transfer_number: transferNumber,
      transfer_date: transferDate,
      reference: transferRef,
      notes: transferNotes,
      status: 'completed',
      total_quantity: totalQty,
      items: savedItems,
      // Legacy compatibility
      product_id: firstItem.product_id,
      product_name: firstItem.product_name,
      product_sku: firstItem.product_sku,
      quantity: totalQty,
      source_business_id: bizId,
      source_business_name: fromWh.name,
      destination_business_id: bizId,
      destination_business_name: toWh.name,
      created_at: new Date().toISOString(),
    };

    this.data.stock_transfers.push(transfer);
    this.save();
    return { success: true, transfer };
  }

  updateStockTransfer(
    id: number,
    businessId: number,
    params: {
      fromWarehouseId?: number;
      toWarehouseId?: number;
      transferDate?: string;
      reference?: string;
      notes?: string;
      items?: Array<{ productId: number; quantity: number }>;
    }
  ): { success: boolean; transfer?: StockTransfer; error?: string } {
    this.data.stock_transfers = this.data.stock_transfers || [];
    this.data.stock_transfer_items = this.data.stock_transfer_items || [];
    const trf = this.data.stock_transfers.find((t) => t.id === id && (t.business_id === businessId || t.source_business_id === businessId));
    if (!trf) return { success: false, error: 'Stock transfer not found.' };

    const oldItems = this.data.stock_transfer_items.filter((i) => i.transfer_id === id);

    // STEP 1: Reverse old transfer (add back to old fromWarehouse, deduct from old toWarehouse)
    for (const item of oldItems) {
      const currentFrom = this.getWarehouseStock(trf.from_warehouse_id, item.product_id, businessId);
      this.setWarehouseStock(businessId, trf.from_warehouse_id, item.product_id, currentFrom + item.quantity);

      const currentTo = this.getWarehouseStock(trf.to_warehouse_id, item.product_id, businessId);
      this.setWarehouseStock(businessId, trf.to_warehouse_id, item.product_id, Math.max(0, currentTo - item.quantity));

      const prod = this.getProductById(item.product_id, businessId);
      this.recordStockTransaction({
        businessId,
        productId: item.product_id,
        transactionType: 'reversal_in',
        quantity: item.quantity,
        unitCost: prod ? prod.purchase_price : 0,
        referenceType: 'manual',
        referenceId: `REV-${trf.transfer_number}`,
        notes: `Transfer edit reversal: restored to ${trf.from_warehouse_name}`,
        warehouseId: trf.from_warehouse_id,
      });
    }

    // STEP 2: Validate new warehouse selections and stock availability
    const newFromId = params.fromWarehouseId || trf.from_warehouse_id;
    const newToId = params.toWarehouseId || trf.to_warehouse_id;

    if (newFromId === newToId) {
      return { success: false, error: 'From and To warehouses must be different locations.' };
    }

    const fromWh = (this.data.warehouses || []).find((w) => w.id === newFromId);
    const toWh = (this.data.warehouses || []).find((w) => w.id === newToId);
    if (!fromWh || !toWh) {
      return { success: false, error: 'Invalid warehouse selected.' };
    }

    const itemsToProcess = params.items && params.items.length > 0
      ? params.items
      : oldItems.map((i) => ({ productId: i.product_id, quantity: i.quantity }));

    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const item = itemsToProcess[idx];
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      const avail = this.getWarehouseStock(newFromId, prodId, businessId);
      if (avail < Number(item.quantity)) {
        const prod = this.getProductById(prodId, businessId);
        return {
          success: false,
          error: `Insufficient stock in ${fromWh.name} for ${prod ? prod.name : 'product'}. Available: ${avail}, Requested: ${item.quantity}`,
        };
      }
    }

    // Clear old transfer items
    this.data.stock_transfer_items = this.data.stock_transfer_items.filter((i) => i.transfer_id !== id);

    // Apply new movements
    let totalQty = 0;
    const updatedItems: StockTransferItem[] = [];

    for (const item of itemsToProcess) {
      const rawProdId = (item as any).productId ?? (item as any).product_id ?? (item as any).id;
      const prodId = typeof rawProdId === 'string' ? parseInt(rawProdId, 10) : Number(rawProdId);
      const prod = this.getProductById(prodId, businessId);
      if (!prod) continue;
      const qty = Number(item.quantity);
      totalQty += qty;

      const currentFrom = this.getWarehouseStock(newFromId, prod.id, businessId);
      this.setWarehouseStock(businessId, newFromId, prod.id, currentFrom - qty);

      const currentTo = this.getWarehouseStock(newToId, prod.id, businessId);
      this.setWarehouseStock(businessId, newToId, prod.id, currentTo + qty);

      const itemId = this.data.stock_transfer_items.length ? Math.max(...this.data.stock_transfer_items.map((x) => x.id)) + 1 : 1;
      const tItem: StockTransferItem = {
        id: itemId,
        transfer_id: id,
        product_id: prod.id,
        product_name: prod.name,
        product_sku: prod.sku,
        quantity: qty,
      };

      updatedItems.push(tItem);
      this.data.stock_transfer_items.push(tItem);

      this.recordStockTransaction({
        businessId,
        productId: prod.id,
        transactionType: 'out',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'manual',
        referenceId: trf.transfer_number,
        notes: `Transfer Out to ${toWh.name} (Updated ${trf.transfer_number})`,
        warehouseId: newFromId,
      });

      this.recordStockTransaction({
        businessId,
        productId: prod.id,
        transactionType: 'in',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'manual',
        referenceId: trf.transfer_number,
        notes: `Transfer In from ${fromWh.name} (Updated ${trf.transfer_number})`,
        warehouseId: newToId,
      });
    }

    trf.from_warehouse_id = newFromId;
    trf.from_warehouse_name = fromWh.name;
    trf.from_warehouse_code = fromWh.code;
    trf.to_warehouse_id = newToId;
    trf.to_warehouse_name = toWh.name;
    trf.to_warehouse_code = toWh.code;
    if (params.transferDate) trf.transfer_date = params.transferDate;
    if (params.reference !== undefined) trf.reference = params.reference;
    if (params.notes !== undefined) trf.notes = params.notes;
    trf.total_quantity = totalQty;
    trf.items = updatedItems;
    if (updatedItems.length > 0) {
      trf.product_id = updatedItems[0].product_id;
      trf.product_name = updatedItems[0].product_name;
      trf.product_sku = updatedItems[0].product_sku;
      trf.quantity = totalQty;
    }

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'stock_transfer',
      transactionId: id,
      referenceNo: trf.transfer_number,
      action: 'edit',
      description: `Edited Stock Transfer ${trf.transfer_number}: ${fromWh.name} -> ${toWh.name}, ${totalQty} units`,
    });

    this.save();
    return { success: true, transfer: trf };
  }

  deleteStockTransfer(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.stock_transfers = this.data.stock_transfers || [];
    this.data.stock_transfer_items = this.data.stock_transfer_items || [];
    const trf = this.data.stock_transfers.find((t) => t.id === id && (t.business_id === businessId || t.source_business_id === businessId));
    if (!trf) return { success: false, error: 'Stock transfer not found.' };

    const items = this.data.stock_transfer_items.filter((i) => i.transfer_id === id);
    for (const item of items) {
      // Revert stock back: add back to fromWarehouse, deduct from toWarehouse
      const currentFrom = this.getWarehouseStock(trf.from_warehouse_id, item.product_id, businessId);
      this.setWarehouseStock(businessId, trf.from_warehouse_id, item.product_id, currentFrom + item.quantity);

      const currentTo = this.getWarehouseStock(trf.to_warehouse_id, item.product_id, businessId);
      this.setWarehouseStock(businessId, trf.to_warehouse_id, item.product_id, Math.max(0, currentTo - item.quantity));

      const prod = this.getProductById(item.product_id, businessId);
      this.recordStockTransaction({
        businessId,
        productId: item.product_id,
        transactionType: 'reversal_in',
        quantity: item.quantity,
        unitCost: prod ? prod.purchase_price : 0,
        referenceType: 'manual',
        referenceId: `DEL-${trf.transfer_number}`,
        notes: `Transfer deletion reversal: restored to ${trf.from_warehouse_name}`,
        warehouseId: trf.from_warehouse_id,
      });
    }

    this.data.stock_transfer_items = this.data.stock_transfer_items.filter((i) => i.transfer_id !== id);
    const idx = this.data.stock_transfers.findIndex((t) => t.id === id);
    if (idx !== -1) this.data.stock_transfers.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'stock_transfer',
      transactionId: id,
      referenceNo: trf.transfer_number,
      action: 'delete',
      description: `Permanently deleted Stock Transfer ${trf.transfer_number} (inventory reversed)`,
    });

    this.save();
    return { success: true };
  }

  // --- STOCK ADJUSTMENTS ---
  getStockAdjustments(businessId: number): StockAdjustment[] {
    this.data.stock_adjustments = this.data.stock_adjustments || [];
    return this.data.stock_adjustments
      .filter((a) => a.business_id === businessId)
      .sort((a, b) => b.id - a.id);
  }

  createStockAdjustment(params: {
    businessId: number;
    productId: number;
    adjustmentType: 'increase' | 'decrease';
    quantity: number;
    reason: string;
    notes: string;
    adjustmentDate?: string;
  }): { success: boolean; adjustment?: StockAdjustment; error?: string } {
    const qty = Number(params.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: 'Adjustment quantity must be greater than zero.' };
    }
    const prod = this.getProductById(params.productId, params.businessId);
    if (!prod) {
      return { success: false, error: 'Product not found.' };
    }

    this.data.stock_adjustments = this.data.stock_adjustments || [];
    const adjId = this.data.stock_adjustments.length ? Math.max(...this.data.stock_adjustments.map((a) => a.id)) + 1 : 1;
    const adjNumber = `ADJ-${1000 + adjId}`;

    if (params.adjustmentType === 'increase') {
      prod.current_stock += qty;
      this.recordStockTransaction({
        businessId: params.businessId,
        productId: prod.id,
        transactionType: 'in',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'manual',
        referenceId: adjNumber,
        notes: `Stock Adjustment (+): ${params.reason} - ${params.notes || ''}`,
      });
    } else {
      prod.current_stock = Math.max(0, prod.current_stock - qty);
      this.recordStockTransaction({
        businessId: params.businessId,
        productId: prod.id,
        transactionType: 'out',
        quantity: qty,
        unitCost: prod.purchase_price,
        referenceType: 'manual',
        referenceId: adjNumber,
        notes: `Stock Adjustment (-): ${params.reason} - ${params.notes || ''}`,
      });
    }

    const adjustment: StockAdjustment = {
      id: adjId,
      business_id: params.businessId,
      product_id: params.productId,
      product_name: prod.name,
      product_sku: prod.sku,
      adjustment_number: adjNumber,
      adjustment_date: params.adjustmentDate || new Date().toISOString().slice(0, 10),
      adjustment_type: params.adjustmentType,
      quantity: qty,
      reason: params.reason || 'Inventory Count Variance',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.data.stock_adjustments.push(adjustment);
    this.save();
    return { success: true, adjustment };
  }

  updateStockAdjustment(
    id: number,
    businessId: number,
    params: {
      productId?: number;
      adjustmentType?: 'increase' | 'decrease';
      quantity?: number;
      reason?: string;
      notes?: string;
      adjustmentDate?: string;
    }
  ): { success: boolean; adjustment?: StockAdjustment; error?: string } {
    this.data.stock_adjustments = this.data.stock_adjustments || [];
    const adj = this.data.stock_adjustments.find((a) => a.id === id && a.business_id === businessId);
    if (!adj) return { success: false, error: 'Stock adjustment not found.' };

    const oldProd = this.getProductById(adj.product_id, businessId);
    if (!oldProd) return { success: false, error: 'Original product not found.' };

    // STEP 1: Reverse original adjustment effect
    if (adj.adjustment_type === 'increase') {
      oldProd.current_stock = Math.max(0, oldProd.current_stock - adj.quantity);
      this.recordStockTransaction({
        businessId,
        productId: adj.product_id,
        transactionType: 'reversal_out',
        quantity: adj.quantity,
        unitCost: oldProd.purchase_price,
        referenceType: 'manual',
        referenceId: `REV-${adj.adjustment_number}`,
        notes: `Adjustment edit reversal: removed +${adj.quantity} units`,
      });
    } else {
      oldProd.current_stock += adj.quantity;
      this.recordStockTransaction({
        businessId,
        productId: adj.product_id,
        transactionType: 'reversal_in',
        quantity: adj.quantity,
        unitCost: oldProd.purchase_price,
        referenceType: 'manual',
        referenceId: `REV-${adj.adjustment_number}`,
        notes: `Adjustment edit reversal: restored -${adj.quantity} units`,
      });
    }

    // STEP 2: Apply new adjustment
    const newProdId = params.productId || adj.product_id;
    const newProd = this.getProductById(newProdId, businessId);
    if (!newProd) return { success: false, error: 'Product not found.' };

    const newType = params.adjustmentType || adj.adjustment_type;
    const newQty = params.quantity !== undefined ? Number(params.quantity) : adj.quantity;
    if (isNaN(newQty) || newQty <= 0) return { success: false, error: 'Valid quantity is required.' };

    if (newType === 'increase') {
      newProd.current_stock += newQty;
      this.recordStockTransaction({
        businessId,
        productId: newProd.id,
        transactionType: 'in',
        quantity: newQty,
        unitCost: newProd.purchase_price,
        referenceType: 'manual',
        referenceId: adj.adjustment_number,
        notes: `Updated Stock Adjustment (+): ${params.reason || adj.reason}`,
      });
    } else {
      newProd.current_stock = Math.max(0, newProd.current_stock - newQty);
      this.recordStockTransaction({
        businessId,
        productId: newProd.id,
        transactionType: 'out',
        quantity: newQty,
        unitCost: newProd.purchase_price,
        referenceType: 'manual',
        referenceId: adj.adjustment_number,
        notes: `Updated Stock Adjustment (-): ${params.reason || adj.reason}`,
      });
    }

    adj.product_id = newProd.id;
    adj.product_name = newProd.name;
    adj.product_sku = newProd.sku;
    adj.adjustment_type = newType;
    adj.quantity = newQty;
    if (params.reason !== undefined) adj.reason = params.reason;
    if (params.notes !== undefined) adj.notes = params.notes;
    if (params.adjustmentDate) adj.adjustment_date = params.adjustmentDate;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'stock_adjustment',
      transactionId: id,
      referenceNo: adj.adjustment_number,
      action: 'edit',
      description: `Edited Stock Adjustment ${adj.adjustment_number}: ${newProd.name} (${newType} by ${newQty})`,
    });

    this.save();
    return { success: true, adjustment: adj };
  }

  deleteStockAdjustment(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.stock_adjustments = this.data.stock_adjustments || [];
    const adj = this.data.stock_adjustments.find((a) => a.id === id && a.business_id === businessId);
    if (!adj) return { success: false, error: 'Stock adjustment not found.' };

    const prod = this.getProductById(adj.product_id, businessId);
    if (prod) {
      if (adj.adjustment_type === 'increase') {
        prod.current_stock = Math.max(0, prod.current_stock - adj.quantity);
        this.recordStockTransaction({
          businessId,
          productId: adj.product_id,
          transactionType: 'reversal_out',
          quantity: adj.quantity,
          unitCost: prod.purchase_price,
          referenceType: 'manual',
          referenceId: `DEL-${adj.adjustment_number}`,
          notes: `Stock adjustment deletion: reversed +${adj.quantity} units`,
        });
      } else {
        prod.current_stock += adj.quantity;
        this.recordStockTransaction({
          businessId,
          productId: adj.product_id,
          transactionType: 'reversal_in',
          quantity: adj.quantity,
          unitCost: prod.purchase_price,
          referenceType: 'manual',
          referenceId: `DEL-${adj.adjustment_number}`,
          notes: `Stock adjustment deletion: restored -${adj.quantity} units`,
        });
      }
    }

    const idx = this.data.stock_adjustments.findIndex((a) => a.id === id);
    if (idx !== -1) this.data.stock_adjustments.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'stock_adjustment',
      transactionId: id,
      referenceNo: adj.adjustment_number,
      action: 'delete',
      description: `Permanently deleted Stock Adjustment ${adj.adjustment_number} (inventory effect reversed)`,
    });

    this.save();
    return { success: true };
  }

  // --- OTHER PAYMENTS ---
  getOtherPayments(businessId: number): OtherPayment[] {
    this.data.other_payments = this.data.other_payments || [];
    return this.data.other_payments
      .filter((p) => {
        if (p.business_id !== businessId) return false;
        const cat = (p.category || '').toLowerCase();
        const payee = (p.payee || '').toLowerCase();
        // Employee / payroll payments must NOT be classified as Other Payments
        if (
          cat.includes('employee') ||
          cat.includes('staff') ||
          cat.includes('kharcha') ||
          cat.includes('salaries') ||
          cat.includes('salary') ||
          cat.includes('payroll') ||
          cat.includes('wage')
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.id - a.id);
  }

  createOtherPayment(params: {
    businessId: number;
    bankAccountId: number;
    amount: number;
    paymentDate: string;
    payee: string;
    category: string;
    referenceNumber: string;
    notes: string;
  }): { success: boolean; payment?: OtherPayment; error?: string } {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };
    const acc = this.getBankAccountById(params.bankAccountId);
    if (!acc) return { success: false, error: 'Bank account not found.' };

    this.data.other_payments = this.data.other_payments || [];
    const payId = this.data.other_payments.length ? Math.max(...this.data.other_payments.map((p) => p.id)) + 1 : 1;
    const payNum = `OPAY-${1000 + payId}`;

    const otherPayment: OtherPayment = {
      id: payId,
      business_id: params.businessId,
      bank_account_id: params.bankAccountId,
      bank_name: acc.bank_name,
      payment_number: payNum,
      payment_date: params.paymentDate || new Date().toISOString().slice(0, 10),
      amount,
      payee: params.payee.trim(),
      category: params.category.trim() || 'General Expense',
      reference_number: params.referenceNumber || '',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.data.other_payments.push(otherPayment);

    // Record withdrawal on bank account
    this.recordBankTransaction({
      bankAccountId: params.bankAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'payment',
      referenceId: payNum,
      description: `Other Payment to ${params.payee} (${params.category || 'Expense'})`,
      transactionDate: otherPayment.payment_date,
    });

    this.save();
    return { success: true, payment: otherPayment };
  }

  updateOtherPayment(
    id: number,
    businessId: number,
    params: {
      bankAccountId?: number;
      amount?: number;
      paymentDate?: string;
      payee?: string;
      category?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): { success: boolean; payment?: OtherPayment; error?: string } {
    this.data.other_payments = this.data.other_payments || [];
    const pay = this.data.other_payments.find((p) => p.id === id && p.business_id === businessId);
    if (!pay) return { success: false, error: 'Other payment not found.' };

    const oldBank = this.getBankAccountById(pay.bank_account_id);
    if (oldBank) {
      oldBank.current_balance += pay.amount;
      this.recordBankTransaction({
        bankAccountId: pay.bank_account_id,
        businessId,
        transactionType: 'deposit',
        amount: pay.amount,
        referenceType: 'payment',
        referenceId: `REV-${pay.payment_number}`,
        description: `Reversal for edit on Other Payment ${pay.payment_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const newBankId = params.bankAccountId || pay.bank_account_id;
    const newBank = this.getBankAccountById(newBankId);
    if (!newBank) return { success: false, error: 'Bank account not found.' };

    const newAmount = params.amount !== undefined ? Number(params.amount) : pay.amount;
    if (isNaN(newAmount) || newAmount <= 0) return { success: false, error: 'Valid amount is required.' };

    newBank.current_balance -= newAmount;
    this.recordBankTransaction({
      bankAccountId: newBankId,
      businessId,
      transactionType: 'withdrawal',
      amount: newAmount,
      referenceType: 'payment',
      referenceId: pay.payment_number,
      description: `Other Payment to ${params.payee || pay.payee} (${params.category || pay.category || 'Expense'}) [Updated]`,
      transactionDate: params.paymentDate || pay.payment_date,
    });

    pay.bank_account_id = newBankId;
    pay.bank_name = newBank.bank_name;
    pay.amount = newAmount;
    if (params.payee !== undefined) pay.payee = params.payee.trim();
    if (params.category !== undefined) pay.category = params.category.trim();
    if (params.paymentDate) pay.payment_date = params.paymentDate;
    if (params.referenceNumber !== undefined) pay.reference_number = params.referenceNumber;
    if (params.notes !== undefined) pay.notes = params.notes;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'other_payment',
      transactionId: id,
      referenceNo: pay.payment_number,
      action: 'edit',
      description: `Edited Other Payment ${pay.payment_number}: ${pay.payee}, PKR ${newAmount.toLocaleString()}`,
    });

    this.save();
    return { success: true, payment: pay };
  }

  deleteOtherPayment(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.other_payments = this.data.other_payments || [];
    const pay = this.data.other_payments.find((p) => p.id === id && p.business_id === businessId);
    if (!pay) return { success: false, error: 'Other payment not found.' };

    const bank = this.getBankAccountById(pay.bank_account_id);
    if (bank) {
      bank.current_balance += pay.amount;
      this.recordBankTransaction({
        bankAccountId: pay.bank_account_id,
        businessId,
        transactionType: 'deposit',
        amount: pay.amount,
        referenceType: 'payment',
        referenceId: `DEL-${pay.payment_number}`,
        description: `Reversal for deleted Other Payment ${pay.payment_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const idx = this.data.other_payments.findIndex((p) => p.id === id);
    if (idx !== -1) this.data.other_payments.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'other_payment',
      transactionId: id,
      referenceNo: pay.payment_number,
      action: 'delete',
      description: `Permanently deleted Other Payment ${pay.payment_number} (bank balance restored)`,
    });

    this.save();
    return { success: true };
  }

  // --- OTHER RECEIPTS ---
  getOtherReceipts(businessId: number): OtherReceipt[] {
    this.data.other_receipts = this.data.other_receipts || [];
    return this.data.other_receipts
      .filter((r) => r.business_id === businessId)
      .sort((a, b) => b.id - a.id);
  }

  createOtherReceipt(params: {
    businessId: number;
    bankAccountId: number;
    amount: number;
    receiptDate: string;
    payer: string;
    category: string;
    referenceNumber: string;
    notes: string;
  }): { success: boolean; receipt?: OtherReceipt; error?: string } {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Receipt amount must be greater than zero.' };
    const acc = this.getBankAccountById(params.bankAccountId);
    if (!acc) return { success: false, error: 'Bank account not found.' };

    this.data.other_receipts = this.data.other_receipts || [];
    const rcptId = this.data.other_receipts.length ? Math.max(...this.data.other_receipts.map((r) => r.id)) + 1 : 1;
    const rcptNum = `ORCPT-${1000 + rcptId}`;

    const otherReceipt: OtherReceipt = {
      id: rcptId,
      business_id: params.businessId,
      bank_account_id: params.bankAccountId,
      bank_name: acc.bank_name,
      receipt_number: rcptNum,
      receipt_date: params.receiptDate || new Date().toISOString().slice(0, 10),
      amount,
      payer: params.payer.trim(),
      category: params.category.trim() || 'General Income',
      reference_number: params.referenceNumber || '',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.data.other_receipts.push(otherReceipt);

    // Record deposit on bank account
    this.recordBankTransaction({
      bankAccountId: params.bankAccountId,
      businessId: params.businessId,
      transactionType: 'deposit',
      amount,
      referenceType: 'receipt',
      referenceId: rcptNum,
      description: `Other Receipt from ${params.payer} (${params.category || 'Income'})`,
      transactionDate: otherReceipt.receipt_date,
    });

    this.save();
    return { success: true, receipt: otherReceipt };
  }

  updateOtherReceipt(
    id: number,
    businessId: number,
    params: {
      bankAccountId?: number;
      amount?: number;
      receiptDate?: string;
      payer?: string;
      category?: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): { success: boolean; receipt?: OtherReceipt; error?: string } {
    this.data.other_receipts = this.data.other_receipts || [];
    const rcpt = this.data.other_receipts.find((r) => r.id === id && r.business_id === businessId);
    if (!rcpt) return { success: false, error: 'Other receipt not found.' };

    const oldBank = this.getBankAccountById(rcpt.bank_account_id);
    if (oldBank) {
      oldBank.current_balance -= rcpt.amount;
      this.recordBankTransaction({
        bankAccountId: rcpt.bank_account_id,
        businessId,
        transactionType: 'withdrawal',
        amount: rcpt.amount,
        referenceType: 'receipt',
        referenceId: `REV-${rcpt.receipt_number}`,
        description: `Reversal for edit on Other Receipt ${rcpt.receipt_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const newBankId = params.bankAccountId || rcpt.bank_account_id;
    const newBank = this.getBankAccountById(newBankId);
    if (!newBank) return { success: false, error: 'Bank account not found.' };

    const newAmount = params.amount !== undefined ? Number(params.amount) : rcpt.amount;
    if (isNaN(newAmount) || newAmount <= 0) return { success: false, error: 'Valid amount is required.' };

    newBank.current_balance += newAmount;
    this.recordBankTransaction({
      bankAccountId: newBankId,
      businessId,
      transactionType: 'deposit',
      amount: newAmount,
      referenceType: 'receipt',
      referenceId: rcpt.receipt_number,
      description: `Other Receipt from ${params.payer || rcpt.payer} (${params.category || rcpt.category || 'Income'}) [Updated]`,
      transactionDate: params.receiptDate || rcpt.receipt_date,
    });

    rcpt.bank_account_id = newBankId;
    rcpt.bank_name = newBank.bank_name;
    rcpt.amount = newAmount;
    if (params.payer !== undefined) rcpt.payer = params.payer.trim();
    if (params.category !== undefined) rcpt.category = params.category.trim();
    if (params.receiptDate) rcpt.receipt_date = params.receiptDate;
    if (params.referenceNumber !== undefined) rcpt.reference_number = params.referenceNumber;
    if (params.notes !== undefined) rcpt.notes = params.notes;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'other_receipt',
      transactionId: id,
      referenceNo: rcpt.receipt_number,
      action: 'edit',
      description: `Edited Other Receipt ${rcpt.receipt_number}: ${rcpt.payer}, PKR ${newAmount.toLocaleString()}`,
    });

    this.save();
    return { success: true, receipt: rcpt };
  }

  deleteOtherReceipt(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.other_receipts = this.data.other_receipts || [];
    const rcpt = this.data.other_receipts.find((r) => r.id === id && r.business_id === businessId);
    if (!rcpt) return { success: false, error: 'Other receipt not found.' };

    const bank = this.getBankAccountById(rcpt.bank_account_id);
    if (bank) {
      bank.current_balance -= rcpt.amount;
      this.recordBankTransaction({
        bankAccountId: rcpt.bank_account_id,
        businessId,
        transactionType: 'withdrawal',
        amount: rcpt.amount,
        referenceType: 'receipt',
        referenceId: `DEL-${rcpt.receipt_number}`,
        description: `Reversal for deleted Other Receipt ${rcpt.receipt_number}`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const idx = this.data.other_receipts.findIndex((r) => r.id === id);
    if (idx !== -1) this.data.other_receipts.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'other_receipt',
      transactionId: id,
      referenceNo: rcpt.receipt_number,
      action: 'delete',
      description: `Permanently deleted Other Receipt ${rcpt.receipt_number} (bank balance restored)`,
    });

    this.save();
    return { success: true };
  }

  // --- BANK TRANSFERS ---
  getBankTransfers(businessId?: number): BankTransfer[] {
    this.data.bank_transfers = this.data.bank_transfers || [];
    return this.data.bank_transfers.sort((a, b) => b.id - a.id);
  }

  createBankTransfer(params: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    transferDate: string;
    reference: string;
    notes: string;
    businessId: number;
  }): { success: boolean; transfer?: BankTransfer; error?: string } {
    if (params.fromAccountId === params.toAccountId) {
      return { success: false, error: 'Source and destination accounts must be different.' };
    }
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Transfer amount must be greater than zero.' };
    }
    const fromAcc = this.getBankAccountById(params.fromAccountId);
    const toAcc = this.getBankAccountById(params.toAccountId);
    if (!fromAcc || !toAcc) {
      return { success: false, error: 'Bank account not found.' };
    }
    if (fromAcc.current_balance < amount) {
      return {
        success: false,
        error: `Insufficient balance in source account. Available: ${fromAcc.current_balance}, Requested: ${amount}`,
      };
    }

    this.data.bank_transfers = this.data.bank_transfers || [];
    const trfId = this.data.bank_transfers.length ? Math.max(...this.data.bank_transfers.map((t) => t.id)) + 1 : 1;
    const trfNum = `BT-${1000 + trfId}`;

    // Record withdrawal on fromAcc
    this.recordBankTransaction({
      bankAccountId: params.fromAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'manual',
      referenceId: trfNum,
      description: `Bank Transfer Out to ${toAcc.bank_name} (${toAcc.account_number}) - Ref: ${params.reference || trfNum}`,
      transactionDate: params.transferDate || new Date().toISOString().slice(0, 10),
    });

    // Record deposit on toAcc
    this.recordBankTransaction({
      bankAccountId: params.toAccountId,
      businessId: params.businessId,
      transactionType: 'deposit',
      amount,
      referenceType: 'manual',
      referenceId: trfNum,
      description: `Bank Transfer In from ${fromAcc.bank_name} (${fromAcc.account_number}) - Ref: ${params.reference || trfNum}`,
      transactionDate: params.transferDate || new Date().toISOString().slice(0, 10),
    });

    const transfer: BankTransfer = {
      id: trfId,
      transfer_number: trfNum,
      transfer_date: params.transferDate || new Date().toISOString().slice(0, 10),
      from_account_id: params.fromAccountId,
      from_account_name: `${fromAcc.bank_name} (${fromAcc.account_title})`,
      to_account_id: params.toAccountId,
      to_account_name: `${toAcc.bank_name} (${toAcc.account_title})`,
      amount,
      reference: params.reference || '',
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.data.bank_transfers.push(transfer);
    this.save();
    return { success: true, transfer };
  }

  updateBankTransfer(
    id: number,
    businessId: number,
    params: {
      fromAccountId?: number;
      toAccountId?: number;
      amount?: number;
      transferDate?: string;
      reference?: string;
      notes?: string;
    }
  ): { success: boolean; transfer?: BankTransfer; error?: string } {
    this.data.bank_transfers = this.data.bank_transfers || [];
    const trf = this.data.bank_transfers.find((t) => t.id === id);
    if (!trf) return { success: false, error: 'Bank transfer not found.' };

    const oldFromAcc = this.getBankAccountById(trf.from_account_id);
    const oldToAcc = this.getBankAccountById(trf.to_account_id);

    // STEP 1: Reverse old transfer (deposit back to fromAccount, withdraw from toAccount)
    if (oldFromAcc) {
      oldFromAcc.current_balance += trf.amount;
      this.recordBankTransaction({
        bankAccountId: trf.from_account_id,
        businessId,
        transactionType: 'deposit',
        amount: trf.amount,
        referenceType: 'manual',
        referenceId: `REV-${trf.transfer_number}`,
        description: `Reversal for edit on Bank Transfer ${trf.transfer_number} (Out restored)`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    if (oldToAcc) {
      oldToAcc.current_balance -= trf.amount;
      this.recordBankTransaction({
        bankAccountId: trf.to_account_id,
        businessId,
        transactionType: 'withdrawal',
        amount: trf.amount,
        referenceType: 'manual',
        referenceId: `REV-${trf.transfer_number}`,
        description: `Reversal for edit on Bank Transfer ${trf.transfer_number} (In removed)`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    // STEP 2: Apply new transfer
    const newFromId = params.fromAccountId || trf.from_account_id;
    const newToId = params.toAccountId || trf.to_account_id;
    if (newFromId === newToId) return { success: false, error: 'Source and destination accounts must be different.' };

    const newFromAcc = this.getBankAccountById(newFromId);
    const newToAcc = this.getBankAccountById(newToId);
    if (!newFromAcc || !newToAcc) return { success: false, error: 'Bank account not found.' };

    const newAmount = params.amount !== undefined ? Number(params.amount) : trf.amount;
    if (isNaN(newAmount) || newAmount <= 0) return { success: false, error: 'Valid amount is required.' };

    newFromAcc.current_balance -= newAmount;
    this.recordBankTransaction({
      bankAccountId: newFromId,
      businessId,
      transactionType: 'withdrawal',
      amount: newAmount,
      referenceType: 'manual',
      referenceId: trf.transfer_number,
      description: `Bank Transfer Out to ${newToAcc.bank_name} (${newToAcc.account_number}) [Updated]`,
      transactionDate: params.transferDate || trf.transfer_date,
    });

    newToAcc.current_balance += newAmount;
    this.recordBankTransaction({
      bankAccountId: newToId,
      businessId,
      transactionType: 'deposit',
      amount: newAmount,
      referenceType: 'manual',
      referenceId: trf.transfer_number,
      description: `Bank Transfer In from ${newFromAcc.bank_name} (${newFromAcc.account_number}) [Updated]`,
      transactionDate: params.transferDate || trf.transfer_date,
    });

    trf.from_account_id = newFromId;
    trf.from_account_name = `${newFromAcc.bank_name} (${newFromAcc.account_title})`;
    trf.to_account_id = newToId;
    trf.to_account_name = `${newToAcc.bank_name} (${newToAcc.account_title})`;
    trf.amount = newAmount;
    if (params.transferDate) trf.transfer_date = params.transferDate;
    if (params.reference !== undefined) trf.reference = params.reference;
    if (params.notes !== undefined) trf.notes = params.notes;

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'bank_transfer',
      transactionId: id,
      referenceNo: trf.transfer_number,
      action: 'edit',
      description: `Edited Bank Transfer ${trf.transfer_number}: ${newFromAcc.bank_name} -> ${newToAcc.bank_name}, PKR ${newAmount.toLocaleString()}`,
    });

    this.save();
    return { success: true, transfer: trf };
  }

  deleteBankTransfer(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.bank_transfers = this.data.bank_transfers || [];
    const trf = this.data.bank_transfers.find((t) => t.id === id);
    if (!trf) return { success: false, error: 'Bank transfer not found.' };

    const fromAcc = this.getBankAccountById(trf.from_account_id);
    if (fromAcc) {
      fromAcc.current_balance += trf.amount;
      this.recordBankTransaction({
        bankAccountId: trf.from_account_id,
        businessId,
        transactionType: 'deposit',
        amount: trf.amount,
        referenceType: 'manual',
        referenceId: `DEL-${trf.transfer_number}`,
        description: `Reversal for deleted Bank Transfer ${trf.transfer_number} (restored balance)`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const toAcc = this.getBankAccountById(trf.to_account_id);
    if (toAcc) {
      toAcc.current_balance -= trf.amount;
      this.recordBankTransaction({
        bankAccountId: trf.to_account_id,
        businessId,
        transactionType: 'withdrawal',
        amount: trf.amount,
        referenceType: 'manual',
        referenceId: `DEL-${trf.transfer_number}`,
        description: `Reversal for deleted Bank Transfer ${trf.transfer_number} (withdrawn transferred funds)`,
        transactionDate: new Date().toISOString().slice(0, 10),
      });
    }

    const idx = this.data.bank_transfers.findIndex((t) => t.id === id);
    if (idx !== -1) this.data.bank_transfers.splice(idx, 1);

    this.recordTransactionAuditLog({
      businessId,
      transactionType: 'bank_transfer',
      transactionId: id,
      referenceNo: trf.transfer_number,
      action: 'delete',
      description: `Permanently deleted Bank Transfer ${trf.transfer_number} (both bank account balances reversed)`,
    });

    this.save();
    return { success: true };
  }

  // =========================================================================
  // HR & PAYROLL MANAGEMENT ENGINE
  // =========================================================================

  recordHRAudit(params: {
    businessId: number;
    actionType: string;
    entityType: string;
    entityId: number;
    description: string;
    performedBy?: string;
  }) {
    this.data.hr_audit_logs = this.data.hr_audit_logs || [];
    const id = this.data.hr_audit_logs.length ? Math.max(...this.data.hr_audit_logs.map((l) => l.id)) + 1 : 1;
    this.data.hr_audit_logs.push({
      id,
      business_id: params.businessId,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      description: params.description,
      performed_by: params.performedBy || 'System Administrator',
      created_at: new Date().toISOString(),
    });
  }

  getHRAuditLogs(businessId: number, employeeId?: number): HRAuditLog[] {
    this.data.hr_audit_logs = this.data.hr_audit_logs || [];
    let logs = this.data.hr_audit_logs.filter((l) => l.business_id === businessId);
    if (employeeId) {
      logs = logs.filter((l) => l.entity_type === 'employee' && l.entity_id === employeeId);
    }
    return logs.sort((a, b) => b.id - a.id);
  }

  // --- EMPLOYEES CRUD ---
  getEmployees(businessId: number): Employee[] {
    this.data.employees = this.data.employees || [];
    let list = this.data.employees.filter((e) => e.business_id === businessId);
    if (list.length === 0) {
      this.seedHRDataForBusiness(businessId);
      list = this.data.employees.filter((e) => e.business_id === businessId);
    }
    return list.sort((a, b) => a.id - b.id);
  }

  getEmployeeById(id: number, businessId: number): Employee | undefined {
    this.data.employees = this.data.employees || [];
    return this.data.employees.find((e) => e.id === id && e.business_id === businessId);
  }

  createEmployee(params: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): {
    success: boolean;
    employee?: Employee;
    error?: string;
  } {
    if (!params.name || !params.name.trim()) {
      return { success: false, error: 'Employee name is required.' };
    }
    this.data.employees = this.data.employees || [];

    // Auto-allot or validate Employee Code
    let empCode = params.employee_code ? params.employee_code.trim() : '';
    const bizEmployees = this.data.employees.filter((e) => e.business_id === params.business_id);
    if (empCode) {
      const existing = bizEmployees.find(
        (e) => e.employee_code?.toLowerCase() === empCode.toLowerCase()
      );
      if (existing) {
        return { success: false, error: `Employee ID "${empCode}" already exists in this business.` };
      }
    } else {
      let maxNum = 0;
      for (const emp of bizEmployees) {
        if (!emp.employee_code) continue;
        const match = emp.employee_code.match(/EMP-(\d+)/i) || emp.employee_code.match(/(\d+)/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      }
      let nextNum = Math.max(bizEmployees.length + 1, maxNum + 1);
      empCode = `EMP-${String(nextNum).padStart(3, '0')}`;
      while (bizEmployees.some((e) => e.employee_code?.toLowerCase() === empCode.toLowerCase())) {
        nextNum++;
        empCode = `EMP-${String(nextNum).padStart(3, '0')}`;
      }
    }

    const newId = this.data.employees.length ? Math.max(...this.data.employees.map((e) => e.id)) + 1 : 1;
    const now = new Date().toISOString();

    const employee: Employee = {
      ...params,
      id: newId,
      employee_code: empCode,
      name: params.name.trim(),
      father_name: params.father_name?.trim() || '',
      cnic: params.cnic?.trim() || '',
      phone: params.phone?.trim() || '',
      email: params.email?.trim() || '',
      address: params.address?.trim() || '',
      dob: params.dob || '',
      join_date: params.join_date || now.slice(0, 10),
      photo: params.photo || '',
      emergency_contact: params.emergency_contact || '',
      designation: params.designation || 'Staff',
      department: params.department || 'General',
      employment_type: params.employment_type || 'permanent',
      salary_type: params.salary_type || 'monthly',
      status: params.status || 'active',

      monthly_salary: Number(params.monthly_salary) || 0,
      standard_hours_per_day: Number(params.standard_hours_per_day) || 8,
      standard_days_per_month: Number(params.standard_days_per_month) || 26,
      overtime_enabled: Boolean(params.overtime_enabled),
      overtime_rate_type: params.overtime_rate_type || 'salary_based',
      overtime_hourly_rate: Number(params.overtime_hourly_rate) || 0,
      holiday_overtime_rate: Number(params.holiday_overtime_rate) || 1.5,
      late_deduction_rule: params.late_deduction_rule || 'hourly',
      late_deduction_amount: Number(params.late_deduction_amount) || 0,
      short_hours_rule: params.short_hours_rule || 'hourly',
      absence_deduction_rule: params.absence_deduction_rule || 'per_day',
      absence_deduction_amount: Number(params.absence_deduction_amount) || 0,
      weekly_off_day: params.weekly_off_day || 'Sunday',
      paid_leaves_per_month: Number(params.paid_leaves_per_month) || 1,

      daily_rate: Number(params.daily_rate) || 0,
      daily_standard_hours: Number(params.daily_standard_hours) || 8,
      daily_overtime_rate: Number(params.daily_overtime_rate) || 0,

      created_at: now,
      updated_at: now,
    };

    this.data.employees.push(employee);
    this.recordHRAudit({
      businessId: params.business_id,
      actionType: 'create',
      entityType: 'employee',
      entityId: employee.id,
      description: `Created new employee "${employee.name}" (${employee.employee_code}) - ${employee.designation}`,
    });
    this.save();
    return { success: true, employee };
  }

  updateEmployee(
    id: number,
    businessId: number,
    params: Partial<Employee>
  ): { success: boolean; employee?: Employee; error?: string } {
    const emp = this.getEmployeeById(id, businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    if (params.employee_code && params.employee_code !== emp.employee_code) {
      const codeTaken = (this.data.employees || []).find(
        (e) => e.business_id === businessId && e.id !== id && e.employee_code?.toLowerCase() === params.employee_code?.toLowerCase()
      );
      if (codeTaken) return { success: false, error: `Employee code "${params.employee_code}" is already taken.` };
    }

    Object.assign(emp, params, { updated_at: new Date().toISOString() });
    this.recordHRAudit({
      businessId,
      actionType: 'update',
      entityType: 'employee',
      entityId: emp.id,
      description: `Updated profile details for employee "${emp.name}" (${emp.employee_code})`,
    });
    this.save();
    return { success: true, employee: emp };
  }

  deleteEmployee(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.employees = this.data.employees || [];
    const idx = this.data.employees.findIndex((e) => e.id === id && e.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Employee not found.' };
    const emp = this.data.employees[idx];
    if (!emp) return { success: false, error: 'Employee not found.' };
    this.data.employees.splice(idx, 1);
    this.recordHRAudit({
      businessId,
      actionType: 'delete',
      entityType: 'employee',
      entityId: id,
      description: `Deleted employee record "${emp.name}" (${emp.employee_code})`,
    });
    this.save();
    return { success: true };
  }

  // --- ATTENDANCE MANAGEMENT ---
  getAttendances(businessId: number, month?: string, date?: string, employeeId?: number): AttendanceRecord[] {
    this.data.attendances = this.data.attendances || [];
    let list = this.data.attendances.filter((a) => a.business_id === businessId);
    if (month) {
      list = list.filter((a) => a.date.startsWith(month));
    }
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    if (employeeId) {
      list = list.filter((a) => a.employee_id === employeeId);
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }

  saveAttendance(params: {
    businessId: number;
    employeeId: number;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    standardHours?: number;
    workedHours?: number;
    overtimeHours?: number;
    shortHours?: number;
    notes?: string;
  }): { success: boolean; attendance?: AttendanceRecord; error?: string } {
    const emp = this.getEmployeeById(params.employeeId, params.businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    this.data.attendances = this.data.attendances || [];
    let att = this.data.attendances.find(
      (a) => a.business_id === params.businessId && a.employee_id === params.employeeId && a.date === params.date
    );

    const stdHours = params.standardHours !== undefined ? params.standardHours : emp.salary_type === 'daily' ? emp.daily_standard_hours || 8 : emp.standard_hours_per_day || 8;
    const wrkHours = params.workedHours !== undefined ? params.workedHours : params.status === 'present' ? stdHours : params.status === 'half_day' ? stdHours / 2 : 0;
    const otHours = params.overtimeHours !== undefined ? params.overtimeHours : wrkHours > stdHours ? wrkHours - stdHours : 0;
    const shHours = params.shortHours !== undefined ? params.shortHours : wrkHours < stdHours && params.status === 'present' ? stdHours - wrkHours : 0;

    if (att) {
      att.status = params.status;
      att.check_in = params.checkIn || att.check_in;
      att.check_out = params.checkOut || att.check_out;
      att.standard_hours = stdHours;
      att.worked_hours = wrkHours;
      att.overtime_hours = otHours;
      att.short_hours = shHours;
      att.notes = params.notes !== undefined ? params.notes : att.notes;
    } else {
      const newId = this.data.attendances.length ? Math.max(...this.data.attendances.map((a) => a.id)) + 1 : 1;
      att = {
        id: newId,
        business_id: params.businessId,
        employee_id: params.employeeId,
        employee_name: emp.name,
        date: params.date,
        status: params.status,
        check_in: params.checkIn || '',
        check_out: params.checkOut || '',
        standard_hours: stdHours,
        worked_hours: wrkHours,
        overtime_hours: otHours,
        short_hours: shHours,
        notes: params.notes || '',
        created_at: new Date().toISOString(),
      };
      this.data.attendances.push(att);
    }

    this.save();
    return { success: true, attendance: att };
  }

  saveBulkAttendance(
    businessId: number,
    date: string,
    records: Array<{
      employeeId: number;
      status: AttendanceStatus;
      checkIn?: string;
      checkOut?: string;
      workedHours?: number;
      overtimeHours?: number;
      shortHours?: number;
      notes?: string;
    }>
  ): { success: boolean; count: number; error?: string } {
    let count = 0;
    for (const rec of records) {
      const res = this.saveAttendance({
        businessId,
        employeeId: rec.employeeId,
        date,
        status: rec.status,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        workedHours: rec.workedHours,
        overtimeHours: rec.overtimeHours,
        shortHours: rec.shortHours,
        notes: rec.notes,
      });
      if (res.success) count++;
    }
    return { success: true, count };
  }

  // --- PUBLIC HOLIDAYS ---
  getPublicHolidays(businessId: number): PublicHoliday[] {
    this.data.public_holidays = this.data.public_holidays || [];
    return this.data.public_holidays
      .filter((h) => h.business_id === businessId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  createPublicHoliday(params: {
    businessId: number;
    name: string;
    date: string;
    isPaid: boolean;
    isSpecial?: boolean;
    recurring?: boolean;
    notes?: string;
  }): { success: boolean; holiday?: PublicHoliday; error?: string } {
    if (!params.name || !params.date) return { success: false, error: 'Holiday name and date are required.' };

    this.data.public_holidays = this.data.public_holidays || [];
    const newId = this.data.public_holidays.length ? Math.max(...this.data.public_holidays.map((h) => h.id)) + 1 : 1;
    const holiday: PublicHoliday = {
      id: newId,
      business_id: params.businessId,
      name: params.name.trim(),
      date: params.date,
      is_paid: params.isPaid ?? true,
      is_special: Boolean(params.isSpecial),
      recurring: Boolean(params.recurring),
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.data.public_holidays.push(holiday);
    this.save();
    return { success: true, holiday };
  }

  updatePublicHoliday(
    id: number,
    businessId: number,
    params: Partial<PublicHoliday>
  ): { success: boolean; holiday?: PublicHoliday; error?: string } {
    this.data.public_holidays = this.data.public_holidays || [];
    const hol = this.data.public_holidays.find((h) => h.id === id && h.business_id === businessId);
    if (!hol) return { success: false, error: 'Public holiday not found.' };

    Object.assign(hol, params);
    this.save();
    return { success: true, holiday: hol };
  }

  deletePublicHoliday(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.public_holidays = this.data.public_holidays || [];
    const idx = this.data.public_holidays.findIndex((h) => h.id === id && h.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Holiday not found.' };
    this.data.public_holidays.splice(idx, 1);
    this.save();
    return { success: true };
  }

  // --- KHARCHA (EMPLOYEE EXPENSES) ---
  getKharchas(businessId: number, employeeId?: number, month?: string): KharchaRecord[] {
    this.data.kharchas = this.data.kharchas || [];
    let list = this.data.kharchas.filter((k) => k.business_id === businessId);
    if (employeeId) list = list.filter((k) => k.employee_id === employeeId);
    if (month) list = list.filter((k) => k.date.startsWith(month) || k.payroll_month === month);
    return list.sort((a, b) => b.id - a.id);
  }

  createKharcha(params: {
    businessId: number;
    employeeId: number;
    amount: number;
    date: string;
    paymentAccountId: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
    description: string;
    referenceNo?: string;
    enteredBy?: string;
    payrollMonth?: string;
  }): { success: boolean; kharcha?: KharchaRecord; error?: string } {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Kharcha amount must be greater than zero.' };

    const emp = this.getEmployeeById(params.employeeId, params.businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    const acc = this.getBankAccountById(params.paymentAccountId);
    if (!acc) return { success: false, error: 'Payment account not found.' };

    this.data.kharchas = this.data.kharchas || [];
    const newId = this.data.kharchas.length ? Math.max(...this.data.kharchas.map((k) => k.id)) + 1 : 1;
    const refNum = params.referenceNo || `KHR-${1000 + newId}`;
    const dateStr = params.date || new Date().toISOString().slice(0, 10);
    const pMonth = params.payrollMonth || dateStr.slice(0, 7);

    // 1. Deduct from Cash/Bank Account & record Bank Transaction
    this.recordBankTransaction({
      bankAccountId: params.paymentAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'payment',
      referenceId: refNum,
      description: `Employee Kharcha for ${emp.name} (${emp.employee_code}) - ${params.description || 'Personal expense'}`,
      transactionDate: dateStr,
    });

    // 2. Save Kharcha Record directly to Employee Ledger
    const kharcha: KharchaRecord = {
      id: newId,
      business_id: params.businessId,
      employee_id: params.employeeId,
      employee_name: emp.name,
      amount,
      date: dateStr,
      payment_account_id: params.paymentAccountId,
      payment_account_name: `${acc.bank_name} (${acc.account_title})`,
      payment_method: params.paymentMethod,
      description: params.description || 'Employee Kharcha',
      reference_no: refNum,
      entered_by: params.enteredBy || 'Administrator',
      payroll_month: pMonth,
      status: 'approved',
      created_at: new Date().toISOString(),
    };

    this.data.kharchas.push(kharcha);
    this.recordHRAudit({
      businessId: params.businessId,
      actionType: 'create',
      entityType: 'kharcha',
      entityId: kharcha.id,
      description: `Given Kharcha of ${amount} to ${emp.name} via ${acc.bank_name}`,
      performedBy: params.enteredBy,
    });

    this.save();
    return { success: true, kharcha };
  }

  createBulkKharcha(
    businessId: number,
    items: Array<{
      employeeId: number;
      amount: number;
      paymentAccountId: number;
      paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
      note: string;
      date?: string;
      enteredBy?: string;
    }>
  ): { success: boolean; count: number; totalAmount: number; error?: string } {
    let count = 0;
    let totalAmount = 0;
    for (const item of items) {
      if (!item.amount || Number(item.amount) <= 0) continue;
      const res = this.createKharcha({
        businessId,
        employeeId: item.employeeId,
        amount: Number(item.amount),
        date: item.date || new Date().toISOString().slice(0, 10),
        paymentAccountId: item.paymentAccountId,
        paymentMethod: item.paymentMethod || 'Cash',
        description: item.note || 'Bulk Kharcha distribution',
        enteredBy: item.enteredBy,
      });
      if (res.success && res.kharcha) {
        count++;
        totalAmount += res.kharcha.amount;
      }
    }
    return { success: true, count, totalAmount };
  }

  deleteKharcha(id: number, businessId: number): { success: boolean; error?: string } {
    this.data.kharchas = this.data.kharchas || [];
    const idx = this.data.kharchas.findIndex((k) => k.id === id && k.business_id === businessId);
    if (idx === -1) return { success: false, error: 'Kharcha not found.' };

    const k = this.data.kharchas[idx];
    // Reversal of cash/bank
    this.recordBankTransaction({
      bankAccountId: k.payment_account_id,
      businessId,
      transactionType: 'deposit',
      amount: k.amount,
      referenceType: 'receipt',
      referenceId: k.reference_no,
      description: `Reversal of deleted Kharcha (${k.reference_no}) for employee #${k.employee_id}`,
      transactionDate: new Date().toISOString().slice(0, 10),
    });

    this.data.kharchas.splice(idx, 1);
    this.save();
    return { success: true };
  }

  // --- ADVANCES & LOANS ---
  getAdvances(businessId: number, employeeId?: number): AdvanceRecord[] {
    this.data.advances = this.data.advances || [];
    let list = this.data.advances.filter((a) => a.business_id === businessId);
    if (employeeId) list = list.filter((a) => a.employee_id === employeeId);
    return list.sort((a, b) => b.id - a.id);
  }

  createAdvance(params: {
    businessId: number;
    employeeId: number;
    advanceAmount: number;
    date: string;
    paymentAccountId: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
    reason: string;
    monthlyDeduction: number;
    startMonth: string;
    enteredBy?: string;
  }): { success: boolean; advance?: AdvanceRecord; error?: string } {
    const amount = Number(params.advanceAmount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Advance amount must be greater than zero.' };

    const emp = this.getEmployeeById(params.employeeId, params.businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    const acc = this.getBankAccountById(params.paymentAccountId);
    if (!acc) return { success: false, error: 'Payment account not found.' };

    this.data.advances = this.data.advances || [];
    const newId = this.data.advances.length ? Math.max(...this.data.advances.map((a) => a.id)) + 1 : 1;
    const refNum = `ADV-${1000 + newId}`;
    const dateStr = params.date || new Date().toISOString().slice(0, 10);

    // 1. Deduct from Cash/Bank Account
    this.recordBankTransaction({
      bankAccountId: params.paymentAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'payment',
      referenceId: refNum,
      description: `Staff Advance disbursed to ${emp.name} (${emp.employee_code}) - ${params.reason || 'Salary Advance'}`,
      transactionDate: dateStr,
    });

    // 2. Save Advance Record directly to Employee Ledger
    const advance: AdvanceRecord = {
      id: newId,
      business_id: params.businessId,
      employee_id: params.employeeId,
      employee_name: emp.name,
      advance_amount: amount,
      date: dateStr,
      payment_account_id: params.paymentAccountId,
      payment_account_name: `${acc.bank_name} (${acc.account_title})`,
      payment_method: params.paymentMethod,
      reason: params.reason || 'Staff Advance',
      monthly_deduction: Number(params.monthlyDeduction) || amount,
      start_month: params.startMonth || dateStr.slice(0, 7),
      total_repaid: 0,
      remaining_balance: amount,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.data.advances.push(advance);
    this.recordHRAudit({
      businessId: params.businessId,
      actionType: 'create',
      entityType: 'advance',
      entityId: advance.id,
      description: `Disbursed advance of ${amount} to ${emp.name}. Repayment: ${params.monthlyDeduction}/mo starting ${advance.start_month}`,
      performedBy: params.enteredBy,
    });

    this.save();
    return { success: true, advance };
  }

  settleAdvance(advanceId: number, businessId: number, amount?: number): { success: boolean; error?: string } {
    this.data.advances = this.data.advances || [];
    const adv = this.data.advances.find((a) => a.id === advanceId && a.business_id === businessId);
    if (!adv) return { success: false, error: 'Advance record not found.' };

    const repayAmt = amount !== undefined ? Math.min(amount, adv.remaining_balance) : adv.remaining_balance;
    adv.total_repaid += repayAmt;
    adv.remaining_balance = Math.max(0, adv.advance_amount - adv.total_repaid);
    if (adv.remaining_balance <= 0) {
      adv.status = 'settled';
    }

    this.recordHRAudit({
      businessId,
      actionType: 'settle',
      entityType: 'advance',
      entityId: adv.id,
      description: `Settled ${repayAmt} on advance for ${adv.employee_name}. Remaining: ${adv.remaining_balance}`,
    });

    this.save();
    return { success: true };
  }

  // --- BONUSES ---
  getBonuses(businessId: number, employeeId?: number, month?: string): BonusRecord[] {
    this.data.bonuses = this.data.bonuses || [];
    let list = this.data.bonuses.filter((b) => b.business_id === businessId);
    if (employeeId) list = list.filter((b) => b.employee_id === employeeId);
    if (month) list = list.filter((b) => b.date.startsWith(month) || b.payroll_month === month);
    return list.sort((a, b) => b.id - a.id);
  }

  createBonus(params: {
    businessId: number;
    employeeId: number;
    bonusType: 'Eid Bonus' | 'Performance Bonus' | 'Festival Bonus' | 'Special Bonus' | 'Other Bonus';
    amount: number;
    date: string;
    paymentAccountId: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
    note: string;
    payrollMonth?: string;
    enteredBy?: string;
  }): { success: boolean; bonus?: BonusRecord; error?: string } {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Bonus amount must be greater than zero.' };

    const emp = this.getEmployeeById(params.employeeId, params.businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    const acc = this.getBankAccountById(params.paymentAccountId);
    if (!acc) return { success: false, error: 'Payment account not found.' };

    this.data.bonuses = this.data.bonuses || [];
    const newId = this.data.bonuses.length ? Math.max(...this.data.bonuses.map((b) => b.id)) + 1 : 1;
    const refNum = `BON-${1000 + newId}`;
    const dateStr = params.date || new Date().toISOString().slice(0, 10);
    const pMonth = params.payrollMonth || dateStr.slice(0, 7);

    // 1. Deduct from Cash/Bank Account
    this.recordBankTransaction({
      bankAccountId: params.paymentAccountId,
      businessId: params.businessId,
      transactionType: 'withdrawal',
      amount,
      referenceType: 'payment',
      referenceId: refNum,
      description: `${params.bonusType} for ${emp.name} (${emp.employee_code}) - ${params.note || 'Special incentive'}`,
      transactionDate: dateStr,
    });

    // 2. Save Bonus Record directly to Employee Ledger
    const bonus: BonusRecord = {
      id: newId,
      business_id: params.businessId,
      employee_id: params.employeeId,
      employee_name: emp.name,
      bonus_type: params.bonusType,
      amount,
      date: dateStr,
      payment_account_id: params.paymentAccountId,
      payment_account_name: `${acc.bank_name} (${acc.account_title})`,
      payment_method: params.paymentMethod,
      note: params.note || params.bonusType,
      payroll_month: pMonth,
      created_at: new Date().toISOString(),
    };

    this.data.bonuses.push(bonus);
    this.recordHRAudit({
      businessId: params.businessId,
      actionType: 'create',
      entityType: 'bonus',
      entityId: bonus.id,
      description: `Disbursed ${params.bonusType} of ${amount} to ${emp.name}`,
      performedBy: params.enteredBy,
    });

    this.save();
    return { success: true, bonus };
  }

  createBulkBonus(
    businessId: number,
    items: Array<{
      employeeId: number;
      bonusType: any;
      amount: number;
      paymentAccountId: number;
      paymentMethod: any;
      note: string;
      date?: string;
      enteredBy?: string;
    }>
  ): { success: boolean; count: number; totalAmount: number; error?: string } {
    let count = 0;
    let totalAmount = 0;
    for (const item of items) {
      if (!item.amount || Number(item.amount) <= 0) continue;
      const res = this.createBonus({
        businessId,
        employeeId: item.employeeId,
        bonusType: item.bonusType || 'Special Bonus',
        amount: Number(item.amount),
        date: item.date || new Date().toISOString().slice(0, 10),
        paymentAccountId: item.paymentAccountId,
        paymentMethod: item.paymentMethod || 'Bank Transfer',
        note: item.note || 'Bulk bonus disbursement',
        enteredBy: item.enteredBy,
      });
      if (res.success && res.bonus) {
        count++;
        totalAmount += res.bonus.amount;
      }
    }
    return { success: true, count, totalAmount };
  }

  // --- OTHER DEDUCTIONS ---
  getOtherDeductions(businessId: number, employeeId?: number, month?: string): OtherDeductionRecord[] {
    this.data.other_deductions = this.data.other_deductions || [];
    let list = this.data.other_deductions.filter((d) => d.business_id === businessId);
    if (employeeId) list = list.filter((d) => d.employee_id === employeeId);
    if (month) list = list.filter((d) => d.payroll_month === month || d.date.startsWith(month));
    return list.sort((a, b) => b.id - a.id);
  }

  createOtherDeduction(params: {
    businessId: number;
    employeeId: number;
    deductionType: 'Damage' | 'Loan' | 'Fine' | 'Missing Item' | 'Other';
    amount: number;
    date: string;
    reason: string;
    authorizedBy: string;
    payrollMonth: string;
  }): { success: boolean; deduction?: OtherDeductionRecord; error?: string } {
    const amount = Number(params.amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Deduction amount must be greater than zero.' };

    const emp = this.getEmployeeById(params.employeeId, params.businessId);
    if (!emp) return { success: false, error: 'Employee not found.' };

    this.data.other_deductions = this.data.other_deductions || [];
    const newId = this.data.other_deductions.length ? Math.max(...this.data.other_deductions.map((d) => d.id)) + 1 : 1;

    const deduction: OtherDeductionRecord = {
      id: newId,
      business_id: params.businessId,
      employee_id: params.employeeId,
      employee_name: emp.name,
      deduction_type: params.deductionType,
      amount,
      date: params.date || new Date().toISOString().slice(0, 10),
      reason: params.reason,
      authorized_by: params.authorizedBy || 'Manager',
      payroll_month: params.payrollMonth || params.date?.slice(0, 7) || new Date().toISOString().slice(0, 7),
      created_at: new Date().toISOString(),
    };

    this.data.other_deductions.push(deduction);
    this.recordHRAudit({
      businessId: params.businessId,
      actionType: 'create',
      entityType: 'deduction',
      entityId: deduction.id,
      description: `Approved ${params.deductionType} deduction of ${amount} for ${emp.name}. Reason: ${params.reason}`,
      performedBy: params.authorizedBy,
    });

    this.save();
    return { success: true, deduction };
  }

  // --- COMPREHENSIVE MULTI-STRUCTURE PAYROLL ENGINE ---
  calculateMonthlyPayroll(
    businessId: number,
    month: string // YYYY-MM
  ): { success: boolean; payroll: MonthlyPayroll; items: PayrollItem[]; error?: string } {
    this.data.monthly_payrolls = this.data.monthly_payrolls || [];
    this.data.payroll_items = this.data.payroll_items || [];

    // Check if finalized
    let existingPayroll = this.data.monthly_payrolls.find(
      (p) => p.business_id === businessId && p.month === month
    );

    if (existingPayroll && existingPayroll.status === 'finalized') {
      const items = this.data.payroll_items.filter((i) => i.payroll_id === existingPayroll!.id);
      return { success: true, payroll: existingPayroll, items };
    }

    const employees = this.getEmployees(businessId).filter((e) => e.status === 'active');
    const attendances = this.getAttendances(businessId, month);
    const kharchas = this.getKharchas(businessId, undefined, month);
    const advances = this.getAdvances(businessId);
    const bonuses = this.getBonuses(businessId, undefined, month);
    const otherDeductions = this.getOtherDeductions(businessId, undefined, month);
    const holidays = this.getPublicHolidays(businessId).filter((h) => h.date.startsWith(month));

    const payrollId = existingPayroll
      ? existingPayroll.id
      : this.data.monthly_payrolls.length
      ? Math.max(...this.data.monthly_payrolls.map((p) => p.id)) + 1
      : 1;

    // Remove old draft items for this payroll
    this.data.payroll_items = this.data.payroll_items.filter((i) => i.payroll_id !== payrollId);

    const computedItems: PayrollItem[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const empAtts = attendances.filter((a) => a.employee_id === emp.id);

      // Attendance calculations
      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let totalWorkedHours = 0;
      let totalOvertimeHours = 0;
      let totalShortHours = 0;

      for (const a of empAtts) {
        if (a.status === 'present') presentDays++;
        else if (a.status === 'half_day') halfDays++;
        else if (a.status === 'absent') absentDays++;
        else if (a.status === 'leave' || a.status === 'paid_leave' || a.status === 'public_holiday') paidLeaveDays++;
        else if (a.status === 'unpaid_leave') unpaidLeaveDays++;

        totalWorkedHours += a.worked_hours || 0;
        totalOvertimeHours += a.overtime_hours || 0;
        totalShortHours += a.short_hours || 0;
      }

      let basicOrDailyRate = 0;
      let earnedBasic = 0;
      let overtimeRate = 0;
      let overtimeAmount = 0;
      let absenceDeduction = 0;
      let shortHoursDeduction = 0;

      // -------------------------------------------------------------
      // CASE 1 & CASE 3: MONTHLY SALARY EMPLOYEE
      // -------------------------------------------------------------
      if (emp.salary_type === 'monthly') {
        const stdDays = emp.standard_days_per_month || 26;
        const stdHours = emp.standard_hours_per_day || 8;
        const baseSalary = emp.monthly_salary || 0;
        basicOrDailyRate = baseSalary;

        const hourlyBaseRate = stdDays * stdHours > 0 ? baseSalary / (stdDays * stdHours) : 0;
        const dailyBaseRate = stdDays > 0 ? baseSalary / stdDays : 0;

        // Earned basic
        earnedBasic = baseSalary;

        // Overtime Calculation
        if (emp.overtime_enabled && emp.overtime_rate_type !== 'disabled') {
          if (emp.overtime_rate_type === 'fixed_hourly') {
            overtimeRate = emp.overtime_hourly_rate || hourlyBaseRate;
          } else {
            // Salary based overtime rate
            overtimeRate = hourlyBaseRate * (emp.holiday_overtime_rate || 1.25);
          }
          overtimeAmount = Math.round(totalOvertimeHours * overtimeRate);
        }

        // Absence Deduction
        const effectiveAbsentDays = absentDays + unpaidLeaveDays + (halfDays * 0.5);
        if (emp.absence_deduction_rule === 'per_day' || emp.absence_deduction_rule === 'unpaid') {
          absenceDeduction = Math.round(effectiveAbsentDays * dailyBaseRate);
        } else if (emp.absence_deduction_rule === 'fixed') {
          absenceDeduction = Math.round(effectiveAbsentDays * (emp.absence_deduction_amount || dailyBaseRate));
        }

        // Short Hours Deduction
        if (emp.short_hours_rule === 'hourly') {
          shortHoursDeduction = Math.round(totalShortHours * hourlyBaseRate);
        } else if (emp.short_hours_rule === 'fixed') {
          shortHoursDeduction = Math.round(totalShortHours * (emp.late_deduction_amount || hourlyBaseRate));
        }
      }
      // -------------------------------------------------------------
      // CASE 2: DAILY WAGE EMPLOYEE
      // -------------------------------------------------------------
      else {
        const dailyRate = emp.daily_rate || 0;
        const stdHours = emp.daily_standard_hours || 8;
        basicOrDailyRate = dailyRate;
        const hourlyRate = stdHours > 0 ? dailyRate / stdHours : 0;

        // Basic wage earned = (present days * daily rate) + (half days * daily rate * 0.5)
        const daysWorked = presentDays + (halfDays * 0.5);
        earnedBasic = Math.round(daysWorked * dailyRate);

        // Daily Overtime
        overtimeRate = emp.daily_overtime_rate || (hourlyRate * 1.5);
        overtimeAmount = Math.round(totalOvertimeHours * overtimeRate);

        // Daily workers don't have separate absence deduction because they are only paid for days worked
        absenceDeduction = 0;
        shortHoursDeduction = 0;
      }

      // Bonuses
      const empBonuses = bonuses.filter((b) => b.employee_id === emp.id);
      const bonusAmount = empBonuses.reduce((sum, b) => sum + b.amount, 0);

      // Kharchas (Employee expenses incurred this month)
      const empKharchas = kharchas.filter((k) => k.employee_id === emp.id);
      const kharchaAmount = empKharchas.reduce((sum, k) => sum + k.amount, 0);

      // Advances (Deduct monthly installment from remaining balance)
      const empAdvances = advances.filter(
        (a) => a.employee_id === emp.id && a.status === 'active' && a.remaining_balance > 0 && a.start_month <= month
      );
      let advanceDeduction = 0;
      for (const adv of empAdvances) {
        const toDeduct = Math.min(adv.monthly_deduction || adv.remaining_balance, adv.remaining_balance);
        advanceDeduction += toDeduct;
      }

      // Other Deductions
      const empOtherDeductions = otherDeductions.filter((d) => d.employee_id === emp.id);
      const otherDeductionAmount = empOtherDeductions.reduce((sum, d) => sum + d.amount, 0);

      // Totals
      const gross = earnedBasic + overtimeAmount + bonusAmount;
      const allDeductions = kharchaAmount + advanceDeduction + absenceDeduction + shortHoursDeduction + otherDeductionAmount;
      const netPayable = Math.max(0, gross - allDeductions);

      totalGross += gross;
      totalDeductions += allDeductions;
      totalNet += netPayable;

      const calcDetails = JSON.stringify({
        salary_type: emp.salary_type,
        base: basicOrDailyRate,
        earnedBasic,
        totalWorkedHours,
        totalOvertimeHours,
        overtimeRate,
        overtimeAmount,
        presentDays,
        absentDays,
        halfDays,
        paidLeaveDays,
        bonusAmount,
        kharchaAmount,
        advanceDeduction,
        absenceDeduction,
        shortHoursDeduction,
        otherDeductionAmount,
        gross,
        netPayable,
      });

      const itemId = this.data.payroll_items.length ? Math.max(...this.data.payroll_items.map((i) => i.id)) + 1 : 1;
      const item: PayrollItem = {
        id: itemId,
        payroll_id: payrollId,
        business_id: businessId,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_code: emp.employee_code,
        department: emp.department,
        salary_type: emp.salary_type,
        basic_or_daily_rate: basicOrDailyRate,
        working_days: presentDays + halfDays,
        worked_hours: totalWorkedHours,
        earned_basic: earnedBasic,
        overtime_hours: totalOvertimeHours,
        overtime_amount: overtimeAmount,
        bonus_amount: bonusAmount,
        kharcha_amount: kharchaAmount,
        advance_deduction: advanceDeduction,
        absence_deduction: absenceDeduction,
        short_hours_deduction: shortHoursDeduction,
        other_deductions: otherDeductionAmount,
        gross_amount: gross,
        net_payable: netPayable,
        paid_amount: 0,
        payment_status: 'unpaid',
        calculation_details: calcDetails,
        created_at: new Date().toISOString(),
      };

      computedItems.push(item);
      this.data.payroll_items.push(item);
    }

    let payroll: MonthlyPayroll;
    if (existingPayroll) {
      existingPayroll.total_gross = totalGross;
      existingPayroll.total_deductions = totalDeductions;
      existingPayroll.total_net = totalNet;
      payroll = existingPayroll;
    } else {
      payroll = {
        id: payrollId,
        business_id: businessId,
        month,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        total_paid: 0,
        status: 'draft',
        created_at: new Date().toISOString(),
      };
      this.data.monthly_payrolls.push(payroll);
    }

    this.save();
    return { success: true, payroll, items: computedItems };
  }

  getMonthlyPayroll(businessId: number, month: string): { payroll: MonthlyPayroll | null; items: PayrollItem[] } {
    this.data.monthly_payrolls = this.data.monthly_payrolls || [];
    this.data.payroll_items = this.data.payroll_items || [];
    const payroll = this.data.monthly_payrolls.find((p) => p.business_id === businessId && p.month === month) || null;
    const items = payroll ? this.data.payroll_items.filter((i) => i.payroll_id === payroll.id) : [];
    return { payroll, items };
  }

  finalizeMonthlyPayroll(
    businessId: number,
    month: string,
    finalizedBy: string
  ): { success: boolean; payroll?: MonthlyPayroll; error?: string } {
    this.data.monthly_payrolls = this.data.monthly_payrolls || [];
    const p = this.data.monthly_payrolls.find((x) => x.business_id === businessId && x.month === month);
    if (!p) return { success: false, error: 'Payroll has not been calculated yet.' };
    if (p.status === 'finalized') return { success: false, error: 'Payroll is already finalized.' };

    p.status = 'finalized';
    p.finalized_at = new Date().toISOString();
    p.finalized_by = finalizedBy || 'Administrator';

    this.recordHRAudit({
      businessId,
      actionType: 'finalize',
      entityType: 'payroll',
      entityId: p.id,
      description: `Finalized monthly payroll for ${month}. Total Net Payable: ${p.total_net}`,
      performedBy: finalizedBy,
    });

    this.save();
    return { success: true, payroll: p };
  }

  reopenMonthlyPayroll(
    businessId: number,
    month: string,
    reopenedBy: string
  ): { success: boolean; payroll?: MonthlyPayroll; error?: string } {
    this.data.monthly_payrolls = this.data.monthly_payrolls || [];
    const p = this.data.monthly_payrolls.find((x) => x.business_id === businessId && x.month === month);
    if (!p) return { success: false, error: 'Payroll not found.' };

    p.status = 'draft';
    p.reopened_at = new Date().toISOString();
    p.reopened_by = reopenedBy || 'Administrator';

    this.recordHRAudit({
      businessId,
      actionType: 'reopen',
      entityType: 'payroll',
      entityId: p.id,
      description: `Reopened monthly payroll for ${month}`,
      performedBy: reopenedBy,
    });

    this.save();
    return { success: true, payroll: p };
  }

  paySalary(params: {
    businessId: number;
    payrollItemId: number;
    paymentAccountId: number;
    paymentMethod: string;
    referenceNo?: string;
    notes?: string;
    paidBy?: string;
  }): { success: boolean; item?: PayrollItem; error?: string } {
    this.data.payroll_items = this.data.payroll_items || [];
    const item = this.data.payroll_items.find((i) => i.id === params.payrollItemId && i.business_id === params.businessId);
    if (!item) return { success: false, error: 'Payroll item not found.' };
    if (item.payment_status === 'paid') return { success: false, error: 'This salary has already been paid.' };

    const acc = this.getBankAccountById(params.paymentAccountId);
    if (!acc) return { success: false, error: 'Payment account not found.' };

    const amount = item.net_payable;
    const refNum = params.referenceNo || `SAL-${1000 + item.id}`;
    const dateStr = new Date().toISOString().slice(0, 10);

    // 1. Deduct from Cash/Bank Account
    if (amount > 0) {
      this.recordBankTransaction({
        bankAccountId: params.paymentAccountId,
        businessId: params.businessId,
        transactionType: 'withdrawal',
        amount,
        referenceType: 'payment',
        referenceId: refNum,
        description: `Salary disbursement to ${item.employee_name} (${item.employee_code || ''}) - Ref: ${refNum}`,
        transactionDate: dateStr,
      });
    }

    // 2. Mark salary item as paid directly in Employee Ledger
    item.payment_status = 'paid';
    item.paid_amount = amount;
    item.payment_date = dateStr;
    item.payment_account_id = params.paymentAccountId;
    item.payment_account_name = `${acc.bank_name} (${acc.account_title})`;
    item.payment_method = params.paymentMethod;
    item.reference_no = refNum;

    // 4. Update employee advances repayment
    if (item.advance_deduction > 0) {
      const advances = this.getAdvances(params.businessId, item.employee_id).filter((a) => a.status === 'active');
      let remainingDeduction = item.advance_deduction;
      for (const adv of advances) {
        if (remainingDeduction <= 0) break;
        const deductThis = Math.min(remainingDeduction, adv.remaining_balance);
        adv.total_repaid += deductThis;
        adv.remaining_balance -= deductThis;
        if (adv.remaining_balance <= 0) adv.status = 'settled';
        remainingDeduction -= deductThis;
      }
    }

    // 5. Update parent monthly payroll total paid
    const payroll = this.data.monthly_payrolls?.find((p) => p.id === item.payroll_id);
    if (payroll) {
      const items = this.data.payroll_items.filter((i) => i.payroll_id === payroll.id);
      payroll.total_paid = items.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
      if (items.every((i) => i.payment_status === 'paid')) {
        payroll.status = 'paid';
      }
    }

    this.recordHRAudit({
      businessId: params.businessId,
      actionType: 'pay_salary',
      entityType: 'payroll_item',
      entityId: item.id,
      description: `Disbursed net salary ${amount} to ${item.employee_name} from ${acc.bank_name}`,
      performedBy: params.paidBy,
    });

    this.save();
    return { success: true, item };
  }

  payBulkSalaries(params: {
    businessId: number;
    month: string;
    paymentAccountId: number;
    paymentMethod: string;
    itemIds: number[];
    paidBy?: string;
  }): { success: boolean; count: number; totalPaid: number; error?: string } {
    let count = 0;
    let totalPaid = 0;
    for (const itemId of params.itemIds) {
      const res = this.paySalary({
        businessId: params.businessId,
        payrollItemId: itemId,
        paymentAccountId: params.paymentAccountId,
        paymentMethod: params.paymentMethod,
        paidBy: params.paidBy,
      });
      if (res.success && res.item) {
        count++;
        totalPaid += res.item.paid_amount;
      }
    }
    return { success: true, count, totalPaid };
  }

  // --- EMPLOYEE STATEMENT & LEDGER ---
  getEmployeeStatement(
    businessId: number,
    employeeId: number,
    fromDate?: string,
    toDate?: string
  ): {
    employee: Employee;
    entries: EmployeeStatementEntry[];
    transactions?: EmployeeStatementEntry[];
    totalDebit: number;
    totalCredit: number;
    currentBalance: number;
    summary?: {
      total_earned: number;
      total_paid: number;
      total_kharcha: number;
      advance_balance: number;
      net_balance: number;
    };
  } {
    const emp = this.getEmployeeById(employeeId, businessId);
    if (!emp) throw new Error('Employee not found');

    const entries: EmployeeStatementEntry[] = [];

    // 1. Payroll Items (Earned basic, Daily Wage, OT, Bonus, Paid salary, Advance deduction)
    const payrollItems = (this.data.payroll_items || []).filter(
      (p) => p.business_id === businessId && p.employee_id === employeeId
    );
    for (const p of payrollItems) {
      const parentPayroll = (this.data.monthly_payrolls || []).find((x) => x.id === p.payroll_id);
      const mStr = parentPayroll ? parentPayroll.month : 'Month';
      
      // Credit: Basic Salary or Daily Wage
      if (p.earned_basic > 0) {
        const isDaily = emp.salary_type === 'daily';
        entries.push({
          date: `${mStr}-01`,
          type: isDaily ? 'daily_wage' : 'salary_earned',
          description: isDaily
            ? `Daily Wage for ${mStr} (${p.working_days} days worked)`
            : `Monthly Salary Earned for ${mStr} (${p.working_days} working days)`,
          debit: 0,
          credit: p.earned_basic,
          balance: 0,
        });
      }
      
      // Credit: Overtime
      if (p.overtime_amount > 0) {
        entries.push({
          date: `${mStr}-25`,
          type: 'overtime',
          description: `Overtime Pay (${p.overtime_hours} hrs) for ${mStr}`,
          debit: 0,
          credit: p.overtime_amount,
          balance: 0,
        });
      }

      // Credit: Bonus included in payroll
      if (p.bonus_amount > 0) {
        entries.push({
          date: `${mStr}-26`,
          type: 'bonus',
          description: `Bonus incentive included in ${mStr} Payroll`,
          debit: 0,
          credit: p.bonus_amount,
          balance: 0,
        });
      }

      // Debit: Advance Deduction in payroll
      if (p.advance_deduction > 0) {
        entries.push({
          date: `${mStr}-28`,
          type: 'advance_deduction',
          description: `Advance Recovery / Deduction in ${mStr} Payroll`,
          debit: p.advance_deduction,
          credit: 0,
          balance: 0,
        });
      }

      // Debit: Salary Paid
      if (p.payment_status === 'paid' && p.paid_amount > 0) {
        entries.push({
          date: p.payment_date || `${mStr}-30`,
          type: 'salary_paid',
          description: `Salary Payment for ${mStr} via ${p.payment_method || 'Bank'} (${p.reference_no || 'Ref'})`,
          debit: p.paid_amount,
          credit: 0,
          balance: 0,
          reference: p.reference_no,
        });
      }
    }

    // 2. Direct Salary Payments (if any recorded outside payroll_items)
    const directSalaryPayments = (this.data.salary_payments || []).filter(
      (s) => s.business_id === businessId && s.employee_id === employeeId
    );
    for (const sp of directSalaryPayments) {
      const alreadyInPayroll = entries.some(
        (e) => e.reference && sp.reference_no && e.reference === sp.reference_no
      );
      if (!alreadyInPayroll && sp.net_paid > 0) {
        entries.push({
          date: sp.payment_date || new Date().toISOString().slice(0, 10),
          type: 'salary_paid',
          description: `Salary Payment for ${sp.month} via ${sp.payment_method} (${sp.reference_no || 'Ref'})`,
          debit: sp.net_paid,
          credit: 0,
          balance: 0,
          reference: sp.reference_no,
        });
      }
    }

    // 3. Kharchas (Debit)
    const kharchas = (this.data.kharchas || []).filter(
      (k) => k.business_id === businessId && k.employee_id === employeeId
    );
    for (const k of kharchas) {
      entries.push({
        date: k.date,
        type: 'kharcha',
        description: `Kharcha Disbursement (${k.description || 'Personal expense'}) - ${k.reference_no}`,
        debit: k.amount,
        credit: 0,
        balance: 0,
        reference: k.reference_no,
      });
    }

    // 4. Advances Given (Debit to employee)
    const advances = (this.data.advances || []).filter(
      (a) => a.business_id === businessId && a.employee_id === employeeId
    );
    for (const a of advances) {
      entries.push({
        date: a.date,
        type: 'advance',
        description: `Staff Advance received (${a.reason}) - ${a.payment_method}`,
        debit: a.advance_amount,
        credit: 0,
        balance: 0,
      });
    }

    // 5. Bonuses (Credit)
    const bonuses = (this.data.bonuses || []).filter(
      (b) => b.business_id === businessId && b.employee_id === employeeId
    );
    for (const b of bonuses) {
      entries.push({
        date: b.date,
        type: 'bonus',
        description: `${b.bonus_type} - ${b.note || 'Special Reward'}`,
        debit: 0,
        credit: b.amount,
        balance: 0,
      });
    }

    // 6. Other Deductions (Debit)
    const otherDeds = (this.data.other_deductions || []).filter(
      (d) => d.business_id === businessId && d.employee_id === employeeId
    );
    for (const d of otherDeds) {
      entries.push({
        date: d.date,
        type: 'other_deduction',
        description: `Approved Deduction: ${d.deduction_type} (${d.reason})`,
        debit: d.amount,
        credit: 0,
        balance: 0,
      });
    }

    // Sort by date ascending
    entries.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance: Balance = previous + Credit - Debit
    let running = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
      running += entry.credit - entry.debit;
      entry.balance = running;
    }

    let filtered = entries;
    if (fromDate) filtered = filtered.filter((e) => e.date >= fromDate);
    if (toDate) filtered = filtered.filter((e) => e.date <= toDate);

    const totalKharcha = kharchas.reduce((s, k) => s + k.amount, 0);
    const totalAdvanceBal = advances.reduce((s, a) => s + (a.remaining_balance ?? a.advance_amount), 0);

    return {
      employee: emp,
      entries: filtered,
      transactions: filtered, // Support both naming conventions
      totalDebit,
      totalCredit,
      currentBalance: running,
      summary: {
        total_earned: totalCredit,
        total_paid: totalDebit,
        total_kharcha: totalKharcha,
        advance_balance: totalAdvanceBal,
        net_balance: running,
      },
    };
  }

  // --- HR REPORT SUMMARY ---
  getHRReportSummary(businessId: number, month?: string) {
    const employees = this.getEmployees(businessId);
    const activeEmps = employees.filter((e) => e.status === 'active');
    const curMonth = month || new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);

    const attendances = this.getAttendances(businessId, undefined, today);
    const todayPresent = attendances.filter((a) => a.status === 'present').length;
    const todayAbsent = attendances.filter((a) => a.status === 'absent').length;
    const todayLeave = attendances.filter((a) => a.status === 'leave' || a.status === 'paid_leave' || a.status === 'half_day').length;

    const kharchas = this.getKharchas(businessId, undefined, curMonth);
    const totalKharcha = kharchas.reduce((sum, k) => sum + k.amount, 0);

    const advances = this.getAdvances(businessId);
    const totalAdvances = advances.reduce((sum, a) => sum + a.advance_amount, 0);
    const outstandingAdvances = advances.reduce((sum, a) => sum + a.remaining_balance, 0);

    const bonuses = this.getBonuses(businessId, undefined, curMonth);
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

    const payrollRes = this.getMonthlyPayroll(businessId, curMonth);
    const monthlyPayroll = payrollRes.payroll ? payrollRes.payroll.total_net : 0;
    const salaryPaid = payrollRes.payroll ? payrollRes.payroll.total_paid : 0;
    const salaryPayable = Math.max(0, monthlyPayroll - salaryPaid);

    let totalOvertime = 0;
    if (payrollRes.items) {
      totalOvertime = payrollRes.items.reduce((sum, i) => sum + (i.overtime_amount || 0), 0);
    }

    // Department group totals
    const deptMap: Record<string, { count: number; totalBasic: number; totalGross: number; totalNet: number; totalKharcha: number }> = {};
    for (const emp of activeEmps) {
      const dept = emp.department || 'General';
      if (!deptMap[dept]) {
        deptMap[dept] = { count: 0, totalBasic: 0, totalGross: 0, totalNet: 0, totalKharcha: 0 };
      }
      deptMap[dept].count++;
      deptMap[dept].totalBasic += emp.salary_type === 'monthly' ? emp.monthly_salary : emp.daily_rate * 26;

      const pItem = payrollRes.items.find((i) => i.employee_id === emp.id);
      if (pItem) {
        deptMap[dept].totalGross += pItem.gross_amount;
        deptMap[dept].totalNet += pItem.net_payable;
        deptMap[dept].totalKharcha += pItem.kharcha_amount;
      }
    }

    const departmentSummaries = Object.keys(deptMap).map((k) => ({
      department: k,
      ...deptMap[k],
    }));

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmps.length,
      inactiveEmployees: employees.length - activeEmps.length,
      monthlyPayroll,
      salaryPayable,
      salaryPaid,
      totalOvertime,
      totalKharcha,
      totalAdvances,
      outstandingAdvances,
      totalBonuses,
      todayAttendance: {
        present: todayPresent,
        absent: todayAbsent,
        leave: todayLeave,
        total: activeEmps.length,
      },
      departmentSummaries,
    };
  }

  // --- SEED INITIAL HR DATA FOR A BUSINESS ---
  seedHRDataForBusiness(businessId: number) {
    this.data.employees = this.data.employees || [];
    if (this.data.employees.some((e) => e.business_id === businessId)) return;

    const now = new Date().toISOString();
    const curMonth = now.slice(0, 7); // e.g. 2026-09

    // Find cash or bank account for this business to link seeds
    const accounts = this.getBankAccountsForBusiness(businessId);
    const primaryAcc = accounts[0] || { id: 1, bank_name: 'Main Business Cash' };

    const initialEmployees: Array<Omit<Employee, 'id' | 'created_at' | 'updated_at'>> = [
      {
        business_id: businessId,
        employee_code: 'EMP-001',
        name: 'Muhammad Bilal Khan',
        father_name: 'Tariq Mehmood Khan',
        cnic: '35201-1234567-1',
        phone: '+92 300 4551244',
        email: 'bilal.khan@company.com',
        address: 'Plot 45-B, Industrial Estate, Lahore',
        dob: '1990-04-15',
        join_date: '2023-01-10',
        emergency_contact: '+92 300 9876543 (Brother)',
        designation: 'Senior Production Manager',
        department: 'Production',
        employment_type: 'permanent',
        salary_type: 'monthly',
        status: 'active',
        monthly_salary: 65000,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: true,
        overtime_rate_type: 'salary_based',
        overtime_hourly_rate: 0,
        holiday_overtime_rate: 1.5,
        late_deduction_rule: 'hourly',
        late_deduction_amount: 0,
        short_hours_rule: 'hourly',
        absence_deduction_rule: 'per_day',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 2,
        daily_rate: 0,
        daily_standard_hours: 8,
        daily_overtime_rate: 0,
      },
      {
        business_id: businessId,
        employee_code: 'EMP-002',
        name: 'Usman Tariq',
        father_name: 'Muhammad Tariq',
        cnic: '35202-7654321-3',
        phone: '+92 321 8899001',
        email: 'usman.tariq@company.com',
        address: 'House 12, Street 4, Gulberg III, Lahore',
        dob: '1994-08-20',
        join_date: '2023-06-01',
        emergency_contact: '+92 322 1122334 (Father)',
        designation: 'Quality & Inventory Specialist',
        department: 'Quality Assurance',
        employment_type: 'permanent',
        salary_type: 'monthly',
        status: 'active',
        monthly_salary: 48000,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: true,
        overtime_rate_type: 'fixed_hourly',
        overtime_hourly_rate: 260,
        holiday_overtime_rate: 1.5,
        late_deduction_rule: 'hourly',
        late_deduction_amount: 0,
        short_hours_rule: 'hourly',
        absence_deduction_rule: 'per_day',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 1,
        daily_rate: 0,
        daily_standard_hours: 8,
        daily_overtime_rate: 0,
      },
      {
        business_id: businessId,
        employee_code: 'EMP-003',
        name: 'Ayesha Noor',
        father_name: 'Noor Muhammad',
        cnic: '35201-9988776-4',
        phone: '+92 333 4455667',
        email: 'ayesha.noor@company.com',
        address: 'Flat 301, Eden Heights, Jail Road, Lahore',
        dob: '1995-12-10',
        join_date: '2024-02-15',
        emergency_contact: '+92 334 5566778 (Mother)',
        designation: 'Executive Accountant',
        department: 'Accounts & Finance',
        employment_type: 'permanent',
        salary_type: 'monthly',
        status: 'active',
        monthly_salary: 55000,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: false,
        overtime_rate_type: 'disabled',
        overtime_hourly_rate: 0,
        holiday_overtime_rate: 1.0,
        late_deduction_rule: 'hourly',
        late_deduction_amount: 0,
        short_hours_rule: 'hourly',
        absence_deduction_rule: 'per_day',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 2,
        daily_rate: 0,
        daily_standard_hours: 8,
        daily_overtime_rate: 0,
      },
      {
        business_id: businessId,
        employee_code: 'EMP-004',
        name: 'Abdul Rehman',
        father_name: 'Abdul Ghafoor',
        cnic: '35202-3344556-5',
        phone: '+92 312 9988776',
        email: '',
        address: 'Basti Saidan Shah, Upper Mall, Lahore',
        dob: '1988-03-05',
        join_date: '2023-03-10',
        emergency_contact: '+92 311 2233445 (Son)',
        designation: 'Master Metal Fabricator',
        department: 'Production',
        employment_type: 'daily_worker',
        salary_type: 'daily',
        status: 'active',
        monthly_salary: 0,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: true,
        overtime_rate_type: 'fixed_hourly',
        overtime_hourly_rate: 0,
        holiday_overtime_rate: 1.5,
        late_deduction_rule: 'disabled',
        late_deduction_amount: 0,
        short_hours_rule: 'disabled',
        absence_deduction_rule: 'disabled',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 0,
        daily_rate: 1800,
        daily_standard_hours: 8,
        daily_overtime_rate: 280,
      },
      {
        business_id: businessId,
        employee_code: 'EMP-005',
        name: 'Hamza Ali',
        father_name: 'Liaqat Ali',
        cnic: '35201-5566778-7',
        phone: '+92 345 6677889',
        email: '',
        address: 'Chungi Amar Sidhu, Ferozepur Road, Lahore',
        dob: '1996-07-22',
        join_date: '2023-08-15',
        emergency_contact: '+92 344 7788990 (Brother)',
        designation: 'CNC Milling Operator',
        department: 'Production',
        employment_type: 'daily_worker',
        salary_type: 'daily',
        status: 'active',
        monthly_salary: 0,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: true,
        overtime_rate_type: 'fixed_hourly',
        overtime_hourly_rate: 0,
        holiday_overtime_rate: 1.5,
        late_deduction_rule: 'disabled',
        late_deduction_amount: 0,
        short_hours_rule: 'disabled',
        absence_deduction_rule: 'disabled',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 0,
        daily_rate: 2000,
        daily_standard_hours: 8,
        daily_overtime_rate: 320,
      },
      {
        business_id: businessId,
        employee_code: 'EMP-006',
        name: 'Rashid Mehmood',
        father_name: 'Akram Mehmood',
        cnic: '35202-1122334-9',
        phone: '+92 301 2233445',
        email: '',
        address: 'Kot Lakhpat Industrial Area, Lahore',
        dob: '1992-11-18',
        join_date: '2024-01-05',
        emergency_contact: '+92 302 3344556 (Uncle)',
        designation: 'Packing & Logistics Handler',
        department: 'Packing & Dispatch',
        employment_type: 'daily_worker',
        salary_type: 'daily',
        status: 'active',
        monthly_salary: 0,
        standard_hours_per_day: 8,
        standard_days_per_month: 26,
        overtime_enabled: true,
        overtime_rate_type: 'fixed_hourly',
        overtime_hourly_rate: 0,
        holiday_overtime_rate: 1.5,
        late_deduction_rule: 'disabled',
        late_deduction_amount: 0,
        short_hours_rule: 'disabled',
        absence_deduction_rule: 'disabled',
        absence_deduction_amount: 0,
        weekly_off_day: 'Sunday',
        paid_leaves_per_month: 0,
        daily_rate: 1500,
        daily_standard_hours: 8,
        daily_overtime_rate: 220,
      },
    ];

    const createdEmployees: Employee[] = [];
    for (const item of initialEmployees) {
      const res = this.createEmployee(item);
      if (res.success && res.employee) {
        createdEmployees.push(res.employee);
      }
    }

    // Seed Public Holidays
    const holidays = [
      { name: 'Pakistan Resolution Day', date: `${curMonth.slice(0, 4)}-03-23`, isPaid: true, recurring: true },
      { name: 'Labor Day', date: `${curMonth.slice(0, 4)}-05-01`, isPaid: true, recurring: true },
      { name: 'Independence Day', date: `${curMonth.slice(0, 4)}-08-14`, isPaid: true, recurring: true },
      { name: 'Eid-ul-Fitr (Holiday 1)', date: `${curMonth.slice(0, 4)}-04-10`, isPaid: true, recurring: false },
      { name: 'Iqbal Day', date: `${curMonth.slice(0, 4)}-11-09`, isPaid: true, recurring: true },
    ];
    for (const h of holidays) {
      this.createPublicHoliday({
        businessId,
        name: h.name,
        date: h.date,
        isPaid: h.isPaid,
        recurring: h.recurring,
      });
    }

    // Seed Sample Attendance for current month up to day 20
    const year = parseInt(curMonth.slice(0, 4), 10);
    const monthNum = parseInt(curMonth.slice(5, 7), 10);
    for (let day = 1; day <= 20; day++) {
      const dayStr = `${curMonth}-${String(day).padStart(2, '0')}`;
      const dObj = new Date(year, monthNum - 1, day);
      const isSunday = dObj.getDay() === 0;

      for (const emp of createdEmployees) {
        let status: AttendanceStatus = 'present';
        let worked = emp.standard_hours_per_day || 8;
        let ot = 0;

        if (isSunday) {
          status = 'rest_day';
          worked = 0;
        } else if (day === 8 && emp.id === createdEmployees[0].id) {
          status = 'leave';
          worked = 0;
        } else if (day === 12 && emp.id === createdEmployees[3].id) {
          status = 'absent';
          worked = 0;
        } else if (day === 15) {
          // overtime day for craftsmen
          ot = 2;
          worked = 10;
        }

        this.saveAttendance({
          businessId,
          employeeId: emp.id,
          date: dayStr,
          status,
          checkIn: worked > 0 ? '09:00' : undefined,
          checkOut: worked > 0 ? (ot > 0 ? '19:00' : '17:00') : undefined,
          workedHours: worked,
          overtimeHours: ot,
        });
      }
    }

    // Seed 1 Sample Advance
    if (createdEmployees[0] && primaryAcc.id) {
      this.createAdvance({
        businessId,
        employeeId: createdEmployees[0].id,
        advanceAmount: 30000,
        date: `${curMonth}-02`,
        paymentAccountId: primaryAcc.id,
        paymentMethod: 'Bank Transfer',
        reason: 'Home renovation installment',
        monthlyDeduction: 5000,
        startMonth: curMonth,
      });
    }

    // Seed 2 Sample Kharchas
    if (createdEmployees[1] && primaryAcc.id) {
      this.createKharcha({
        businessId,
        employeeId: createdEmployees[1].id,
        amount: 3500,
        date: `${curMonth}-05`,
        paymentAccountId: primaryAcc.id,
        paymentMethod: 'Cash',
        description: 'Emergency medicine kharcha',
        payrollMonth: curMonth,
      });
    }

    if (createdEmployees[3] && primaryAcc.id) {
      this.createKharcha({
        businessId,
        employeeId: createdEmployees[3].id,
        amount: 2000,
        date: `${curMonth}-10`,
        paymentAccountId: primaryAcc.id,
        paymentMethod: 'Cash',
        description: 'Weekly grocery advance kharcha',
        payrollMonth: curMonth,
      });
    }

    // Seed 1 Sample Bonus
    if (createdEmployees[4] && primaryAcc.id) {
      this.createBonus({
        businessId,
        employeeId: createdEmployees[4].id,
        bonusType: 'Performance Bonus',
        amount: 5000,
        date: `${curMonth}-14`,
        paymentAccountId: primaryAcc.id,
        paymentMethod: 'Cash',
        note: 'Completed urgent machine batch ahead of schedule',
        payrollMonth: curMonth,
      });
    }

    // Calculate initial monthly payroll preview
    this.calculateMonthlyPayroll(businessId, curMonth);
  }
}

export const db = new Database();
