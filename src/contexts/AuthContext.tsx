import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  googleAccessToken: null,
  setGoogleAccessToken: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for valid token
    const storedToken = localStorage.getItem('gcal_token');
    const storedTime = localStorage.getItem('gcal_token_time');
    if (storedToken && storedTime) {
      const timeDiff = Date.now() - parseInt(storedTime, 10);
      if (timeDiff < 50 * 60 * 1000) { // Token valid for ~50 mins
        setGoogleAccessToken(storedToken);
      } else {
        localStorage.removeItem('gcal_token');
        localStorage.removeItem('gcal_token_time');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, setGoogleAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
