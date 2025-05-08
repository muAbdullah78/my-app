import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'customer' | 'shop_owner';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (phoneNumber: string) => Promise<void>;
  signUp: (userData: Partial<User>) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  verifyCode: async () => {},
  setUserRole: async () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tempUserData, setTempUserData] = useState<Partial<User> | null>(null);

  useEffect(() => {
    // Simulate checking for existing session
    const checkAuth = () => {
      try {
        // In a real app, you would check for stored credentials or tokens
        setIsLoading(false);
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (phoneNumber: string) => {
    try {
      // In a real app, this would make an API call to initiate phone auth
      setTempUserData({ phoneNumber });
      // Simulating async operation
      return Promise.resolve();
    } catch (error) {
      console.error('Sign in error:', error);
      return Promise.reject(error);
    }
  };

  const signUp = async (userData: Partial<User>) => {
    try {
      // In a real app, this would validate the data and store it temporarily
      setTempUserData(userData);
      // Simulating async operation
      return Promise.resolve();
    } catch (error) {
      console.error('Sign up error:', error);
      return Promise.reject(error);
    }
  };

  const verifyCode = async (code: string) => {
    try {
      // In a real app, this would verify the code with an authentication service
      if (code.length !== 4) {
        throw new Error('Invalid code');
      }

      // For demo purposes, we'll accept any 4-digit code
      // In a real app, this would be verified against the auth provider
      if (tempUserData) {
        const mockUser: User = {
          id: Math.random().toString(36).substring(2, 15),
          name: tempUserData.name || 'Demo User',
          email: tempUserData.email || 'user@example.com',
          phoneNumber: tempUserData.phoneNumber || '+1234567890',
        };

        setUser(mockUser);
        // Note: We don't set isAuthenticated to true yet because the user needs to select a role
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Verify code error:', error);
      return Promise.reject(error);
    }
  };

  const setUserRole = async (role: UserRole) => {
    try {
      setUserRoleState(role);
      setIsAuthenticated(true);
      return Promise.resolve();
    } catch (error) {
      console.error('Set user role error:', error);
      return Promise.reject(error);
    }
  };

  const signOut = () => {
    try {
      setUser(null);
      setUserRoleState(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        verifyCode,
        setUserRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }