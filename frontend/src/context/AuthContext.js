// context/AuthContext.js
import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// The tutorial kept the user in React state only, so refreshing the
// page logged you out. That would break a marker's click-through, so
// the session is persisted to localStorage here.
const STORAGE_KEY = 'cbp_user';

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
