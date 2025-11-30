"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building, MapPin, Save, Clock, Search, ImageIcon, Calendar, Phone, Mail, Globe, Star, Users, Briefcase, Edit } from "lucide-react";
import { toast } from "sonner";
import { fetchCompanyDetails, updateCompanyDetails, upsertCompanyAddress, fetchCategories } from "@/lib/api";

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

// Working hours type
interface DaySchedule {
  open: string | null;
  close: string | null;
  isOpen: boolean;
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  open: "07:00",
  close: "18:00",
  isOpen: true,
};

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: { open: "07:00", close: "14:00", isOpen: false },
  sunday: { open: "07:00", close: "14:00", isOpen: false },
};

const DAYS_OF_WEEK: Array<{ key: keyof WorkingHours; label: string; shortLabel: string }> = [
  { key: "monday", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "tuesday", label: "Terça-feira", shortLabel: "Ter" },
  { key: "wednesday", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "thursday", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "friday", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "saturday", label: "Sábado", shortLabel: "Sáb" },
  { key: "sunday", label: "Domingo", shortLabel: "Dom" },
];

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(1, "Descrição é obrigatória"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  logo: z.string().url("URL inválida").optional().or(z.literal("")),
  coverImage: z.string().url("URL inválida").optional().or(z.literal("")),
  yearEstablished: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  zipCode: z.string().min(8, "CEP inválido"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [hasWorkingHoursChanges, setHasWorkingHoursChanges] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Fetch company details (includes address)
  const { data: company, isLoading } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => fetchCompanyDetails(companyId!),
    enabled: !!companyId,
  });

  // Fetch categories for display
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Extract address from company response
  const address = company?.address;

  // Parse working hours from company data
  const parsedWorkingHours = (() => {
    if (!company?.workingHours) return null;
    try {
      return typeof company.workingHours === "string" 
        ? JSON.parse(company.workingHours) 
        : company.workingHours;
    } catch {
      return null;
    }
  })();

  // Initialize working hours state when data loads
  useEffect(() => {
    if (parsedWorkingHours && !workingHours) {
      setWorkingHours(parsedWorkingHours);
    }
  }, [parsedWorkingHours]);

  // Initialize with defaults if no working hours exist and user wants to edit
  const initializeWorkingHours = () => {
    setWorkingHours(DEFAULT_WORKING_HOURS);
    setIsEditingHours(true);
    setHasWorkingHoursChanges(true);
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: company?.name || "",
      description: company?.description || "",
      phone: company?.phone || "",
      email: company?.email || "",
      logo: company?.logo || "",
      coverImage: company?.coverImage || "",
      yearEstablished: company?.yearEstablished || "",
      cnpj: company?.cnpj || "",
      website: company?.website || "",
    },
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    values: {
      street: address?.street || "",
      number: address?.number || "",
      complement: address?.complement || "",
      neighborhood: address?.neighborhood || "",
      city: address?.city || "",
      state: address?.state || "",
      zipCode: address?.zipCode || "",
    },
  });

  // CEP lookup
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

      addressForm.setValue("street", data.logradouro || "", { shouldValidate: true });
      addressForm.setValue("neighborhood", data.bairro || "", { shouldValidate: true });
      addressForm.setValue("city", data.localidade || "", { shouldValidate: true });
      addressForm.setValue("state", data.uf || "", { shouldValidate: true });
      
      toast.success("Endereço preenchido automaticamente");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateCompanyDetails(companyId!, data),
    onSuccess: () => {
      toast.success("Dados atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyDetails", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar dados");
    },
  });

  // Format working hours for API (null values when closed)
  const formatWorkingHoursForApi = (hours: WorkingHours) => {
    const formatted: Record<string, { open: string | null; close: string | null; isOpen: boolean }> = {};
    for (const [day, schedule] of Object.entries(hours)) {
      formatted[day] = {
        open: schedule.isOpen ? schedule.open : null,
        close: schedule.isOpen ? schedule.close : null,
        isOpen: schedule.isOpen,
      };
    }
    return formatted;
  };

  const updateWorkingHoursMutation = useMutation({
    mutationFn: (data: { workingHours: WorkingHours }) => 
      updateCompanyDetails(companyId!, { workingHours: JSON.stringify(formatWorkingHoursForApi(data.workingHours)) }),
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyDetails", companyId] });
      setHasWorkingHoursChanges(false);
      setIsEditingHours(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar horários");
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: (data: AddressFormData) => upsertCompanyAddress(companyId!, data),
    onSuccess: () => {
      toast.success("Endereço atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyDetails", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar endereço");
    },
  });

  // Update working hours for a specific day
  const updateDaySchedule = (day: keyof WorkingHours, field: keyof DaySchedule, value: string | boolean) => {
    if (!workingHours) return;
    
    setWorkingHours(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
        },
      };
    });
    setHasWorkingHoursChanges(true);
  };

  // Copy hours from one day to all weekdays
  const copyToWeekdays = (sourceDay: keyof WorkingHours) => {
    if (!workingHours) return;
    
    const sourceSchedule = workingHours[sourceDay];
    const weekdays: (keyof WorkingHours)[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    
    setWorkingHours(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      weekdays.forEach(day => {
        updated[day] = { ...sourceSchedule };
      });
      return updated;
    });
    setHasWorkingHoursChanges(true);
    toast.success("Horários copiados para dias úteis");
  };

  // Save working hours
  const handleSaveWorkingHours = () => {
    if (!workingHours) return;
    updateWorkingHoursMutation.mutate({ workingHours });
  };

  const onSubmitProfile = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const onSubmitAddress = (data: AddressFormData) => {
    updateAddressMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <CompanyLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CompanyLayout>
    );
  }

  const dayNames: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  // Calculate stats
  const stats = {
    rating: company?.rating?.toFixed(1) || "0.0",
    reviews: company?.totalReviews || 0,
    services: company?.services?.length || company?.serviceCount || 0,
    professionals: company?.professionals?.length || company?.professionalCount || 0,
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Perfil da Empresa</h1>
          <p className="text-muted-foreground">Gerencie as informações da sua empresa</p>
        </div>

        {/* Company Header */}
        <Card className="overflow-hidden">
          {/* Cover Image */}
          {company?.coverImage && (
            <div className="h-32 md:h-48 w-full overflow-hidden bg-muted">
              <img 
                src={company.coverImage} 
                alt="Capa" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className={`p-6 ${company?.coverImage ? "-mt-12" : ""}`}>
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <div className="relative">
                <Avatar className={`h-24 w-24 border-4 border-background shadow-lg ${company?.coverImage ? "ring-2 ring-background" : ""}`}>
                  <AvatarImage src={company?.logo} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {company?.name?.[0]?.toUpperCase() || "E"}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{company?.name}</h2>
                  {company?.description && (
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {company.description}
                    </p>
                  )}
                </div>
                
                {/* Categories */}
                {company?.categories && company.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {company.categories.map((cat: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {address?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {address.city}/{address.state}
                    </span>
                  )}
                  {company?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {company.phone}
                    </span>
                  )}
                  {company?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {company.email}
                    </span>
                  )}
                  {company?.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex gap-6 pt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{stats.rating}</span>
                    <span className="text-muted-foreground text-sm">({stats.reviews} avaliações)</span>
                  </div>
                  {stats.services > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold">{stats.services}</span>
                      <span className="text-muted-foreground ml-1">serviços</span>
                    </div>
                  )}
                  {stats.professionals > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{stats.professionals}</span>
                      <span className="text-muted-foreground">profissionais</span>
                    </div>
                  )}
                  {company?.yearEstablished && (
                    <div className="text-sm">
                      <span className="font-semibold">Desde {company.yearEstablished}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="info" className="gap-2">
              <Building className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="h-4 w-4" />
              Horários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Informações públicas da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Descreva sua empresa..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(11) 99999-9999" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="contato@empresa.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="00.000.000/0000-00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://www.empresa.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={profileForm.control}
                        name="yearEstablished"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Fundação</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  placeholder="2020"
                                  maxLength={4}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Logo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} placeholder="https://..." className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da Capa</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} placeholder="https://..." className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Alterações
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>
                  Localização da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...addressForm}>
                  <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-6">
                    <FormField
                      control={addressForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="00000-000"
                                className="max-w-[200px]"
                                onChange={(e) => {
                                  const formatted = formatZipCode(e.target.value);
                                  field.onChange(formatted);
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField
                        control={addressForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Logradouro *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={addressForm.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Sala, andar, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Cidade *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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

                    <Button type="submit" disabled={updateAddressMutation.isPending}>
                      {updateAddressMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Endereço
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Horário de Funcionamento</CardTitle>
                    <CardDescription>
                      Horários em que sua empresa está aberta para atendimento
                    </CardDescription>
                  </div>
                  {workingHours && !isEditingHours && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingHours(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Horários
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!workingHours && !parsedWorkingHours ? (
                  <div className="text-center py-8 space-y-4">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                    <div>
                      <p className="font-medium">Horários não configurados</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure os horários de funcionamento para que seus clientes possam agendar serviços.
                      </p>
                    </div>
                    <Button onClick={initializeWorkingHours}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Configurar Horários
                    </Button>
                  </div>
                ) : isEditingHours ? (
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (workingHours?.monday) {
                            copyToWeekdays("monday");
                          }
                        }}
                      >
                        Copiar Segunda para dias úteis
                      </Button>
                    </div>

                    {/* Days Editor */}
                    <div className="space-y-3">
                      {DAYS_OF_WEEK.map(({ key, label }) => {
                        const schedule = workingHours?.[key];
                        return (
                          <div 
                            key={key} 
                            className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <Switch
                              checked={schedule?.isOpen ?? false}
                              onCheckedChange={(checked) => updateDaySchedule(key, "isOpen", checked)}
                            />
                            <span className="w-32 font-medium">{label}</span>
                            
                            {schedule?.isOpen ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="time"
                                  value={schedule.open || "07:00"}
                                  onChange={(e) => updateDaySchedule(key, "open", e.target.value)}
                                  className="w-28"
                                />
                                <span className="text-muted-foreground">às</span>
                                <Input
                                  type="time"
                                  value={schedule.close || "18:00"}
                                  onChange={(e) => updateDaySchedule(key, "close", e.target.value)}
                                  className="w-28"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Fechado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setWorkingHours(parsedWorkingHours);
                          setIsEditingHours(false);
                          setHasWorkingHoursChanges(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveWorkingHours}
                        disabled={!hasWorkingHoursChanges || updateWorkingHoursMutation.isPending}
                      >
                        {updateWorkingHoursMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Horários
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map(({ key, label, shortLabel }) => {
                      const schedule = (workingHours || parsedWorkingHours)?.[key];
                      const isOpen = schedule?.isOpen;
                      return (
                        <div 
                          key={key} 
                          className="flex items-center justify-between py-3 border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-32 font-medium">{label}</span>
                            <Badge variant={isOpen ? "default" : "secondary"}>
                              {isOpen ? "Aberto" : "Fechado"}
                            </Badge>
                          </div>
                          {isOpen && schedule?.open && schedule?.close && (
                            <span className="text-muted-foreground font-medium">
                              {schedule.open} - {schedule.close}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyLayout>
  );
}
