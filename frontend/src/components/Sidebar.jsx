import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, BookOpen, Users, BrainCircuit, Calendar, MessageSquare, TrendingUp, Settings, User, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar({ onSupportClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, setActiveRole } = useAuth();

  const getNavItems = () => {
    const roles = {
      mentor: [
        { name: 'Dashboard', path: '/mentor-dashboard', icon: Home },
        { name: 'My Schedule', path: '/sessions', icon: Calendar },
        { name: 'Incoming Requests', path: '/requests', icon: MessageSquare },
        { name: 'Mentorship Analytics', path: '/analytics', icon: TrendingUp },
      ],
      learner: [
        { name: 'Dashboard', path: '/learner-dashboard', icon: Home },
        { name: 'My Sessions', path: '/sessions', icon: Calendar },
        { name: 'Find Mentors', path: '/match', icon: Search },
        { name: 'Learning Paths', path: '/learning-path', icon: BookOpen },
        { name: 'AI Learning Hub', path: '/ai-tutor', icon: BrainCircuit },
      ],
      admin: [{ name: 'Overview', path: '/admin-dashboard', icon: Home }],
      moderator: [{ name: 'Resolution', path: '/moderator-dashboard', icon: Home }]
    };
    
    return roles[activeRole] || roles.learner;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between hidden md:flex h-[calc(100vh-64px)] shrink-0 z-40 fixed left-0 top-16">
      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            // A more relaxed active check because we might be on /ai-summaries which falls under AI Learning Hub conceptually, etc.
            // But simple match is fine for now
            const isActive = location.pathname.includes(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm group",
                  isActive 
                    ? "bg-[#2b59ff] text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={18} className={clsx(
                  "transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 group"
        >
          <User size={18} className="text-slate-400 group-hover:text-slate-600" />
          <span>Profile</span>
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 group"
        >
          <Settings size={18} className="text-slate-400 group-hover:text-slate-600" />
          <span>Settings</span>
        </Link>
        <button
          onClick={onSupportClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 group text-left"
        >
          <LifeBuoy size={18} className="text-slate-400 group-hover:text-slate-600" />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
}
