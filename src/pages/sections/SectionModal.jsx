import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateTrack } from '../../i18n/tracks';

export default function SectionModal({ isOpen, onClose, section = null, programTypes = [], onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    program_type_id: '',
    order_no: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!section;

  useEffect(() => {
    if (section) {
      setFormData({
        name: section.name || '',
        program_type_id: section.program_type_id || '',
        order_no: section.order_no || '',
      });
    } else {
      setFormData({ name: '', program_type_id: '', order_no: '' });
    }
  }, [section, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData, isEdit ? section.id : null);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform transition-all animate-[slide-up_0.3s_ease-out] overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{isEdit ? 'Edit Section' : 'Add New Section'}</h2>
          <button onClick={onClose} className="p-2 bg-slate-200/50 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Section Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Y1, R2, D3"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Program Type <span className="text-red-500">*</span></label>
            <select
              name="program_type_id"
              value={formData.program_type_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
            >
              <option value="">Select Program Type</option>
              {programTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {translateTrack(t, pt.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Promotion Rank (Order No)</label>
            <input
              type="number"
              name="order_no"
              value={formData.order_no}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-800"
            />
            <p className="text-xs text-slate-400 font-medium">Used to determine order when students are promoted.</p>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl py-2.5 font-bold shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 hover:shadow-brand-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}