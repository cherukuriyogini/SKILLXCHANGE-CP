import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BrainCircuit, Sparkles, BookOpen, Code, Lightbulb, Send, CheckCircle, ArrowRight, MessageSquare, Plus, HelpCircle, ChevronRight, Zap, RefreshCcw, Layout, Settings, Paperclip, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AITutorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isSubstitute = searchParams.get('substitute') === 'true';
  const initialTopic = searchParams.get('topic') || 'Web Development';
  const sessionId = searchParams.get('sessionId');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isSubstitute 
        ? `Hello! I'm your AI Substitute Tutor. Since your mentor couldn't join, I'll be teaching you **${initialTopic}** today. I've prepared a structured lesson for you.`
        : `Hi! I'm your AI Doubt Solver. Ask me anything about ${initialTopic}, or let's explore some key concepts together!`,
      type: 'text'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lessonData, setLessonData] = useState(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(isSubstitute);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const hasFetched = useRef(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isSubstitute && !hasFetched.current) {
      hasFetched.current = true;
      fetchStructuredLesson();
    }
  }, [isSubstitute]);

  const fetchStructuredLesson = async () => {
    try {
      setIsLoadingLesson(true);
      const res = await api.post('/ai/tutor', { topic: initialTopic, sessionId });
      if (res.data.success && res.data.data) {
        setLessonData(res.data.data);
        const data = res.data.data;
        const formattedLesson = `
### ${data.topic}

**Explanation:**
${data.explanation}

**Step-by-step:**
${data.stepByStep?.map((s, i) => `${i+1}. ${s}`).join('\n') || 'N/A'}

**Examples:**
${data.examples?.map(e => `- ${e}`).join('\n') || 'N/A'}

Are you ready for a mini quiz?
        `;
        setMessages(prev => [...prev, { role: 'assistant', content: formattedLesson }]);
      }
    } catch (err) {
      addToast('AI service is busy, switching to basic mode.', 'warning');
      setMessages(prev => [...prev, { role: 'assistant', content: `I'm currently experiencing high demand. Please ask me a specific question about **${initialTopic}** and I'll do my best to help!` }]);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('question', messageText);
        formData.append('file', selectedFile);
        formData.append('context', isSubstitute ? `Current Topic: ${initialTopic}. This is an AI substitute session.` : `Topic: ${initialTopic}`);
        
        res = await api.post('/ai/doubt-solver', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSelectedFile(null);
      } else {
        res = await api.post('/ai/doubt-solver', { 
          question: messageText,
          context: isSubstitute ? `Current Topic: ${initialTopic}. This is an AI substitute session.` : `Topic: ${initialTopic}`
        });
      }

      if (res.data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.data.data.answer,
          type: 'text'
        }]);
      }
    } catch (err) {
      addToast('AI service is busy. Please try again.', 'error');
      setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I am experiencing a high volume of requests right now. Could you please wait a moment and try asking that again?',
          type: 'text'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      if (sessionId) {
        await api.patch(`/sessions/${sessionId}/complete`);
      }
      addToast('Session finalized! Redirecting to summary...', 'success');
      navigate(`/ai-summaries?gen=true${sessionId ? `&sessionId=${sessionId}` : ''}&topic=${initialTopic}`);
    } catch (err) {
      addToast('Failed to finalize session', 'error');
    }
  };

  if (isLoadingLesson) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
       <LoadingSpinner size="lg" />
       <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">AI Tutor is crafting your lesson...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 font-sans">
      
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col font-sans">
      
      {/* Premium Hub Header */}
      <div className="bg-gradient-to-r from-[#a033ff] to-[#2b59ff] rounded-2xl p-8 text-white relative overflow-hidden shadow-sm mb-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-white border border-white/30 rounded-full p-1"><BrainCircuit size={20} /></div>
            <h1 className="text-2xl font-bold tracking-tight">AI Doubt Solver</h1>
          </div>
          <p className="text-white/90 text-sm font-medium mt-1">Get instant answers to your learning questions, 24/7</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Chat Main Window */}
        <div className="lg:col-span-8 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
              
              {/* Initial AI Welcome Message */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 max-w-3xl"
              >
                <div className="space-y-1 w-full">
                  <div className="bg-[#fcfaff] border border-[#a033ff]/20 p-5 rounded-xl shadow-sm text-sm text-slate-700 leading-relaxed flex gap-3">
                    <div className="text-[#a033ff] shrink-0 mt-0.5">
                      <BrainCircuit size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#a033ff] uppercase tracking-widest mb-2">AI Tutor</p>
                      Hi! I'm your AI Doubt Solver. Ask me anything about your learning topics, and I'll help you understand better! 🎓
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Chat Messages */}
              <AnimatePresence mode="popLayout">
                {messages.slice(1).map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">
                          {msg.role === 'user' ? 'You' : 'Assistant'}
                       </span>
                       <div className={`p-5 rounded-2xl shadow-sm border ${
                        msg.role === 'user' 
                          ? 'bg-[#2b59ff] text-white border-[#2b59ff] rounded-tr-sm' 
                          : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'
                      }`}>
                        <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${msg.role === 'user' ? 'text-white prose-p:text-white' : ''}`}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({node, inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    {...props}
                                    children={String(children).replace(/\n$/, '')}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                  />
                                ) : (
                                  <code {...props} className={className}>
                                    {children}
                                  </code>
                                )
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 animate-pulse">
                    <BrainCircuit size={18} />
                  </div>
                  <div className="flex items-center gap-1.5 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <span className="w-1.5 h-1.5 bg-[#a033ff]/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#a033ff]/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#a033ff] rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-slate-100">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a question or upload a document..."
                  className="w-full bg-[#f4f7fe] border border-slate-200 rounded-xl py-3.5 pl-4 pr-32 text-sm focus:outline-none focus:border-[#2b59ff] focus:ring-1 focus:ring-[#2b59ff] transition-all min-h-[50px] max-h-[150px] resize-none text-slate-800"
                  rows={1}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input
                    type="file"
                    id="ai-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        addToast(`File "${file.name}" ready for analysis.`, 'info');
                      }
                    }}
                  />
                  <button 
                    onClick={() => document.getElementById('ai-file-upload').click()}
                    className={`p-2 transition-all ${selectedFile ? 'text-[#2b59ff] bg-blue-50 rounded-lg' : 'text-slate-400 hover:text-[#2b59ff]'}`}
                  >
                    <Paperclip size={18} />
                  </button>
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="p-2.5 bg-slate-200 text-slate-500 rounded-lg shadow-sm hover:bg-slate-300 disabled:opacity-50 transition-colors ml-1"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-3">
                Powered by Gemini 1.5 Flash • End-to-end encrypted
              </p>
            </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-4 hidden lg:block overflow-y-auto pr-2 custom-scrollbar">
           
           {/* Quick Questions */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex items-center gap-2 text-[#a033ff]">
                 <Sparkles size={18} />
                 <h3 className="text-sm font-bold text-slate-800">Quick Questions</h3>
              </div>
              <div className="space-y-2">
                 {[
                   'Explain Python decorators', 
                   'What is the difference between list and tuple?', 
                   'How does gradient descent work?',
                   'Best practices for React hooks'
                 ].map((tag) => (
                   <button key={tag} onClick={() => handleSend(tag)} className="w-full text-left p-3 rounded-xl bg-[#fcfaff] border border-slate-100 hover:border-[#a033ff]/30 text-xs font-semibold text-[#a033ff] transition-all">
                      {tag}
                   </button>
                 ))}
              </div>
           </div>

           {/* What I Can Help With */}
           <div className="bg-white rounded-2xl shadow-sm border border-[#a033ff]/20 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">What I Can Help With</h3>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <BookOpen size={16} className="text-[#2b59ff] mt-0.5" />
                    <div>
                       <p className="text-xs font-bold text-slate-800">Concept Clarification</p>
                       <p className="text-[10px] text-slate-500 font-medium">Explain topics from your sessions</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Code size={16} className="text-[#a033ff] mt-0.5" />
                    <div>
                       <p className="text-xs font-bold text-slate-800">Code Help</p>
                       <p className="text-[10px] text-slate-500 font-medium">Debug and understand code</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Lightbulb size={16} className="text-yellow-500 mt-0.5" />
                    <div>
                       <p className="text-xs font-bold text-slate-800">Practice Tips</p>
                       <p className="text-[10px] text-slate-500 font-medium">Get study suggestions</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Based on Your Learning */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Based on Your Learning</h3>
              <ul className="space-y-2">
                 <li className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <div className="w-1.5 h-1.5 bg-[#2b59ff] rounded-full" />
                    Currently learning: Python
                 </li>
                 <li className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <div className="w-1.5 h-1.5 bg-[#a033ff] rounded-full" />
                    Last session: Data Structures
                 </li>
                 <li className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Active task: Calculator Program
                 </li>
              </ul>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                 AI uses your session context and assigned tasks to provide relevant answers.
              </p>
           </div>

           {/* Your Stats */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Your Stats</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-600">Questions Asked</span>
                    <span className="text-[#2b59ff] font-bold">24</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-600">Doubts Solved</span>
                    <span className="text-emerald-500 font-bold">22</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-600">This Week</span>
                    <span className="text-[#a033ff] font-bold">7</span>
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Smart Context-Aware AI Banner */}
      <div className="bg-[#fcfaff] border border-[#a033ff]/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm max-w-4xl mx-auto w-full mb-8">
         <div className="w-8 h-8 rounded-full bg-[#f3f0ff] text-[#a033ff] flex items-center justify-center shrink-0">
            <BrainCircuit size={16} />
         </div>
         <p className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-800">Smart Context-Aware AI:</span> The AI Doubt Solver has access to your session summaries, assigned tasks, and learning progress to provide personalized and relevant answers to your questions.
         </p>
      </div>
    </div>
    </div>
  );
}
