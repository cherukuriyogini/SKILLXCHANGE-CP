import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mic, MicOff, Video, VideoOff, MessageSquare, PhoneMissed, PhoneOff,
  Users, User, Sparkles, Send, ShieldAlert, BrainCircuit, 
  RefreshCcw, Clock, X, MonitorUp, MonitorOff, Activity, DownloadCloud, Search, Wifi, WifiOff,
  Heart, ThumbsUp, Hand, Smile, ChevronRight, ScreenShare, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import Whiteboard from '../components/Whiteboard';

const VideoComponent = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (stream && ref.current) {
      if (ref.current.srcObject !== stream) {
        ref.current.srcObject = stream;
      }
    }
  }, [stream]);
  return <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />;
};

export default function LiveSessionPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const socketRef = useRef();
  const userVideo = useRef();
  const partnersRef = useRef({}); // { socketId: { peer, stream, name } }
  const streamRef = useRef();
  const screenStreamRef = useRef();
  const chatEndRef = useRef(null);
  
  // Recording references
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [session, setSession] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [peers, setPeers] = useState([]);
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('loading'); // loading, waiting, active, no-show, ai-substitute
  const [connectionStatus, setConnectionStatus] = useState('initializing'); // initializing, requesting-media, connecting, active, reconnecting, failed
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 minutes waiting time
  const [showChat, setShowChat] = useState(true);
  const [isMentorJoined, setIsMentorJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const roomIdRef = useRef(null); // Always use MongoDB _id as room key
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [remoteMedia, setRemoteMedia] = useState({ isMicOn: true, isVideoOn: true, isSharing: false });
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [mediaError, setMediaError] = useState(null); 
  const [reactions, setReactions] = useState([]);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [networkHealth, setNetworkHealth] = useState('excellent');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);


  const activeRole = user?.roles?.includes('mentor') ? 'mentor' : 'learner';

  // Simulate network health polling
  useEffect(() => {
    if (sessionStatus !== 'active') return;
    const interval = setInterval(() => {
       const rand = Math.random();
       if (rand > 0.95) setNetworkHealth('poor');
       else if (rand > 0.8) setNetworkHealth('average');
       else setNetworkHealth('excellent');
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionStatus]);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Re-attach local stream to video element whenever it mounts or stream changes
  useEffect(() => {
    if (userVideo.current) {
      const targetStream = isScreenSharing ? screenStreamRef.current : localStream;
      if (targetStream && userVideo.current.srcObject !== targetStream) {
        userVideo.current.srcObject = targetStream;
      }
    }
  }, [localStream, sessionStatus, isScreenSharing]);

  const fetchSession = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      const currentSession = res.data.data;

      if (!currentSession) {
        setSessionStatus('error');
        addToast('Session not found', 'error');
        return;
      }

      setSession(currentSession);

      if (currentSession.status === 'ai-substitute' || currentSession.status === 'no-show') {
        setSessionStatus(currentSession.status);
      } else if (currentSession.status === 'completed') {
        navigate('/learner-dashboard');
      } else {
        setSessionStatus('waiting');
      }
    } catch (err) {
      console.error('Failed to fetch session', err);
      setSessionStatus('error');
    }
  };

  const [shouldConnect, setShouldConnect] = useState(false);

  useEffect(() => {
    if (sessionStatus !== 'loading' && sessionStatus !== 'error') {
      setShouldConnect(true);
    }
  }, [sessionStatus]);

  useEffect(() => {
    if (!shouldConnect || !user) return;
    
    let ignore = false;

    const setupConnection = async () => {
      if (ignore) return;
      setConnectionStatus('requesting-media');
      
      // 1. Get Media with HD constraints & fallbacks
      const hdConstraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      let stream;
      try {
        if (!navigator.mediaDevices) throw new Error("Media devices not supported in this browser.");
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        console.log("[Media] HD Stream acquired");
      } catch (err) {
        console.warn("[Media] HD Failed, trying basic...", err.name);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log("[Media] Basic Stream acquired");
        } catch (basicErr) {
          console.error("[Media] All media acquisition failed", basicErr);
          setMediaError({
            type: basicErr.name === 'NotAllowedError' ? 'permission' : 'device',
            message: basicErr.name === 'NotAllowedError' 
              ? 'Camera/Mic access denied. Please enable them in your browser settings.' 
              : 'No camera or microphone found. Please connect a device and refresh.'
          });
          setConnectionStatus('failed');
          addToast(basicErr.message, 'error');
          return;
        }
      }

      if (ignore) {
        stream?.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      setLocalStream(stream);
      startActiveSpeakerDetection(stream, 'local');
      
      const hasAudio = stream.getAudioTracks().length > 0;
      const hasVideo = stream.getVideoTracks().length > 0;
      setIsMicOn(hasAudio);
      setIsVideoOn(hasVideo);

      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      // 2. Initialize Socket
      setConnectionStatus('connecting');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5008';
      socketRef.current = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });
      
      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log(`[Socket] Connected: ${socket.id}`);
        setConnectionStatus('active');
        // Always use MongoDB _id as the room key for consistency
        const roomId = sessionId; // sessionId from useParams is the MongoDB _id
        roomIdRef.current = roomId;
        socket.emit('join_session', { 
          sessionId: roomId, 
          userId: user.id, 
          name: user.name, 
          roles: user.roles 
        });
      });

      socket.on('disconnect', (reason) => {
        console.warn(`[Socket] Disconnected: ${reason}`);
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setConnectionStatus('reconnecting');
        }
      });

      socket.on('mentor_joined', (data) => {
        setIsMentorJoined(true);
        if (!user.roles.includes('mentor')) {
          addToast('Mentor has joined the session! Starting now...', 'success');
        }
      });

      socket.on('user_joined', ({ userId, name, socketId, roles }) => {
        console.log(`[Socket] User joined: ${name} (${socketId})`);
        addToast(`${name} has joined`, 'info');
        setParticipantCount(prev => prev + 1);
        // We do NOT initiate peer here to avoid WebRTC glare condition.
        // The newly joined user will receive 'room_users' and act as the sole initiator.
      });

      socket.on('room_users', ({ users }) => {
        console.log(`[Socket] Room users received: ${users.length}`);
        setParticipantCount(users.length);
        if (users.length > 0) {
          // Immediately mark as active if others are already present
          // The WebRTC stream will confirm, but we want the UI to update
          setSessionStatus('active');
        }
        users.forEach(socketId => {
          if (!partnersRef.current[socketId] && socketId !== socket.id && streamRef.current) {
            console.log(`[WebRTC] Creating peer to existing user ${socketId}`);
            createPeer(socketId, socket.id, streamRef.current);
          }
        });
      });

      socket.on('call_made', async ({ offer, socket: fromSocketId, name }) => {
        console.log(`[WebRTC] Received call from ${name} (${fromSocketId})`);
        if (partnersRef.current[fromSocketId]) {
          console.warn(`[WebRTC] Peer already exists for ${fromSocketId}. Destroying old peer.`);
          partnersRef.current[fromSocketId].peer.destroy();
        }
        const peer = addPeer(offer, fromSocketId, streamRef.current);
        partnersRef.current[fromSocketId] = { peer, name };
      });

      socket.on('answer_made', ({ answer, socket: fromSocketId }) => {
        const item = partnersRef.current[fromSocketId];
        if (item?.peer) {
          item.peer.signal(answer);
        }
      });

      socket.on('ice_candidate', ({ candidate, socket: fromSocketId }) => {
        const item = partnersRef.current[fromSocketId];
        if (item?.peer) {
          item.peer.signal(candidate);
        }
      });

      socket.on('user_left', ({ socketId }) => {
        const item = partnersRef.current[socketId];
        if (item) {
          item.peer.destroy();
          delete partnersRef.current[socketId];
          setPeers(prev => prev.filter(p => p.socketId !== socketId));
          addToast('A participant left.', 'info');
        }
      });

      socket.on('receive_message', (data) => {
        if (data.userId !== user.id) {
          setMessages(prev => [...prev, {
            sender: data.sender,
            text: data.text,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }
      });

      socket.on('chat_history', (history) => {
        const formatted = history.map(msg => ({
          sender: msg.userId === user.id ? 'You' : msg.sender,
          text: msg.text,
          time: new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        setMessages(formatted);
      });

      socket.on('receive_reaction', (data) => {
        const newReaction = { id: Date.now() + Math.random(), type: data.reactionType, sender: data.name };
        setReactions(prev => [...prev, newReaction]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== newReaction.id)), 4000);
      });

      socket.on('remote_media_state', (data) => {
        setRemoteMedia(prev => ({ ...prev, isMicOn: data.isMicOn, isVideoOn: data.isVideoOn }));
      });

      socket.on('session_ended', () => {
        addToast('Session ended.', 'info');
        handleCallTermination();
      });

      socket.on('connect_error', (err) => {
        console.error('[Socket] Connection Error:', err);
        setConnectionStatus('failed');
      });
    };

    setupConnection();

    return () => {
      ignore = true;
      console.log("[Cleanup] Tearing down connection...");
      streamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks()?.forEach(track => track.stop());
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }

      if (socketRef.current) {
        const socket = socketRef.current;
        socket.off('connect');
        socket.off('disconnect');
        socket.off('mentor_joined');
        socket.off('user_joined');
        socket.off('room_users');
        socket.off('call_made');
        socket.off('answer_made');
        socket.off('ice_candidate');
        socket.off('user_left');
        socket.off('receive_message');
        socket.off('chat_history');
        socket.off('receive_reaction');
        socket.off('remote_media_state');
        socket.off('session_ended');
        socket.off('connect_error');
        socket.disconnect();
      }
      
      Object.values(partnersRef.current).forEach(({ peer }) => {
        try { peer?.destroy(); } catch(e) {}
      });
      partnersRef.current = {};
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [shouldConnect, sessionId, user?.id]);


  const startActiveSpeakerDetection = (stream, source) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const context = audioContextRef.current;
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (sessionStatus !== 'active') return;
        analyser.getByteFrequencyData(dataArray);
        let values = 0;
        for (let i = 0; i < bufferLength; i++) {
          values += dataArray[i];
        }
        const average = values / bufferLength;
        if (average > 30) {
          setActiveSpeaker(source);
        }
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.error('Audio Context Error:', e);
    }
  };

  const startRecording = (stream) => {
    try {
      // Capture audio only for transcription
      const audioStream = new MediaStream(stream.getAudioTracks());
      mediaRecorderRef.current = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // collect 1s chunks
      setIsRecording(true);
      addToast('Session recording started for AI Summary', 'info');
    } catch (err) {
      console.error('MediaRecorder error:', err);
    }
  };

  const createPeer = (userToCall, callerId, stream) => {
    console.log(`[WebRTC] Creating initiating peer for ${userToCall}`);
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: { iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, 
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ] }
    });

    peer.on('signal', signal => {
      if (signal.type === 'offer') {
        console.log(`[WebRTC] Sending offer to ${userToCall}`);
        socketRef.current.emit('call_user', { offer: signal, to: userToCall, from: callerId, name: user.name });
      } else if (signal.candidate) {
        socketRef.current.emit('ice_candidate', { candidate: signal, to: userToCall });
      }
    });

    peer.on('stream', remoteStream => {
      console.log(`[WebRTC] Connection established with ${userToCall} (Initiator)`);
      partnersRef.current[userToCall] = { ...partnersRef.current[userToCall], stream: remoteStream };
      setPeers(prev => {
        const otherPeers = prev.filter(p => p.socketId !== userToCall);
        return [...otherPeers, { socketId: userToCall, stream: remoteStream }];
      });
      setSessionStatus('active');
    });

    peer.on('error', err => {
      console.error('[WebRTC] Peer Error:', err);
      addToast('Connection failed. Retrying...', 'error');
    });

    partnersRef.current[userToCall] = { peer };
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    console.log(`[WebRTC] Adding receiving peer for ${callerId}`);
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: { iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, 
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ] }
    });

    peer.on('signal', signal => {
      if (signal.type === 'answer') {
        console.log(`[WebRTC] Sending answer to ${callerId}`);
        socketRef.current.emit('make_answer', { answer: signal, to: callerId });
      } else if (signal.candidate) {
        socketRef.current.emit('ice_candidate', { candidate: signal, to: callerId });
      }
    });

    peer.on('stream', remoteStream => {
      console.log(`[WebRTC] Connection established with ${callerId} (Receiver)`);
      partnersRef.current[callerId] = { ...partnersRef.current[callerId], stream: remoteStream };
      setPeers(prev => {
        const otherPeers = prev.filter(p => p.socketId !== callerId);
        return [...otherPeers, { socketId: callerId, stream: remoteStream }];
      });
      setSessionStatus('active');
    });

    peer.on('error', err => {
      console.error('[WebRTC] Peer Error (add):', err);
    });

    peer.signal(incomingSignal);
    partnersRef.current[callerId] = { peer };
    return peer;
  };

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      socketRef.current?.emit('media_state_change', { 
        sessionId, 
        userId: user.id, 
        isMicOn: audioTrack.enabled, 
        isVideoOn 
      });
    }
  };

  const toggleVideo = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
      socketRef.current?.emit('media_state_change', { 
        sessionId, 
        userId: user.id, 
        isMicOn, 
        isVideoOn: videoTrack.enabled 
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const webcamTrack = streamRef.current?.getVideoTracks()[0];

        if (!screenTrack || !webcamTrack) return;

        // Replace for all peers
        Object.values(partnersRef.current).forEach(({ peer }) => {
          if (peer && !peer.destroyed) {
            try {
              peer.replaceTrack(webcamTrack, screenTrack, streamRef.current);
            } catch (err) {
              console.error("[WebRTC] ReplaceTrack Error:", err);
            }
          }
        });

        screenTrack.onended = () => stopScreenShare();
        if (userVideo.current) userVideo.current.srcObject = screenStream;
        setIsScreenSharing(true);
        socketRef.current?.emit('screen_share_state', { sessionId, userId: user.id, isSharing: true });
        addToast('Screen sharing active', 'success');
      } catch (err) {
        console.error('Screen Share Error:', err);
        addToast('Screen sharing cancelled or failed', 'error');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (!isScreenSharing) return;

    const webcamTrack = streamRef.current?.getVideoTracks()[0];
    const screenTrack = screenStreamRef.current?.getVideoTracks()[0];

    if (webcamTrack && screenTrack) {
      Object.values(partnersRef.current).forEach(({ peer }) => {
        if (peer && !peer.destroyed) {
          try {
            peer.replaceTrack(screenTrack, webcamTrack, streamRef.current);
          } catch (err) {
            console.error("[WebRTC] ReplaceTrack (Stop) Error:", err);
          }
        }
      });
    }

    if (userVideo.current) userVideo.current.srcObject = streamRef.current;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    socketRef.current?.emit('screen_share_state', { sessionId, userId: user.id, isSharing: false });
  };

  const sendReaction = (type) => {
    const reactionData = {
      sessionId: sessionId,
      userId: user.id,
      name: user.name,
      reactionType: type
    };
    socketRef.current.emit('send_reaction', reactionData);
    
    // Show locally
    const newReaction = { id: Date.now() + Math.random(), type, sender: 'You' };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 4000);
    setShowReactionsMenu(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (sessionStatus === 'waiting' && !user.roles.includes('mentor')) {
      const timerInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleNoShow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerInterval);
    }
    
    if (sessionStatus === 'active') {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [sessionStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNoShow = async () => {
    try {
      await api.patch(`/sessions/${session._id}/no-show`);
      setSessionStatus('no-show');
    } catch (err) {
      console.error('Failed to update status to no-show');
    }
  };

  const handleStartAI = async () => {
    try {
      await api.patch(`/sessions/${session._id}`, { status: 'ai-substitute' });
      navigate(`/ai-tutor?substitute=true&sessionId=${session._id}&topic=${encodeURIComponent(session.topic)}`);
    } catch (err) {
      console.error('Failed to start AI substitute');
    }
  };

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    const msgData = {
      sessionId: sessionId,
      sender: user?.name,
      text: newMessage,
      userId: user.id
    };
    socketRef.current.emit('send_message', msgData);
    setMessages(prev => [...prev, {
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
    setNewMessage('');
  };

  const leaveSession = () => {
    if (window.confirm('Are you sure you want to leave the session?')) {
      handleEndCall();
    }
  };

  const handleCallTermination = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsProcessingAI(true);
      
      // Wait for the ondataavailable to finish pushing chunks
      setTimeout(async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'session_audio.webm');
        formData.append('sessionId', session.sessionId || session._id);

        try {
          addToast('Uploading recording to AI for summarization...', 'info');
          await api.post('/ai/meeting-summary', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          addToast('AI Summary successfully generated!', 'success');
        } catch (err) {
          console.error('Failed to generate AI summary', err);
          addToast('Failed to generate full AI summary, fallback used.', 'error');
        } finally {
          audioChunksRef.current = [];
          completeRouting();
        }
      }, 500);
    } else {
      completeRouting();
    }
  };

  const completeRouting = async () => {
    try {
      if (session?._id) {
        await api.patch(`/sessions/${session._id}/complete`).catch(() => {});
      }
    } catch (err) {
      console.error('Error marking session complete', err);
    }

    if (user.roles.includes('mentor')) {
      navigate('/mentor-dashboard');
    } else {
      // Learners go to summary page for feedback and AI insights
      navigate(`/ai-summaries?sessionId=${session?._id}&topic=${encodeURIComponent(session?.topic || 'Session')}`);
    }
  };

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end this session? Generating AI Summary may take a moment.')) {
      if (socketRef.current) {
        socketRef.current.emit('end_session', { sessionId: sessionId });
      }
      handleCallTermination();
    }
  };

  const handleMuteAll = () => {
    if (!user.roles.includes('mentor')) {
      addToast('Only the mentor can mute all participants.', 'warning');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('mute_all_participants', { sessionId: session?.sessionId || sessionId });
      addToast('All participants have been muted.', 'info');
    }
  };

  if (sessionStatus === 'loading') return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-t-2 border-indigo-500 border-r-2 border-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="text-indigo-500 animate-pulse" size={32} />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">Initializing Session</h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
          Status: {connectionStatus.replace('-', ' ')}
        </p>
      </div>

      {mediaError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md text-center"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="text-red-500" size={24} />
          </div>
          <h3 className="text-red-500 font-bold mb-2">Media Access Error</h3>
          <p className="text-slate-400 text-sm mb-6">{mediaError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Retry Access
          </button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden font-sans text-white">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">{session?.topic}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                ID: <span className="font-mono text-slate-300">{session?.sessionId || sessionId}</span>
              </p>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {sessionStatus === 'active' ? 'Live Session Active' : 'Waiting Room'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isProcessingAI && (
             <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-slate-300 text-xs font-bold animate-pulse">
                <BrainCircuit size={16} className="text-indigo-400" />
                Analyzing session...
             </div>
          )}

          {sessionStatus === 'active' && (
            <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className={`text-xs font-semibold ${isRecording ? 'text-red-500' : 'text-emerald-500'}`}>
                  {isRecording ? 'Recording' : 'Live'}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                <Clock size={14} className="text-slate-500" />
                {formatTime(timer)}
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2" title={`Network Health: ${networkHealth}`}>
                 {networkHealth === 'poor' ? <WifiOff size={16} className="text-red-500" /> : <Wifi size={16} className={networkHealth === 'average' ? 'text-yellow-500' : 'text-green-500'} />}
                 <span className={`text-[10px] font-bold uppercase tracking-widest hidden md:inline ${networkHealth === 'poor' ? 'text-red-500' : networkHealth === 'average' ? 'text-yellow-500' : 'text-green-500'}`}>{networkHealth}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { 
                setShowParticipants(!showParticipants); 
                if(showChat) setShowChat(false);
                if(showWhiteboard) setShowWhiteboard(false);
              }}
              className={`p-2 rounded-lg transition-colors ${showParticipants ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="Participants"
            >
              <Users size={18} />
            </button>
            <button 
              onClick={() => { 
                setShowWhiteboard(!showWhiteboard); 
                if(showChat) setShowChat(false);
                if(showParticipants) setShowParticipants(false);
              }}
              className={`p-2 rounded-lg transition-colors ${showWhiteboard ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="Toggle Whiteboard"
            >
              <Pencil size={18} />
            </button>
            <button 
              onClick={() => {
                setShowChat(!showChat);
                if(showWhiteboard) setShowWhiteboard(false);
                if(showParticipants) setShowParticipants(false);
              }} 
              className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="Chat"
            >
              <MessageSquare size={18} />
            </button>
            <button 
              onClick={handleEndCall} 
              disabled={isProcessingAI}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessingAI ? <RefreshCcw className="animate-spin" size={16} /> : <PhoneMissed size={16} />}
              {isProcessingAI ? 'Uploading...' : 'End'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-950 relative">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-slate-950 to-slate-950 pointer-events-none" />

        <AnimatePresence mode="wait">
          {sessionStatus === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-8 relative z-10"
            >
              <motion.div 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-32 h-32 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-800 relative shadow-2xl"
              >
                <div className="absolute inset-0 rounded-3xl border border-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                   <Video size={40} className="text-indigo-400" />
                </div>
              </motion.div>
              
              <h2 className="text-4xl font-black mb-2 text-white tracking-tight">Secure Waiting Room</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Waiting for {activeRole === 'learner' ? 'Mentor' : 'Learner'} to join...</p>

              {!user.roles.includes('mentor') && (
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl max-w-sm text-center">
                  <div className="flex items-center justify-center gap-2 mb-3 text-indigo-400">
                    <Clock size={16} />
                    <span className="text-lg font-mono font-bold">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
                  </div>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    If your mentor doesn't arrive within the countdown, you'll be automatically redirected to an AI-powered substitute session.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 mt-12">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                  />
                ))}
              </div>

              {/* Participant joined indicator */}
              {participantCount > 0 && (
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-3 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    {activeRole === 'mentor' ? 'Learner is connected' : 'Mentor is connected'} — Starting session...
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-center gap-4 flex-wrap justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-800 flex items-center gap-2"
                >
                  <RefreshCcw size={14} /> Refresh
                </button>
                {(user.roles.includes('admin') || user.roles.includes('mentor') || participantCount > 0) && (
                  <button 
                    onClick={() => {
                      setSessionStatus('active');
                      // Also re-emit to trigger peer creation if needed
                      if (socketRef.current && roomIdRef.current) {
                        const clients = Array.from(partnersRef.current);
                        if (Object.keys(partnersRef.current).length === 0 && streamRef.current) {
                          socketRef.current.emit('force_start', { sessionId: roomIdRef.current });
                        }
                      }
                    }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    ▶ Start Session
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Local Camera PiP — always visible in waiting room */}
          {sessionStatus === 'waiting' && localStream && (
            <div className="absolute bottom-6 right-6 w-48 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl z-20">
              <video
                ref={userVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold">
                You (Preview)
              </div>
            </div>
          )}

          {(sessionStatus === 'no-show' || sessionStatus === 'ai-substitute') && (
            <motion.div 
              key="no-show"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-8 z-10"
            >
              <div className="bg-slate-900 border border-slate-800 p-10 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                  <ShieldAlert size={48} className="text-red-400" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white tracking-tight">Mentor Unavailable</h1>
                <p className="text-slate-400 text-base mb-10 leading-relaxed">
                  We value your time. Your session on <span className="text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded">"{session?.topic}"</span> has been redirected to our high-fidelity <span className="text-primary-400 font-bold">AI Tutor</span>.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={handleStartAI}
                    className="col-span-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 group"
                  >
                    <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform" />
                    Continue with AI Tutor
                  </button>
                  <Link to="/match" className="btn-secondary py-3.5 rounded-xl flex items-center justify-center gap-2">
                    <Search size={16} /> Find New Mentor
                  </Link>
                  <button onClick={() => navigate('/learner-dashboard')} className="btn-secondary py-3.5 rounded-xl">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {sessionStatus === 'active' && (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col lg:flex-row overflow-hidden z-10 p-6 gap-6"
            >
              {/* Main Video Area */}
            {/* Collaborative Whiteboard */}
            {showWhiteboard && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 min-h-[500px]"
              >
                <Whiteboard socket={socketRef.current} sessionId={session?.sessionId || sessionId} user={user} />
              </motion.div>
            )}

            {/* Video Grid */}
            {!showWhiteboard && (
              <div className="flex-1 p-8 grid gap-8 overflow-y-auto" style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${peers.length === 0 ? '800px' : '400px'}, 1fr))`
              }}>
                {/* Local Stream */}
                <motion.div 
                  layout
                  className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border transition-colors ${activeSpeaker === 'local' ? 'border-indigo-500' : 'border-slate-800'}`}
                >
                  <video
                    ref={userVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
                    <span className="text-xs font-medium text-white">{user?.name} (You)</span>
                  </div>
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                           <User size={32} className="text-slate-600" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Camera Off</p>
                      </div>
                    </div>
                  )}
                </motion.div>
                {/* Remote Peers */}
                <AnimatePresence>
                  {peers.map((peer) => (
                    <motion.div 
                      key={peer.socketId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden border transition-colors ${activeSpeaker === peer.socketId ? 'border-indigo-500' : 'border-slate-800'}`}
                    >
                      <VideoComponent stream={peer.stream} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
                        <div className={`w-1.5 h-1.5 rounded-full ${remoteMedia.isMicOn ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-medium text-white">Partner</span>
                      </div>
                      {!remoteMedia.isVideoOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                               <User size={32} className="text-slate-600" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Partner Offline</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

                {/* Floating Controls */}
          {/* Control Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30">
            <button 
              onClick={toggleMic}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                isMicOn ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                isVideoOn ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button 
              onClick={toggleScreenShare}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ScreenShare size={18} />
            </button>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
                showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MessageSquare size={18} />
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button 
              onClick={leaveSession}
              className="w-11 h-11 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center justify-center transition-all"
            >
              <PhoneOff size={18} />
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button 
              onClick={() => window.location.reload()}
              className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg flex items-center justify-center transition-all border border-slate-700"
              title="Reconnect"
            >
              <RefreshCcw size={18} />
            </button>
          </div>

              {/* Sidebar Chat */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40 relative"
                  >
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-slate-200">Session Chat</h2>
                      <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === user?.name ? 'items-end' : 'items-start'}`}>
                          <span className="text-xs font-medium text-slate-500 mb-1">{msg.sender}</span>
                          <div className={`px-4 py-2 rounded-lg text-sm ${
                            msg.sender === user?.name 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-800 text-slate-200'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-slate-800 bg-slate-900">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button 
                          type="submit"
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sidebar Participants */}
              <AnimatePresence>
                {showParticipants && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40 relative"
                  >
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-slate-200">Participants ({1 + peers.length})</h2>
                      <button onClick={() => setShowParticipants(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Local User */}
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{user.name} (You)</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user.roles.join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {isMicOn ? <Mic size={14} className="text-slate-400" /> : <MicOff size={14} className="text-red-500" />}
                           {isVideoOn ? <Video size={14} className="text-slate-400" /> : <VideoOff size={14} className="text-red-500" />}
                        </div>
                      </div>

                      {/* Remote Peers */}
                      {peers.map(peer => (
                        <div key={peer.socketId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              P
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-200">Partner</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Participant</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {remoteMedia.isMicOn ? <Mic size={14} className="text-slate-400" /> : <MicOff size={14} className="text-red-500" />}
                             {remoteMedia.isVideoOn ? <Video size={14} className="text-slate-400" /> : <VideoOff size={14} className="text-red-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-4 border-t border-slate-800">
                       <button 
                        onClick={handleMuteAll}
                        className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold transition-colors border border-indigo-500/20"
                       >
                         Mute All
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
