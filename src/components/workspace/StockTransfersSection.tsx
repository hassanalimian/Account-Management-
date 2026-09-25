import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Package,
  Calendar,
  X,
  Warehouse as WarehouseIcon,
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  Eye,
  Info,
  Edit2,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Product, StockTransfer, Warehouse } from '../../types.ts';

interface StockTransfersSectionProps {
  business: Business;
  onNavigateToWarehouses?: () => void;
}

interface TransferItemRow {
  productId: number;
  quantity: number;
  availableStock: number;
}

export const StockTransfersSection: React.FC<StockTransfersSectionProps> = ({
  business,
  onNavigateToWarehouses,
}) => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<Record<number, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState<string>('');
  const [toWarehouseId, setToWarehouseId] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<TransferItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View Details Modal
  const [viewingTransfer, setViewingTransfer] = useState<StockTransfer | null>(null);

  // Edit and Delete State
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransfer | null>(null);
  const [editFromWarehouseId, setEditFromWarehouseId] = useState<string>('');
  const [editToWarehouseId, setEditToWarehouseId] = useState<string>('');
  const [editTransferDate, setEditTransferDate] = useState<string>('');
  const [editReference, setEditReference] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editItems, setEditItems] = useState<TransferItemRow[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleOpenEdit = (trf: StockTransfer) => {
    setEditingTransfer(trf);
    setEditFromWarehouseId(trf.from_warehouse_id?.toString() || '');
    setEditToWarehouseId(trf.to_warehouse_id?.toString() || '');
    setEditTransferDate(trf.transfer_date || new Date().toISOString().slice(0, 10));
    setEditReference(trf.reference || '');
    setEditNotes(trf.notes || '');
    setEditError(null);

    const trfItems = (trf.items && trf.items.length > 0)
      ? trf.items.map((i) => ({
          productId: i.product_id,
          quantity: i.quantity,
          availableStock: getProductStockInWh(trf.from_warehouse_id, i.product_id) + i.quantity,
        }))
      : trf.product_id
      ? [{
          productId: trf.product_id,
          quantity: trf.quantity || 1,
          availableStock: getProductStockInWh(trf.from_warehouse_id, trf.product_id) + (trf.quantity || 1),
        }]
      : [];
    setEditItems(trfItems);
  };

  const handleUpdateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;
    if (!editFromWarehouseId || !editToWarehouseId) {
      setEditError('Please select both source and destination warehouses.');
      return;
    }
    if (editFromWarehouseId === editToWarehouseId) {
      setEditError('From Warehouse and To Warehouse must be different locations.');
      return;
    }
    if (editItems.length === 0) {
      setEditError('Please select at least one product to transfer.');
      return;
    }
    for (let idx = 0; idx < editItems.length; idx++) {
      const it = editItems[idx];
      if (!it.productId || it.quantity <= 0) {
        setEditError(`Please select a valid product and quantity for item #${idx + 1}.`);
        return;
      }
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.updateStockTransfer(business.id, editingTransfer.id, {
        fromWarehouseId: parseInt(editFromWarehouseId, 10),
        toWarehouseId: parseInt(editToWarehouseId, 10),
        transferDate: editTransferDate,
        reference: editReference.trim(),
        notes: editNotes.trim(),
        items: editItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setEditingTransfer(null);
      setSuccessMessage(`Stock transfer ${editingTransfer.transfer_number} updated successfully with movement reversal applied.`);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update stock transfer.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!deletingTransfer) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteStockTransfer(business.id, deletingTransfer.id);
      setSuccessMessage(`Stock transfer ${deletingTransfer.transfer_number} deleted. Stock movements reversed and quantities restored.`);
      setDeletingTransfer(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete stock transfer.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [transRes, whRes, prodRes] = await Promise.all([
        api.getStockTransfers(business.id),
        api.getWarehouses(business.id),
        api.getProducts(business.id),
      ]);

      const whList: Warehouse[] = whRes.warehouses || [];
      const prodList: Product[] = prodRes.products || [];

      setTransfers(transRes.transfers || []);
      setWarehouses(whList);
      setProducts(prodList);

      // Pre-load inventory map for warehouses
      const invMap: Record<number, Record<number, number>> = {};
      for (const wh of whList) {
        try {
          const sRes = await api.getWarehouseStock(business.id, wh.id);
          invMap[wh.id] = {};
          if (sRes.inventory) {
            for (const item of sRes.inventory) {
              invMap[wh.id][item.productId] = item.stock;
            }
          }
        } catch {
          // ignore error
        }
      }
      setWarehouseInventory(invMap);

      if (whList.length >= 2) {
        if (!fromWarehouseId) setFromWarehouseId(whList[0].id.toString());
        if (!toWarehouseId) setToWarehouseId(whList[1].id.toString());
      } else if (whList.length === 1) {
        if (!fromWarehouseId) setFromWarehouseId(whList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load stock transfers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  // When From Warehouse changes, update available stock for all item rows
  const getProductStockInWh = (whId: number, prodId: number): number => {
    if (warehouseInventory[whId] && warehouseInventory[whId][prodId] !== undefined) {
      return warehouseInventory[whId][prodId];
    }
    const wh = warehouses.find((w) => w.id === whId);
    const prod = products.find((p) => p.id === prodId);
    if (wh?.is_default && prod) return prod.current_stock;
    return 0;
  };

  const handleFromWarehouseChange = (newWhId: string) => {
    setFromWarehouseId(newWhId);
    const numWhId = parseInt(newWhId, 10);
    setItems((prev) =>
      prev.map((row) => ({
        ...row,
        availableStock: getProductStockInWh(numWhId, row.productId),
      }))
    );
  };

  const openNewTransferModal = () => {
    const fromId = warehouses.length > 0 ? warehouses[0].id.toString() : '';
    const toId = warehouses.length > 1 ? warehouses[1].id.toString() : '';

    setFromWarehouseId(fromId);
    setToWarehouseId(toId);
    setTransferDate(new Date().toISOString().split('T')[0]);
    setReference(`REF-${Date.now().toString().slice(-4)}`);
    setNotes('');
    setFormError(null);

    // Default with 1 product item row
    if (products.length > 0 && fromId) {
      const p = products[0];
      setItems([
        {
          productId: p.id,
          quantity: 1,
          availableStock: getProductStockInWh(parseInt(fromId, 10), p.id),
        },
      ]);
    } else {
      setItems([]);
    }

    setShowModal(true);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const selectedIds = new Set(items.map((i) => i.productId));
    const nextProd = products.find((p) => !selectedIds.has(p.id)) || products[0];
    const fromId = parseInt(fromWarehouseId, 10);
    const avail = fromId ? getProductStockInWh(fromId, nextProd.id) : 0;

    setItems((prev) => [
      ...prev,
      {
        productId: nextProd.id,
        quantity: 1,
        availableStock: avail,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, field: keyof TransferItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'productId') {
        const prodId = parseInt(value, 10);
        row.productId = prodId;
        const fromId = parseInt(fromWarehouseId, 10);
        row.availableStock = fromId ? getProductStockInWh(fromId, prodId) : 0;
      } else if (field === 'quantity') {
        row.quantity = parseFloat(value) || 0;
      }

      updated[index] = row;
      return updated;
    });
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fromWarehouseId) {
      setFormError('Please select a source (From) warehouse.');
      return;
    }
    if (!toWarehouseId) {
      setFormError('Please select a destination (To) warehouse.');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setFormError('From Warehouse and To Warehouse must be different locations.');
      return;
    }
    if (items.length === 0) {
      setFormError('Please select at least one product to transfer.');
      return;
    }

    const fromId = parseInt(fromWarehouseId, 10);
    const fromWh = warehouses.find((w) => w.id === fromId);

    // Validate quantities
    for (let idx = 0; idx < items.length; idx++) {
      const row = items[idx];
      const prod = products.find((p) => p.id === row.productId);
      const prodName = prod ? prod.name : `Product #${row.productId}`;

      if (!row.quantity || row.quantity <= 0) {
        setFormError(`Please enter a valid quantity for item ${idx + 1} (${prodName}).`);
        return;
      }

      const available = getProductStockInWh(fromId, row.productId);
      if (row.quantity > available) {
        setFormError(
          `Requested quantity (${row.quantity}) for "${prodName}" exceeds available stock in ${fromWh?.name || 'source warehouse'} (${available} units).`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await api.createStockTransfer(business.id, {
        from_warehouse_id: fromId,
        to_warehouse_id: parseInt(toWarehouseId, 10),
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        transfer_date: transferDate,
        reference,
        notes,
      });

      setShowModal(false);
      setSuccessMessage(
        `Stock transfer ${res.transfer.transfer_number} completed successfully! Inventory has been updated between warehouses.`
      );
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete stock transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    return (
      (t.transfer_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.from_warehouse_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.to_warehouse_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.items || []).some((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const totalTransferredItems = transfers.reduce((sum, t) => sum + (t.total_quantity || t.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Transfers</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer physical stock between warehouses with real-time balance synchronization and audit history
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigateToWarehouses && (
            <button
              onClick={onNavigateToWarehouses}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <WarehouseIcon className="w-4 h-4 text-indigo-600" />
              <span>Manage Warehouses</span>
            </button>
          )}

          <button
            onClick={openNewTransferModal}
            disabled={warehouses.length < 2}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            title={
              warehouses.length < 2
                ? 'Requires at least 2 warehouses to execute inter-warehouse transfers'
                : 'Create Stock Transfer'
            }
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Transfer</span>
          </button>
        </div>
      </div>

      {warehouses.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You currently have {warehouses.length} warehouse facility registered. To transfer stock, you need at least two warehouses (From & To).
            </span>
          </div>
          {onNavigateToWarehouses && (
            <button
              onClick={onNavigateToWarehouses}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 ml-4 cursor-pointer"
            >
              Add Warehouse
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Transfers
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{transfers.length}</p>
          <p className="text-xs text-slate-400 mt-1">Inter-warehouse movements logged</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Units Transferred
          </span>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {totalTransferredItems.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Zero impact on sales or ledger</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Connected Warehouses
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{warehouses.length}</p>
          <p className="text-xs text-slate-400 mt-1">All storage nodes synchronized</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transfers, warehouses, SKU, reference..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading stock transfers history...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No Stock Transfers Recorded</p>
            <p className="text-xs text-slate-400 mt-1">
              Transfer products between your warehouses to track inventory distribution accurately
            </p>
            {warehouses.length >= 2 && (
              <button
                onClick={openNewTransferModal}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Transfer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">From Warehouse</th>
                  <th className="py-3 px-4">To Warehouse</th>
                  <th className="py-3 px-4">Products & Quantities</th>
                  <th className="py-3 px-4 text-center">Total Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((trf) => {
                  const itemsList = trf.items && trf.items.length > 0 ? trf.items : [];
                  const totalQty = trf.total_quantity || trf.quantity || itemsList.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={trf.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {trf.transfer_number}
                        {trf.reference && (
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                            Ref: {trf.reference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {trf.transfer_date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] font-bold border border-rose-100">
                            {trf.from_warehouse_code || 'WH-FROM'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {trf.from_warehouse_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-100">
                            {trf.to_warehouse_code || 'WH-TO'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {trf.to_warehouse_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {itemsList.length > 0 ? (
                          <div className="space-y-1">
                            {itemsList.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-1.5">
                                <span className="font-medium text-slate-800 truncate max-w-[160px]">
                                  {item.product_name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                            {itemsList.length > 2 && (
                              <span className="text-[10px] text-indigo-600 font-medium">
                                + {itemsList.length - 2} more item(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-medium text-slate-800">
                            {trf.product_name} (x{trf.quantity})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs">
                          {totalQty}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100 inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setViewingTransfer(trf)}
                            className="px-2 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 text-xs font-semibold inline-flex items-center space-x-1 transition-colors cursor-pointer"
                            title="View Transfer Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Slip</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(trf)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Stock Transfer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTransfer(trf)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Stock Transfer"
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

      {/* New Stock Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Execute Stock Transfer</h3>
                  <p className="text-xs text-slate-500">Move inventory between warehouses without generating invoices</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-4 mt-4">
              {/* Warehouse Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    From Warehouse (Source) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={fromWarehouseId}
                    onChange={(e) => handleFromWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name} {w.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    To Warehouse (Destination) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    {warehouses
                      .filter((w) => w.id.toString() !== fromWarehouseId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Products to Transfer ({items.length}) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {items.map((row, idx) => {
                    const prod = products.find((p) => p.id === row.productId);
                    const isOver = row.quantity > row.availableStock;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={row.productId}
                            onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="text-[11px] text-slate-500 px-2 py-1 bg-white border border-slate-200 rounded-lg shrink-0">
                            Available:{' '}
                            <strong className={row.availableStock <= 0 ? 'text-rose-600' : 'text-emerald-700'}>
                              {row.availableStock}
                            </strong>
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={row.quantity || ''}
                              onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-bold text-center focus:outline-none ${
                                isOver
                                  ? 'border-rose-400 ring-2 ring-rose-300 text-rose-700'
                                  : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                            />
                          </div>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date, Reference, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Dispatch #
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. WAYBILL-9021"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes & Logistics Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Restocking retail showroom; dispatched via driver Alex"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Total Items:{' '}
                  <strong className="text-slate-800 font-bold">
                    {items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} units
                  </strong>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Executing Transfer...' : 'Complete Transfer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Transfer Slip Modal */}
      {viewingTransfer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                  Internal Transfer Slip
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {viewingTransfer.transfer_number}
                </h3>
              </div>
              <button
                onClick={() => setViewingTransfer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">From Source WH</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingTransfer.from_warehouse_name}</p>
                  <span className="text-[10px] text-slate-500">{viewingTransfer.from_warehouse_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">To Destination WH</span>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingTransfer.to_warehouse_name}</p>
                  <span className="text-[10px] text-slate-500">{viewingTransfer.to_warehouse_code}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Transfer Date</span>
                  <p className="font-medium text-slate-800">{viewingTransfer.transfer_date}</p>
                </div>
                {viewingTransfer.reference && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Reference #</span>
                    <p className="font-medium text-slate-800">{viewingTransfer.reference}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase mb-2 block">
                  Transferred Products
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {(viewingTransfer.items && viewingTransfer.items.length > 0
                    ? viewingTransfer.items
                    : [
                        {
                          product_name: viewingTransfer.product_name || 'Product',
                          product_sku: viewingTransfer.product_sku || '',
                          quantity: viewingTransfer.quantity || 1,
                        },
                      ]
                  ).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product_name}</p>
                        {item.product_sku && (
                          <span className="font-mono text-[10px] text-slate-400">{item.product_sku}</span>
                        )}
                      </div>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                        {item.quantity} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {viewingTransfer.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Notes</span>
                  <p className="text-slate-700 mt-0.5">{viewingTransfer.notes}</p>
                </div>
              )}

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-800 text-[11px] flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>This transfer was executed with zero impact on customer ledgers or sales revenues.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingTransfer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Transfer Modal */}
      {editingTransfer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Stock Transfer</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingTransfer.transfer_number}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTransfer(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTransfer} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    From Warehouse (Source) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editFromWarehouseId}
                    onChange={(e) => setEditFromWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    To Warehouse (Destination) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editToWarehouseId}
                    onChange={(e) => setEditToWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editTransferDate}
                    onChange={(e) => setEditTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Vehicle #</label>
                  <input
                    type="text"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Products to Transfer</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length > 0) {
                        setEditItems([
                          ...editItems,
                          {
                            productId: products[0].id,
                            quantity: 1,
                            availableStock: getProductStockInWh(parseInt(editFromWarehouseId, 10), products[0].id),
                          },
                        ]);
                      }
                    }}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newProdId = parseInt(e.target.value, 10);
                            const updated = [...editItems];
                            updated[idx] = {
                              ...updated[idx],
                              productId: newProdId,
                              availableStock: getProductStockInWh(parseInt(editFromWarehouseId, 10), newProdId),
                            };
                            setEditItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value, 10) || 0;
                            const updated = [...editItems];
                            updated[idx] = { ...updated[idx], quantity: q };
                            setEditItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                          placeholder="Qty"
                        />
                      </div>
                      {editItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason</label>
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
                  onClick={() => setEditingTransfer(null)}
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

      {/* Delete Stock Transfer Confirmation Modal */}
      {deletingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Stock Transfer?</h3>
                <p className="text-xs text-slate-500 font-mono">{deletingTransfer.transfer_number}</p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 my-4 text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold text-rose-900">Atomic Stock Movement Reversal Notice:</p>
              <p>
                Deleting this transfer will reverse all associated stock movements: transferred units will be returned to <strong>{deletingTransfer.from_warehouse_name}</strong> and removed from <strong>{deletingTransfer.to_warehouse_name}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTransfer(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTransfer}
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
