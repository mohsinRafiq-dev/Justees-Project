import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to use Auth Context
 * Must be used within AuthProvider
 * 
 * @returns {Object} Auth context value
 * @returns {Object|null} returns.user - Current authenticated user
 * @returns {boolean} returns.loading - Loading state
 * @returns {Function} returns.login - Login function
 * @returns {Function} returns.logout - Logout function
 * @returns {boolean} returns.isAuthenticated - Whether user is authenticated
 * 
 * @example
 * const { user, login, logout, isAuthenticated, loading } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
