"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import apiClient from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("Email enviado!", {
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      // Still show success to prevent email enumeration
      setIsSubmitted(true);
      toast.success("Email enviado!", {
        description: "Se o email existir, você receberá instruções para redefinir sua senha."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center p-4 h-screen">
          <Card className="w-full max-w-md shadow-lg border-border">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle 
                className="text-2xl text-foreground"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Email enviado!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Se uma conta existir com o email <strong>{email}</strong>, você receberá um link para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full"
                >
                  Tentar outro email
                </Button>
                <Link href="/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              Esqueceu sua senha?
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground text-base">
              Digite seu email e enviaremos instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Seu email"
                  className="pl-10 h-12 text-base focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instruções"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
