import { auth } from '@/firebase'; // Using alias from tsconfig.json
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{ user: User | null }>({ user: null });

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await AsyncStorage.setItem('user_session', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('user_session');
      }
      setLoading(false);
    });
    
    const checkLocalSession = async () => {
        try {
            const session = await AsyncStorage.getItem('user_session');
            if(session) {
                setUser(JSON.parse(session));
            }
        } catch (error) {
            // Error retrieving data
        } finally {
            setLoading(false);
        }
    }

    checkLocalSession();

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
} 