import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';

const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || 
                  import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'demo@demo.com',
  displayName: 'Demo User'
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
  const [user, setUser] = useState(DEMO_MODE ? DEMO_USER : null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode] = useState(DEMO_MODE);

  useEffect(() => {
    if (!DEMO_MODE) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  const signup = async (email, password, displayName) => {
    if (DEMO_MODE) {
      const user = { ...DEMO_USER, email, displayName };
      localStorage.setItem('demo_user', JSON.stringify(user));
      setUser(user);
      return { user };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  };

  const login = async (email, password) => {
    if (DEMO_MODE) {
      const user = { ...DEMO_USER, email };
      localStorage.setItem('demo_user', JSON.stringify(user));
      setUser(user);
      return { user };
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (DEMO_MODE) {
      localStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    isDemoMode,
    signup,
    login,
    logout,
    demoGalleries: DEMO_MODE ? loadDemoGalleries() : null,
    demoItems: DEMO_MODE ? loadDemoItems() : null,
    saveDemoGalleries: DEMO_MODE ? saveDemoGalleries : null,
    saveDemoItems: DEMO_MODE ? saveDemoItems : null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { DEMO_MODE };
