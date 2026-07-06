import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, ArrowRight, RefreshCcw, CheckCircle, Hourglass, XCircle, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import ReportModal from '../components/ReportModal';

const STATUS_CONFIG = {
  accepted: {
    label: 'Accepted — Join Now',
    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: <CheckCircle size={12} />,
    canJoin: true,
  },
  requested: {
    label: 'Pending Approval',
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <Hourglass size={12} />,
    canJoin: false,
  },
  completed: {
    label: 'Completed',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <CheckCircle size={12} />,
    canJoin: false,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-50 text-red-600 border border-red-200',
    icon: <XCircle size={12} />,
    canJoin: false,
  },
  'no-show': {
    label: 'No Show',
    classes: 'bg-slate-50 text-slate-500 border border-slate-200',
    icon: <XCircle size={12} />,
    canJoin: false,
  },
  'ai-substitute': {
    label: 'AI Substitute',
    classes: 'bg-violet-50 text-violet-700 border border-violet-200',
    icon: <Video size={12} />,
    canJoin: false,
  },
};

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalData, setReportModalData] = useState({ isOpen: false, sessionId: null, reportedUserId: null, reportedUserName: null });
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Correct endpoint — fetches all sessions for the logged-in user
      const res = await api.get('/sessions');
      setSessions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      addToast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    if (session.status === 'accepted') {
      navigate(`/live/${session._id}`);
    } else if (session.status === 'completed' || session.status === 'ai-substitute') {
      navigate(`/ai-summaries?sessionId=${session._id}&topic=${encodeURIComponent(session.topic)}`);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <RefreshCcw className="animate-spin text-violet-600" size={32} />
    </div>
  );

  const upcoming = sessions.filter(s => ['accepted', 'requested'].includes(s.status));
  const past = sessions.filter(s => !['accepted', 'requested'].includes(s.status));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Sessions</h1>
            <p className="text-white/80 text-sm mt-1">Manage your upcoming and past mentorship sessions</p>
          </div>
          <button
            onClick={fetchSessions}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Upcoming & Accepted Sessions */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">
          Upcoming Sessions ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Calendar size={40} className="mx-auto mb-4 text-slate-200" />
            <p className="font-semibold text-slate-400 text-sm">No upcoming sessions</p>
            <Link to="/match" className="text-[#2b59ff] text-sm font-bold hover:underline mt-2 inline-block">
              Find a mentor →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((session) => {
              const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.requested;
              const otherParty = session.mentorId?.name || session.learnerId?.name || 'Unknown';
              return (
                <div
                  key={session._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-6 group hover:border-[#2b59ff]/30 hover:shadow-md transition-all"
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    session.status === 'accepted' ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}>
                    <Video size={26} className={session.status === 'accepted' ? 'text-emerald-500' : 'text-amber-400'} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">{session.topic}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      with <span className="font-semibold text-slate-700">{otherParty}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-slate-400 text-xs font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(session.scheduledTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(session.scheduledTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {session.duration} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + Action */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.classes}`}>
                      {config.icon}
                      {config.label}
                    </span>

                    {session.status === 'accepted' && (
                      <button
                        onClick={() => handleSessionClick(session)}
                        className="flex items-center gap-2 bg-[#2b59ff] hover:bg-[#1e40ff] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-100"
                      >
                        <Play size={13} fill="currentColor" />
                        Join Session
                      </button>
                    )}

                    {session.status === 'requested' && (
                      <span className="text-[10px] text-slate-400 font-medium">Awaiting mentor approval</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">
            Past Sessions ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((session) => {
              const config = STATUS_CONFIG[session.status] || {};
              const otherPartyName = session.mentorId?.name || session.learnerId?.name || 'Unknown';
              
              // Figure out who the other person is for reporting purposes
              const currentUserId = user?.id || user?._id;
              const isLearner = session.learnerId?._id === currentUserId || session.learnerId === currentUserId;
              const reportedUserId = isLearner ? (session.mentorId?._id || session.mentorId) : (session.learnerId?._id || session.learnerId);
              const reportedUserName = isLearner ? session.mentorId?.name : session.learnerId?.name;
              
              const canViewSummary = ['completed', 'ai-substitute'].includes(session.status);
              return (
                <div
                  key={session._id}
                  onClick={() => canViewSummary && handleSessionClick(session)}
                  className={`bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-5 ${
                    canViewSummary ? 'cursor-pointer hover:border-[#2b59ff]/30 hover:shadow-sm transition-all group' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    <Video size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-700 text-sm truncate">{session.topic}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(session.scheduledTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · with {otherPartyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.classes || 'bg-slate-50 text-slate-500'}`}>
                      {config.icon}
                      {config.label || session.status}
                    </span>
                    {canViewSummary && (
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-[#2b59ff] transition-colors ml-2" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportModalData({
                          isOpen: true,
                          sessionId: session._id,
                          reportedUserId: reportedUserId,
                          reportedUserName: reportedUserName || otherPartyName
                        });
                      }}
                      className="ml-2 px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded text-[10px] font-bold uppercase transition-colors border border-transparent hover:border-red-100"
                    >
                      Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <ReportModal 
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ ...reportModalData, isOpen: false })}
        sessionId={reportModalData.sessionId}
        reportedUserId={reportModalData.reportedUserId}
        reportedUserName={reportModalData.reportedUserName}
      />
    </div>
  );
}
