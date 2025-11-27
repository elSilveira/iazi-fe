"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error("Login error", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center p-4 h-screen">
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
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground text-lg">
              Acesse sua conta para gerenciar seus agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
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
                    placeholder="Senha"
                    className="pl-10 h-12 text-base focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline block"
                >
                  Esqueceu sua senha?
                </Link>
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
