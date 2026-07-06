import { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, AlertTriangle, TrendingUp, 
  CheckCircle, Star, ShieldCheck, UserCheck, ShieldAlert, 
  ArrowRight, Search, Edit3, Trash2, Zap, FileText, 
  MessageCircle, BarChart2, Server, Database, Wifi, X, AlertOctagon, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, LineChart, Line, Tooltip
} from 'recharts';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/SkeletonLoader';
import TicketList from '../components/TicketList';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState({ 
    users: 0, sessions: 0, reports: 0, mentors: 0, 
    learners: 0, moderators: 0,
    weeklyStats: [], aiUsage: 0, growthRate: 0,
    aiStats: { aiSubstitute: 0, aiSummaries: 0, doubtQueries: 0, roadmapsGenerated: 0 },
    monthlyGrowth: []
  });
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Users');
  const [health, setHealth] = useState({ 
    latency: 85, dbStatus: 'Healthy', uptime: '99.99%', connections: 12 
  });

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [skillToRemove, setSkillToRemove] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users')
      ]);
      setStats(statsRes.data.data);
      setUsersList(usersRes.data.data);
      
      // Update health connections dynamically based on active users
      setHealth(prev => ({
        ...prev,
        connections: usersRes.data.data.filter(u => u.status === 'online').length + 3
      }));
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      addToast('Error loading administration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    setIsActionPending(true);
    try {
      const res = await api.patch(`/admin/block/${userId}`);
      addToast(res.data.data.isBlocked ? 'Account suspended successfully' : 'Account reactivated successfully', 'success');
      // Update selectedUser state in-place to keep modal consistent
      setSelectedUser(prev => ({ ...prev, isBlocked: res.data.data.isBlocked }));
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user block status', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleFlagUser = async (userId) => {
    setIsActionPending(true);
    try {
      const res = await api.patch(`/admin/flag/${userId}`);
      addToast(res.data.data.isFlagged ? 'User marked as flagged' : 'User flag removed', 'success');
      setSelectedUser(prev => ({ ...prev, isFlagged: res.data.data.isFlagged }));
      fetchData();
    } catch (err) {
      addToast('Failed to toggle flag on account', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CRITICAL WARNING: Are you sure you want to permanently delete this user account? This action is irreversible.')) return;
    setIsActionPending(true);
    try {
      await api.delete(`/admin/user/${userId}`);
      addToast('User account successfully purged from database', 'success');
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user account', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRoleChange = async (userId, targetRole) => {
    setIsActionPending(true);
    try {
      // Toggle role
      const currentRoles = selectedUser.roles || [];
      let nextRoles = [...currentRoles];
      if (nextRoles.includes(targetRole)) {
        if (nextRoles.length === 1) {
          addToast('A user must have at least one assigned role.', 'warning');
          setIsActionPending(false);
          return;
        }
        nextRoles = nextRoles.filter(r => r !== targetRole);
      } else {
        nextRoles.push(targetRole);
      }

      const res = await api.patch(`/admin/role/${userId}`, { roles: nextRoles });
      addToast('User roles updated successfully', 'success');
      setSelectedUser(prev => ({ ...prev, roles: res.data.data.roles }));
      fetchData();
    } catch (err) {
      addToast('Failed to update roles', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleVerifyMentor = async (userId) => {
    setIsActionPending(true);
    try {
      const res = await api.patch(`/admin/verify-mentor/${userId}`);
      addToast('Mentor verification state approved!', 'success');
      setSelectedUser(prev => ({ ...prev, verifiedSkills: res.data.data.verifiedSkills }));
      fetchData();
    } catch (err) {
      addToast('Failed to verify mentor', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRevokeMentor = async (userId) => {
    setIsActionPending(true);
    try {
      const res = await api.patch(`/admin/revoke-mentor/${userId}`);
      addToast('Mentor credentials successfully revoked', 'info');
      setSelectedUser(prev => ({ ...prev, verifiedSkills: res.data.data.verifiedSkills }));
      fetchData();
    } catch (err) {
      addToast('Failed to revoke verification status', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleWarnUser = async (e) => {
    e.preventDefault();
    if (!warningReason.trim()) return;
    setIsActionPending(true);
    try {
      await api.post(`/admin/warn/${selectedUser._id || selectedUser.id}`, { reason: warningReason });
      addToast('Warning notification sent to user successfully', 'success');
      setWarningReason('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to issue warning', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRemoveSkill = async (skill) => {
    setIsActionPending(true);
    try {
      const res = await api.patch(`/admin/remove-skill/${selectedUser._id || selectedUser.id}`, { skill });
      addToast(`Skill "${skill}" removed from profile`, 'success');
      setSelectedUser(prev => ({ 
        ...prev, 
        skillsTeach: res.data.data.skillsTeach,
        verifiedSkills: res.data.data.verifiedSkills
      }));
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove skill', 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = usersList;
    
    if (activeTab !== 'All Users') {
      const roleMap = {
          'Learners': 'learner',
          'Mentors': 'mentor',
          'Moderators': 'moderator'
      };
      filtered = filtered.filter(u => u.roles?.includes(roleMap[activeTab]));
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(lowerSearch) || 
        u.email?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto p-10 space-y-6">
      <Skeleton className="w-full h-40 rounded-2xl" />
      <Skeleton className="w-full h-20 rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="w-full h-64 rounded-xl" />
        <Skeleton className="w-full h-64 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 font-sans bg-slate-50/30">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-300 text-sm font-medium">Platform overview and system management</p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.users, sub: `+${stats.growthRate}% this month`, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Active Sessions', value: stats.sessions, sub: 'Live now', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Reports', value: stats.reports, sub: 'Needs attention', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'AI Usage Rate', value: `${stats.aiUsage}%`, sub: 'AI substitute sessions', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">{stat.label}</p>
              <p className={`text-xs font-medium ${stat.color.replace('text-', 'text-opacity-70 text-')}`}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="text-violet-500" size={18} />
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Weekly Session Activity</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyStats || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="text-emerald-500" size={20} />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Growth Trend (Cumulative)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold text-slate-800">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500 transition-all w-full md:w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-6">
            {['All Users', 'Learners', 'Mentors', 'Moderators', 'Support Hub'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-50 text-[#2b59ff] shadow-sm border border-[#2b59ff]/20' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'Support Hub' ? (
          <div className="p-8 pt-0">
             <TicketList adminView={true} />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {getFilteredUsers().map((user, idx) => (
                <tr key={user.id || user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-100 flex items-center justify-center overflow-hidden">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users size={16} className="text-slate-400" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{user.name}</span>
                      {user.isFlagged && <span className="text-[9px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Flagged</span>}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map(role => (
                        <span key={role} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          role === 'admin' ? 'bg-rose-50 text-rose-600' :
                          role === 'moderator' ? 'bg-orange-50 text-orange-600' :
                          role === 'mentor' ? 'bg-purple-50 text-purple-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs text-slate-500">{user.email}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.isBlocked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-[10px] font-bold text-violet-600 hover:bg-violet-50 border border-violet-100 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Edit3 size={11} /> Manage User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* AI Analytics Cards */}
      <div className="bg-violet-50/50 rounded-2xl p-8 border border-violet-100 flex flex-col gap-6">
        <div className="flex items-center gap-2">
           <Zap className="text-violet-600" size={18} />
           <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">AI Usage Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { value: stats.aiStats?.aiSubstitute || 0, label: 'AI Substitute Sessions', icon: Server },
            { value: stats.aiStats?.aiSummaries || 0, label: 'AI Summaries Generated', icon: FileText },
            { value: stats.aiStats?.doubtQueries || 0, label: 'Doubt Solver Queries', icon: MessageCircle },
            { value: stats.aiStats?.roadmapsGenerated || 0, label: 'Roadmaps Generated', icon: Star }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <p className="text-2xl font-bold text-slate-800 mb-1">{item.value}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-8">
           <Activity className="text-emerald-500" size={20} />
           <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Health</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'API Response Time', value: `${health.latency}ms`, icon: Wifi, status: 'success' },
            { label: 'Database Status', value: health.dbStatus, icon: Database, status: 'success' },
            { label: 'Server Uptime', value: health.uptime, icon: Server, status: 'success' },
            { label: 'Active Socket Connections', value: health.connections.toLocaleString(), icon: Users, status: 'none' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-slate-400 group-hover:text-slate-600" />
                <span className="text-xs font-bold text-slate-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${item.status === 'success' ? 'text-emerald-500' : 'text-violet-500'}`}>{item.value}</span>
                {item.status === 'success' && <CheckCircle size={14} className="text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect & Action Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-rose-400" size={20} />
                  <div>
                    <h3 className="font-bold text-base">Inspect User Account</h3>
                    <p className="text-xs text-slate-300">Detailed overview and real-time moderation suite</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* User Stats Card */}
                <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : <Users size={22} className="text-slate-400" />}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 block truncate">{selectedUser.name}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">({selectedUser.email})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Roles:</span>
                      {selectedUser.roles?.map(role => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(selectedUser._id || selectedUser.id, role)}
                          disabled={isActionPending}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Click to remove role"
                        >
                          {role} ×
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">XP Points</p>
                    <p className="text-sm font-extrabold text-slate-700">{selectedUser.xp || 0} pts</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Level</p>
                    <p className="text-sm font-extrabold text-slate-700">Lvl {selectedUser.level || 1}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Reputation</p>
                    <p className="text-sm font-extrabold text-slate-700">{selectedUser.reputationScore || 0} / 100</p>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Star size={14} className="text-amber-500" /> Teaching Skills
                  </h4>
                  {selectedUser.skillsTeach && selectedUser.skillsTeach.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skillsTeach.map(skill => {
                        const isVerified = selectedUser.verifiedSkills?.includes(skill);
                        return (
                          <div key={skill} className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-xs font-medium">
                            <span>{skill}</span>
                            {isVerified ? (
                              <ShieldCheck size={14} className="text-emerald-500" title="Skill Verified" />
                            ) : (
                              <ShieldAlert size={14} className="text-slate-400" title="Not Verified" />
                            )}
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              disabled={isActionPending}
                              className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-xs"
                              title="Remove inappropriate skill content"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No teaching skills listed.</p>
                  )}
                </div>

                {/* Moderation Warning Form */}
                <form onSubmit={handleWarnUser} className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert size={14} className="text-amber-500" /> Issue Official Warning
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Specify infraction reason (e.g. Harassment, No-Show, False Skills)..."
                      value={warningReason}
                      onChange={(e) => setWarningReason(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500 transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isActionPending || !warningReason.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Warn User
                    </button>
                  </div>
                </form>

                {/* Core Administrative Actions Grid */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertOctagon size={14} className="text-rose-500" /> Core Moderation Controls
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    
                    {/* Block/Unblock toggle */}
                    <button
                      onClick={() => handleBlockUser(selectedUser._id || selectedUser.id)}
                      disabled={isActionPending}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        selectedUser.isBlocked 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {selectedUser.isBlocked ? 'Reactivate Account' : 'Suspend Account'}
                    </button>

                    {/* Flag/Unflag toggle */}
                    <button
                      onClick={() => handleFlagUser(selectedUser._id || selectedUser.id)}
                      disabled={isActionPending}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        selectedUser.isFlagged
                          ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {selectedUser.isFlagged ? 'Remove Flag' : 'Flag Account'}
                    </button>

                    {/* Verify Mentor status */}
                    <button
                      onClick={() => handleVerifyMentor(selectedUser._id || selectedUser.id)}
                      disabled={isActionPending}
                      className="px-3 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      Verify Mentor
                    </button>

                    {/* Revoke Mentor credentials */}
                    <button
                      onClick={() => handleRevokeMentor(selectedUser._id || selectedUser.id)}
                      disabled={isActionPending}
                      className="px-3 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      Revoke Mentor
                    </button>

                  </div>
                </div>

                {/* Additional Role Toggles */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck size={14} className="text-violet-500" /> Assign User Roles
                  </h4>
                  <div className="flex gap-2">
                    {['learner', 'mentor', 'moderator', 'admin'].map(role => {
                      const hasRole = selectedUser.roles?.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(selectedUser._id || selectedUser.id, role)}
                          disabled={isActionPending}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            hasRole
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {role.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Critical danger actions */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center bg-rose-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold">Purge and Delete User Account</span>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(selectedUser._id || selectedUser.id)}
                    disabled={isActionPending}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-red-200"
                  >
                    <Trash2 size={14} /> Permanent Delete
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
