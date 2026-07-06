import { useState, useEffect } from 'react';
import { Search, Filter, Star, Calendar, Sparkles, Award, CheckCircle, Clock, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function SkillMatchingPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSkill, setFilterSkill] = useState('');
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('match'); // match, rating, name

  useEffect(() => {
    fetchMentors();
  }, []);

  const calculateMatchScore = (mentor) => {
    return mentor.matchPercentage || 50;
  };

  const fetchMentors = async () => {
    try {
      const res = await api.get('/users/mentors');
      if (res.data.success) {
        const currentUserId = user?.id || user?._id?.toString();
        const mentorsWithScores = res.data.data
          .filter(m => {
            const mentorId = m.id || m._id?.toString();
            return mentorId !== currentUserId;
          })
          .map(m => ({
            ...m,
            matchScore: calculateMatchScore(m),
            reviews: m.totalSessions || 0,
            rating: m.averageRating || '0.0',
            skillsTeach: m.skillsTeach || []
          }))
          .sort((a, b) => b.matchScore - a.matchScore);

        
        setMentors(mentorsWithScores);
      }
    } catch (err) {
      console.error('Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique skills for filter dropdown
  const allSkills = [...new Set(mentors.flatMap(m => m.skillsTeach || []))];

  const filteredMentors = mentors
    .filter(m => {
      const name = m.name || '';
      const skills = m.skillsTeach || [];
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSkill = !filterSkill || skills.some(s => s.toLowerCase() === filterSkill.toLowerCase());
      const matchesRating = parseFloat(m.rating) >= filterMinRating;
      return matchesSearch && matchesSkill && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.rating) - parseFloat(a.rating);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.matchScore - a.matchScore;
    });

  const handleBookSession = (mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
    setBookingStep(1);
  };

  const confirmBooking = async () => {
    try {
      // Convert 12-hour time (e.g. "02:00 PM") to 24-hour (e.g. "14:00")
      const convertTo24h = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}:00`;
      };

      const topicSkill = selectedMentor.skillsTeach?.[0] || 'General Mentorship';
      const scheduledTime = new Date(`${selectedDate}T${convertTo24h(selectedTime)}`);

      if (isNaN(scheduledTime.getTime())) {
        addToast('Invalid date or time selected. Please try again.', 'error');
        return;
      }

      await api.post('/sessions', {
        mentorId: selectedMentor._id,
        topic: `Learning ${topicSkill}`,
        scheduledTime
      });
      setBookingStep(3);
      addToast('Session booked successfully!', 'success');
    } catch (err) {
      console.error('Booking error:', err.response?.data || err.message);
      addToast(err.response?.data?.message || 'Failed to book session', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Sparkles className="text-violet-600" size={48} />
      </motion.div>
      <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-xs">Finding matches...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 font-sans">
      
      {/* Search Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-2xl p-8 text-white relative overflow-hidden shadow-sm"
      >
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Find Your Perfect Mentor</h1>
          <p className="text-violet-100 text-sm font-medium">AI-powered matching to connect you with the best mentors</p>
        </div>
      </motion.div>

      {/* Filter Section */}
      <div className="card p-6 bg-white space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Filter size={18} />
          <h2 className="text-sm font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Skill</label>
            <select 
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-colors"
            >
              <option value="">All Skills</option>
              {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Availability</label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-colors">
              <option>Any Time</option>
              <option>Weekdays</option>
              <option>Weekends</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">Minimum Rating</label>
            <select 
              value={filterMinRating}
              onChange={(e) => setFilterMinRating(Number(e.target.value))}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-colors"
            >
              <option value="0">Any Rating</option>
              <option value="4">4.0 & above</option>
              <option value="4.5">4.5 & above</option>
            </select>
          </div>
        </div>

        <div className="relative group pt-2">
          <Search className="absolute left-3 top-[calc(50%+4px)] -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or skill..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-bold text-slate-900">{filteredMentors.length} mentors found {filterSkill && `for ${filterSkill}`}</p>
        <div className="flex items-center gap-1.5 text-[#a033ff]">
          <Sparkles size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">AI sorted by best match</span>
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredMentors.map((mentor, idx) => (
            <motion.div
              key={mentor._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`card p-6 relative flex flex-col group transition-all duration-300 ${mentor.matchScore > 85 ? 'border-[#a033ff] shadow-[0_0_15px_rgba(160,51,255,0.05)] ring-1 ring-[#a033ff]/10' : 'border-slate-200'}`}
            >
              {mentor.matchScore > 85 && (
                <div className="flex items-center gap-1.5 text-[#a033ff] mb-4">
                  <Sparkles size={14} />
                  <span className="text-xs font-semibold">Best Match</span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <img src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 object-cover" alt="" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 leading-tight">{mentor.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    <span className="text-xs font-medium text-slate-700">{mentor.rating}</span>
                    <span className="text-xs text-slate-400 ml-1">({mentor.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-500">Match Score</span>
                  <span className="text-xs font-semibold text-[#2b59ff]">{mentor.matchScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${mentor.matchScore}%` }}
                    className="h-full bg-gradient-to-r from-[#2b59ff] to-[#a033ff] rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Teaches:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.skillsTeach?.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100/50">
                  <p className="text-xs font-medium text-purple-700 text-center">
                    Verified {mentor.skillsTeach?.[0] || 'Expert'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button 
                  onClick={() => handleBookSession(mentor)}
                  className="w-full py-2.5 bg-[#2b59ff] text-white rounded-lg text-sm font-bold hover:bg-[#1e40ff] transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Request Session
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>

              <div className="p-8">
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Book with {selectedMentor?.name}</h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">Select a preferred date and time slot.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Date</label>
                        <input 
                          type="date" 
                          className="w-full p-2.5 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm transition-colors"
                          onChange={(e) => setSelectedDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-500">Time Slots</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'].map(time => (
                            <button 
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-2 rounded-lg text-sm font-medium border transition-colors ${selectedTime === time ? 'bg-violet-50 border-violet-600 text-violet-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setBookingStep(2)}
                      disabled={!selectedDate || !selectedTime}
                      className="w-full py-2.5 bg-[#2b59ff] text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors hover:bg-[#1e40ff] mt-2"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} className="text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Confirm Booking</h2>
                      <p className="text-xs text-slate-500 font-medium mt-2">
                        You're requesting a session for <span className="font-bold text-slate-900">{selectedDate}</span> at <span className="font-bold text-slate-900">{selectedTime}</span>.
                      </p>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setBookingStep(1)}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button 
                        onClick={confirmBooking}
                        className="flex-1 py-2.5 bg-[#2b59ff] text-white rounded-lg text-sm font-bold hover:bg-[#1e40ff]"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Request Sent!</h2>
                    <p className="text-sm text-slate-500">Your session request has been sent to {selectedMentor.name}.</p>
                    <button 
                      onClick={() => setShowBookingModal(false)}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium mt-4 hover:bg-slate-800"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
