import { useState, useEffect, Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { ToastProvider } from './components/Toast';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const LearnerDashboard = lazy(() => import('./pages/LearnerDashboard'));
const MentorDashboard = lazy(() => import('./pages/MentorDashboard'));
const ModeratorDashboard = lazy(() => import('./pages/ModeratorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SkillMatchingPage = lazy(() => import('./pages/SkillMatchingPage'));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage'));
const AITutorPage = lazy(() => import('./pages/AITutorPage'));
const AISummaryPage = lazy(() => import('./pages/AISummaryPage'));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage'));
const PeerGroupsPage = lazy(() => import('./pages/PeerGroupsPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const Layout = lazy(() => import('./components/Layout'));
const FloatingAITutor = lazy(() => import('./components/FloatingAITutor'));


class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("React Error Boundary caught:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-20 flex flex-col items-center justify-center font-sans">
          <h1 className="text-4xl font-black mb-4">Critical System Error</h1>
          <pre className="bg-white/5 p-6 rounded-2xl text-rose-400 overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-10 px-8 py-4 bg-violet-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, activeRole, loading } = useAuth();
  
  if (loading) return <LoadingSplash />;
  
  if (!user) return <Navigate to="/auth" replace />;

  if (user.roles.length > 1 && !activeRole) {
    return <Navigate to="/role-selection" replace />;
  }
  
  const checkRole = activeRole || (user.roles.length === 1 ? user.roles[0] : null);
  
  // STRICT VALIDATION 1: Prevent LocalStorage Tampering
  // Ensure the activeRole is actually in the user's verified database roles
  if (checkRole && !user.roles.includes(checkRole)) {
    return <Navigate to="/" replace />;
  }

  // STRICT VALIDATION 2: Route Protection
  // Ensure the validated role is authorized for this specific route
  if (allowedRoles && !allowedRoles.includes(checkRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// 404 Not Found Page
const NotFound = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="text-center">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-sm">
        <h1 className="text-6xl font-black text-slate-200 mb-4">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Oops! Page not found</h2>
        <p className="text-slate-500 mb-6 text-sm">The page you are looking for doesn't exist.</p>
        <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all">
          Go Back Home
        </button>
      </div>
    </div>
  </div>
);

const LoadingSplash = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <div className="bg-violet-600 p-4 rounded-2xl shadow-2xl shadow-violet-200 mb-6">
      <GraduationCap className="text-white" size={48} />
    </div>
    <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
      <div className="w-full h-full bg-violet-600" />
    </div>
    <p className="mt-4 text-slate-400 font-medium text-sm">Initializing SkillXchange...</p>
  </div>
);

function AppRoutes() {
  const { user, activeRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSplash />;

  const getRedirectPath = () => {
    if (!user) return "/home";
    if (user.roles.length > 1 && !activeRole) return "/role-selection";
    return `/${activeRole || user.roles[0]}-dashboard`;
  };

  return (
    <Suspense fallback={<LoadingSplash />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={user ? <Navigate to={getRedirectPath()} replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to={getRedirectPath()} replace /> : <AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/role-selection" element={user && user.roles.length > 1 ? <RoleSelectionPage /> : <Navigate to={getRedirectPath()} replace />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/learner-dashboard" element={<ProtectedRoute allowedRoles={['learner', 'admin']}><LearnerDashboard /></ProtectedRoute>} />
          <Route path="/mentor-dashboard" element={<ProtectedRoute allowedRoles={['mentor', 'admin']}><MentorDashboard /></ProtectedRoute>} />
          <Route path="/moderator-dashboard" element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><ModeratorDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/match" element={<SkillMatchingPage />} />
          <Route path="/learning-path" element={<LearningPathPage />} />
          <Route path="/peer-groups" element={<PeerGroupsPage />} />
          <Route path="/ai-tutor" element={<AITutorPage />} />
          <Route path="/ai-doubt-solver" element={<Navigate to="/ai-tutor" replace />} />
          <Route path="/ai-summaries" element={<AISummaryPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/requests" element={<Navigate to="/sessions" replace />} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['mentor', 'admin']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/live/:sessionId" element={<ProtectedRoute><LiveSessionPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
            <AuthWrapper>
              <FloatingAITutor />
            </AuthWrapper>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AuthWrapper({ children }) {
  const { user } = useAuth();
  return user ? children : null;
}
