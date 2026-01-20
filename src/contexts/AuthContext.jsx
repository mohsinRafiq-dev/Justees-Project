import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext.js";
import {
  loginAdminWithGoogle,
  logoutAdmin,
  subscribeToAuthChanges,
} from "../services/auth.service";

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Google Login function with client-side validation
   */
  const loginWithGoogle = async () => {
    try {
      const user = await loginAdminWithGoogle();
      setUser(user);
      return { success: true, user };
    } catch (error) {
      setUser(null);
      return { success: false, error: error.message };
    }
  };

  /**
   * Legacy login function - deprecated
   * @deprecated Use loginWithGoogle instead
   */
  const login = async (email, password) => {
    return { success: false, error: 'Email/password login is disabled. Please use Google login.' };
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
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
