import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  ShoppingCart,
  Trash2,
  Package,
  Calendar,
  X,
  Truck,
  Building2,
  Copy,
  Edit2,
  Eye,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Bill, Supplier, Product, Warehouse } from '../../types.ts';

interface BillsSectionProps {
  business: Business;
  autoOpenCreate?: number;
}

export const BillsSection: React.FC<BillsSectionProps> = ({ business, autoOpenCreate }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Bill Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lastAutoOpenRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autoOpenCreate && autoOpenCreate !== lastAutoOpenRef.current) {
      lastAutoOpenRef.current = autoOpenCreate;
      setSupplierId(suppliers.length > 0 ? suppliers[0].id.toString() : '');
      if (warehouses.length > 0) {
        const def = warehouses.find((w) => w.is_default) || warehouses[0];
        setWarehouseId(def.id.toString());
      }
      setBillDate(new Date().toISOString().split('T')[0]);
      setTax('0');
      setNotes('');
      setCartItems([]);
      setError(null);
      setShowModal(true);
    }
  }, [autoOpenCreate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsRes, suppRes, prodRes, whRes] = await Promise.all([
        api.getBills(business.id),
        api.getSuppliers(business.id),
        api.getProducts(business.id),
        api.getWarehouses(business.id),
      ]);
      setBills(billsRes.bills || []);
      setSuppliers(suppRes.suppliers || []);
      setProducts(prodRes.products || []);
      const activeWhs = (whRes.warehouses || []).filter((w: Warehouse) => w.status === 'active');
      setWarehouses(activeWhs);
      if (suppRes.suppliers && suppRes.suppliers.length > 0 && !supplierId) {
        setSupplierId(suppRes.suppliers[0].id.toString());
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

  const addProductToBill = (prod: Product) => {
    const existing = cartItems.find((i) => i.productId === prod.id);
    if (existing) {
      setCartItems(
        cartItems.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
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

  const removeCartItem = (productId: number) => {
    setCartItems(cartItems.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) return removeCartItem(productId);
    setCartItems(cartItems.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  };

  const updatePrice = (productId: number, price: number) => {
    setCartItems(cartItems.map((i) => (i.productId === productId ? { ...i, unitPrice: price } : i)));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const grandTotal = Math.max(0, subtotal + (parseFloat(tax) || 0));

  const openCreateModal = () => {
    setEditingBill(null);
    setSupplierId(suppliers.length > 0 ? suppliers[0].id.toString() : '');
    if (warehouses.length > 0) {
      const def = warehouses.find((w) => w.is_default) || warehouses[0];
      setWarehouseId(def.id.toString());
    } else {
      setWarehouseId('');
    }
    setBillDate(new Date().toISOString().split('T')[0]);
    setTax('0');
    setNotes('');
    setCartItems([]);
    setError(null);
    setShowModal(true);
  };

  const handleCreateCopy = (bill: Bill) => {
    setEditingBill(null);
    setSupplierId(''); // Requirement #11: Supplier must be selected manually again (cleared)
    setWarehouseId(bill.warehouse_id ? bill.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setBillDate(new Date().toISOString().split('T')[0]);
    setTax(bill.tax ? bill.tax.toString() : '0');
    setNotes(bill.notes || '');
    setCartItems(
      (bill.items || []).map((i) => ({
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku || '',
        quantity: i.quantity,
        unitPrice: i.unit_price,
      }))
    );
    setError('Please select a supplier for the copied purchase bill.');
    setShowModal(true);
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setSupplierId(bill.supplier_id.toString());
    setWarehouseId(bill.warehouse_id ? bill.warehouse_id.toString() : (warehouses[0]?.id.toString() || ''));
    setBillDate(bill.bill_date);
    setTax(bill.tax ? bill.tax.toString() : '0');
    setNotes(bill.notes || '');
    setCartItems(
      (bill.items || []).map((i) => ({
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku || '',
        quantity: i.quantity,
        unitPrice: i.unit_price,
      }))
    );
    setError(null);
    setShowModal(true);
  };

  const handleDeleteBill = async (billId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this purchase bill? This will automatically reverse stock movements and adjust the supplier ledger.'
      )
    ) {
      return;
    }

    try {
      await api.deleteBill(business.id, billId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete purchase bill.');
    }
  };

  const handleSaveBill = async () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (!warehouseId) {
      setError('Please select a receiving warehouse');
      return;
    }
    if (cartItems.length === 0) {
      setError('Add at least one product item to the bill');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        supplier_id: parseInt(supplierId, 10),
        warehouse_id: parseInt(warehouseId, 10),
        bill_date: billDate,
        tax: parseFloat(tax) || 0,
        notes,
        items: cartItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      };

      if (editingBill) {
        await api.updateBill(business.id, editingBill.id, payload);
      } else {
        await api.createBill(business.id, payload);
      }

      setShowModal(false);
      setEditingBill(null);
      setCartItems([]);
      setTax('0');
      setNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Purchase Bills & Stock Inward</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Log vendor purchases, increase product inventory, and record supplier payables in ledger
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="enter-bill-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Purchase Bill</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Bill #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier / Vendor</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Tax</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {bill.bill_number}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{bill.bill_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{bill.supplier_name}</td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>{bill.warehouse_name || 'Main Warehouse'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {business.currency} {bill.subtotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                    {bill.tax.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {business.currency} {bill.grand_total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {/* Create Copy (Requirement #11) */}
                    <button
                      onClick={() => handleCreateCopy(bill)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Create Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {/* Edit Purchase Bill (Requirement #15) */}
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Bill"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete Purchase Bill (Requirement #15) */}
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    No purchase bills recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enter Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 text-slate-900 shadow-2xl max-h-[92vh] flex flex-col my-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>{editingBill ? `Edit Purchase Bill: ${editingBill.bill_number}` : 'Enter Purchase Bill'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: {business.currency} {s.current_balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Warehouse (Inward) *
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Ref</label>
                  <input
                    type="text"
                    placeholder="Vendor Invoice Reference"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Product catalog quick picker */}
              <div>
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Click Products to Add to Purchase Bill:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/70">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => addProductToBill(p)}
                      className="bg-white border border-slate-200 hover:border-indigo-500 rounded-lg overflow-hidden cursor-pointer text-left transition-all hover:shadow-xs shadow-2xs group flex flex-col justify-between"
                      title={`Add ${p.name} to bill`}
                    >
                      {/* Dominant image area */}
                      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <Package className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      {/* Compact text area */}
                      <div className="p-1.5">
                        <div className="font-semibold text-[11px] text-slate-900 truncate leading-tight" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 font-semibold mt-0.5 truncate">
                          {business.currency} {p.purchase_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 w-28">Qty (Adds to Stock)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Cost Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    {cartItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.productId, parseInt(e.target.value) || 1)
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-sm text-slate-900 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updatePrice(item.productId, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right text-sm text-slate-900 font-mono"
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
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-sm">
                          Bill is empty. Click items above to add products.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-60 space-y-2 text-sm font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="text-slate-900 font-semibold">{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tax:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right text-sm text-slate-900"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-slate-900">
                      {business.currency} {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || cartItems.length === 0}
                onClick={handleSaveBill}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : editingBill ? 'Update Bill & Recalculate Stock' : 'Save & Increase Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
