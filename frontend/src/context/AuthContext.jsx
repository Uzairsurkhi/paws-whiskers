import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, TOKEN_KEY } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setReady(true);
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => {
        // A deployment can move the store to a new database. Do not leave a
        // stale in-memory user signed in when that account no longer exists.
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout, setUser, isAdmin: user?.role === "admin" }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
