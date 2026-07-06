import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Paperclip, Copy, Check, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../lib/api';

export default function FloatingAITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI Doubt Solver. Ask me anything about your studies, or upload a document/image to analyze.", sender: 'ai', id: 'init' }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/chat-history');
      if (res.data.success && res.data.data.length > 0) {
        setMessages([
          { text: "Welcome back! Here's our previous conversation.", sender: 'ai', id: 'welcome' },
          ...res.data.data
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch chat history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if ((!query.trim() && !selectedFile) || loading) return;

    const formData = new FormData();
    if (query) formData.append('question', query);
    if (selectedFile) formData.append('file', selectedFile);

    const userMsg = query || (selectedFile ? `[Uploaded: ${selectedFile.name}]` : 'Analyze this');
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user', id: userMsgId }]);
    
    setQuery('');
    const tempFile = selectedFile;
    setSelectedFile(null);
    setLoading(true);

    try {
      const res = await api.post('/ai/doubt-solver', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const answer = res.data?.data?.answer || res.data?.answer || 'No response received.';
      setMessages(prev => [...prev, { text: answer, sender: 'ai', id: Date.now() + 1 }]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Sorry, the AI engine is temporarily busy. Please try again in a moment.";
      setMessages(prev => [...prev, { 
        text: errorMsg, 
        sender: 'ai', 
        id: Date.now() + 2,
        error: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[90vw] md:w-[420px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-violet-600 p-5 flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI Doubt Solver</h3>
                  <p className="text-xs text-violet-100 font-medium">Powered by SkillXchange AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2 rounded-lg transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`relative group max-w-[85%] p-4 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-200' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'prose-invert' : 'prose-slate'} leading-relaxed`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    
                    {msg.sender === 'ai' && msg.id !== 'init' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-violet-600 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500 uppercase tracking-wider">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span className="uppercase tracking-wider">Copy Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-400 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-3 items-center">
                    <div className="flex gap-1">
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                      />
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                      />
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-3 bg-violet-50 border-t border-violet-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 text-xs font-bold text-violet-700 truncate">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                      {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="truncate">
                      <p className="truncate mb-0.5">{selectedFile.name}</p>
                      <p className="text-[9px] text-violet-400 font-bold uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="p-2 text-violet-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2 pr-3 border border-slate-200 focus-within:border-violet-500/50 focus-within:bg-white focus-within:shadow-md transition-all">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-violet-600 transition-colors rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100"
                  title="Upload materials (Image, PDF, Docx)"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
                />
                <input
                  type="text"
                  placeholder={loading ? "AI is processing..." : "Ask your doubt..."}
                  className="flex-1 bg-transparent border-none py-3 px-2 text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                  disabled={loading}
                />
                <button 
                  onClick={handleSend}
                  disabled={(!query.trim() && !selectedFile) || loading}
                  className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-all shadow-md shadow-violet-100 disabled:opacity-30 active:scale-95 group"
                >
                  <Send size={18} className={`transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${loading ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border border-slate-200/50 ${
          isOpen ? 'bg-white text-slate-400' : 'bg-violet-600 text-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative">
              <MessageSquare size={28} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-violet-600 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
