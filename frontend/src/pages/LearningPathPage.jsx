import { useState, useEffect } from 'react';
import { Sparkles, Activity, CheckCircle, Circle, Lock, BookOpen, Terminal, Star, RefreshCcw, ChevronRight, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function LearningPathPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [manualSkill, setManualSkill] = useState('');

  useEffect(() => {
    fetchPath();
  }, []);

  const fetchPath = async () => {
    try {
      const res = await api.get('/learning-path');
      if (res.data.success && res.data.data.length > 0) {
        setPath(res.data.data[0]); // Get the most recent path
      }
    } catch (err) {
      console.error('Failed to fetch learning path');
    } finally {
      setLoading(false);
    }
  };

  const generatePath = async (skill) => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/learning-path-generator', { skill, currentLevel: 'beginner' });
      if (res.data.success) {
        setPath(res.data.data);
        addToast('AI Roadmap generated successfully!', 'success');
      }
    } catch (err) {
      addToast('AI engine is busy. Try again later.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <RefreshCcw className="text-violet-600" size={32} />
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 font-sans">
      
      {/* Learning Path Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white relative overflow-hidden shadow-sm"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles size={24} />
            <h1 className="text-2xl font-bold">AI Personalized Learning Path</h1>
          </div>
          <p className="text-white/80 text-sm font-medium mb-6">Your customized roadmap to master {path?.skill || 'Python'}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span>Overall Progress</span>
              <span>35%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '35%' }}
                className="bg-white h-full" 
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current Level Card */}
      <div className="card p-6 flex items-center justify-between border-none shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Current Level</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">You're making great progress!</p>
        </div>
        <span className="px-5 py-2 bg-blue-50 text-[#2b59ff] rounded-xl text-xs font-bold shadow-sm">Beginner</span>
      </div>

      {!path ? (
        <div className="card p-16 text-center border border-slate-200 shadow-sm space-y-6 rounded-2xl">
          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Target size={32} className="text-[#2b59ff]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">No active path found</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Generate a roadmap to start your learning journey.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {user?.skillsLearn?.map(skill => (
              <button 
                key={skill}
                onClick={() => generatePath(skill)}
                className="px-8 py-4 bg-[#2b59ff] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1e40ff] transition-all shadow-sm active:scale-95"
              >
                Generate {skill} Path
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Learning Roadmap */}
          <div className="card p-10 bg-white space-y-12">
            <h2 className="text-lg font-bold">Learning Roadmap</h2>
            
            <div className="space-y-16">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => {
                const stageMilestones = path.milestones.filter(m => m.title.includes(`[${level}]`));
                const completedInStage = stageMilestones.filter(m => m.isCompleted).length;
                const progress = stageMilestones.length > 0 ? (completedInStage / stageMilestones.length) * 100 : 0;
                const isLocked = level !== 'Beginner' && path.milestones.filter(m => m.title.includes('[Beginner]') && !m.isCompleted).length > 0;

                return (
                  <div key={level} className={`space-y-8 ${isLocked ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-[#2b59ff] text-white'}`}>
                        {isLocked ? <Lock size={20} /> : <Activity size={20} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-900">{level}</h3>
                        {!isLocked && (
                          <div className="flex items-center gap-4 mt-1">
                            <div className="w-48 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div className="h-full bg-[#2b59ff] transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{Math.round(progress)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pl-4">
                      {stageMilestones.map((item, idx) => {
                        const isActive = !item.isCompleted && (idx === 0 || stageMilestones[idx-1].isCompleted);
                        return (
                          <div key={item._id || idx} className={`p-5 rounded-2xl border flex items-center justify-between group transition-all ${isActive && !isLocked ? 'border-[#2b59ff]/30 bg-white shadow-sm ring-1 ring-[#2b59ff]/10' : item.isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-50 bg-slate-50 opacity-60'}`}>
                            <div className="flex items-center gap-4">
                              {item.isCompleted ? (
                                <CheckCircle className="text-emerald-500" size={18} />
                              ) : (isActive && !isLocked) ? (
                                <Circle className="text-violet-500 fill-violet-500" size={18} />
                              ) : (
                                <Circle className="text-slate-200" size={18} />
                              )}
                              <div>
                                <h4 className={`text-xs font-bold ${(isLocked || (!item.isCompleted && !isActive)) ? 'text-slate-400' : 'text-slate-900'}`}>
                                  {item.title.replace(`[${level}] `, '')}
                                </h4>
                              </div>
                            </div>
                            {item.isCompleted ? (
                              <button className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-200 transition-colors">Review</button>
                            ) : (isActive && !isLocked) ? (
                              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-violet-700 shadow-sm transition-colors">Continue</button>
                            ) : null}
                          </div>
                        );
                      })}
                      {stageMilestones.length === 0 && <p className="text-[10px] text-slate-400 italic">No topics assigned for this stage yet.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-purple-50 rounded-[2.5rem] p-10 border border-purple-100 space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900">AI Recommendations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-[#2b59ff]" size={16} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Topic</p>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Control Flow Basics</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">Continue your beginner journey with loops and conditionals.</p>
                <button className="w-full py-3 bg-[#2b59ff] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1e40ff] transition-all">Start Learning</button>
              </div>
              <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="text-[#a033ff]" size={16} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Section</p>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Review Data Types</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">AI suggests reviewing this topic to strengthen your foundation.</p>
                <button className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Start Practice</button>
              </div>
            </div>
          </div>

          {/* Recommended Mentors */}
          <div className="card p-10 bg-white space-y-8">
            <h2 className="text-lg font-bold">Recommended Mentors for Your Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Sarah Martinez', skill: 'Python', rating: '4.8', match: '98%' },
                { name: 'Emma Wilson', skill: 'Machine Learning', rating: '4.9', match: '82%' }
              ].map((mentor, idx) => (
                <div key={idx} className="p-6 border border-slate-100 rounded-2xl space-y-6 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{mentor.name}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{mentor.skill}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" fill="currentColor" />
                      <span className="text-[10px] font-bold">{mentor.rating}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-violet-600">
                      <span>Path Match</span>
                      <span>{mentor.match}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full bg-violet-600`} style={{ width: mentor.match }} />
                    </div>
                  </div>
                  <button className="w-full py-3 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 shadow-sm transition-all">Book Session</button>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Insights */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Progress Insights</h2>
            <div className="grid grid-cols-3 gap-4">
               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-2xl font-black text-[#2b59ff]">70%</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Beginner Level</p>
               </div>
               <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <p className="text-2xl font-black text-[#a033ff]">12</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Topics Completed</p>
               </div>
               <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-2xl font-black text-emerald-500">8</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sessions Attended</p>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
