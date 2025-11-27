"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Lock, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateAuthState } = useAuth();
  
  // Capture inviteCode from query string
  const inviteCode = searchParams.get("inviteCode") || "";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: { name: string; email: string; password: string; inviteCode?: string } = { 
        name, 
        email, 
        password 
      };
      if (inviteCode) {
        payload.inviteCode = inviteCode;
      }
      
      console.log("Register payload:", payload);
      
      const response = await apiClient.post("/auth/register", payload);
      const { user: registeredUser, accessToken, refreshToken } = response.data;

      if (!registeredUser || !accessToken) {
        throw new Error("Resposta de registro inválida do servidor.");
      }

      updateAuthState(registeredUser, accessToken, refreshToken);

      toast.success(`Bem-vindo(a), ${registeredUser.name}!`, {
        description: "Conta criada com sucesso! Você será redirecionado."
      });

      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao criar conta", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {inviteCode && (
        <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Código de convite:</span>
          <Badge variant="secondary" className="font-mono">{inviteCode}</Badge>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nome completo"
            className="pl-10 h-12 text-base focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email"
            className="pl-10 h-12 text-base focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Senha (mínimo 8 caracteres)"
            className="pl-10 h-12 text-base focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline"
          >
            Faça login
          </Link>
        </p>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-3">
          <div className="text-center mb-4">
            <Link href="/" className="text-3xl font-bold text-primary">
              iAzi
            </Link>
          </div>
          <CardTitle 
            className="text-3xl text-center text-foreground"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Criar conta
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground text-lg">
            Preencha seus dados para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <RegisterForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
