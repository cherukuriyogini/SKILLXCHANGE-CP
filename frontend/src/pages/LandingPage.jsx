import { Link } from 'react-router-dom';
import { 
  Users, BrainCircuit, ShieldCheck, ArrowRight, 
  BookOpen, Video, FileText, MessagesSquare, GraduationCap,
  Sparkles, CheckCircle, Search, PlayCircle, Star, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-slate-800 pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[#2b59ff]">
              <GraduationCap size={28} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">SkillXchange</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" state={{ isLogin: true }} className="text-sm font-bold text-[#2b59ff] hover:text-[#1e40ff] transition-colors">Login</Link>
            <Link to="/auth" state={{ isLogin: false }} className="bg-[#2b59ff] hover:bg-[#1e40ff] text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-sm">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto relative">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-4 tracking-tight text-slate-900"
        >
          SkillXchange
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#2b59ff] to-[#a033ff]"
        >
          Teach what you know. Learn what you don't.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-sm max-w-xl mx-auto mb-10 font-medium leading-relaxed"
        >
          A free peer-to-peer learning platform where students teach and learn from each other, 
          powered by AI assistance to ensure uninterrupted education.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/auth" state={{ isLogin: false }} className="bg-gradient-to-r from-[#a033ff] to-[#8b2bfe] hover:opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all text-sm shadow-md flex items-center gap-2">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <HowItWorksCard 
            icon={<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Search className="text-[#2b59ff]" size={20} /></div>}
            title="Choose a Skill"
            desc="Browse skills you want to learn and get matched with verified peer mentors"
          />
          <HowItWorksCard 
            icon={<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><Users className="text-[#a033ff]" size={20} /></div>}
            title="Learn Together"
            desc="Join live sessions, watch recordings, or learn with AI when mentors are busy"
          />
          <HowItWorksCard 
            icon={<div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><Star className="text-yellow-500 fill-yellow-500" size={20} /></div>}
            title="Share Knowledge"
            desc="Teach your own skills, earn badges, and build your reputation"
          />
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Features</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard 
            icon={<Users className="text-[#2b59ff]" size={24} />}
            title="Learn from Peers"
            desc="Connect with fellow students who excel in the skills you want to master"
          />
          <FeatureCard 
            icon={<BrainCircuit className="text-[#a033ff]" size={24} />}
            title="AI-Assisted Learning"
            desc="Get personalized learning paths, summaries, and instant doubt resolution"
          />
          <FeatureCard 
            icon={<Sparkles className="text-[#2b59ff]" size={24} />}
            title="AI Backup Tutor"
            desc="Never miss a learning opportunity. AI steps in when mentors are unavailable"
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-[#a033ff]" size={24} />}
            title="Verified Mentors"
            desc="Trust through ratings, verified badges, and active moderation"
          />
          <FeatureCard 
            icon={<Video className="text-[#2b59ff]" size={24} />}
            title="Live Sessions"
            desc="Real-time interactive sessions with screen sharing and Q&A"
          />
          <FeatureCard 
            icon={<BookOpen className="text-[#a033ff]" size={24} />}
            title="Recorded Content"
            desc="Access session recordings anytime for revision and review"
          />
          <FeatureCard 
            icon={<MessagesSquare className="text-[#2b59ff]" size={24} />}
            title="Peer Groups"
            desc="Join learning groups with shared interests and collaborative tasks"
          />
          <FeatureCard 
            icon={<GraduationCap className="text-[#a033ff]" size={24} />}
            title="100% Free"
            desc="No payments, no subscriptions - pure peer-to-peer knowledge exchange"
          />
        </div>
      </section>

      {/* Built on Trust Banner */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-12 text-center text-white shadow-lg relative overflow-hidden">
          <div className="flex justify-center mb-4">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Built on Trust</h2>
          <p className="text-white/90 text-sm max-w-xl mx-auto mb-8 font-medium">
            Our platform ensures quality through ratings, reviews, verified skill badges, and active moderation by our community team.
          </p>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold mb-1">
                4.8 <Star size={24} className="fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">10K+</div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Sessions Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">5K+</div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Active Learners</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">2K+</div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Verified Mentors</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Ready to Start Learning?</h2>
        <p className="text-slate-500 text-sm mb-8">Join thousands of students teaching and learning together</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/auth" className="bg-[#2b59ff] hover:bg-[#1e40ff] text-white font-bold py-2.5 px-8 rounded-full transition-colors text-sm shadow-sm">
            Sign Up Free
          </Link>
          <Link to="/auth" state={{ isLogin: true }} className="bg-white hover:bg-slate-50 text-[#2b59ff] border border-[#2b59ff] font-bold py-2.5 px-8 rounded-full transition-colors text-sm shadow-sm">
            Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 text-center text-slate-400 text-xs font-medium">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GraduationCap size={16} />
          <span className="font-bold text-white">SkillXchange</span>
        </div>
        <p>© 2026 SkillXchange. Capstone Project Prototype.</p>
      </footer>
    </div>
  );
}

function HowItWorksCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
      <div className="mb-6">{icon}</div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-xs font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-xs font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
