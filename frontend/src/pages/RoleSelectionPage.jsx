import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, GraduationCap, ArrowRight, Sparkles, Star, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleSelectionPage() {
  const { user, setActiveRole } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setActiveRole(role);
    navigate(`/${role}-dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-slate-800 pb-20 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-[#2b59ff] rounded-2xl flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={32} />
          </div>
          <span className="text-3xl font-black tracking-tighter text-slate-900">SkillXchange</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Welcome back, <span className="text-[#2b59ff]">{user?.name?.split(' ')[0]}</span></h1>
        <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto">Select your workspace for today to continue your learning journey.</p>
      </motion.div>

      <div className="grid gap-6 max-w-3xl w-full md:grid-cols-2">
        {user?.roles?.includes('learner') && (
          <RoleCard 
            icon={<BookOpen size={28} className="text-[#2b59ff]" />}
            title="Learner"
            description="Explore skills, use AI tutors, and track your learning progress."
            features={['Peer Mentorship', 'AI Learning Paths', 'Doubt Solver']}
            color="blue"
            onClick={() => handleSelectRole('learner')}
          />
        )}

        {user?.roles?.includes('mentor') && (
          <RoleCard 
            icon={<Users size={28} className="text-[#a033ff]" />}
            title="Mentor"
            description="Share your expertise, host sessions, and build your reputation."
            features={['Session Management', 'Reputation Score', 'Teaching History']}
            color="purple"
            onClick={() => handleSelectRole('mentor')}
          />
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200">
          <Sparkles size={14} className="text-amber-500" />
          {user?.roles?.length > 1 ? `${user.roles.length} Roles Active` : 'Standard Membership'}
        </div>
      </motion.div>
    </div>
  );
}

function RoleCard({ icon, title, description, features, color, onClick }) {
  const isBlue = color === 'blue';
  
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={`bg-white rounded-2xl p-10 transition-shadow duration-300 cursor-pointer flex flex-col group relative overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:border-${isBlue ? '[#2b59ff]' : '[#a033ff]'}`}
      onClick={onClick}
    >
      <div className={`mb-8 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 ${isBlue ? 'bg-blue-50' : 'bg-purple-50'}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">
        {description}
      </p>
      
      <div className="space-y-3 mb-10">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <div className={`w-2 h-2 rounded-full shadow-sm ${isBlue ? 'bg-[#2b59ff]' : 'bg-[#a033ff]'}`} />
            {f}
          </div>
        ))}
      </div>

      <div className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-white ${isBlue ? 'bg-[#2b59ff] hover:bg-[#1e40ff]' : 'bg-[#a033ff] hover:bg-[#8022cc]'}`}>
        <span>Enter {title} Workspace</span>
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
