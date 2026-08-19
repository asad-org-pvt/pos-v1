import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { authService, UserContext } from "../services/app/AuthService";
import { setRuntimeTenantId, clearRuntimeTenantId } from "./tenantRuntime";

interface AuthTenantContextType {
  firebaseUser: FirebaseUser | null;
  userContext: UserContext | null;
  tenantId: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrgAdmin: boolean;
  isLoading: boolean;
  switchTenant: (newTenantId: string) => void;
  signOut: () => Promise<void>;
}

const AuthTenantContext = createContext<AuthTenantContextType>({
  firebaseUser: null,
  userContext: null,
  tenantId: "",
  isAuthenticated: false,
  isAdmin: false,
  isOrgAdmin: false,
  isLoading: true,
  switchTenant: () => {},
  signOut: async () => {},
});

export const AuthTenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [tenantId, setTenantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      setFirebaseUser(user);
      if (user) {
        try {
          // Force refresh token to obtain authoritative claims
          let resolved = await authService.resolveUserContext(user, true);

          if (!resolved.isProvisioned) {
            for (let attempt = 0; attempt < 3; attempt++) {
              await new Promise((r) => setTimeout(r, 500));
              resolved = await authService.resolveUserContext(user, true);
              if (resolved.isProvisioned) break;
            }
          }

          setUserContext(resolved);

          if (resolved.isProvisioned && resolved.organisationId) {
            setTenantId(resolved.organisationId);
            setRuntimeTenantId(resolved.organisationId);
            localStorage.setItem("email", user.email || "");
            localStorage.setItem("uid", user.uid);
            localStorage.setItem("org", resolved.organisationId);
          } else {
            setTenantId("");
            clearRuntimeTenantId();
          }
        } catch (e) {
          console.error("Error resolving verified token claims", e);
          setUserContext(null);
          setTenantId("");
          clearRuntimeTenantId();
        }
      } else {
        setUserContext(null);
        setTenantId("");
        clearRuntimeTenantId();
        localStorage.removeItem("org");
        localStorage.removeItem("email");
        localStorage.removeItem("uid");
        localStorage.removeItem("tkn");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const switchTenant = (newTenantId: string) => {
    // Platform administrators are authorized to switch active tenant views
    if (userContext?.role === "SUPER_ADMIN" && newTenantId && newTenantId.trim()) {
      setTenantId(newTenantId.trim());
      setRuntimeTenantId(newTenantId.trim());
      localStorage.setItem("org", newTenantId.trim());
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUserContext(null);
    setTenantId("");
    clearRuntimeTenantId();
  };

  const value: AuthTenantContextType = {
    firebaseUser,
    userContext,
    tenantId,
    isAuthenticated: !!firebaseUser && !!userContext?.isProvisioned,
    isAdmin: !!userContext?.isAdmin,
    isOrgAdmin: !!userContext?.isOrgAdmin,
    isLoading,
    switchTenant,
    signOut: handleSignOut,
  };

  return <AuthTenantContext.Provider value={value}>{children}</AuthTenantContext.Provider>;
};

export const useAuthTenant = () => useContext(AuthTenantContext);
export const useAuth = () => {
  const ctx = useContext(AuthTenantContext);
  return {
    user: ctx.firebaseUser,
    userContext: ctx.userContext,
    isAuthenticated: ctx.isAuthenticated,
    isAdmin: ctx.isAdmin,
    isLoading: ctx.isLoading,
    signOut: ctx.signOut,
  };
};
export const useTenant = () => {
  const ctx = useContext(AuthTenantContext);
  return {
    tenantId: ctx.tenantId,
    switchTenant: ctx.switchTenant,
    isOrgAdmin: ctx.isOrgAdmin,
  };
};
