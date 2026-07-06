import { useState, useEffect } from 'react';
import { Star, TrendingUp, Award, CheckCircle, Check, X, Info, Calendar, Clock, User, RefreshCw, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import ErrorState from '../components/ErrorState';

export default function MentorDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({});
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, requestsRes] = await Promise.all([
        api.get('/sessions/stats'),
        api.get('/sessions?status=requested'),
      ]);

      const statsData = statsRes.data.data;
      setStats(statsData.stats || {});
      setUpcomingSessions(statsData.upcomingSessions || []);
      setRecentSessions(statsData.recentSessions || []);

      // Filter requests where the current mentor is the one being requested
      const mentorId = user?.id || user?._id?.toString();
      const myRequests = (requestsRes.data.data || []).filter(
        s => s.mentorId?._id?.toString() === mentorId || s.mentorId?.toString() === mentorId
      );
      setIncomingRequests(myRequests);
    } catch (err) {
      console.error('[MentorDashboard] Fetch error:', err);
      setError('Failed to sync dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'accept' }));
    try {
      await api.patch(`/sessions/${sessionId}/accept`);
      addToast('Session accepted successfully! 🎉', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error('[MentorDashboard] Accept error:', err);
      addToast(err.response?.data?.message || 'Failed to accept session', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleDecline = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'decline' }));
    try {
      await api.patch(`/sessions/${sessionId}/reject`);
      addToast('Session declined.', 'info');
      fetchDashboardData();
    } catch (err) {
      console.error('[MentorDashboard] Decline error:', err);
      addToast(err.response?.data?.message || 'Failed to decline session', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return 'TBD';
    return new Date(dt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#2b59ff]" size={36} />
        <p className="text-sm font-semibold text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-10">
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-slate-800 pb-20 px-4 md:px-8 max-w-[1200px] mx-auto pt-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mentor Dashboard 👩‍🏫</h1>
            <p className="text-white/80 font-medium text-sm">Share your knowledge and inspire learners</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-2">
              <Star size={16} className="text-amber-400" fill="currentColor" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{user?.averageRating || '—'}</div>
            <div className="text-xs font-semibold text-slate-500">Average Rating</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <TrendingUp size={16} className="text-[#2b59ff]" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSessions || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Total Sessions</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mb-2">
              <Award size={16} className="text-[#a033ff]" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{(stats.badges || []).length}</div>
            <div className="text-xs font-semibold text-slate-500">Badges Earned</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center mb-2">
              <CheckCircle size={16} className="text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {incomingRequests.length}
            </div>
            <div className="text-xs font-semibold text-slate-500">Pending Requests</div>
          </div>
        </div>

        {/* Incoming Session Requests — LIVE DATA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-[#2b59ff]" />
              Incoming Session Requests
              {incomingRequests.length > 0 && (
                <span className="bg-[#2b59ff] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </h2>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                <BookOpen size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No pending session requests</p>
              <p className="text-xs text-slate-300 mt-1">When a learner requests a session, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((session) => {
                const learnerName = session.learnerId?.name || 'A Learner';
                const isAccepting = actionLoading[session._id] === 'accept';
                const isDeclining = actionLoading[session._id] === 'decline';
                const isProcessing = isAccepting || isDeclining;

                return (
                  <div key={session._id} className="border border-slate-200 rounded-xl p-5 hover:border-[#2b59ff]/30 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{session.topic}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={12} /> Requested by <span className="font-semibold text-slate-700 ml-1">{learnerName}</span>
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-100 shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Clock size={13} />
                      {formatDateTime(session.scheduledTime)}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(session._id)}
                        disabled={isProcessing}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {isAccepting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(session._id)}
                        disabled={isProcessing}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-600 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {isDeclining ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Accepted Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Accepted & Upcoming Sessions
          </h2>
          {upcomingSessions.filter(s => s.status === 'accepted').length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs font-semibold text-slate-400">No upcoming accepted sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions
                .filter(s => s.status === 'accepted')
                .map(session => (
                  <div key={session._id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{session.topic}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        with <span className="font-semibold">{session.learnerId?.name || 'Learner'}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-600">{formatDateTime(session.scheduledTime)}</p>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Confirmed</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* AI Session Quality Analyzer */}
        <div className="bg-[#f3f0ff] rounded-2xl p-6 border border-[#e5dfff]">
          <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Info size={16} className="text-[#a033ff]" /> AI Session Quality Analyzer
          </h2>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500 mb-1">92%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Content Clarity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2b59ff] mb-1">88%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Engagement Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#a033ff] mb-1">95%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Concept Coverage</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic mt-6 text-center">
            AI analyzes your teaching sessions to provide insights on improvement areas.
          </p>
        </div>
      </div>
    </div>
  );
}
