"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import apiClient from "@/lib/api";

type UserRole = "admin" | "company" | "professional" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profilePicture?: string;
  phone?: string;
  professionalId?: string | null;
  companyId?: string | null;
  role?: UserRole;
  admin?: boolean;
  isAdmin?: boolean;
  isProfessional?: boolean;
  hasCompany?: boolean;
};

// Utility to get effective user role
export function getEffectiveUserRole(user: User | null): UserRole {
  if (!user) return "user";
  if (user.role) return user.role;
  if (user.admin) return "admin";
  if (user.companyId) return "company";
  if (user.isProfessional) return "professional";
  return "user";
}

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (callBackend?: boolean) => Promise<void>;
  updateAuthState: (user: User, accessToken: string, refreshToken?: string) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Consistent keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load initial state from localStorage
  useEffect(() => {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedAccessToken && storedUser) {
      setAccessToken(storedAccessToken);
      if (storedRefreshToken) {
        setRefreshToken(storedRefreshToken);
      }
      try {
        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = {
          ...parsedUser,
          isAdmin: parsedUser.isAdmin ?? (parsedUser.role === "ADMIN" || parsedUser.role === "admin"),
          isProfessional: parsedUser.isProfessional ?? (parsedUser.role === "PROFESSIONAL" || parsedUser.role === "professional"),
          hasCompany: parsedUser.hasCompany ?? !!parsedUser.companyId,
        };
        setUser(normalizedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Update auth state (used by login and register)
  const updateAuthState = useCallback((loggedInUser: User, newAccessToken: string, newRefreshToken?: string) => {
    const userWithFlags = {
      ...loggedInUser,
      isAdmin: typeof loggedInUser.isAdmin === "boolean" 
        ? loggedInUser.isAdmin 
        : (typeof loggedInUser.role === "string" ? loggedInUser.role.toLowerCase() === "admin" : false) || loggedInUser.admin === true,
      isProfessional: typeof loggedInUser.isProfessional === "boolean" 
        ? loggedInUser.isProfessional 
        : (typeof loggedInUser.role === "string" ? loggedInUser.role.toLowerCase() === "professional" : false),
      hasCompany: typeof loggedInUser.hasCompany === "boolean" 
        ? loggedInUser.hasCompany 
        : !!loggedInUser.companyId,
    };
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userWithFlags));
    setAccessToken(newAccessToken);
    setUser(userWithFlags);
    if (newRefreshToken) {
      console.log("Storing refresh token:", newRefreshToken ? "present" : "missing");
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      setRefreshToken(newRefreshToken);
      // Verify it was stored
      const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      console.log("Verified stored token:", storedToken ? "stored successfully" : "STORAGE FAILED");
    } else {
      console.warn("No refresh token provided to store!");
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      console.log("Login response:", response.data); // Debug log
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userPayload } = response.data;
      
      console.log("Tokens received:", { 
        hasAccessToken: !!newAccessToken, 
        hasRefreshToken: !!newRefreshToken,
        refreshTokenValue: newRefreshToken ? "present" : "missing"
      }); // Debug log
      
      if (!newAccessToken || !userPayload) {
        throw new Error("Invalid login response from server.");
      }
      
      const loggedInUser: User = {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        avatar: userPayload.avatar ?? undefined,
        profilePicture: userPayload.profilePicture ?? undefined,
        phone: userPayload.phone ?? undefined,
        role: typeof userPayload.role === "string" ? userPayload.role.toLowerCase() as UserRole : undefined,
        professionalId: userPayload.professionalId ?? null,
        companyId: userPayload.companyId ?? null,
        isProfessional: userPayload.isProfessional ?? (userPayload.role === "PROFESSIONAL" || userPayload.role === "professional"),
        hasCompany: userPayload.hasCompany ?? !!userPayload.companyId,
        isAdmin: userPayload.isAdmin ?? (userPayload.role === "ADMIN" || userPayload.role === "admin"),
        admin: userPayload.admin ?? false,
      };
      
      updateAuthState(loggedInUser, newAccessToken, newRefreshToken);
      toast.success(`Welcome, ${loggedInUser.name}!`);
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, updateAuthState]);

  const logout = useCallback(async (callBackend = true): Promise<void> => {
    console.log("Starting logout...");
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Clear local state and storage immediately
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // Clear Axios default header
    delete apiClient.defaults.headers.common["Authorization"];

    // Optionally call backend logout
    if (callBackend && currentRefreshToken) {
      try {
        console.log("Calling backend /auth/logout");
        await apiClient.post("/auth/logout", { refreshToken: currentRefreshToken });
        console.log("Backend logout successful.");
      } catch (err) {
        console.error("Failed to call backend /auth/logout:", err);
      }
    }

    toast.success("You have been logged out successfully.");
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await apiClient.get("/auth/me");
      const userPayload = response.data;
      
      if (userPayload) {
        const refreshedUser: User = {
          id: userPayload.id,
          name: userPayload.name,
          email: userPayload.email,
          avatar: userPayload.avatar ?? undefined,
          profilePicture: userPayload.profilePicture ?? undefined,
          phone: userPayload.phone ?? undefined,
          role: typeof userPayload.role === "string" ? userPayload.role.toLowerCase() as UserRole : undefined,
          professionalId: userPayload.professionalId ?? null,
          companyId: userPayload.companyId ?? null,
          isProfessional: userPayload.isProfessional ?? (userPayload.role === "PROFESSIONAL" || userPayload.role === "professional"),
          hasCompany: userPayload.hasCompany ?? !!userPayload.companyId,
          isAdmin: userPayload.isAdmin ?? (userPayload.role === "ADMIN" || userPayload.role === "admin"),
          admin: userPayload.admin ?? false,
        };
        
        const userWithFlags = {
          ...refreshedUser,
          isAdmin: typeof refreshedUser.isAdmin === "boolean" 
            ? refreshedUser.isAdmin 
            : (typeof refreshedUser.role === "string" ? refreshedUser.role.toLowerCase() === "admin" : false) || refreshedUser.admin === true,
          isProfessional: typeof refreshedUser.isProfessional === "boolean" 
            ? refreshedUser.isProfessional 
            : (typeof refreshedUser.role === "string" ? refreshedUser.role.toLowerCase() === "professional" : false),
          hasCompany: typeof refreshedUser.hasCompany === "boolean" 
            ? refreshedUser.hasCompany 
            : !!refreshedUser.companyId,
        };
        
        localStorage.setItem(USER_KEY, JSON.stringify(userWithFlags));
        setUser(userWithFlags);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY && !event.newValue) {
        console.log("Access token removed from storage, logging out locally.");
        logout(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateAuthState,
        refreshUser,
        isAuthenticated: !!accessToken,
        isLoading,
        accessToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
