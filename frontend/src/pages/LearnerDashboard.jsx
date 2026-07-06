import { useState, useEffect } from 'react';
import { Calendar, Video, FileText, MessageSquare, Map, Play, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import ErrorState from '../components/ErrorState';

export default function LearnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ stats: {}, upcomingSessions: [], recentSessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/sessions/stats');
      setData(res.data.data || {});
    } catch (err) {
      setError('Failed to sync dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return 'TBD';
    return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#2b59ff]" size={32} />
      <p className="text-sm font-semibold text-slate-500">Loading your dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto p-10">
      <ErrorState message={error} onRetry={fetchDashboardData} />
    </div>
  );

  const { stats = {}, upcomingSessions = [], recentSessions = [] } = data;
  const acceptedSessions = upcomingSessions.filter(s => s.status === 'accepted');
  const pendingSessions = upcomingSessions.filter(s => s.status === 'requested');

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-slate-800 pb-20 px-4 md:px-8 max-w-[1200px] mx-auto pt-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-white/80 font-medium text-sm">Ready to continue your learning journey?</p>
          </div>
          <button onClick={fetchDashboardData} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Sessions', value: stats.totalSessions || 0, color: 'text-[#2b59ff]', bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completedSessions || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Upcoming', value: stats.upcomingCount || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'XP Earned', value: stats.xp || 0, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs font-semibold text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Sessions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming / Accepted Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#a033ff]" /> Upcoming Sessions
            </h2>

            {upcomingSessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <Calendar size={36} className="text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400 mb-2">No upcoming sessions</p>
                <Link to="/match" className="text-sm font-bold text-[#2b59ff] hover:underline">Find a mentor →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Accepted sessions — with Join button */}
                {acceptedSessions.map(session => (
                  <div key={session._id} className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{session.topic}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          with <span className="font-semibold">{session.mentorId?.name || 'Mentor'}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Accepted</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                      <Clock size={12} /> {formatDateTime(session.scheduledTime)}
                    </p>
                    <button
                      onClick={() => navigate(`/live/${session._id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-[#2b59ff] hover:bg-[#1e40ff] text-white text-xs font-bold py-2 rounded-lg transition-colors"
                    >
                      <Play size={12} fill="currentColor" /> Join Session
                    </button>
                  </div>
                ))}

                {/* Pending sessions */}
                {pendingSessions.map(session => (
                  <div key={session._id} className="border border-amber-100 bg-amber-50/40 rounded-xl p-4">
                    <p className="font-bold text-slate-900 text-sm truncate">{session.topic}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      with <span className="font-semibold">{session.mentorId?.name || 'Mentor'}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {formatDateTime(session.scheduledTime)}
                    </p>
                    <span className="text-[10px] font-semibold text-amber-600 mt-2 inline-block">⏳ Awaiting mentor approval</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Video size={16} className="text-[#2b59ff]" /> Recent Sessions
            </h2>

            {recentSessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <Video size={36} className="text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">No completed sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => navigate(`/ai-summaries?sessionId=${session._id}&topic=${encodeURIComponent(session.topic)}`)}
                    className="border border-slate-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-[#2b59ff]/20 hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Video size={16} className="text-[#2b59ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate">{session.topic}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(session.scheduledTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                    }`}>
                      {session.status === 'completed' ? '✓ Done' : 'AI Sub'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Learning Tools */}
        <div className="bg-[#f3f0ff] rounded-2xl p-6 border border-[#e5dfff]">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-[#a033ff]">✦</span> AI Learning Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/ai-summaries" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <FileText className="text-[#2b59ff] mb-3 group-hover:scale-110 transition-transform" size={22} />
              <h3 className="font-bold text-slate-900 text-sm mb-1">AI Session Summary</h3>
              <p className="text-xs text-slate-500">Generate summaries and notes from sessions.</p>
            </Link>
            <Link to="/ai-tutor" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <MessageSquare className="text-[#a033ff] mb-3 group-hover:scale-110 transition-transform" size={22} />
              <h3 className="font-bold text-slate-900 text-sm mb-1">AI Doubt Solver</h3>
              <p className="text-xs text-slate-500">Ask questions and get instant answers.</p>
            </Link>
            <Link to="/learning-path" className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <Map className="text-[#2b59ff] mb-3 group-hover:scale-110 transition-transform" size={22} />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Learning Path</h3>
              <p className="text-xs text-slate-500">Personalized roadmap to master skills.</p>
            </Link>
          </div>
        </div>

        {/* Recommended Mentors */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#a033ff]">✨</span> AI Recommended Mentors
          </h2>
          <Link to="/match" className="text-sm font-semibold text-[#2b59ff] hover:underline">View All →</Link>
        </div>
      </div>
    </div>
  );
}
