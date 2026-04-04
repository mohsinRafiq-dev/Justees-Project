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
   * Email/Password Login
   */
  const login = async (email, password) => {
    try {
      const { loginAdmin } = await import("../services/auth.service");
      const user = await loginAdmin(email, password);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { updateAdminPassword } = await import("../services/auth.service");
      return await updateAdminPassword(user, newPassword);
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
    updatePassword,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
