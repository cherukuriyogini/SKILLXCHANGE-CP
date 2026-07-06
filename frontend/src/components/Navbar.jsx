import { useAuth } from '../context/AuthContext';
import { User, LogOut, GraduationCap, Sparkles, LayoutDashboard, Search, Users, FileText, Settings, Bell, Zap, Shield, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import socket from '../lib/socket';
import api from '../lib/api';

export default function Navbar() {
  const { user, logout, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => {
        if(res.data.success) setNotifications(res.data.data);
      }).catch(console.error);

      if (!socket.connected) socket.connect();
      socket.emit('identify', user.id);

      const handleNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
      };

      socket.on('notification', handleNotification);
      return () => socket.off('notification', handleNotification);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-50 shrink-0 sticky top-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      
      {/* Brand */}
      <Link to="/home" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/40 group-hover:scale-105 transition-all">
          <GraduationCap size={22} className="group-hover:rotate-6 transition-transform" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900 tracking-tight leading-none">SkillXchange</span>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Enterprise</span>
        </div>
      </Link>
      
      {/* Context Indicator */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/50">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Space</span>
         <div className="w-1 h-1 bg-slate-300 rounded-full" />
         <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{activeRole}</span>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-5">
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative group"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-2 ring-rose-100" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-[100]"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notification Hub</h3>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-medium italic">No new activity</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id} 
                        className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-indigo-50/30 transition-all ${!n.isRead ? 'bg-indigo-50/20' : ''}`}
                      >
                        <p className="text-xs font-bold text-slate-900 mb-1">{n.title}</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 pl-5 border-l border-slate-200/60">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 tracking-tight">{user?.name}</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{user?.roles?.[0]} Status</span>
          </div>
          
          <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
            <img 
              src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5008/api'}/..${user.avatar}`) : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name}`} 
              className="w-10 h-10 rounded-xl border-2 border-white shadow-md group-hover:scale-105 transition-transform object-cover"
              alt={user?.name}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <button 
            onClick={logout} 
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
