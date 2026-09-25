import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  Calendar,
  X,
  Eye,
  Edit2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Truck,
  Building2,
  Copy,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Supplier, Product, PurchaseOrder, PurchaseOrderItem, Warehouse } from '../../types.ts';

interface PurchaseOrdersSectionProps {
  business: Business;
  onNavigateToBill?: (order: PurchaseOrder) => void;
  autoOpenCreate?: number;
}

export const PurchaseOrdersSection: React.FC<PurchaseOrdersSectionProps> = ({
  business,
  onNavigateToBill,
  autoOpenCreate,
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<
    Array<{
      productId: number;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);
  const [prodSearch, setProdSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      openCreateModal();
    }
  }, [autoOpenCreate]);

  // View / Print Modal State
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  // Convert to Bill Confirmation Modal
  const [convertOrder, setConvertOrder] = useState<PurchaseOrder | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, suppRes, prodRes, whRes] = await Promise.all([
        api.getPurchaseOrders(business.id),
        api.getSuppliers(business.id),
        api.getProducts(business.id),
        api.getWarehouses(business.id),
      ]);
      setOrders(orderRes.orders || []);
      setSuppliers(suppRes.suppliers || []);
      setProducts(prodRes.products || []);
      const activeWhs = (whRes.warehouses || []).filter((w: Warehouse) => w.status === 'active');
      setWarehouses(activeWhs);
      if (suppRes.suppliers && suppRes.suppliers.length > 0 && !supplierId) {
        setSupplierId(suppRes.suppliers[0].id.toString());
      }
      if (activeWhs.length > 0 && !warehouseId) {
        const def = activeWhs.find((w: Warehouse) => w.is_default) || activeWhs[0];
        setWarehouseId(def.id.toString());
      }
    } catch (err) {
      console.error('Failed to load purchase orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const openCreateModal = () => {
    setEditingOrder(null);
    setSupplierId(suppliers.length > 0 ? suppliers[0].id.toString() : '');
    if (warehouses.length > 0) {
      const def = warehouses.find((w) => w.is_default) || warehouses[0];
      setWarehouseId(def.id.toString());
    } else {
      setWarehouseId('');
    }
    setOrderDate(new Date().toISOString().split('T')[0]);
    setTax('0');
    setNotes('');
    setCartItems([]);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setSupplierId(order.supplier_id.toString());
    setWarehouseId(order.warehouse_id ? order.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setOrderDate(order.order_date);
    setTax(order.tax.toString());
    setNotes(order.notes);
    setCartItems(
      (order.items || []).map((i) => ({
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku,
        quantity: i.quantity,
        unitPrice: i.unit_price,
      }))
    );
    setFormError(null);
    setShowModal(true);
  };

  const handleCreateCopy = (order: PurchaseOrder) => {
    setEditingOrder(null);
    setSupplierId(''); // Requirement #10: Supplier selection must be cleared. User selects manually.
    setWarehouseId(order.warehouse_id ? order.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setOrderDate(new Date().toISOString().split('T')[0]);
    setTax(order.tax ? order.tax.toString() : '0');
    setNotes(order.notes || '');
    setCartItems(
      (order.items || []).map((i) => ({
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku,
        quantity: i.quantity,
        unitPrice: i.unit_price,
      }))
    );
    setFormError('Please select a supplier for the copied purchase order.');
    setShowModal(true);
  };

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
          unitPrice: prod.purchase_price,
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
    const t = parseFloat(tax) || 0;
    return sub + t;
  };

  const handleSaveOrder = async () => {
    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }
    if (!warehouseId) {
      setFormError('Please select a warehouse.');
      return;
    }
    if (cartItems.length === 0) {
      setFormError('Please add at least one product item to the purchase order.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        supplier_id: parseInt(supplierId, 10),
        warehouse_id: parseInt(warehouseId, 10),
        order_date: orderDate,
        tax: parseFloat(tax) || 0,
        notes,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      if (editingOrder) {
        await api.updatePurchaseOrder(business.id, editingOrder.id, payload);
      } else {
        await api.createPurchaseOrder(business.id, payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updatePurchaseOrderStatus(business.id, orderId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await api.deletePurchaseOrder(business.id, orderId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase order');
    }
  };

  const handleConvertConfirmed = async () => {
    if (!convertOrder) return;
    setConverting(true);
    try {
      // Create actual Purchase Bill linked to this Purchase Order
      const billPayload = {
        supplier_id: convertOrder.supplier_id,
        warehouse_id: convertOrder.warehouse_id,
        bill_date: new Date().toISOString().slice(0, 10),
        tax: convertOrder.tax,
        notes: `Converted from Purchase Order ${convertOrder.order_number}. ${convertOrder.notes}`,
        purchase_order_id: convertOrder.id,
        items: (convertOrder.items || []).map((i) => ({
          productId: i.product_id,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
      };

      const res = await api.createBill(business.id, billPayload);
      setConvertSuccess(`Purchase Order ${convertOrder.order_number} successfully converted to Bill ${res.bill.bill_number}! Stock received and supplier payable recorded.`);
      setConvertOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to convert purchase order to bill');
    } finally {
      setConverting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.items || []).some((i) => (i.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearch.toLowerCase())
    );
  });

  const countInProcess = orders.filter((o) => o.status === 'In Process').length;
  const countApproved = orders.filter((o) => o.status === 'Approved').length;
  const countComplete = orders.filter((o) => o.status === 'Complete').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue procurement purchase orders to suppliers prior to receiving stock and invoices.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-800">Workflow Isolation: </span>
          Purchase Orders do not affect your supplier ledger balances, accounts payable, or physical inventory stock until an <strong>Approved</strong> purchase order is converted into an official Purchase Bill.
        </div>
      </div>

      {convertSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{convertSuccess}</span>
          </div>
          <button
            onClick={() => setConvertSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
          <div className="text-xl font-bold text-slate-800 mt-1">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">In Process</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{countInProcess}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Approved (Ready)</span>
          <div className="text-xl font-bold text-blue-700 mt-1">{countApproved}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Complete (Billed)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{countComplete}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'In Process', 'Approved', 'Rejected', 'Complete'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Orders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            Loading purchase orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No purchase orders found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  let icon = <Clock className="w-3 h-3 mr-1" />;
                  if (order.status === 'In Process') {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    icon = <Clock className="w-3 h-3 mr-1 text-amber-500" />;
                  } else if (order.status === 'Approved') {
                    badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    icon = <CheckCircle2 className="w-3 h-3 mr-1 text-blue-500" />;
                  } else if (order.status === 'Rejected') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    icon = <XCircle className="w-3 h-3 mr-1 text-rose-500" />;
                  } else if (order.status === 'Complete') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    icon = <FileCheck className="w-3 h-3 mr-1 text-emerald-500" />;
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{order.order_date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{order.supplier_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>{order.warehouse_name || 'Main Warehouse'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
                          {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${order.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${badgeClass}`}
                        >
                          {icon}
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Convert button if Approved */}
                          {order.status === 'Approved' && (
                            <button
                              onClick={() => setConvertOrder(order)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1 shadow-xs cursor-pointer transition-all"
                              title="Convert to Purchase Bill"
                            >
                              <span>Create Bill</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* Quick Approve / Reject for In Process */}
                          {order.status === 'In Process' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order.id, 'Approved')}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                title="Approve PO"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(order.id, 'Rejected')}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                title="Reject PO"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Re-open if Rejected */}
                          {order.status === 'Rejected' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'In Process')}
                              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                              title="Re-open PO"
                            >
                              Re-open
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View / Print PO"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Create Copy (Requirement #10) */}
                          <button
                            onClick={() => handleCreateCopy(order)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Create Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Edit PO (Requirement #14) */}
                          <button
                            onClick={() => openEditModal(order)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit PO"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete PO (Requirement #14) */}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREATE / EDIT PURCHASE ORDER MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingOrder ? `Edit Purchase Order ${editingOrder.order_number}` : 'Create New Purchase Order'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-purchase procurement order. Does not post to ledgers or increase stock.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Order Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: ${s.current_balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receiving Warehouse <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code}) {wh.is_default ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Product picker */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Select Products to Order</span>
                  </span>
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductToCart(p)}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">${p.purchase_price}</span>
                        <span className="text-[10px] text-slate-500">Stk: {p.current_stock}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Table */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Purchase Order Items ({cartItems.length})
                </label>
                {cartItems.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    Click items above to add them to this purchase order.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 w-28">Quantity</th>
                          <th className="py-2.5 px-3 w-32">Unit Cost ($)</th>
                          <th className="py-2.5 px-3 text-right">Total ($)</th>
                          <th className="py-2.5 px-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cartItems.map((item) => (
                          <tr key={item.productId}>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-800">{item.productName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.productSku}</div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateCartQty(item.productId, parseInt(e.target.value, 10) || 0)}
                                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateCartPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => removeCartItem(item.productId)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PO Notes / Specifications</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery instructions, supplier quote number, payment terms..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tax ($):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-24 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-right"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono">${calculateGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveOrder}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingOrder ? 'Update Purchase Order' : 'Save Purchase Order (In Process)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONVERT TO PURCHASE BILL MODAL */}
      {/* ========================================================================= */}
      {convertOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Convert Purchase Order {convertOrder.order_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Receive stock and post to accounts payable.
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>
                Converting this purchase order will automatically:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Create an official <strong>Purchase Bill</strong>.</li>
                <li>Increase physical inventory stock for each product received.</li>
                <li>Record a credit of <strong>${convertOrder.grand_total.toFixed(2)}</strong> to <strong>{convertOrder.supplier_name}</strong>'s payable ledger account.</li>
                <li>Mark Purchase Order <strong>{convertOrder.order_number}</strong> status as <strong>Complete</strong>.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setConvertOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={converting}
                onClick={handleConvertConfirmed}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {converting ? 'Converting...' : 'Confirm & Generate Purchase Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW / PRINT PURCHASE ORDER MODAL */}
      {/* ========================================================================= */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
                  {business.name}
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  PURCHASE ORDER
                </h2>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  {viewOrder.order_number}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    viewOrder.status === 'Approved'
                      ? 'bg-blue-100 text-blue-800'
                      : viewOrder.status === 'Complete'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewOrder.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {viewOrder.status}
                </span>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Date: {viewOrder.order_date}
                </div>
              </div>
            </div>

            <div className="py-6 border-b border-slate-200 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Supplier</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{viewOrder.supplier_name}</div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Receiving Warehouse</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{viewOrder.warehouse_name || 'Main Warehouse'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Purchaser</span>
                <div className="text-slate-700 font-medium mt-0.5">{business.name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{business.currency}</div>
              </div>
            </div>

            {/* Items */}
            <div className="py-6 border-b border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Cost Rate</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(viewOrder.items || []).map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-900">{i.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{i.product_sku}</div>
                      </td>
                      <td className="py-2.5 text-center font-mono">{i.quantity}</td>
                      <td className="py-2.5 text-right font-mono">${i.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        ${i.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-end space-y-1 text-xs">
                <div className="flex justify-between w-48 text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">${viewOrder.subtotal.toFixed(2)}</span>
                </div>
                {viewOrder.tax > 0 && (
                  <div className="flex justify-between w-48 text-slate-500">
                    <span>Tax:</span>
                    <span className="font-mono">+${viewOrder.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="font-mono">${viewOrder.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {viewOrder.notes && (
              <div className="pt-4 text-xs text-slate-500 italic">
                Notes: {viewOrder.notes}
              </div>
            )}

            <div className="pt-6 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Purchase Order</span>
              </button>
              <button
                onClick={() => setViewOrder(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
