import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedBackground from '../../components/common/AnimatedBackground';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle, login, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
      <AnimatedBackground />
      
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className={`absolute top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg hover:scale-105 transition-all ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/80 border-gray-200 text-gray-900 hover:bg-white'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl glass ${isDark ? '' : 'glass-light'}`}>
              <Shield className="w-12 h-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent" style={{fill: 'url(#gradient)'}} />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          <h2 className={`text-center text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Portal
          </h2>
          <p className="text-center text-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent font-semibold">
            Justees Management System
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className={`glass ${isDark ? '' : 'glass-light'} py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${isDark ? 'bg-red-900/30 border-red-500/50' : 'bg-red-50 border-red-200'} border rounded-xl p-4 backdrop-blur-sm`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>Authentication Error</h3>
                      <div className={`mt-2 text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email address</span>
                    </div>
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`appearance-none block w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="admin@justees.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </div>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`appearance-none block w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-800/50 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 pr-4 flex items-center ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'} transition-colors`}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign in with Email'
                    )}
                  </motion.button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>Or continue with</span>
                </div>
              </div>

              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={`w-full flex justify-center items-center px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-xl shadow-sm text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </motion.button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className={`px-2 ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-500'}`}>
                      <Lock className="w-3 h-3 inline mr-1" />
                      Access restricted to authorized administrators only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
