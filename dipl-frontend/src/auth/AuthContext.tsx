import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/auth";
import { usersApi } from "../api/users";
import { organisationsApi } from "../api/organisations";
import type { UserDB, OrganisationPublic } from "../types/api";

type Role = "user" | "organisation" | "admin" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  user: UserDB | null;
  organisation: OrganisationPublic | null;
  loginUser: (username: string, password: string) => Promise<void>;
  loginOrg: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerUser: (data: any) => Promise<void>;
  registerOrg: (data: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT token (simple base64 decode)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Detect role from token or API call
async function detectRole(token: string): Promise<Role> {
  const decoded = decodeJWT(token);
  
  // Check token payload for role
  if (decoded?.role === "admin") {
    return "admin";
  }
  
  // Try to detect by calling user/me endpoint
  try {
    await usersApi.getMe();
    return "user";
  } catch {
    // If user/me fails, try org/me
    try {
      await organisationsApi.getMe();
      return "organisation";
    } catch {
      // If both fail, check token for hints
      if (decoded?.sub || decoded?.username) {
        // Could be user or org, default to user
        return "user";
      }
      return null;
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<UserDB | null>(null);
  const [organisation, setOrganisation] = useState<OrganisationPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      initializeAuth(token);
    } else {
      setLoading(false);
    }
  }, []);

  const initializeAuth = async (token: string) => {
    try {
      const detectedRole = await detectRole(token);
      setRole(detectedRole);
      setIsAuthenticated(true);

      if (detectedRole === "user") {
        const userData = await usersApi.getMe();
        setUser(userData);
      } else if (detectedRole === "organisation") {
        const orgData = await organisationsApi.getMe();
        setOrganisation(orgData);
      } else if (detectedRole === "admin") {
        // Admin might have user data too
        try {
          const userData = await usersApi.getMe();
          setUser(userData);
        } catch {
          // Admin might not have user profile
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (username: string, password: string) => {
    const response = await authApi.loginUser(username, password);
    localStorage.setItem("token", response.access_token);
    await initializeAuth(response.access_token);
  };

  const loginOrg = async (email: string, password: string) => {
    const response = await authApi.loginOrg(email, password);
    localStorage.setItem("token", response.access_token);
    await initializeAuth(response.access_token);
  };

  const registerUser = async (data: any) => {
    await authApi.registerUser(data);
    // User needs to login manually after registration
  };

  const registerOrg = async (data: any) => {
    await authApi.registerOrg(data);
    // Note: Org registration might require admin approval, so no auto-login
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setOrganisation(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        organisation,
        loginUser,
        loginOrg,
        logout,
        registerUser,
        registerOrg,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

