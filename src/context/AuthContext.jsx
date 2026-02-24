import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/config';

const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.VITE_SUPABASE_URL === '';



const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@demo.com',
  user_metadata: { display_name: 'Demo User' }
};

const loadDemoGalleries = () => {
  const data = localStorage.getItem('demo_galleries');
  return data ? JSON.parse(data) : [];
};

const saveDemoGalleries = (galleries) => {
  localStorage.setItem('demo_galleries', JSON.stringify(galleries));
};

const loadDemoItems = () => {
  const data = localStorage.getItem('demo_items');
  return data ? JSON.parse(data) : [];
};

const saveDemoItems = (items) => {
  localStorage.setItem('demo_items', JSON.stringify(items));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(isDemoMode ? DEMO_USER : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
    
    if (!isDemoMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        
        setUser(session?.user || null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signup = async (email, password, displayName) => {
    
    
    if (isDemoMode) {
      const user = { ...DEMO_USER, email, user_metadata: { display_name: displayName } };
      localStorage.setItem('demo_user', JSON.stringify(user));
      setUser(user);
      return { user };
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  };

  const login = async (email, password) => {
    
    
    if (isDemoMode) {
      const user = { ...DEMO_USER, email };
      localStorage.setItem('demo_user', JSON.stringify(user));
      setUser(user);
      return { user };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    
    
    if (isDemoMode) {
      localStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    user,
    loading,
    isDemoMode,
    signup,
    login,
    logout,
    demoGalleries: isDemoMode ? loadDemoGalleries() : null,
    demoItems: isDemoMode ? loadDemoItems() : null,
    saveDemoGalleries: isDemoMode ? saveDemoGalleries : null,
    saveDemoItems: isDemoMode ? saveDemoItems : null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { isDemoMode };
