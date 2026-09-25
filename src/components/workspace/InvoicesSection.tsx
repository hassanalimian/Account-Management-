import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  Ban,
  CheckCircle2,
  Package,
  Calendar,
  X,
  Eye,
  Building2,
  Copy,
  Edit2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Invoice, Customer, Product, ProductCategory, Warehouse } from '../../types.ts';
import { CategoryIconBar } from '../common/CategoryIconBar.tsx';

interface InvoicesSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({ business, autoOpenCreate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedInvoiceCategory, setSelectedInvoiceCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New / Edit Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<
    Array<{
      productId: number;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      availableStock: number;
    }>
  >([]);
  const [prodSearch, setProdSearch] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // View / Print Invoice Modal
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      setCustomerId(customers.length > 0 ? customers[0].id.toString() : '');
      if (warehouses.length > 0) {
        const def = warehouses.find((w) => w.is_default) || warehouses[0];
        setWarehouseId(def.id.toString());
      }
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDiscount('0');
      setTax('0');
      setNotes('');
      setCartItems([]);
      setCreateError(null);
      setShowCreateModal(true);
    }
  }, [autoOpenCreate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, prodRes, catRes, whRes] = await Promise.all([
        api.getInvoices(business.id),
        api.getCustomers(business.id),
        api.getProducts(business.id),
        api.getCategories(business.id),
        api.getWarehouses(business.id),
      ]);
      setInvoices(invRes.invoices || []);
      setCustomers(custRes.customers || []);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      const activeWhs = (whRes.warehouses || []).filter((w: Warehouse) => w.status === 'active');
      setWarehouses(activeWhs);
      if (custRes.customers && custRes.customers.length > 0 && !customerId) {
        setCustomerId(custRes.customers[0].id.toString());
      }
      if (activeWhs.length > 0) {
        const defaultWh = activeWhs.find((w: Warehouse) => w.is_default) || activeWhs[0];
        setWarehouseId(defaultWh.id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const addProductToCart = (prod: Product) => {
    const existing = cartItems.find((item) => item.productId === prod.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: prod.id,
          productName: prod.name,
          productSku: prod.sku,
          quantity: 1,
          unitPrice: prod.selling_price,
          availableStock: prod.current_stock,
        },
      ]);
    }
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter((i) => i.productId !== productId));
    } else {
      setCartItems(
        cartItems.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const updateCartPrice = (productId: number, price: number) => {
    setCartItems(
      cartItems.map((i) => (i.productId === productId ? { ...i, unitPrice: price } : i))
    );
  };

  const removeCartItem = (productId: number) => {
    setCartItems(cartItems.filter((i) => i.productId !== productId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const d = parseFloat(discount) || 0;
    const t = parseFloat(tax) || 0;
    return Math.max(0, sub - d + t);
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    setCustomerId(customers.length > 0 ? customers[0].id.toString() : '');
    if (warehouses.length > 0) {
      const def = warehouses.find((w) => w.is_default) || warehouses[0];
      setWarehouseId(def.id.toString());
    } else {
      setWarehouseId('');
    }
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDiscount('0');
    setTax('0');
    setNotes('');
    setCartItems([]);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateCopy = (inv: Invoice) => {
    setEditingInvoice(null);
    setCustomerId(''); // Customer selection must be cleared (Requirement #9)
    setWarehouseId(inv.warehouse_id ? inv.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDiscount(inv.discount ? inv.discount.toString() : '0');
    setTax(inv.tax ? inv.tax.toString() : '0');
    setNotes(inv.notes || '');
    setCartItems(
      (inv.items || []).map((i) => {
        const prod = products.find((p) => p.id === i.product_id);
        return {
          productId: i.product_id,
          productName: i.product_name,
          productSku: i.product_sku || '',
          quantity: i.quantity,
          unitPrice: i.unit_price,
          availableStock: prod ? prod.current_stock : 0,
        };
      })
    );
    setCreateError('Please select a customer before saving the copied invoice.');
    setShowCreateModal(true);
  };

  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCustomerId(inv.customer_id.toString());
    setWarehouseId(inv.warehouse_id ? inv.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setInvoiceDate(inv.invoice_date);
    setDiscount(inv.discount ? inv.discount.toString() : '0');
    setTax(inv.tax ? inv.tax.toString() : '0');
    setNotes(inv.notes || '');
    setCartItems(
      (inv.items || []).map((i) => {
        const prod = products.find((p) => p.id === i.product_id);
        return {
          productId: i.product_id,
          productName: i.product_name,
          productSku: i.product_sku || '',
          quantity: i.quantity,
          unitPrice: i.unit_price,
          availableStock: prod ? prod.current_stock : 0,
        };
      })
    );
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this sales invoice? This will automatically reverse stock deductions, remove ledger entries, and restore customer balance.'
      )
    ) {
      return;
    }

    try {
      await api.deleteInvoice(business.id, invoiceId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice.');
    }
  };

  const handleSaveInvoice = async () => {
    if (!customerId) {
      setCreateError('Please select a customer.');
      return;
    }
    if (!warehouseId) {
      setCreateError('Please select a warehouse.');
      return;
    }
    if (cartItems.length === 0) {
      setCreateError('Please add at least one product item to the invoice.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const payload = {
        customer_id: parseInt(customerId, 10),
        warehouse_id: parseInt(warehouseId, 10),
        invoice_date: invoiceDate,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        notes,
        items: cartItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      };

      if (editingInvoice) {
        const res = await api.updateInvoice(business.id, editingInvoice.id, payload);
        setShowCreateModal(false);
        setEditingInvoice(null);
        setCartItems([]);
        setDiscount('0');
        setTax('0');
        setNotes('');
        loadData();
        if (res && res.invoice) {
          setViewInvoice(res.invoice);
        }
      } else {
        const res = await api.createInvoice(business.id, payload);
        setShowCreateModal(false);
        setCartItems([]);
        setDiscount('0');
        setTax('0');
        setNotes('');
        loadData();
        setViewInvoice(res.invoice);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to generate invoice.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (
      !confirm(
        'Are you sure you want to cancel this invoice? It will reverse stock updates and deduct from customer balance.'
      )
    )
      return;

    try {
      await api.cancelInvoice(business.id, invoiceId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice.');
    }
  };

  // Product counts per category for the clickable icon chips
  const categoryProductCounts = products.reduce((acc, p) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Filter catalog in Create Invoice by selected category icon and search query
  const filteredCatalog = products.filter((p) => {
    const matchesCategory =
      selectedInvoiceCategory === 'all' || p.category_id.toString() === selectedInvoiceCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Sales Invoices</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate GST sales bills, update inventory stocks, and print customer vouchers
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="create-invoice-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Invoice</span>
        </button>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Tax / Disc</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{inv.invoice_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.customer_name}</td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>{inv.warehouse_name || 'Main Warehouse'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {business.currency} {inv.subtotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                    +{inv.tax.toFixed(2)} / -{inv.discount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {business.currency} {inv.grand_total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        inv.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => setViewInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View Slip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Create Copy (Requirement #9) */}
                    <button
                      onClick={() => handleCreateCopy(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Create Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {/* Edit Invoice (Requirement #13) */}
                    <button
                      onClick={() => openEditModal(inv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Invoice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete Invoice (Requirement #13) */}
                    <button
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {inv.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelInvoice(inv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Cancel & Revert Stock"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    No sales invoices created yet. Click "New Sales Invoice" to start billing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Invoice Creation Drawer/Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 text-slate-900 shadow-2xl max-h-[92vh] flex flex-col my-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingInvoice ? `Edit Sales Invoice: ${editingInvoice.invoice_number}` : 'Create Sales Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 shrink-0">
                {createError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
              {/* Header Info: Customer, Warehouse & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Bal: {business.currency} {c.current_balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Dispatch Warehouse *
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code}) {wh.is_default ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Notes / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Terms: 30 days"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Product Picker Catalog: Click visual cards to add to invoice */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Click Product Cards to Add Line Items:</span>
                  </h4>
                  <input
                    type="text"
                    placeholder="Search product catalog..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                {/* Category Clickable Icons at top instead of dropdown */}
                <div className="mb-3">
                  <CategoryIconBar
                    categories={categories}
                    selectedCategoryId={selectedInvoiceCategory}
                    onSelectCategory={(catId) => setSelectedInvoiceCategory(catId)}
                    productCounts={categoryProductCounts}
                    totalCount={products.length}
                    compact
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/60">
                  {filteredCatalog.map((prod) => (
                    <div
                      key={prod.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => addProductToCart(prod)}
                      className="bg-white border border-slate-200 hover:border-indigo-500 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xs flex flex-col justify-between shadow-2xs group"
                      title={`Click to add ${prod.name} (${prod.current_stock} in stock)`}
                    >
                      {/* Dominant image area */}
                      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <Package className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 pointer-events-none">
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-semibold backdrop-blur-xs ${
                              prod.current_stock > 10
                                ? 'bg-emerald-600/90 text-white'
                                : prod.current_stock > 0
                                ? 'bg-amber-600/90 text-white'
                                : 'bg-rose-600/90 text-white'
                            }`}
                          >
                            {prod.current_stock}
                          </span>
                        </div>
                      </div>
                      {/* Compact text area */}
                      <div className="p-1.5">
                        <div className="font-semibold text-[11px] text-slate-900 truncate leading-tight" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="font-mono font-bold text-[10px] text-slate-800 mt-0.5 truncate">
                          {business.currency} {prod.selling_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart / Invoice Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 border-b border-slate-200">
                  Selected Line Items ({cartItems.length})
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/60 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 w-28">Qty</th>
                      <th className="py-2.5 px-3 w-32 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    {cartItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">{item.productSku}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQty(item.productId, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateCartPrice(item.productId, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 text-right font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {business.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cartItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-sm">
                          Click any product card above to add it to this invoice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-600">Subtotal:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {business.currency} {calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-600">Discount:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-600">Tax (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono"
                  />
                </div>
                <div className="flex items-center space-x-2 pl-4 border-l border-slate-200">
                  <span className="text-sm font-bold text-slate-800">Grand Total:</span>
                  <span className="text-lg font-mono font-bold text-slate-900">
                    {business.currency} {calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating || cartItems.length === 0}
                onClick={handleSaveInvoice}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                id="submit-invoice-btn"
              >
                {creating ? 'Saving & Updating Stock...' : editingInvoice ? 'Update Invoice & Reconcile Stock' : 'Save & Confirm Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Slip View / Print Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Invoice Slip: {viewInvoice.invoice_number}</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 mt-4 text-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <span>{business.icon}</span>
                    <span>{business.name}</span>
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">{business.address}</div>
                  <div className="text-slate-500 text-xs">
                    {business.phone} &bull; {business.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-indigo-600 text-base">
                    {viewInvoice.invoice_number}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">Date: {viewInvoice.invoice_date}</div>
                  <div className="uppercase font-semibold text-xs text-emerald-700 mt-1">
                    {viewInvoice.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 uppercase block font-semibold">Billed To:</span>
                  <span className="font-bold text-slate-900 text-base">{viewInvoice.customer_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase block font-semibold">Dispatched From:</span>
                  <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{viewInvoice.warehouse_name || 'Main Warehouse'}</span>
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-sm border-t border-b border-slate-200">
                <thead>
                  <tr className="text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5">Item</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {viewInvoice.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 font-medium">{it.product_name}</td>
                      <td className="py-2.5 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono text-slate-700">
                        {it.unit_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {it.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-56 space-y-1.5 font-mono text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{viewInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {viewInvoice.discount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span>-{viewInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {viewInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax:</span>
                      <span>+{viewInvoice.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-slate-900">
                      {business.currency} {viewInvoice.grand_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
