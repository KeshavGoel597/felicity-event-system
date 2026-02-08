import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setIsAuthenticated(true);

          // Validate token by fetching current user
          try {
            const response = await authAPI.getProfile();
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
          } catch (error) {
            // Token invalid, clear auth state
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (credentials, userRole = 'participant') => {
    try {
      let response;
      
      // Call appropriate login endpoint based on role
      switch (userRole) {
        case 'organizer':
          response = await authAPI.organizerLogin(credentials);
          break;
        case 'admin':
          response = await authAPI.adminLogin(credentials);
          break;
        default:
          response = await authAPI.login(credentials);
      }

      const { token: newToken, user: userData } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(newToken);
      setUser(userData);
      setRole(userData.role);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setToken(newToken);
      setUser(newUser);
      setRole(newUser.role);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed',
      };
    }
  };

  const completeOnboarding = async (onboardingData) => {
    try {
      const response = await authAPI.onboarding(onboardingData);
      const updatedUser = response.data.data;
      
      // Update user in localStorage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Onboarding failed',
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    clearAuth();
  };

  const value = {
    user,
    token,
    role,
    isAuthenticated,
    loading,
    login,
    signup,
    completeOnboarding,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
