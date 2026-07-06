import { useState, useEffect, createContext, useContext } from 'react';
import api from '../lib/api';
import socket from '../lib/socket';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('activeRole') || null;
  });
  
  const [loading, setLoading] = useState(true);

  // Silent auth check on mount — with hard 6-second timeout to prevent infinite loading splash
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      // Race the API call against a 6-second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timed out')), 6000)
      );

      try {
        const res = await Promise.race([
          api.get('/auth/me', { timeout: 5000 }),
          timeoutPromise
        ]);

        if (!cancelled && res.data?.success) {
          const userData = res.data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          // Strict Role Assignment & Validation
          let currentActive = activeRole;
          
          if (userData.roles.includes('admin')) {
            currentActive = 'admin';
          } else if (userData.roles.includes('moderator')) {
            currentActive = 'moderator';
          } else if (!currentActive || !userData.roles.includes(currentActive)) {
            // Validate existing activeRole or fallback for learner/mentor
            currentActive = userData.roles.length > 0 ? userData.roles[0] : null;
          }

          if (currentActive !== activeRole && currentActive) {
            setActiveRole(currentActive);
            localStorage.setItem('activeRole', currentActive);
          }
        }
      } catch (error) {
        // Silently fail — user will see LandingPage / login form
        if (error.message === 'Auth check timed out') {
          console.warn('AuthContext: session check timed out — proceeding as guest');
          // Clear stale token to prevent future hangs
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('activeRole');
        } else {
          console.warn('AuthContext: session verification failed:', error?.response?.status);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const handleAuthLogout = () => {
      setUser(null);
      setActiveRole(null);
      if (socket.connected) socket.disconnect();
    };

    const handleForcedLogout = (data) => {
      handleAuthLogout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('activeRole');
      alert(data.reason || 'Your account has been blocked.');
      window.location.href = '/auth';
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    socket.on('forced_logout', handleForcedLogout);

    initAuth();

    return () => {
      cancelled = true;
      window.removeEventListener('auth-logout', handleAuthLogout);
      socket.off('forced_logout', handleForcedLogout);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { accessToken, user: userData } = res.data;
      setUser(userData);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      let assignedRole = null;
      if (userData.roles.includes('admin')) {
        assignedRole = 'admin';
      } else if (userData.roles.includes('moderator')) {
        assignedRole = 'moderator';
      } else if (userData.roles.length === 1) {
        assignedRole = userData.roles[0];
      }

      if (assignedRole) {
        setActiveRole(assignedRole);
        localStorage.setItem('activeRole', assignedRole);
      } else {
        setActiveRole(null);
        localStorage.removeItem('activeRole');
      }

      return userData;
    }
    throw new Error('Login failed');
  };

  const handleSetActiveRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  const register = async (userData) => {
    const res = await api.post('/auth/signup', userData);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout API errors — always clear local state
    } finally {
      setUser(null);
      setActiveRole(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('activeRole');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, activeRole, setActiveRole: handleSetActiveRole, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
