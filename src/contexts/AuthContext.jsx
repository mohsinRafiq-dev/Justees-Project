import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import {
  loginAdmin,
  logoutAdmin,
  subscribeToAuthChanges,
} from '../services/auth.service';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Login function
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   */
  const login = async (email, password) => {
    try {
      const user = await loginAdmin(email, password);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      await logoutAdmin();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
