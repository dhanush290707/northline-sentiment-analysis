import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAccessToken } from "../services/api.js";
import { restoreSession, signOut as cognitoSignOut } from "../services/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    restoreSession().then((profile) => {
      if (cancelled) return;
      if (profile) {
        setAccessToken(profile.accessToken);
        setUser(profile);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async establish(profile) {
      setAccessToken(profile.accessToken);
      setUser(profile);
      const displayName = profile.name || profile.email?.split("@")[0] || "Customer";
      if (profile.email) {
        try {
          await api("/me", {
            method: "PUT",
            auth: true,
            body: { displayName, email: profile.email },
          });
        } catch {
          /* The shop still works if the profile write is unavailable. */
        }
      }
    },
    signOut() {
      cognitoSignOut();
      setAccessToken("");
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
