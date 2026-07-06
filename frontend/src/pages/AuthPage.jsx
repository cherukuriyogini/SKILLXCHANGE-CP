import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [signupSuccess, setSignupSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skillsTeach: '',
    skillsLearn: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        if (user.roles.includes('learner') && user.roles.includes('mentor')) {
          navigate('/role-selection');
        } else {
          navigate(`/${user.roles[0]}-dashboard`);
        }
      } else {
        const res = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roles: ['learner', 'mentor'], // Give both roles by default to simplify for the user based on screenshot
          bio: 'I love learning and teaching on SkillXchange!',
          skillsTeach: formData.skillsTeach ? formData.skillsTeach.split(',').map(s => s.trim()).filter(Boolean) : [],
          skillsLearn: formData.skillsLearn ? formData.skillsLearn.split(',').map(s => s.trim()).filter(Boolean) : []
        });

        if (res.success) {
          setSignupSuccess(true);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors?.[0]?.message || 
                  'Authentication failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex flex-col justify-center items-center py-12 px-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
          <p className="text-slate-500 mb-8 text-sm">
            Welcome to SkillXchange. Your account has been created successfully.
          </p>
          <button
            onClick={() => { setError(''); setIsLogin(true); setSignupSuccess(false); }}
            className="w-full py-3 bg-[#2b59ff] text-white rounded-xl font-bold hover:bg-[#1e40ff] transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col items-center pt-20 px-4 font-sans">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="text-[#2b59ff]" size={32} />
          <span className="text-2xl font-bold text-slate-900">SkillXchange</span>
        </div>
        <p className="text-sm text-slate-500">
          {isLogin ? 'Welcome back! Login to continue learning' : 'Join our community of learners and mentors'}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {isLogin ? 'Login' : 'Create Account'}
        </h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Skills I Can Teach</label>
                <input
                  name="skillsTeach"
                  type="text"
                  value={formData.skillsTeach}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all"
                  placeholder="Start typing a skill..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Skills I Want To Learn</label>
                <input
                  name="skillsLearn"
                  type="text"
                  value={formData.skillsLearn}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all"
                  placeholder="Start typing a skill..."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-[#2b59ff] hover:bg-[#1e40ff] text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? (
            <p>Don't have an account? <button onClick={() => setIsLogin(false)} className="text-[#2b59ff] font-bold hover:underline">Sign Up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setIsLogin(true)} className="text-[#2b59ff] font-bold hover:underline">Login</button></p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
