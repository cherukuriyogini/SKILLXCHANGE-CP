import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingUp, Clock, Star, Check, Users, ShieldCheck, LifeBuoy, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/api';
import ErrorState from '../components/ErrorState';
import { Skeleton } from '../components/SkeletonLoader';

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({ pendingReports: 0, resolvedToday: 0, platformHealth: 100, avgResponse: 1.5 });
  const [reportsList, setReportsList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionPendingId, setActionPendingId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, ticketsRes] = await Promise.all([
        api.get('/admin/moderator-stats'),
        api.get('/reports'),
        api.get('/tickets')
      ]);
      setStats(statsRes.data.data);
      setReportsList(reportsRes.data.data);
      setTicketsList(ticketsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load moderator dashboard data', err);
      setError('Failed to sync moderation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await api.post(`/tickets/${ticketId}/reply`, { message: replyText });
      setSelectedTicket(res.data.data);
      setReplyText('');
      addToast('Reply sent to learner successfully', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to send reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleTicketStatus = async (ticketId, status) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status });
      setSelectedTicket(prev => prev ? { ...prev, status } : prev);
      addToast(`Ticket marked as ${status}`, 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to update ticket status', 'error');
    }
  };

  const handleResolveReport = async (reportId) => {
    setActionPendingId(reportId);
    try {
      await api.put(`/reports/${reportId}`, { status: 'resolved' });
      addToast('Report successfully marked as resolved', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to resolve report', 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleDismissReport = async (reportId) => {
    setActionPendingId(reportId);
    try {
      await api.put(`/reports/${reportId}`, { status: 'dismissed' });
      addToast('Report dismissed successfully', 'info');
      fetchData();
    } catch (err) {
      addToast('Failed to dismiss report', 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleWarnUser = async (reportedUserId, reason, reportId) => {
    setActionPendingId(reportId);
    try {
      await api.post(`/admin/warn/${reportedUserId}`, { reason: `Reported violation: ${reason}` });
      addToast('Official warning issued and notified to the reported user', 'success');
      
      // Auto-resolve report upon warning to clear the queue
      await api.put(`/reports/${reportId}`, { status: 'resolved' });
      fetchData();
    } catch (err) {
      addToast('Failed to warn user', 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleFlagAccount = async (reportedUserId, reportId) => {
    setActionPendingId(reportId);
    try {
      await api.patch(`/admin/flag/${reportedUserId}`);
      addToast('Reported account marked as flagged for high moderation oversight', 'success');
      
      // Auto-resolve
      await api.put(`/reports/${reportId}`, { status: 'resolved' });
      fetchData();
    } catch (err) {
      addToast('Failed to flag account', 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleRemoveSkill = async (reportedUserId, skill, reportId) => {
    if (!skill) {
      addToast('No associated skill topic found to remove.', 'warning');
      return;
    }
    setActionPendingId(reportId);
    try {
      await api.patch(`/admin/remove-skill/${reportedUserId}`, { skill });
      addToast(`Skill "${skill}" removed from the reported user profile`, 'success');
      
      // Auto-resolve
      await api.put(`/reports/${reportId}`, { status: 'resolved' });
      fetchData();
    } catch (err) {
      addToast('Failed to remove inappropriate skill content', 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const getFilteredReports = () => {
    let filtered = reportsList;
    
    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === activeFilter);
    }

    return filtered;
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto p-10 space-y-6">
      <Skeleton className="w-full h-40 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="w-full h-96 rounded-2xl" />
    </div>
  );

  if (error) return <div className="max-w-5xl mx-auto p-10"><ErrorState message={error} onRetry={fetchData} /></div>;

  return (
    <div className="min-h-screen bg-[#f4f7fe]/30 font-sans text-slate-800 pb-20 px-4 md:px-8 max-w-[1200px] mx-auto pt-8">
      {/* Welcome Banner */}
      <div className="bg-[#e91e45] rounded-2xl p-8 text-white shadow-sm mb-6 flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldAlert size={28} /> Moderator Dashboard
          </h1>
          <p className="text-white/90 font-medium text-sm">Ensuring quality, safety, and peer-to-peer trust across the platform</p>
        </div>
        <button 
          onClick={fetchData} 
          className="z-10 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
        >
          <Clock size={14} /> Refresh Queue
        </button>
      </div>

      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.pendingReports}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Reports</div>
              </div>
           </div>
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.resolvedToday}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resolved Today</div>
              </div>
           </div>
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-[#2b59ff]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.platformHealth}%</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Platform Health</div>
              </div>
           </div>
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-[#a033ff]" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.avgResponse}h</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Response Time</div>
              </div>
           </div>
        </div>

        {/* Reported Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
           <h2 className="text-sm font-bold text-slate-900 mb-4">Reported Sessions Queue</h2>
           <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
              {[
                { label: 'All Reports', value: 'all' },
                { label: 'No-Show', value: 'no-show' },
                { label: 'Spam', value: 'spam' },
                { label: 'Fake Skill', value: 'fake-skill' },
                { label: 'Harassment', value: 'harassment' },
                { label: 'Other', value: 'other' }
              ].map(filterBtn => (
                <button 
                  key={filterBtn.value}
                  onClick={() => setActiveFilter(filterBtn.value)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeFilter === filterBtn.value
                      ? 'bg-blue-50 text-[#2b59ff] border border-blue-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 border border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {filterBtn.label}
                </button>
              ))}
           </div>
           
           <div className="space-y-4">
              {getFilteredReports().length > 0 ? (
                getFilteredReports().map(report => {
                  const isPending = report.status === 'pending';
                  const isActionPending = actionPendingId === report._id;

                  return (
                    <div key={report._id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                       <div className="flex gap-2 mb-3 items-center flex-wrap">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            report.type === 'harassment' ? 'bg-red-50 text-red-500' :
                            report.type === 'spam' ? 'bg-orange-50 text-orange-500' :
                            report.type === 'fake-skill' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-violet-50 text-violet-600'
                          }`}>
                            {report.type}
                          </span>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            report.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {report.status}
                          </span>
                       </div>
                       
                       <h3 className="font-extrabold text-slate-800 text-sm mb-1">
                         Session ID: {report.sessionId?.sessionId || report.sessionId?._id || 'N/A'}
                         {report.sessionId?.topic && <span className="text-slate-400 font-medium ml-2">({report.sessionId.topic})</span>}
                       </h3>
                       
                       <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3 font-medium">
                          <span>Reporter: <strong className="text-slate-600">{report.reporterId?.name || 'Deleted User'}</strong></span>
                          <span>|</span>
                          <span>Reported: <strong className="text-slate-600">{report.reportedUserId?.name || 'Deleted User'}</strong></span>
                       </div>
                       
                       <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 italic">
                         "{report.reason}"
                       </p>
                       
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-5">
                          <Clock size={12} /> Reported on: {new Date(report.createdAt).toLocaleString()}
                       </div>
                       
                       {isPending && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                             <button 
                               onClick={() => handleWarnUser(report.reportedUserId?._id || report.reportedUserId?.id, report.reason, report._id)}
                               disabled={isActionPending}
                               className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-yellow-200 disabled:opacity-50"
                             >
                               Warn User
                             </button>
                             <button 
                               onClick={() => handleRemoveSkill(report.reportedUserId?._id || report.reportedUserId?.id, report.sessionId?.topic, report._id)}
                               disabled={isActionPending}
                               className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-orange-200 disabled:opacity-50"
                             >
                               Remove Skill
                             </button>
                             <button 
                               onClick={() => handleFlagAccount(report.reportedUserId?._id || report.reportedUserId?.id, report._id)}
                               disabled={isActionPending}
                               className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-200 disabled:opacity-50"
                             >
                               Flag Account
                             </button>
                             <button 
                               onClick={() => handleResolveReport(report._id)}
                               disabled={isActionPending}
                               className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                             >
                               <Check size={14} /> Resolve Report
                             </button>
                             <button 
                               onClick={() => handleDismissReport(report._id)}
                               disabled={isActionPending}
                               className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 disabled:opacity-50"
                             >
                               Dismiss
                             </button>
                          </div>
                       )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <CheckCircle size={32} className="text-emerald-500 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-800">Clear queue! No reports waiting.</p>
                  <p className="text-xs text-slate-400 mt-1">Excellent work keeping SkillXchange healthy and productive.</p>
                </div>
              )}
           </div>
        </div>

        {/* Support Tickets from Learners */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <LifeBuoy size={16} className="text-violet-500" /> Learner Support Tickets
            {ticketsList.filter(t => t.status === 'open').length > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-black rounded-full">
                {ticketsList.filter(t => t.status === 'open').length} Open
              </span>
            )}
          </h2>

          {ticketsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">No open support tickets.</p>
              <p className="text-xs text-slate-400 mt-1">All learner requests have been handled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Ticket list column */}
              <div className="lg:col-span-2 space-y-2">
                {ticketsList.map(ticket => (
                  <div
                    key={ticket._id}
                    onClick={() => { setSelectedTicket(ticket); setReplyText(''); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTicket?._id === ticket._id
                        ? 'border-violet-400 bg-violet-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                        ticket.category === 'mentor_issue' ? 'bg-amber-50 text-amber-600' :
                        ticket.category === 'technical' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>{ticket.category?.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                        ticket.status === 'open' ? 'bg-violet-50 text-violet-600' :
                        ticket.status === 'in-progress' ? 'bg-orange-50 text-orange-500' :
                        ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>{ticket.status}</span>
                      {ticket.priority === 'high' || ticket.priority === 'critical' ? (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-red-50 text-red-500">{ticket.priority}</span>
                      ) : null}
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{ticket.subject}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">From: {ticket.userId?.name || 'Learner'}</p>
                  </div>
                ))}
              </div>

              {/* Ticket detail column */}
              <div className="lg:col-span-3">
                {selectedTicket ? (
                  <div className="border border-slate-200 rounded-xl p-5 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{selectedTicket.subject}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Ticket #{selectedTicket._id?.slice(-8).toUpperCase()} · from {selectedTicket.userId?.name}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTicketStatus(selectedTicket._id, 'resolved')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition-all"
                        >Resolve</button>
                        <button
                          onClick={() => handleTicketStatus(selectedTicket._id, 'closed')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 transition-all"
                        >Close</button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{selectedTicket.description}</p>
                    </div>

                    {selectedTicket.replies?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversation</p>
                        {selectedTicket.replies.map((r, i) => (
                          <div key={i} className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
                            <p className="text-[10px] font-bold text-violet-600 mb-1">Moderator</p>
                            <p className="text-xs text-slate-700">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto">
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleTicketReply(selectedTicket._id)}
                        placeholder="Type your reply to the learner..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-400 transition-all"
                      />
                      <button
                        onClick={() => handleTicketReply(selectedTicket._id)}
                        disabled={isReplying || !replyText.trim()}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Send size={12} /> {isReplying ? '...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <LifeBuoy size={28} className="text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Select a ticket to view details and reply</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rating Disputes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
           <h2 className="text-sm font-bold text-slate-900 mb-6">Rating Disputes Queue</h2>
           <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={32} className="text-slate-300 mb-3" />
              <p className="text-xs font-semibold text-slate-400">No active rating disputes found</p>
           </div>
        </div>

        {/* Session Quality Analytics */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
           <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
             <TrendingUp size={16} className="text-[#2b59ff]" /> Session Quality Analytics
           </h2>
           <div className="flex items-center justify-around mb-8 border-b border-slate-100 pb-8">
              <div className="text-center">
                 <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="text-3xl font-bold text-emerald-500">4.8</div>
                    <Star size={24} className="text-amber-400" fill="currentColor" />
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Average Session Rating</div>
              </div>
              <div className="text-center">
                 <div className="text-3xl font-bold text-[#2b59ff] mb-1">96%</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Mentor Attendance Rate</div>
              </div>
              <div className="text-center">
                 <div className="text-3xl font-bold text-[#a033ff] mb-1">4.2%</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase">AI Substitute Rate</div>
              </div>
           </div>

           <div>
              <h3 className="text-xs font-bold text-slate-900 mb-4">Quality & Escalation Trends</h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                    <span>Session completion rate</span>
                    <span className="font-bold">↑ 5.2% this week</span>
                 </div>
                 <div className="flex items-center justify-between text-xs p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <span>Average mentor rating</span>
                    <span className="font-bold">Stable at 4.8 ⭐</span>
                 </div>
                 <div className="flex items-center justify-between text-xs p-3 bg-yellow-50 text-yellow-700 rounded-lg">
                    <span>Report frequency index</span>
                    <span className="font-bold">↓ 1.8% this week</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
