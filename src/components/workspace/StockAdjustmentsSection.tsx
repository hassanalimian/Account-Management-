import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Package,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Product, StockAdjustment } from '../../types.ts';

interface StockAdjustmentsSectionProps {
  business: Business;
}

export const StockAdjustmentsSection: React.FC<StockAdjustmentsSectionProps> = ({
  business,
}) => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'increase' | 'decrease'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('Physical Count Variance');
  const [adjustmentDate, setAdjustmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View / Edit / Delete States
  const [viewingAdjustment, setViewingAdjustment] = useState<StockAdjustment | null>(null);
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null);
  const [deletingAdjustment, setDeletingAdjustment] = useState<StockAdjustment | null>(null);

  const [editProductId, setEditProductId] = useState<string>('');
  const [editAdjustmentType, setEditAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [editReason, setEditReason] = useState<string>('Physical Count Variance');
  const [editAdjustmentDate, setEditAdjustmentDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleOpenEdit = (adj: StockAdjustment) => {
    setEditingAdjustment(adj);
    setEditProductId(adj.product_id?.toString() || '');
    setEditAdjustmentType(adj.adjustment_type);
    setEditQuantity(adj.quantity?.toString() || '1');
    setEditReason(adj.reason || 'Physical Count Variance');
    setEditAdjustmentDate(adj.adjustment_date || new Date().toISOString().slice(0, 10));
    setEditNotes(adj.notes || '');
    setEditError(null);
  };

  const handleUpdateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdjustment) return;

    const pId = parseInt(editProductId, 10);
    const qty = parseFloat(editQuantity);
    if (isNaN(pId) || pId <= 0) {
      setEditError('Please select a valid product.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setEditError('Quantity must be greater than zero.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.updateStockAdjustment(business.id, editingAdjustment.id, {
        productId: pId,
        adjustmentType: editAdjustmentType,
        quantity: qty,
        reason: editReason,
        adjustmentDate: editAdjustmentDate,
        notes: editNotes.trim(),
      });

      setEditingAdjustment(null);
      setSuccessMessage(`Stock adjustment ${editingAdjustment.adjustment_number} updated successfully. Inventory recalculated.`);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update stock adjustment.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAdjustment = async () => {
    if (!deletingAdjustment) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteStockAdjustment(business.id, deletingAdjustment.id);
      setSuccessMessage(`Stock adjustment ${deletingAdjustment.adjustment_number} deleted. Product stock reversed and restored.`);
      setDeletingAdjustment(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete stock adjustment.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const reasonsList = [
    'Physical Count Variance',
    'Damaged Goods',
    'Expired Stock',
    'Internal Sample / Testing',
    'Customer Return to Stock',
    'Found Stock / Inventory Gain',
    'Theft or Lost Stock',
    'Production Scrap / Wastage',
    'Other Adjustment',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [adjRes, prodRes] = await Promise.all([
        api.getStockAdjustments(business.id),
        api.getProducts(business.id),
      ]);
      setAdjustments(adjRes.adjustments || []);
      setProducts(prodRes.products || []);
      if (prodRes.products && prodRes.products.length > 0 && !productId) {
        setProductId(prodRes.products[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load stock adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const selectedProduct = products.find((p) => p.id.toString() === productId);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setFormError('Please select a product.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid positive quantity.');
      return;
    }
    if (adjustmentType === 'decrease' && selectedProduct && qty > selectedProduct.current_stock) {
      setFormError(
        `Cannot reduce stock by ${qty} units. Current stock is ${selectedProduct.current_stock}.`
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createStockAdjustment(business.id, {
        product_id: parseInt(productId, 10),
        adjustment_type: adjustmentType,
        quantity: qty,
        reason,
        notes,
        adjustment_date: adjustmentDate,
      });

      setShowModal(false);
      setSuccessMessage(
        `Stock adjustment ${res.adjustment.adjustment_number} applied: ${adjustmentType === 'increase' ? '+' : '-'}${qty} units of ${res.adjustment.product_name}.`
      );
      setNotes('');
      setQuantity('1');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to apply stock adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    const matchesSearch =
      (a.adjustment_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.product_sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || a.adjustment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Adjustments</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record manual inventory write-offs, physical count gains, and damaged stock adjustments.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Adjustment</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search adjustment #, product, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Adjustments
          </button>
          <button
            onClick={() => setTypeFilter('increase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'increase'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Increases (+)</span>
          </button>
          <button
            onClick={() => setTypeFilter('decrease')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'decrease'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Decreases (-)</span>
          </button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
            Loading adjustments log...
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No stock adjustments found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Adjustment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {a.adjustment_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{a.adjustment_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{a.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.product_sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.adjustment_type === 'increase' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
                          Stock Gain (+)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown className="w-3 h-3 mr-1 text-rose-500" />
                          Stock Reduction (-)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {a.adjustment_type === 'increase' ? `+${a.quantity}` : `-${a.quantity}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {a.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                      {a.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingAdjustment(a)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Adjustment Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Stock Adjustment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingAdjustment(a)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Stock Adjustment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECORD STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Stock Adjustment</h3>
                  <p className="text-xs text-slate-500">Manual stock reconciliation with audit log</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdjustment} className="py-4 space-y-4 text-xs">
              {/* Product selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.sku}] — Current Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Current stock level: <strong>{selectedProduct.current_stock} units</strong>
                  </div>
                )}
              </div>

              {/* Adjustment Type selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Adjustment Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('decrease')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                      adjustmentType === 'decrease'
                        ? 'border-rose-400 bg-rose-50/70 text-rose-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-xs">Decrease Stock (-)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Damage, expiry, loss</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('increase')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                      adjustmentType === 'increase'
                        ? 'border-emerald-400 bg-emerald-50/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs">Increase Stock (+)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Physical gain, return</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Units to Adjust <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adjustment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  {reasonsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Broken in transit, annual physical inventory audit discrepancy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {viewingAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Stock Adjustment Details</h3>
                  <p className="text-xs font-mono text-slate-500">{viewingAdjustment.adjustment_number}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAdjustment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-semibold text-slate-800">{viewingAdjustment.adjustment_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Product</span>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{viewingAdjustment.product_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{viewingAdjustment.product_sku}</div>
                </div>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 items-center">
                <span className="text-slate-500 font-medium">Adjustment Type</span>
                <span>
                  {viewingAdjustment.adjustment_type === 'increase' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
                      Stock Gain (+)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <TrendingDown className="w-3 h-3 mr-1 text-rose-500" />
                      Stock Reduction (-)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Quantity</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {viewingAdjustment.adjustment_type === 'increase' ? `+${viewingAdjustment.quantity}` : `-${viewingAdjustment.quantity}`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Reason</span>
                <span className="font-semibold text-slate-800">{viewingAdjustment.reason}</span>
              </div>
              {viewingAdjustment.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Detailed Audit Notes</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 text-xs border border-slate-100">
                    {viewingAdjustment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const a = viewingAdjustment;
                  setViewingAdjustment(null);
                  handleOpenEdit(a);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Edit Adjustment
              </button>
              <button
                type="button"
                onClick={() => setViewingAdjustment(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {editingAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Stock Adjustment</h3>
                  <p className="text-xs text-slate-500">
                    Reverses previous adjustment movements and recalculates product inventory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdjustment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdjustment} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editProductId}
                  onChange={(e) => setEditProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adjustment Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditAdjustmentType('decrease')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                      editAdjustmentType === 'decrease'
                        ? 'border-rose-400 bg-rose-50/70 text-rose-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-xs">Decrease Stock (-)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Damage, expiry, loss</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAdjustmentType('increase')}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                      editAdjustmentType === 'increase'
                        ? 'border-emerald-400 bg-emerald-50/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs">Increase Stock (+)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Physical gain, return</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adjustment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editAdjustmentDate}
                    onChange={(e) => setEditAdjustmentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Adjustment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {reasonsList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Audit Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingAdjustment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save & Reconcile Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE STOCK ADJUSTMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Stock Adjustment?</h3>
                <p className="text-xs text-slate-500 font-mono">{deletingAdjustment.adjustment_number}</p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 my-4 text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold text-rose-900">Atomic Stock Movement Reversal Notice:</p>
              <p>
                Deleting this adjustment will reverse its effect on inventory:
                {deletingAdjustment.adjustment_type === 'increase' ? (
                  <span>
                    {' '}<strong>{deletingAdjustment.quantity}</strong> units will be deducted from <strong>{deletingAdjustment.product_name}</strong> to reverse the prior gain.
                  </span>
                ) : (
                  <span>
                    {' '}<strong>{deletingAdjustment.quantity}</strong> units will be restored to <strong>{deletingAdjustment.product_name}</strong> to reverse the prior reduction.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingAdjustment(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdjustment}
                disabled={deleteSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? 'Reversing...' : 'Confirm Delete & Reverse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
