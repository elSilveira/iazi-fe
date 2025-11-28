"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, AlertCircle, Building } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading && isAuthenticated && user) {
        console.log("ProtectedRoute - checking access for role:", requiredRole);
        console.log("ProtectedRoute - user:", user);
        
        let access = false;
        
        // Admin has access to everything
        if (user.admin || user.isAdmin || user.role === "admin") {
          access = true;
        }
        // Check specific role requirements
        else if (requiredRole === "professional") {
          access = user.isProfessional || user.role === "professional" || !!user.professionalId;
        }
        else if (requiredRole === "company") {
          access = user.hasCompany || user.role === "company" || !!user.companyId;
          console.log("ProtectedRoute - company check:", { hasCompany: user.hasCompany, companyId: user.companyId, access });
          
          // If no access and haven't tried refreshing yet, try once
          if (!access && !hasRefreshedRef.current) {
            hasRefreshedRef.current = true;
            console.log("No company access detected, refreshing user data...");
            await refreshUser();
            
            // Check again with the latest localStorage data
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                access = parsedUser.hasCompany || !!parsedUser.companyId;
                console.log("After refresh - hasAccess:", access, "companyId:", parsedUser.companyId);
              } catch (e) {
                console.error("Failed to parse stored user:", e);
              }
            }
          }
        }
        else if (requiredRole === "user" || !requiredRole) {
          access = true; // All authenticated users have "user" role
        }
        
        console.log("ProtectedRoute - final access:", access);
        setHasAccess(access);
        setIsCheckingAccess(false);
        
        // Only redirect to home if not a company route (company has special handling)
        if (!access && requiredRole !== "company") {
          router.push("/");
        }
      }
    };
    
    checkAccess();
  }, [isAuthenticated, isLoading, user, requiredRole, router, refreshUser]);

  if (isLoading || isCheckingAccess) {
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

  // Special handling for company role - show message with registration link
  if (requiredRole === "company" && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não possui uma empresa cadastrada. Cadastre sua empresa para acessar este painel.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/register-company">
                <Building className="mr-2 h-4 w-4" />
                Cadastrar Empresa
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                Voltar para Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
