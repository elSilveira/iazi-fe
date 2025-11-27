"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Star,
  Users,
  Loader2,
} from "lucide-react";
import { createProfessionalProfile } from "@/lib/api";

const professionalSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  bio: z.string().min(20, "Biografia deve ter pelo menos 20 caracteres"),
  specialties: z.string().min(3, "Informe pelo menos uma especialidade"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

const benefits = [
  {
    icon: Users,
    title: "Alcance mais clientes",
    description: "Seja encontrado por milhares de pessoas que buscam seus serviços.",
  },
  {
    icon: Clock,
    title: "Gerencie sua agenda",
    description: "Controle seus horários e disponibilidade de forma simples.",
  },
  {
    icon: DollarSign,
    title: "Aumente sua renda",
    description: "Receba pagamentos de forma segura e rápida.",
  },
  {
    icon: Star,
    title: "Construa sua reputação",
    description: "Receba avaliações e destaque-se no mercado.",
  },
];

export default function BecomeProfessionalPage() {
  const router = useRouter();
  const { user, updateAuthState, accessToken } = useAuth();
  const [step, setStep] = useState<"info" | "form">("info");

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      title: "",
      bio: "",
      specialties: "",
      phone: user?.phone || "",
      address: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: (data: ProfessionalFormData) => {
      const payload = {
        ...data,
        specialties: data.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      };
      return createProfessionalProfile(payload);
    },
    onSuccess: (data) => {
      toast.success("Perfil profissional criado com sucesso!");
      
      // Update user state with professional flag
      if (user && accessToken) {
        const updatedUser = {
          ...user,
          isProfessional: true,
          professionalId: data.id || data.professionalId,
        };
        updateAuthState(updatedUser, accessToken);
      }
      
      router.push("/professional/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar perfil profissional");
    },
  });

  const onSubmit = (data: ProfessionalFormData) => {
    createProfileMutation.mutate(data);
  };

  if (user?.isProfessional) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto px-4 py-12">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Você já é um profissional!</h2>
                <p className="text-muted-foreground mb-6">
                  Acesse seu painel para gerenciar seus serviços e agendamentos.
                </p>
                <Button onClick={() => router.push("/professional/dashboard")}>
                  Ir para o Painel
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          {step === "info" ? (
            <div className="max-w-4xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Seja um Profissional iAzi
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Junte-se a milhares de profissionais que já usam o iAzi para 
                  gerenciar seus negócios e conquistar novos clientes.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {benefits.map((benefit, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button size="lg" onClick={() => setStep("form")}>
                  Começar Agora
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  É grátis e leva apenas alguns minutos
                </p>
              </div>
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Criar Perfil Profissional</CardTitle>
                <CardDescription>
                  Preencha as informações abaixo para começar a oferecer seus serviços.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Profissional</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Cabeleireira, Manicure, Massagista..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Como você quer ser identificado na plataforma
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especialidades</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Corte feminino, Coloração, Penteados"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Separe suas especialidades por vírgula
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobre você</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Conte um pouco sobre sua experiência e trabalho..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Esta descrição aparecerá no seu perfil público
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 99999-9999"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, número, bairro, cidade"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Onde você atende seus clientes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("info")}
                        disabled={createProfileMutation.isPending}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createProfileMutation.isPending}
                      >
                        {createProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          "Criar Perfil Profissional"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
