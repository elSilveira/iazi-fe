"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Tags,
  ChevronsUpDown,
  Check,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { registerCompany, fetchCategories } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  description?: string;
}

const companySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().length(14, "CNPJ deve ter 14 dígitos").regex(/^\d+$/, "CNPJ deve conter apenas números"),
  description: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
  address: z.object({
    street: z.string().min(5, "Endereço é obrigatório"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro é obrigatório"),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().length(2, "Estado deve ter 2 caracteres"),
    zipCode: z.string().regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato 00000-000"),
  }),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function RegisterCompanyPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  
  const categories: Category[] = categoriesData || [];
  
  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      description: "",
      email: user?.email || "",
      phone: "",
      website: "",
      categories: [],
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

  // Watch categories for reactive updates
  const watchedCategories = useWatch({
    control: form.control,
    name: "categories",
    defaultValue: [],
  });

  const registerMutation = useMutation({
    mutationFn: registerCompany,
    onSuccess: async () => {
      toast.success("Empresa registrada com sucesso!");
      await refreshUser();
      router.push("/company/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar empresa");
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    registerMutation.mutate(data);
  };

  const handleNextStep = async () => {
    // Validate step 1 fields before proceeding
    if (step === 1) {
      const fieldsToValidate: (keyof CompanyFormData)[] = ["name", "cnpj", "email", "phone"];
      const isValid = await form.trigger(fieldsToValidate);
      
      if (isValid) {
        setStep(2);
      } else {
        // Show toast with validation errors
        const errors = form.formState.errors;
        const errorMessages: string[] = [];
        
        if (errors.name) errorMessages.push("Nome da empresa");
        if (errors.cnpj) errorMessages.push("CNPJ");
        if (errors.email) errorMessages.push("Email");
        if (errors.phone) errorMessages.push("Telefone");
        
        if (errorMessages.length > 0) {
          toast.error(`Corrija os campos: ${errorMessages.join(", ")}`);
        }
      }
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits;
  };

  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    // Apply mask: 00000-000
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  return (
    <>
      <Navigation />
      <main className="container max-w-3xl mx-auto py-8 px-4 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cadastrar Empresa</h1>
          <p className="text-muted-foreground">
            Registre sua empresa para gerenciar serviços, equipe e agendamentos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
            </div>
            <span className="ml-2 font-medium">Informações</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
            </div>
            <span className="ml-2 font-medium">Endereço</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações da Empresa
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados básicos da sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome fantasia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000000000000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(formatCNPJ(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>Apenas números</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua empresa..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="contato@empresa.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
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
                                placeholder="11999999999"
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
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://www.suaempresa.com.br"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categories Field */}
                  <FormField
                    control={form.control}
                    name="categories"
                    render={() => (
                      <FormItem className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-base">Categorias *</FormLabel>
                        </div>
                        <FormDescription className="mb-2">
                          Selecione as categorias de serviços que sua empresa oferece
                        </FormDescription>
                        {categoriesLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando categorias...
                          </div>
                        ) : (
                          <>
                            <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoriesOpen}
                                    className={cn(
                                      "w-full justify-between",
                                      watchedCategories.length === 0 && "text-muted-foreground"
                                    )}
                                  >
                                    {watchedCategories.length > 0
                                      ? `${watchedCategories.length} categoria(s) selecionada(s)`
                                      : "Selecione as categorias..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-[var(--radix-popover-trigger-width)] p-2" 
                                align="start"
                                sideOffset={4}
                              >
                                {/* Search Input */}
                                <div className="flex items-center gap-2 border-b pb-2 mb-2 px-1">
                                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Buscar categoria..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                  />
                                </div>
                                
                                {/* Categories List */}
                                <div className="max-h-[200px] overflow-y-auto">
                                  {filteredCategories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Nenhuma categoria encontrada.
                                    </p>
                                  ) : (
                                    <div className="space-y-1">
                                      {filteredCategories.map((category) => {
                                        const isSelected = watchedCategories.includes(category.id);
                                        return (
                                          <div
                                            key={category.id}
                                            className={cn(
                                              "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                              isSelected && "bg-accent/50"
                                            )}
                                            onClick={() => {
                                              const currentValues = [...watchedCategories];
                                              let newValues: string[];
                                              
                                              if (isSelected) {
                                                newValues = currentValues.filter((id) => id !== category.id);
                                              } else {
                                                newValues = [...currentValues, category.id];
                                              }
                                              
                                              form.setValue("categories", newValues, { 
                                                shouldValidate: true,
                                                shouldDirty: true,
                                                shouldTouch: true 
                                              });
                                            }}
                                          >
                                            <div
                                              className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                  ? "bg-primary text-primary-foreground"
                                                  : "opacity-50"
                                              )}
                                            >
                                              {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            {category.name}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Selected Categories Tags */}
                            {watchedCategories.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {watchedCategories.map((categoryId) => {
                                  const category = categories.find((c) => c.id === categoryId);
                                  if (!category) return null;
                                  return (
                                    <Badge
                                      key={categoryId}
                                      variant="secondary"
                                      className="flex items-center gap-1 pr-1"
                                    >
                                      {category.name}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newValues = watchedCategories.filter((id) => id !== categoryId);
                                          form.setValue("categories", newValues, { 
                                            shouldValidate: false,
                                            shouldDirty: true,
                                            shouldTouch: true 
                                          });
                                        }}
                                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNextStep();
                      }}
                    >
                      Próximo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </CardTitle>
                  <CardDescription>
                    Informe o endereço da empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000-000"
                            className="max-w-[200px]"
                            {...field}
                            onChange={(e) =>
                              field.onChange(formatZipCode(e.target.value))
                            }
                          />
                        </FormControl>
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
                          <FormLabel>Logradouro *</FormLabel>
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
                          <FormLabel>Número *</FormLabel>
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
                          <FormLabel>Bairro *</FormLabel>
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
                          <FormLabel>Cidade *</FormLabel>
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
                          <FormLabel>Estado *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              maxLength={2}
                              className="uppercase"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {registerMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {registerMutation.error?.message ||
                          "Erro ao registrar empresa. Tente novamente."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Cadastrar Empresa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </main>
    </>
  );
}
