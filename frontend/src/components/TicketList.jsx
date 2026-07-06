import { useState, useEffect } from 'react';
import { MessageSquare, Clock, AlertCircle, CheckCircle, ChevronRight, User, Tag, Filter } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function TicketList({ adminView = false }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('all');
  const { addToast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.data);
    } catch (err) {
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      await api.post(`/tickets/${selectedTicket._id}/reply`, { message: reply });
      addToast('Reply sent', 'success');
      setReply('');
      // Refresh ticket details
      const res = await api.get(`/tickets/${selectedTicket._id}`);
      setSelectedTicket(res.data.data);
      fetchTickets();
    } catch (err) {
      addToast('Failed to send reply', 'error');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/tickets/${selectedTicket._id}/status`, { status });
      addToast('Status updated', 'success');
      setSelectedTicket({ ...selectedTicket, status });
      fetchTickets();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading Support Hub...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Ticket List Side */}
      <div className={`lg:col-span-${selectedTicket ? '4' : '12'} space-y-4`}>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={16} />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredTickets.length} Tickets Found</span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
          {filteredTickets.map(ticket => (
            <motion.div
              layout
              key={ticket._id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedTicket?._id === ticket._id 
                  ? 'bg-violet-600 border-violet-500 shadow-lg shadow-violet-600/20' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  selectedTicket?._id === ticket._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {ticket.category}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  ticket.status === 'open' ? 'text-violet-500' :
                  ticket.status === 'resolved' ? 'text-emerald-500' : 'text-orange-500'
                } ${selectedTicket?._id === ticket._id ? 'text-white' : ''}`}>
                  {ticket.status}
                </span>
              </div>
              <h3 className={`text-sm font-bold mb-1 truncate ${selectedTicket?._id === ticket._id ? 'text-white' : 'text-slate-800'}`}>
                {ticket.subject}
              </h3>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden">
                      {ticket.userId?.avatar ? <img src={ticket.userId.avatar} className="w-full h-full object-cover" /> : <User size={10} className="text-slate-400 m-1" />}
                   </div>
                   <span className={`text-[10px] font-bold ${selectedTicket?._id === ticket._id ? 'text-white/80' : 'text-slate-500'}`}>{ticket.userId?.name}</span>
                </div>
                <span className={`text-[9px] font-medium ${selectedTicket?._id === ticket._id ? 'text-white/60' : 'text-slate-400'}`}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ticket Details View */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden"
          >
            {/* Ticket Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="rotate-180" /></button>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{selectedTicket.subject}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket ID: {selectedTicket._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {adminView && selectedTicket.status !== 'resolved' && (
                  <button 
                    onClick={() => handleStatusChange('resolved')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Mark Resolved
                  </button>
                )}
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  selectedTicket.priority === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-violet-50 text-violet-500 border-violet-100'
                }`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
              {/* Original Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0 border border-violet-200">
                   <User className="text-violet-600" size={20} />
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedTicket.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Original Issue</span>
                </div>
              </div>

              {/* Replies */}
              {selectedTicket.replies.map((msg, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    msg.sender === selectedTicket.userId._id ? 'bg-violet-100 border-violet-200' : 'bg-indigo-100 border-indigo-200'
                  }`}>
                    {msg.sender === selectedTicket.userId._id ? <User className="text-violet-600" size={20} /> : <ShieldCheck className="text-indigo-600" size={20} />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <p className="text-sm text-slate-600 leading-relaxed">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {msg.sender === selectedTicket.userId._id ? 'User' : 'Support Team'}
                       </span>
                       <span className="text-[10px] font-medium text-slate-300">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleReply} className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck({ className, size }) {
  return <CheckCircle className={className} size={size} />;
}
