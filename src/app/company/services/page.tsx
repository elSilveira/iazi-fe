"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
  Tag,
  Users,
  ImageIcon,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchCompanyServices, 
  createCompanyService, 
  updateCompanyService, 
  deleteCompanyService,
  fetchCategories,
  fetchServices,
  fetchCompanyDetails,
} from "@/lib/api";

// Interface baseada na resposta da API
interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface DaySchedule {
  isOpen: boolean;
  start: string;
  end: string;
}

interface ServiceSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string | number;
  duration: string | number;
  categoryId: number;
  companyId?: string;
  image?: string;
  category?: Category;
  schedule?: ServiceSchedule;
  professionals?: Array<{
    professionalId: string;
    professional?: {
      id: string;
      name: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  categoryId: string;
  image: string;
  schedule: ServiceSchedule;
}

const DEFAULT_SCHEDULE: ServiceSchedule = {
  monday: { isOpen: true, start: "07:00", end: "18:00" },
  tuesday: { isOpen: true, start: "07:00", end: "18:00" },
  wednesday: { isOpen: true, start: "07:00", end: "18:00" },
  thursday: { isOpen: true, start: "07:00", end: "18:00" },
  friday: { isOpen: true, start: "07:00", end: "18:00" },
  saturday: { isOpen: false, start: "07:00", end: "14:00" },
  sunday: { isOpen: false, start: "07:00", end: "14:00" },
};

const DAYS_OF_WEEK: Array<{ key: keyof ServiceSchedule; label: string }> = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const initialFormData: FormData = {
  name: "",
  description: "",
  price: "",
  duration: "",
  categoryId: "",
  image: "",
  schedule: DEFAULT_SCHEDULE,
};

export default function CompanyServicesPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [companySchedule, setCompanySchedule] = useState<ServiceSchedule>(DEFAULT_SCHEDULE);

  // Buscar serviços da empresa
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["companyServices", companyId],
    queryFn: () => fetchCompanyServices(companyId!),
    enabled: !!companyId,
  });

  // Buscar dados da empresa para pegar horários de funcionamento
  const { data: companyData } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => fetchCompanyDetails(companyId!),
    enabled: !!companyId,
  });

  // Atualizar horários padrão baseado nos horários da empresa
  useEffect(() => {
    if (companyData?.workingHours) {
      const wh = companyData.workingHours;
      const newSchedule: ServiceSchedule = {
        monday: { isOpen: wh.monday?.isOpen ?? true, start: wh.monday?.start || "07:00", end: wh.monday?.end || "18:00" },
        tuesday: { isOpen: wh.tuesday?.isOpen ?? true, start: wh.tuesday?.start || "07:00", end: wh.tuesday?.end || "18:00" },
        wednesday: { isOpen: wh.wednesday?.isOpen ?? true, start: wh.wednesday?.start || "07:00", end: wh.wednesday?.end || "18:00" },
        thursday: { isOpen: wh.thursday?.isOpen ?? true, start: wh.thursday?.start || "07:00", end: wh.thursday?.end || "18:00" },
        friday: { isOpen: wh.friday?.isOpen ?? true, start: wh.friday?.start || "07:00", end: wh.friday?.end || "18:00" },
        saturday: { isOpen: wh.saturday?.isOpen ?? false, start: wh.saturday?.start || "07:00", end: wh.saturday?.end || "14:00" },
        sunday: { isOpen: wh.sunday?.isOpen ?? false, start: wh.sunday?.start || "07:00", end: wh.sunday?.end || "14:00" },
      };
      setCompanySchedule(newSchedule);
    }
  }, [companyData]);

  // Buscar todos os serviços do catálogo (para seleção)
  const { data: catalogServicesData, isLoading: loadingCatalog } = useQuery({
    queryKey: ["allServices"],
    queryFn: () => fetchServices(),
    enabled: showAddDialog,
  });
  const catalogServices: Service[] = catalogServicesData?.data || catalogServicesData || [];

  // Buscar categorias disponíveis
  const { data: categoriesData } = useQuery<Category[] | { data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  // Normalizar categorias (pode vir como array ou { data: [...] })
  const categories: Category[] = Array.isArray(categoriesData) 
    ? categoriesData 
    : categoriesData?.data || [];

  // Filtrar serviços do catálogo que ainda não estão vinculados à empresa
  const linkedServiceIds = new Set(services.map((s) => s.id));
  const filteredCatalogServices = catalogServices.filter(
    (s) =>
      !linkedServiceIds.has(s.id) &&
      !s.companyId && // Serviços globais (sem empresa específica)
      s.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())
  );

  // Mutation para criar/vincular serviço
  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createCompanyService(data),
    onSuccess: () => {
      toast.success("Serviço adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyServices", companyId] });
      handleCloseDialogs();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar serviço");
    },
  });

  // Mutation para atualizar serviço
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateCompanyService(id, data),
    onSuccess: () => {
      toast.success("Serviço atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyServices", companyId] });
      handleCloseDialogs();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  // Mutation para deletar serviço
  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => deleteCompanyService(id),
    onSuccess: () => {
      toast.success("Serviço removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyServices", companyId] });
      setShowDeleteDialog(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover serviço");
    },
  });

  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedService(null);
    setFormData({ ...initialFormData, schedule: companySchedule });
    setCatalogSearchQuery("");
  };

  // Selecionar serviço do catálogo para adicionar
  const handleSelectCatalogService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: String(service.price || ""),
      duration: parseDuration(service.duration),
      categoryId: String(service.categoryId || ""),
      image: service.image || "",
      schedule: service.schedule || companySchedule,
    });
    setShowAddDialog(false);
    setShowCreateDialog(true);
  };

  // Editar serviço existente
  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: parseDuration(service.duration),
      categoryId: String(service.categoryId),
      image: service.image || "",
      schedule: service.schedule || companySchedule,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  // Extrai o número de minutos de uma string de duração
  const parseDuration = (duration: string | number | undefined): string => {
    if (!duration) return "30";
    if (typeof duration === "number") return String(duration);
    
    const str = String(duration).toLowerCase().trim();
    
    const minMatch = str.match(/^(\d+)\s*min/);
    if (minMatch) return minMatch[1];
    
    const hourMatch = str.match(/^(\d+)\s*h\s*(\d*)/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]) || 0;
      const mins = parseInt(hourMatch[2]) || 0;
      return String(hours * 60 + mins);
    }
    
    const numMatch = str.match(/^(\d+)/);
    if (numMatch) return numMatch[1];
    
    return "30";
  };

  const handleSubmitCreate = () => {
    // Validações
    if (!formData.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Descrição do serviço é obrigatória");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("Duração deve ser maior que zero");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    // Montar dados para API
    const data: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      duration: formData.duration,
      categoryId: parseInt(formData.categoryId),
      companyId: companyId,
      schedule: formData.schedule,
    };

    if (formData.image.trim()) {
      data.image = formData.image.trim();
    }

    createServiceMutation.mutate(data);
  };

  const handleSubmitEdit = () => {
    if (!selectedService) return;

    // Validações
    if (!formData.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Descrição do serviço é obrigatória");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("Duração deve ser maior que zero");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    const data: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      duration: formData.duration,
      categoryId: parseInt(formData.categoryId),
      schedule: formData.schedule,
    };

    if (formData.image.trim()) {
      data.image = formData.image.trim();
    }

    updateServiceMutation.mutate({ id: selectedService.id, data });
  };

  // Atualizar horário de um dia específico
  const updateDaySchedule = (day: keyof ServiceSchedule, field: keyof DaySchedule, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }));
  };

  // Filtrar serviços pela busca
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatar preço
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  // Formatar duração
  const formatDuration = (duration: number | string) => {
    const minutes = typeof duration === "string" ? parseInt(duration) : duration;
    if (isNaN(minutes)) return "0min";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Obter nome da categoria
  const getCategoryName = (service: Service) => {
    if (service.category?.name) return service.category.name;
    const cat = categories.find(c => c.id === service.categoryId);
    return cat?.name || "Sem categoria";
  };

  // Contar profissionais vinculados ao serviço
  const getProfessionalsCount = (service: Service) => {
    return service.professionals?.length || 0;
  };

  // Obter iniciais do serviço
  const getServiceInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isPending = createServiceMutation.isPending || updateServiceMutation.isPending;

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie os serviços oferecidos pela empresa
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Serviço
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhum serviço encontrado"
                  : "Nenhum serviço cadastrado"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro serviço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                {/* Imagem do serviço */}
                {service.image && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {service.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {getCategoryName(service)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {service.description || "Sem descrição"}
                  </CardDescription>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                  </div>

                  {/* Profissionais vinculados */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {getProfessionalsCount(service)} profissional(is) vinculado(s)
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(service)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Service Dialog - Select from Catalog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Adicionar Serviço</DialogTitle>
              <DialogDescription>
                Selecione um serviço do catálogo ou crie um novo
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviço no catálogo..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
              {loadingCatalog ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredCatalogServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {catalogSearchQuery
                    ? "Nenhum serviço encontrado no catálogo"
                    : "Nenhum serviço disponível no catálogo"}
                </div>
              ) : (
                filteredCatalogServices.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectCatalogService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-primary/10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {getServiceInitials(service.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(service.duration)}
                              </span>
                              <span className="flex items-center gap-1 text-primary font-medium">
                                {formatCurrency(service.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAddDialog(false);
                  setShowCreateDialog(true);
                  setSelectedService(null);
                  setFormData({ ...initialFormData, schedule: companySchedule });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar novo serviço
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create/Configure New Service Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) handleCloseDialogs();
          else setShowCreateDialog(open);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedService ? "Configurar Serviço" : "Criar Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {selectedService 
                  ? "Configure o serviço antes de adicionar à empresa"
                  : "Preencha as informações do novo serviço"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte de Cabelo Masculino"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!!selectedService}
                  className={selectedService ? "bg-muted" : ""}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhes do serviço oferecido..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Categoria - Linha completa */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  disabled={!!selectedService}
                >
                  <SelectTrigger className={`w-full ${selectedService ? "bg-muted" : ""}`}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preço e Duração */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="45"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Horários de Funcionamento do Serviço */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Horários de Disponibilidade
                </Label>
                <p className="text-sm text-muted-foreground">
                  Configure em quais dias e horários este serviço está disponível (inicializado com os horários da empresa)
                </p>
                <div className="space-y-2 rounded-lg border p-4">
                  {DAYS_OF_WEEK.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Switch
                        checked={formData.schedule[key].isOpen}
                        onCheckedChange={(checked) => updateDaySchedule(key, "isOpen", checked)}
                      />
                      <span className="w-20 text-sm font-medium">{label}</span>
                      {formData.schedule[key].isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={formData.schedule[key].start}
                            onChange={(e) => updateDaySchedule(key, "start", e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">às</span>
                          <Input
                            type="time"
                            value={formData.schedule[key].end}
                            onChange={(e) => updateDaySchedule(key, "end", e.target.value)}
                            className="w-28"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Imagem */}
              <div className="space-y-2">
                <Label htmlFor="image">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    URL da Imagem (opcional)
                  </div>
                </Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                />
                {formData.image && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitCreate} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedService ? "Adicionar Serviço" : "Criar Serviço"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          if (!open) handleCloseDialogs();
          else setShowEditDialog(open);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
              <DialogDescription>
                Atualize as informações do serviço
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Serviço *</Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Corte de Cabelo Masculino"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição *</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Descreva detalhes do serviço oferecido..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Categoria - Linha completa */}
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preço e Duração */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Preço (R$) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duração (minutos) *</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="45"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Horários de Funcionamento do Serviço */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Horários de Disponibilidade
                </Label>
                <p className="text-sm text-muted-foreground">
                  Configure em quais dias e horários este serviço está disponível
                </p>
                <div className="space-y-2 rounded-lg border p-4">
                  {DAYS_OF_WEEK.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Switch
                        checked={formData.schedule[key].isOpen}
                        onCheckedChange={(checked) => updateDaySchedule(key, "isOpen", checked)}
                      />
                      <span className="w-20 text-sm font-medium">{label}</span>
                      {formData.schedule[key].isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={formData.schedule[key].start}
                            onChange={(e) => updateDaySchedule(key, "start", e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">às</span>
                          <Input
                            type="time"
                            value={formData.schedule[key].end}
                            onChange={(e) => updateDaySchedule(key, "end", e.target.value)}
                            className="w-28"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Imagem */}
              <div className="space-y-2">
                <Label htmlFor="edit-image">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    URL da Imagem (opcional)
                  </div>
                </Label>
                <Input
                  id="edit-image"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                />
                {formData.image && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitEdit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Serviço</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o serviço &quot;{selectedService?.name}&quot;?
                <br /><br />
                <strong className="text-destructive">Atenção:</strong> Todos os vínculos com profissionais 
                serão removidos e agendamentos futuros podem ser afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  selectedService && deleteServiceMutation.mutate(selectedService.id)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteServiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Remover Serviço
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CompanyLayout>
  );
}
