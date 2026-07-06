import { useState, useEffect } from 'react';
import { 
  Users, Send, Search, Plus, MessageSquare, Info, 
  Hash, Users2, Shield, Zap, ArrowRight, UserPlus,
  MoreVertical, Smile, Paperclip, RefreshCcw, Bell, X, Sparkles, BookOpen, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useRef } from 'react';

export default function PeerGroupsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', skill: '', level: 'beginner', maxMembers: 6 });
  const socketRef = useRef();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5008';
    socketRef.current = io(socketUrl);
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    
    socketRef.current.emit('join_group', selectedGroup._id);

    const handleNewMessage = (data) => {
      if (data.groupId === selectedGroup._id) {
        // Prevent duplicate if we sent it (optimistic update handles ours)
        if (data.userId?._id?.toString() !== user?.id) {
          setSelectedGroup(prev => ({
            ...prev,
            chatMessages: [...(prev.chatMessages || []), {
              message: data.message,
              userId: data.userId,
              timestamp: data.timestamp
            }]
          }));
        }
      }
    };

    socketRef.current.on('receive_group_message', handleNewMessage);

    return () => {
      socketRef.current.off('receive_group_message', handleNewMessage);
    };
  }, [selectedGroup, user.id]);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/peer-groups');
      const allGroups = res.data.data;
      setGroups(allGroups);

      // Default selection if already in a group
      const my = allGroups.filter(group =>
        group.members.some(m => (m.userId?._id?.toString() || m.userId?.toString()) === user?.id)
      );

      if (my.length > 0 && !selectedGroup) {
        setSelectedGroup(my[0]);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const myGroups = groups.filter(group =>
    group.members.some(m => (m.userId?._id?.toString() || m.userId?.toString()) === user?.id)
  );

  const discoverGroups = groups.filter(group =>
    !group.members.some(m => (m.userId?._id?.toString() || m.userId?.toString()) === user?.id)
  );

  const filteredDiscover = discoverGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      const optimisticMsg = {
        message: newMessage,
        userId: { _id: user.id, name: user.name, avatar: user.avatar },
        timestamp: new Date()
      };
      
      setSelectedGroup(prev => ({
        ...prev,
        chatMessages: [...(prev.chatMessages || []), optimisticMsg]
      }));
      setNewMessage('');

      // Emit socket event
      socketRef.current.emit('send_group_message', {
        groupId: selectedGroup._id,
        message: newMessage,
        userId: { _id: user.id, name: user.name, avatar: user.avatar },
        timestamp: new Date()
      });

      await api.post(`/peer-groups/${selectedGroup._id}/messages`, {
        message: newMessage
      });
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/peer-groups/${groupId}/join`);
      addToast('Joined group successfully!', 'success');
      await fetchGroups();
      setActiveTab('my-groups');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join group', 'error');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim() || !newGroup.skill.trim()) {
      addToast('Group name and skill are required', 'error');
      return;
    }
    try {
      setCreating(true);
      await api.post('/peer-groups', newGroup);
      addToast('Group created successfully!', 'success');
      setShowCreateModal(false);
      setNewGroup({ name: '', skill: '', level: 'beginner', maxMembers: 6 });
      await fetchGroups();
      setActiveTab('my-groups');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCcw className="text-violet-600" size={40} />
        </motion.div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-6">Syncing Communities</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 font-sans">
      
      {/* Peer Learning Groups Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white relative overflow-hidden shadow-sm"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Users size={24} />
            <h1 className="text-2xl font-bold">Peer Learning Groups</h1>
          </div>
          <p className="text-white/80 text-sm font-medium">Collaborate with fellow learners on shared goals</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: My Groups */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6 bg-white border-none shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800">My Groups</h2>
            
            <div className="space-y-3">
              {(myGroups.length > 0 ? myGroups : [
                { _id: '1', name: 'Python Beginners', skill: 'Python', members: [1,2,3,4,5], hasNotification: true },
                { _id: '2', name: 'ML Enthusiasts', skill: 'Machine Learning', members: [1,2,3,4] }
              ]).map((group) => (
                <button
                  key={group._id}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full p-4 rounded-xl text-left border transition-all relative group ${
                    selectedGroup?._id === group._id 
                      ? 'border-violet-500 bg-white ring-1 ring-violet-500/10' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{group.name}</p>
                      {group.hasNotification && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{group.skill}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Users size={10} className="text-slate-300" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{group.members?.length || 0} members</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full py-3 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-md active:scale-95"
            >
              Join New Group
            </button>
          </div>
        </div>

        {/* Main Content: Group Workspace */}
        <div className="lg:col-span-9 space-y-6">
          {selectedGroup ? (
            <>
              {/* Group Header Card */}
              <div className="card p-6 bg-white border-none shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedGroup.name}</h2>
                  <p className="text-xs text-slate-400 font-medium">{selectedGroup.skill}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold shadow-sm">
                  <Users size={14} />
                  <span>{selectedGroup.members?.length || 0} members</span>
                </div>
              </div>

              {/* Shared Tasks */}
              <div className="card p-8 bg-white border-none shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-purple-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800">Shared Tasks</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Build a Calculator Program', due: '14/10/2026', progress: '35%', status: 'In Progress' },
                    { title: 'List Comprehension Exercises', due: '12/10/2026', progress: '100%', status: 'Completed' }
                  ].map((task, idx) => (
                    <div key={idx} className="p-5 border border-slate-50 rounded-2xl space-y-4 hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{task.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock size={10} className="text-slate-300" />
                            <p className="text-[9px] text-slate-400 font-medium tracking-wide">Due {task.due}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${task.status === 'Completed' ? 'bg-violet-600' : 'bg-violet-400 opacity-60'}`} style={{ width: task.progress }} />
                        </div>
                        <p className="text-right text-[9px] font-bold text-slate-400">{task.progress}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Chat */}
              <div className="card bg-white border-none shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                  <MessageSquare className="text-violet-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800">Group Chat</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                  {[
                    { name: 'Sarah Martinez', role: 'Mentor', time: '10:32 AM', msg: 'Hey everyone! Just uploaded the session summary from yesterday.' },
                    { name: 'Alex Chen', time: '10:37 AM', msg: 'Thanks Sarah! I found the decorators section really helpful.' },
                    { name: 'Michael Brown', time: '10:41 AM', msg: 'Does anyone have tips for the list comprehension task?' },
                    { name: 'Lisa Anderson', time: '11:02 AM', msg: 'I completed the task! Happy to help if anyone needs it.' }
                  ].map((msg, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0">{msg.name[0]}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{msg.name}</span>
                          {msg.role && <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-[9px] font-bold uppercase tracking-wider">{msg.role}</span>}
                          <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{msg.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-50 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-violet-500/50 transition-colors placeholder:text-slate-300"
                      placeholder="Type your message..."
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="w-12 h-12 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 shadow-md transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Group Summary Box */}
              <div className="bg-violet-50/50 rounded-2xl p-8 border border-violet-100 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={18} />
                  <h3 className="text-xs font-bold text-slate-900">AI Group Session Summary</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Last week, your group covered list comprehensions and completed 4/8 practice tasks. Keep up the great collaboration!
                </p>
                <button className="px-6 py-2 bg-white text-violet-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-violet-100 hover:bg-violet-50 transition-colors shadow-sm">View Full Summary</button>
              </div>
            </>
          ) : (
            <div className="card p-16 text-center border border-slate-200 shadow-sm space-y-6 rounded-2xl">
              <div className="w-16 h-16 bg-violet-50 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                <Users2 size={32} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select a group</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Choose a community hub to start collaborating.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal logic preserved but not visualised in snippet */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-100 relative"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Initiate a Group</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} className="text-slate-500 hover:text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. React Masters Guild"
                  className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-colors text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Skill Focus *</label>
                <input
                  type="text"
                  value={newGroup.skill}
                  onChange={e => setNewGroup(prev => ({ ...prev, skill: e.target.value }))}
                  placeholder="e.g. React, Python, Machine Learning"
                  className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-colors text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Level</label>
                  <select
                    value={newGroup.level}
                    onChange={e => setNewGroup(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-[#2b59ff] transition-colors text-slate-800"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Max Members</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={newGroup.maxMembers}
                    onChange={e => setNewGroup(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-[#2b59ff] transition-colors text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary py-3 text-[11px] uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary py-3 text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {creating ? <RefreshCcw size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
