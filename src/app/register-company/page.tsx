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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Phone,
  Mail,
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
  Calendar,
  ImageIcon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { registerCompany, fetchCategories } from "@/lib/api";

interface Category {
  id: number | string;
  name: string;
  icon?: string;
  description?: string;
}

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

// Working hours schema for each day
const dayScheduleSchema = z.object({
  open: z.string().nullable(),
  close: z.string().nullable(),
  isOpen: z.boolean(),
});

const workingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  description: z.string().min(1, "Descrição da empresa é obrigatória"),
  logo: z.string().url("URL inválida").optional().or(z.literal("")),
  coverImage: z.string().url("URL inválida").optional().or(z.literal("")),
  yearEstablished: z.string().regex(/^\d{4}$/, "Ano deve ter 4 dígitos").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  categories: z.array(z.string()).min(1, "Selecione pelo menos uma categoria"),
  workingHours: workingHoursSchema.optional(),
  address: z.object({
    street: z.string().min(1, "Logradouro é obrigatório"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
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
  
  // Extract categories array from API response (may come as { value: [...] } or direct array)
  const categoriesRaw = categoriesData?.value || categoriesData?.data || categoriesData || [];
  const categories: Category[] = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  
  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const defaultWorkingHours = {
    monday: { open: "09:00", close: "18:00", isOpen: true },
    tuesday: { open: "09:00", close: "18:00", isOpen: true },
    wednesday: { open: "09:00", close: "18:00", isOpen: true },
    thursday: { open: "09:00", close: "18:00", isOpen: true },
    friday: { open: "09:00", close: "18:00", isOpen: true },
    saturday: { open: "09:00", close: "13:00", isOpen: true },
    sunday: { open: null, close: null, isOpen: false },
  };

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      coverImage: "",
      yearEstablished: "",
      phone: "",
      email: user?.email || "",
      categories: [],
      workingHours: defaultWorkingHours,
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
    onSuccess: async (data) => {
      toast.success("Empresa registrada com sucesso!");
      console.log("Company registered:", data);
      
      // Get the company ID from response
      const companyId = data?.id || data?.company?.id;
      
      if (companyId) {
        console.log("Company ID from response:", companyId);
        
        // Update user in localStorage immediately
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
          try {
            const userData = JSON.parse(currentUser);
            userData.companyId = companyId;
            userData.hasCompany = true;
            localStorage.setItem("user", JSON.stringify(userData));
            console.log("Updated user in localStorage with companyId:", companyId);
          } catch (e) {
            console.error("Failed to update user in localStorage:", e);
          }
        }
      }
      
      // Refresh user data from API (this will also update state)
      await refreshUser();
      
      // Small delay to ensure state is propagated before navigation
      setTimeout(() => {
        router.push("/company/dashboard");
      }, 100);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar empresa");
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    // Transform categories from IDs to names for API
    const categoryNames = data.categories
      .map((catId) => categories.find((c) => String(c.id) === catId)?.name)
      .filter((name): name is string => !!name);

    // Build the payload matching API requirements
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      categories: categoryNames,
      address: data.address,
    };

    // Add optional fields only if they have values
    if (data.logo) payload.logo = data.logo;
    if (data.coverImage) payload.coverImage = data.coverImage;
    if (data.yearEstablished) payload.yearEstablished = data.yearEstablished;
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;
    // Backend expects workingHours as JSON string
    if (data.workingHours) payload.workingHours = JSON.stringify(data.workingHours);

    registerMutation.mutate(payload);
  };

  const handleNextStep = async () => {
    // Validate step 1 fields before proceeding
    if (step === 1) {
      const fieldsToValidate: (keyof CompanyFormData)[] = ["name", "description", "categories"];
      const isValid = await form.trigger(fieldsToValidate);
      
      if (isValid) {
        setStep(2);
      } else {
        // Show toast with validation errors
        const errors = form.formState.errors;
        const errorMessages: string[] = [];
        
        if (errors.name) errorMessages.push("Nome da empresa");
        if (errors.description) errorMessages.push("Descrição");
        if (errors.categories) errorMessages.push("Categorias");
        
        if (errorMessages.length > 0) {
          toast.error(`Corrija os campos: ${errorMessages.join(", ")}`);
        }
      }
    }
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

  // CEP lookup state
  const [isLoadingCep, setIsLoadingCep] = useState(false);

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
                  {/* Nome da Empresa */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome fantasia da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua empresa, os serviços oferecidos..."
                            className="min-h-24"
                            {...field}
                          />
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
                                        const categoryIdStr = String(category.id);
                                        const isSelected = watchedCategories.includes(categoryIdStr);
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
                                                newValues = currentValues.filter((id) => id !== categoryIdStr);
                                              } else {
                                                newValues = [...currentValues, categoryIdStr];
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
                                  const category = categories.find((c) => String(c.id) === categoryId);
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
                                            shouldValidate: true,
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

                  {/* Optional Fields Section */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      Informações Opcionais
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contato</FormLabel>
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

                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 mt-4">
                      {/* Year Established */}
                      <FormField
                        control={form.control}
                        name="yearEstablished"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Fundação</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="2020"
                                  maxLength={4}
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                    field.onChange(value);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Logo URL */}
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Logo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="https://..."
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cover Image URL */}
                      <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da Capa</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="https://..."
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Working Hours */}
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Horário de Funcionamento</h4>
                      </div>
                      <div className="space-y-3">
                        {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
                          const dayNames: Record<string, string> = {
                            monday: "Segunda-feira",
                            tuesday: "Terça-feira",
                            wednesday: "Quarta-feira",
                            thursday: "Quinta-feira",
                            friday: "Sexta-feira",
                            saturday: "Sábado",
                            sunday: "Domingo",
                          };
                          const watchedDay = form.watch(`workingHours.${day}`);
                          
                          return (
                            <div key={day} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                              <div className="w-32 text-sm font-medium">{dayNames[day]}</div>
                              <FormField
                                control={form.control}
                                name={`workingHours.${day}.isOpen`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          if (!checked) {
                                            form.setValue(`workingHours.${day}.open`, null);
                                            form.setValue(`workingHours.${day}.close`, null);
                                          } else {
                                            form.setValue(`workingHours.${day}.open`, "09:00");
                                            form.setValue(`workingHours.${day}.close`, "18:00");
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <span className="text-sm text-muted-foreground w-16">
                                      {field.value ? "Aberto" : "Fechado"}
                                    </span>
                                  </FormItem>
                                )}
                              />
                              {watchedDay?.isOpen && (
                                <>
                                  <FormField
                                    control={form.control}
                                    name={`workingHours.${day}.open`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                          <Input
                                            type="time"
                                            className="w-28"
                                            value={field.value || ""}
                                            onChange={(e) => field.onChange(e.target.value)}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <span className="text-sm text-muted-foreground">às</span>
                                  <FormField
                                    control={form.control}
                                    name={`workingHours.${day}.close`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                          <Input
                                            type="time"
                                            className="w-28"
                                            value={field.value || ""}
                                            onChange={(e) => field.onChange(e.target.value)}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

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
                    Informe o endereço da empresa. Digite o CEP para preencher automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
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
                            onClick={() => lookupCep(field.value)}
                            disabled={isLoadingCep || field.value.replace(/\D/g, "").length !== 8}
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
