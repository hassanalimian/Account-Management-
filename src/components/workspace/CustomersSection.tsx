import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Edit,
  Trash2,
  UserCheck,
  ShieldCheck,
  ArrowRightLeft,
  Building2,
  FileText,
  BadgeAlert,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Customer, UnifiedParty, UnifiedLedgerRow } from '../../types.ts';

interface CustomersSectionProps {
  business: Business;
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ business }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [alsoAsSupplier, setAlsoAsSupplier] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editTaxNumber, setEditTaxNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Unified Profile & Ledger Modal
  const [activeProfileCustomer, setActiveProfileCustomer] = useState<Customer | null>(null);
  const [partyProfile, setPartyProfile] = useState<UnifiedParty | null>(null);
  const [unifiedLedgerEntries, setUnifiedLedgerEntries] = useState<UnifiedLedgerRow[]>([]);
  const [ledgerFrom, setLedgerFrom] = useState('');
  const [ledgerTo, setLedgerTo] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Delete / Role Removal Confirmation Modal
  const [partyToDelete, setPartyToDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers(business.id);
      setCustomers(res.customers || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [business.id]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createCustomer(business.id, {
        name,
        company_name: companyName,
        phone,
        email,
        address,
        city,
        tax_number: taxNumber,
        notes,
        opening_balance: parseFloat(openingBalance) || 0,
        also_supplier: alsoAsSupplier,
      });
      setShowAddModal(false);
      resetAddForm();
      loadCustomers();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    }
  };

  const resetAddForm = () => {
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setTaxNumber('');
    setNotes('');
    setOpeningBalance('0');
    setAlsoAsSupplier(false);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditName(cust.name);
    setEditCompanyName(cust.company_name || '');
    setEditPhone(cust.phone || '');
    setEditEmail(cust.email || '');
    setEditAddress(cust.address || '');
    setEditCity(cust.city || '');
    setEditTaxNumber(cust.tax_number || '');
    setEditNotes(cust.notes || '');
    setEditStatus(cust.status || 'active');
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await api.updateCustomer(business.id, editingCustomer.id, {
        name: editName,
        company_name: editCompanyName,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
        city: editCity,
        tax_number: editTaxNumber,
        notes: editNotes,
        status: editStatus,
      });
      setEditingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    }
  };

  const openUnifiedProfile = async (cust: Customer) => {
    setActiveProfileCustomer(cust);
    setProfileLoading(true);
    setActionMessage(null);
    try {
      const partyKey = cust.party_id ? String(cust.party_id) : `c_${cust.id}`;
      const [profileRes, ledgerRes] = await Promise.all([
        api.getPartyProfile(business.id, partyKey).catch(() => null),
        api.getPartyLedger(business.id, partyKey, ledgerFrom, ledgerTo).catch(() => null),
      ]);

      if (profileRes && profileRes.party) {
        setPartyProfile(profileRes.party);
      } else {
        setPartyProfile({
          id: cust.party_id || cust.id,
          business_id: business.id,
          customer_id: cust.id,
          supplier_id: cust.linked_supplier_id || null,
          name: cust.name,
          company_name: cust.company_name,
          phone: cust.phone,
          email: cust.email,
          address: cust.address,
          city: cust.city,
          tax_number: cust.tax_number,
          notes: cust.notes,
          status: cust.status || 'active',
          is_customer: true,
          is_supplier: Boolean(cust.is_supplier || cust.linked_supplier_id),
          customer_balance: cust.current_balance,
          supplier_balance: 0,
          net_balance: cust.current_balance,
          created_at: cust.created_at,
        });
      }

      if (ledgerRes && ledgerRes.entries) {
        setUnifiedLedgerEntries(ledgerRes.entries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const applyLedgerFilter = async () => {
    if (!activeProfileCustomer) return;
    setProfileLoading(true);
    try {
      const partyKey = activeProfileCustomer.party_id
        ? String(activeProfileCustomer.party_id)
        : `c_${activeProfileCustomer.id}`;
      const res = await api.getPartyLedger(business.id, partyKey, ledgerFrom, ledgerTo);
      if (res && res.entries) {
        setUnifiedLedgerEntries(res.entries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDesignateAsSupplier = async (custId: number) => {
    try {
      await api.designateCustomerAsSupplier(business.id, custId);
      setActionMessage('Successfully designated as Supplier. ABC entity is now Customer + Supplier!');
      loadCustomers();
      if (activeProfileCustomer && activeProfileCustomer.id === custId) {
        openUnifiedProfile(activeProfileCustomer);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to designate as Supplier');
    }
  };

  const handleRemoveSupplierRole = async (custId: number) => {
    if (!confirm('Are you sure you want to remove the Supplier role from this entity? Historical transactions remain safe in the unified ledger.')) {
      return;
    }
    try {
      await api.removeCustomerRole(business.id, custId); // or suppliers remove
      setActionMessage('Supplier role removed.');
      loadCustomers();
      if (activeProfileCustomer && activeProfileCustomer.id === custId) {
        openUnifiedProfile(activeProfileCustomer);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDeleteClick = (cust: Customer) => {
    setPartyToDelete(cust);
    setDeleteError(null);
  };

  const confirmDeleteCustomer = async (force: boolean = false) => {
    if (!partyToDelete) return;
    try {
      const partyKey = partyToDelete.party_id ? String(partyToDelete.party_id) : `c_${partyToDelete.id}`;
      const res = await api.deleteUnifiedParty(business.id, { partyKey, forceDelete: force });
      if (res.success) {
        setPartyToDelete(null);
        loadCustomers();
      } else {
        setDeleteError(res.error || 'Cannot delete entity with existing accounting records.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Deletion failed.');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Customers & Receivables</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Maintain unified customer & supplier profiles, dual-role entities, and unified running ledgers
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            resetAddForm();
            setShowAddModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
          id="add-customer-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, company, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Entity / Customer Name</th>
                <th className="py-3.5 px-4">Role(s)</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Address / City</th>
                <th className="py-3.5 px-4 text-right">Balance ({business.currency})</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCustomers.map((cust) => {
                const isDualRole = Boolean(cust.is_supplier || cust.linked_supplier_id);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{cust.name}</div>
                      {cust.company_name && (
                        <div className="text-xs font-normal text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{cust.company_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Role Badges */}
                    <td className="py-3.5 px-4">
                      {isDualRole ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          Customer + Supplier
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Customer
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5 text-xs">
                      {cust.phone && (
                        <div className="flex items-center space-x-1.5 text-slate-700 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.email && (
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate text-xs">
                      <div>{cust.address || '-'}</div>
                      {cust.city && <div className="text-slate-400">{cust.city}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          cust.current_balance > 0
                            ? 'text-amber-700 font-bold'
                            : cust.current_balance < 0
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-600'
                        }
                      >
                        {business.currency} {cust.current_balance.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => openUnifiedProfile(cust)}
                          title="View Unified Profile & Ledger"
                          className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Ledger</span>
                        </button>

                        {!isDualRole ? (
                          <button
                            onClick={() => handleDesignateAsSupplier(cust.id)}
                            title="Also designate this entity as Supplier"
                            className="px-2 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add as Supplier</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleOpenEdit(cust)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(cust)}
                          title="Delete / Manage Entity Role"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Add New Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Customer / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Traders or Ramesh Kumar"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Company / Trade Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. ABC Enterprises Ltd."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="entity@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street / Warehouse address"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore / Karachi"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tax / NTN Number</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="e.g. 1234567-8"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Opening Balance ({business.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* UNIFIED DESIGNATION CHECKBOX */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="also-supplier-checkbox"
                    checked={alsoAsSupplier}
                    onChange={(e) => setAlsoAsSupplier(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-sm text-slate-900">
                      Also designate this customer as a Supplier
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Creates a single unified party entity that appears in both Customer and Supplier lists, sharing ONE combined ledger for sales invoices, purchase bills, and payments.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <span>Edit Customer: {editingCustomer.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tax / NTN Number</label>
                  <input
                    type="text"
                    value={editTaxNumber}
                    onChange={(e) => setEditTaxNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Profile & Combined Ledger Modal */}
      {activeProfileCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 text-slate-900 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 shrink-0 gap-3">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <span>{partyProfile?.name || activeProfileCustomer.name}</span>
                  </h3>
                  {partyProfile?.is_customer && partyProfile?.is_supplier ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      Customer + Supplier
                    </span>
                  ) : partyProfile?.is_supplier ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Supplier Only
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      Customer Only
                    </span>
                  )}
                </div>

                {partyProfile?.company_name && (
                  <p className="text-sm text-slate-600 font-medium mt-0.5">
                    {partyProfile.company_name}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!partyProfile?.is_supplier && (
                  <button
                    onClick={() => handleDesignateAsSupplier(activeProfileCustomer.id)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add as Supplier</span>
                  </button>
                )}

                {partyProfile?.is_customer && partyProfile?.is_supplier && (
                  <button
                    onClick={() => handleRemoveSupplierRole(activeProfileCustomer.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Remove Supplier Role
                  </button>
                )}

                <button
                  onClick={() => setActiveProfileCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {actionMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Profile Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 text-xs shrink-0">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Contact Details</span>
                <span className="text-slate-800 font-semibold block mt-0.5 font-mono">
                  {partyProfile?.phone || 'No phone'}
                </span>
                <span className="text-slate-500 truncate block">{partyProfile?.email || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="text-slate-800 font-semibold block mt-0.5 truncate">
                  {partyProfile?.address || '-'}
                </span>
                <span className="text-slate-500 block">{partyProfile?.city || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Tax / NTN</span>
                <span className="text-slate-800 font-semibold block mt-0.5 font-mono">
                  {partyProfile?.tax_number || 'N/A'}
                </span>
                <span className="text-slate-500 block">Status: {partyProfile?.status || 'active'}</span>
              </div>

              <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                <span className="text-indigo-600 block font-medium">Combined Net Balance</span>
                <span
                  className={`text-base font-bold font-mono block mt-0.5 ${
                    (partyProfile?.net_balance || 0) > 0
                      ? 'text-amber-700'
                      : (partyProfile?.net_balance || 0) < 0
                      ? 'text-emerald-700'
                      : 'text-slate-800'
                  }`}
                >
                  {business.currency} {(partyProfile?.net_balance ?? activeProfileCustomer.current_balance).toFixed(2)}
                </span>
                <span className="text-slate-500 text-[10px] block">
                  {(partyProfile?.net_balance || 0) > 0
                    ? 'Net Receivable from Party'
                    : (partyProfile?.net_balance || 0) < 0
                    ? 'Net Payable to Party'
                    : 'Settled / Zero Balance'}
                </span>
              </div>
            </div>

            {/* Combined Ledger Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Date Range:</span>
                </span>
                <input
                  type="date"
                  value={ledgerFrom}
                  onChange={(e) => setLedgerFrom(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={ledgerTo}
                  onChange={(e) => setLedgerTo(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <button
                  onClick={applyLedgerFilter}
                  className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Filter
                </button>
              </div>

              <div className="text-xs text-slate-500 italic">
                One entity &bull; One unified ledger (Sales Invoices, Purchase Bills & Payments)
              </div>
            </div>

            {/* Unified Ledger Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Transaction</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Receivable</th>
                    <th className="py-2.5 px-3 text-right">Payable</th>
                    <th className="py-2.5 px-3 text-right">Balance ({business.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {unifiedLedgerEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono">{entry.date}</td>
                      <td className="py-2.5 px-3 font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            entry.transaction_type === 'invoice'
                              ? 'bg-amber-100 text-amber-800'
                              : entry.transaction_type === 'bill'
                              ? 'bg-indigo-100 text-indigo-800'
                              : entry.transaction_type === 'receipt'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.transaction_type === 'payment'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {entry.type_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{entry.reference_no}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{entry.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-700">
                        {entry.receivable_amount && entry.receivable_amount > 0
                          ? `${business.currency} ${entry.receivable_amount.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-indigo-700">
                        {entry.payable_amount && entry.payable_amount > 0
                          ? `${business.currency} ${entry.payable_amount.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {business.currency} {entry.running_balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {unifiedLedgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {profileLoading ? 'Loading ledger...' : 'No ledger entries found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 shrink-0 text-xs text-slate-500">
              <div>
                Total Transactions: <strong>{unifiedLedgerEntries.length}</strong>
              </div>
              <button
                type="button"
                onClick={() => setActiveProfileCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Role Management Dialog */}
      {partyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete / Manage: {partyToDelete.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Safety verification for financial entity
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <p className="text-sm text-slate-600 mb-4">
              If this entity has existing invoices, bills, or payments, deleting it completely would damage audit history. You may instead deactivate it or remove specific roles.
            </p>

            {partyToDelete.is_supplier && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                <strong>Notice:</strong> This entity is also designated as a Supplier. You can remove the Customer role or Supplier role individually to preserve records.
              </div>
            )}

            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => confirmDeleteCustomer(false)}
                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Confirm Delete (Only if zero transactions)
              </button>
              <button
                type="button"
                onClick={() => setPartyToDelete(null)}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
