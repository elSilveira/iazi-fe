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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Star,
  Users,
  Loader2,
  MapPin,
  Search,
  Phone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createProfessionalProfile } from "@/lib/api";

// Brazilian states
const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

const professionalSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  role: z.string().min(3, "Cargo/especialidade deve ter pelo menos 3 caracteres"),
  bio: z.string().min(20, "Biografia deve ter pelo menos 20 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
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
  const [step, setStep] = useState<"info" | "form" | "address">("info");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: user?.name || "",
      role: "",
      bio: "",
      phone: user?.phone || "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits;
  };

  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  // Lookup address by CEP using ViaCEP API
  const lookupCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Auto-fill address fields
      form.setValue("address.street", data.logradouro || "", { shouldValidate: true });
      form.setValue("address.neighborhood", data.bairro || "", { shouldValidate: true });
      form.setValue("address.city", data.localidade || "", { shouldValidate: true });
      form.setValue("address.state", data.uf || "", { shouldValidate: true });
      
      if (data.complemento) {
        form.setValue("address.complement", data.complemento, { shouldValidate: true });
      }

      toast.success("Endereço preenchido automaticamente");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const createProfileMutation = useMutation({
    mutationFn: (data: ProfessionalFormData) => {
      // Build payload matching API requirements
      const payload: Record<string, unknown> = {
        name: data.name,
        role: data.role,
        bio: data.bio,
        phone: data.phone,
      };

      // Add address only if it has content
      if (data.address?.zipCode || data.address?.city) {
        payload.address = data.address;
      }

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

  const handleNextStep = async () => {
    if (step === "form") {
      const fieldsToValidate: (keyof ProfessionalFormData)[] = ["name", "role", "bio", "phone"];
      const isValid = await form.trigger(fieldsToValidate);
      
      if (isValid) {
        setStep("address");
      }
    }
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
            <div className="max-w-2xl mx-auto">
              {/* Progress Steps */}
              <div className="flex items-center mb-8">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === "form" || step === "address" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {step === "address" ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                  </div>
                  <span className="ml-2 font-medium">Informações</span>
                </div>
                <div className={`flex-1 h-1 mx-4 ${step === "address" ? "bg-primary" : "bg-muted"}`} />
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === "address" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    2
                  </div>
                  <span className="ml-2 font-medium">Endereço</span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  {step === "form" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Informações Profissionais
                        </CardTitle>
                        <CardDescription>
                          Preencha os dados básicos do seu perfil profissional
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Seu nome completo"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Como você será identificado na plataforma
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo / Especialidade *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: Cabeleireiro, Manicure, Massagista..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Sua profissão ou área de atuação principal
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
                              <FormLabel>Sobre você *</FormLabel>
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
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="(11) 99999-9999"
                                    className="pl-10"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(formatPhone(e.target.value))
                                    }
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep("info")}
                          >
                            Voltar
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={handleNextStep}
                          >
                            Próximo
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {step === "address" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Endereço (Opcional)
                        </CardTitle>
                        <CardDescription>
                          Informe onde você atende seus clientes. Digite o CEP para preencher automaticamente.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="address.zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    placeholder="00000-000"
                                    className="max-w-[200px]"
                                    {...field}
                                    onChange={(e) => {
                                      const formatted = formatZipCode(e.target.value);
                                      field.onChange(formatted);
                                      // Auto-lookup when CEP is complete
                                      if (formatted.replace(/\D/g, "").length === 8) {
                                        lookupCep(formatted);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => lookupCep(field.value || "")}
                                  disabled={isLoadingCep || (field.value?.replace(/\D/g, "").length !== 8)}
                                >
                                  {isLoadingCep ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Search className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <FormDescription>
                                Digite o CEP para buscar o endereço automaticamente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-4">
                          <FormField
                            control={form.control}
                            name="address.street"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>Logradouro</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua, Avenida, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="address.number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input placeholder="123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="address.complement"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sala, andar, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="address.neighborhood"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                  <Input placeholder="Bairro" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="address.city"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input placeholder="Cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="address.state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {BRAZILIAN_STATES.map((state) => (
                                      <SelectItem key={state.code} value={state.code}>
                                        {state.code} - {state.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep("form")}
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
                      </CardContent>
                    </Card>
                  )}
                </form>
              </Form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
