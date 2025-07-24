import { auth } from '@/firebase'; // Using alias from tsconfig.json
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{ user: User | null; login: (user: User) => void; logout: () => void; }>({ 
    user: null,
    login: () => {},
    logout: () => {}
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (user: User) => {
    setUser(user);
    await AsyncStorage.setItem('user_session', JSON.stringify(user));
  }

  const logout = async () => {
    await signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        login(user);
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user_session');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 