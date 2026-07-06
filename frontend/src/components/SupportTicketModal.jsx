import { useState } from 'react';
import { X, Send, AlertCircle, LifeBuoy, Zap, CreditCard, HelpCircle } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportTicketModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !description) return;

    setIsSubmitting(true);
    try {
      await api.post('/tickets', { subject, description, category, priority });
      addToast('Support ticket created successfully. Our team will contact you soon.', 'success');
      onClose();
      // Reset form
      setSubject('');
      setDescription('');
    } catch (err) {
      addToast('Failed to create ticket. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORIES = [
    { id: 'technical', label: 'Technical Issue', icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: 'billing', label: 'Billing / Payments', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'mentor_issue', label: 'Mentor Problem', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'other', label: 'Other Inquiry', icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-50' }
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
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <LifeBuoy className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Support Hub</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">How can we help you today?</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      category === cat.id 
                        ? 'border-violet-500 bg-violet-50/50 shadow-sm' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <cat.icon className={`mb-2 ${cat.color}`} size={18} />
                    <p className={`text-[11px] font-black uppercase tracking-wider ${category === cat.id ? 'text-violet-600' : 'text-slate-500'}`}>
                      {cat.label}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Issue Subject</label>
                  <input 
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefly describe the topic"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us more about the issue..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Urgency:</span>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none border-none focus:ring-0 p-0"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Ticket'}
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
