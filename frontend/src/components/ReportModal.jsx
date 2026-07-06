import { useState } from 'react';
import { X, Send, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportModal({ isOpen, onClose, sessionId, reportedUserId, reportedUserName }) {
  const [type, setType] = useState('no-show');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !reportedUserId) return;

    setIsSubmitting(true);
    try {
      await api.post('/reports', { 
        reportedUserId, 
        sessionId, 
        type, 
        reason 
      });
      addToast('Report submitted successfully. A moderator will review it shortly.', 'success');
      onClose();
      setReason('');
    } catch (err) {
      addToast('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORIES = [
    { id: 'no-show', label: 'No Show', color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'harassment', label: 'Harassment', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'fake-skill', label: 'Fake Skill', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'spam', label: 'Spam/Scam', color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'other', label: 'Other', color: 'text-slate-500', bg: 'bg-slate-50' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <ShieldAlert className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Report User</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Reporting {reportedUserName || 'User'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id)}
                    className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                      type === cat.id 
                        ? `border-${cat.color.split('-')[1]}-500 ${cat.bg} ${cat.color} shadow-sm` 
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1">
                  <AlertTriangle size={12} /> Reason for Report
                </label>
                <textarea 
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide specific details about what happened..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-4">
                <p className="text-[9px] text-slate-400 font-medium max-w-[200px]">
                  False reports may result in account penalties. Please be truthful.
                </p>
                <button 
                  type="submit"
                  disabled={isSubmitting || !reason}
                  className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
