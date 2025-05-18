import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  logOut, 
  onAuthChange 
} from '../lib/firebase';
import { generateVerificationCode, sendVerificationCode } from '../lib/emailjs';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pendingVerification: boolean;
  verificationEmail: string;
  verifyCode: (code: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  pendingVerification: false,
  verificationEmail: '',
  verifyCode: () => false,
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logoutUser: async () => {},
  registerWithEmail: async () => { throw new Error('Not implemented'); },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      if (!pendingVerification) {
        setUser(authUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [pendingVerification]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result) {
        // Store the user temporarily but don't set it as the main user yet
        setTempUser(result);
        const code = generateVerificationCode();
        await sendVerificationCode(email, code);
        setGeneratedCode(code);
        setVerificationEmail(email);
        setPendingVerification(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        // Store the user temporarily but don't set it as the main user yet
        setTempUser(result);
        const code = generateVerificationCode();
        await sendVerificationCode(result.email || '', code);
        setGeneratedCode(code);
        setVerificationEmail(result.email || '');
        setPendingVerification(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const verifyCode = (code: string): boolean => {
    if (code === generatedCode && tempUser) {
      // Only set the user after successful verification
      setUser(tempUser);
      setPendingVerification(false);
      setVerificationEmail('');
      setGeneratedCode('');
      setTempUser(null);
      return true;
    }
    return false;
  };

  const logoutUser = async () => {
    try {
      await logOut();
      setUser(null);
      setTempUser(null);
      setPendingVerification(false);
      setVerificationEmail('');
      setGeneratedCode('');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    pendingVerification,
    verificationEmail,
    verifyCode,
    loginWithEmail,
    loginWithGoogle,
    logoutUser,
    registerWithEmail: signUpWithEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
