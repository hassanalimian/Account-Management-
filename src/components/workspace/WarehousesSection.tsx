import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Layers,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Boxes,
  ArrowLeftRight,
  Eye,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Warehouse } from '../../types.ts';

interface WarehousesSectionProps {
  business: Business;
  onNavigateToTransfers?: () => void;
}

export const WarehousesSection: React.FC<WarehousesSectionProps> = ({
  business,
  onNavigateToTransfers,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [manager, setManager] = useState('');
  const [capacity, setCapacity] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View Stock Drawer / Modal
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [invSearch, setInvSearch] = useState('');

  // Delete Confirmation
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.getWarehouses(business.id);
      setWarehouses(res.warehouses || []);
    } catch (err: any) {
      console.error('Failed to load warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [business.id]);

  const openCreateModal = () => {
    setEditingWarehouse(null);
    setName('');
    setCode(`WH-0${warehouses.length + 1}`);
    setAddress('');
    setCity('');
    setPhone('');
    setEmail('');
    setManager('');
    setCapacity('');
    setNotes('');
    setStatus('active');
    setIsDefault(warehouses.length === 0);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setName(wh.name);
    setCode(wh.code);
    setAddress(wh.address || '');
    setCity(wh.city || '');
    setPhone(wh.phone || '');
    setEmail(wh.email || '');
    setManager(wh.manager || '');
    setCapacity(wh.capacity || '');
    setNotes(wh.notes || '');
    setStatus(wh.status);
    setIsDefault(!!wh.is_default);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Warehouse name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      manager: manager.trim(),
      capacity: capacity.trim(),
      notes: notes.trim(),
      status,
      is_default: isDefault,
    };

    try {
      if (editingWarehouse) {
        await api.updateWarehouse(business.id, editingWarehouse.id, payload);
      } else {
        await api.createWarehouse(business.id, payload);
      }
      setShowModal(false);
      loadWarehouses();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewInventory = async (wh: Warehouse) => {
    setViewingWarehouse(wh);
    setInventoryLoading(true);
    try {
      const res = await api.getWarehouseStock(business.id, wh.id);
      setWarehouseInventory(res.inventory || []);
    } catch (err: any) {
      console.error('Failed to load warehouse stock', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteWarehouse(business.id, deletingWarehouse.id);
      setDeletingWarehouse(null);
      loadWarehouses();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete warehouse.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      (w.city && w.city.toLowerCase().includes(search.toLowerCase())) ||
      (w.manager && w.manager.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || w.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCapacityUnits = warehouses.reduce((sum, w) => sum + (w.total_stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <WarehouseIcon className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Warehouse Management</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage storage facilities, multi-location stock levels, and warehouse distribution hubs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigateToTransfers && (
            <button
              onClick={onNavigateToTransfers}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              <span>Stock Transfers</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Warehouses
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{warehouses.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {warehouses.filter((w) => w.status === 'active').length} active storage hubs
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total On-Hand Inventory
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalCapacityUnits.toLocaleString()} <span className="text-sm font-medium text-slate-400">units</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all facilities</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Primary Fulfillment Hub
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 truncate">
            {warehouses.find((w) => w.is_default)?.name || 'Central Warehouse'}
          </p>
          <p className="text-xs text-indigo-600 font-medium mt-1">
            Code: {warehouses.find((w) => w.is_default)?.code || 'WH-MAIN'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by warehouse name, code, city, manager..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Warehouses Grid / List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs">
          Loading warehouses and inventory allocations...
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <WarehouseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No Warehouses Found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try adjusting your search query' : 'Create your first warehouse facility to start storing stock'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Warehouse</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWarehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] tracking-wider border border-indigo-100">
                        {wh.code}
                      </span>
                      {wh.is_default && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Default Hub</span>
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                          wh.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {wh.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                      {wh.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(wh)}
                      title="Edit Warehouse"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingWarehouse(wh)}
                      title="Delete Warehouse"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Location & Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {wh.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {wh.address}
                        {wh.city ? `, ${wh.city}` : ''}
                      </span>
                    </div>
                  )}
                  {wh.manager && (
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Manager: <strong className="font-semibold text-slate-700">{wh.manager}</strong>
                      </span>
                    </div>
                  )}
                  {wh.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{wh.phone}</span>
                    </div>
                  )}
                  {wh.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{wh.email}</span>
                    </div>
                  )}
                  {wh.capacity && (
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Capacity: {wh.capacity}</span>
                    </div>
                  )}
                </div>

                {/* Stock Stats */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Stored Products</span>
                    <p className="text-base font-bold text-slate-900">
                      {wh.total_products || 0} <span className="text-[11px] font-normal text-slate-500">items</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Total Units</span>
                    <p className="text-base font-bold text-indigo-700">
                      {(wh.total_stock || 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500">units</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openViewInventory(wh)}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>View Inventory</span>
                </button>
                {onNavigateToTransfers && (
                  <button
                    onClick={onNavigateToTransfers}
                    className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    title="Transfer stock to/from this warehouse"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Transfer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <WarehouseIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                </h3>
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

            <form onSubmit={handleSaveWarehouse} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Central Logistics Hub"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warehouse Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WH-01"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. warehouse@business.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (Estimated)
                  </label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 15,000 units / 5,000 sq ft"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New York, NY"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / Logistics Gate
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Bay 4, Industrial Logistics Boulevard"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes & Handling Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Cold storage bay available, operating hours 08:00 - 18:00"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800">
                        Set as Default Primary Warehouse
                      </span>
                      <p className="text-[11px] text-slate-500">
                        New inventory purchases and main receiving will prioritize this warehouse
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Warehouse Inventory Drawer / Modal */}
      {viewingWarehouse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] font-mono">
                    {viewingWarehouse.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {viewingWarehouse.name} — Inventory Stock
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingWarehouse.address} {viewingWarehouse.city ? `• ${viewingWarehouse.city}` : ''}
                </p>
              </div>
              <button
                onClick={() => setViewingWarehouse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inventory Search & Quick stats */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Search products in this warehouse..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              {onNavigateToTransfers && (
                <button
                  onClick={() => {
                    setViewingWarehouse(null);
                    onNavigateToTransfers();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transfer Stock</span>
                </button>
              )}
            </div>

            {/* Product table */}
            <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              {inventoryLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading inventory levels...</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200/80 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">In This WH</th>
                      <th className="py-2.5 px-3 text-right">Total Biz Stock</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouseInventory
                      .filter((p) =>
                        p.productName.toLowerCase().includes(invSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(invSearch.toLowerCase())
                      )
                      .map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{item.sku}</td>
                          <td className="py-2 px-3 text-slate-500">{item.categoryName}</td>
                          <td className="py-2 px-3 text-right font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${
                                item.stock > 10
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.stock > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {item.stock}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">{item.totalBusinessStock}</td>
                          <td className="py-2 px-3 text-right font-medium text-slate-800">
                            ${Number(item.sellingPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    {warehouseInventory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No products registered in the system yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingWarehouse(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWarehouse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Warehouse</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong>{deletingWarehouse.name}</strong> ({deletingWarehouse.code})?
            </p>

            {deleteError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setDeletingWarehouse(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Warehouse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
