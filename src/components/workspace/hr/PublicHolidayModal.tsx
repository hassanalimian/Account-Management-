import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar } from 'lucide-react';
import { PublicHoliday } from '../../../types.ts';
import { api } from '../../../api.ts';

interface PublicHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: number;
  holidayToEdit?: PublicHoliday | null;
}

export const PublicHolidayModal: React.FC<PublicHolidayModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  businessId,
  holidayToEdit,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPaid, setIsPaid] = useState(true);
  const [isSpecial, setIsSpecial] = useState(false);
  const [recurring, setRecurring] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holidayToEdit) {
      setName(holidayToEdit.name);
      setDate(holidayToEdit.date);
      setIsPaid(holidayToEdit.is_paid);
      setIsSpecial(holidayToEdit.is_special);
      setRecurring(holidayToEdit.recurring);
      setNotes(holidayToEdit.notes || '');
    } else {
      setName('');
      setDate(new Date().toISOString().slice(0, 10));
      setIsPaid(true);
      setIsSpecial(false);
      setRecurring(true);
      setNotes('');
    }
    setError(null);
  }, [holidayToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter holiday title.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      date,
      is_paid: isPaid,
      is_special: isSpecial,
      recurring,
      notes: notes.trim(),
    };

    try {
      if (holidayToEdit) {
        const res = await api.updatePublicHoliday(businessId, holidayToEdit.id, payload);
        if (!res.success) throw new Error((res as any).error || 'Failed to update holiday');
      } else {
        const res = await api.createPublicHoliday(businessId, payload);
        if (!res.success) throw new Error((res as any).error || 'Failed to create holiday');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {holidayToEdit ? 'Edit Public Holiday' : 'Add Public Holiday'}
              </h2>
              <p className="text-xs text-slate-300">Gazetted holiday rules for payroll & attendance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Holiday Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eid-ul-Fitr Day 1 / Pakistan Day"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Holiday Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Paid Holiday (No salary deduction for employees)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Special Holiday (Qualifies for higher overtime multiplier)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Recurring Annual Public Holiday</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Notification
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Official government notification"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : holidayToEdit ? 'Update Holiday' : 'Save Holiday'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
