import { createContext } from 'react';

// Create Auth Context with default values
export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export default AuthContext;
