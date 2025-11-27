"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "company" | "professional" | "user";
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user) {
      // Check specific role access
      let hasAccess = false;
      
      // Admin has access to everything
      if (user.admin || user.isAdmin || user.role === "admin") {
        hasAccess = true;
      }
      // Check specific role requirements
      else if (requiredRole === "professional") {
        hasAccess = user.isProfessional || user.role === "professional" || !!user.professionalId;
      }
      else if (requiredRole === "company") {
        hasAccess = user.hasCompany || user.role === "company" || !!user.companyId;
      }
      else if (requiredRole === "user") {
        hasAccess = true; // All authenticated users have "user" role
      }
      
      if (!hasAccess) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
