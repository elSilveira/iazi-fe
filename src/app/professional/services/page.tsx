"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Clock, 
  Search, 
  Pencil,
  X,
  Calendar,
} from "lucide-react";
import { 
  fetchMyServices, 
  fetchServices, 
  fetchCategories,
  fetchProfessionalMe,
  fetchProfessionalServices,
  linkMyService, 
  updateMyService,
  unlinkMyService,
  createService,
} from "@/lib/api";
import { toast } from "sonner";

interface ServiceSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Service {
  id: string;
  serviceId?: string;
  name: string;
  description?: string;
  price: number | string | null;
  duration: number | string;
  isActive?: boolean;
  active?: boolean;
  categoryId?: number;
  schedule?: ServiceSchedule[];
  service?: {
    id: string;
    name: string;
    description?: string;
    price: number | string;
    duration: number | string;
    categoryId?: number;
    category?: Category;
  };
}

interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface Professional {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const formatPrice = (price: number | string | null | undefined) => {
  if (price === null || price === undefined) return "Não definido";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "Não definido";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numPrice);
};

const formatDuration = (duration: number | string | undefined) => {
  if (!duration) return "N/A";
  
  // Se for número, converte para formato legível
  if (typeof duration === "number") {
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  }
  
  // Se for string, verifica se já está formatada (ex: "2h", "30min", "1h 30min")
  const str = String(duration).toLowerCase().trim();
  
  // Se já contém 'h' ou 'min', retorna como está (já formatado)
  if (str.includes("h") || str.includes("min")) {
    return duration;
  }
  
  // Se for apenas número como string, converte
  const minutes = parseInt(str);
  if (!isNaN(minutes)) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  }
  
  return "N/A";
};

export default function ProfessionalServicesPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);

  // Form states for editing/creating service
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    duration: "30",
    categoryId: "",
    schedule: [] as ServiceSchedule[],
  });

  // New schedule item form
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
  });

  // Fetch professional profile to get professionalId
  const { data: professionalData } = useQuery<Professional>({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });
  const professionalId = professionalData?.id;

  const { data: servicesData = [], isLoading, refetch: refetchServices } = useQuery<Service[]>({
    queryKey: ["myServices", professionalId],
    queryFn: async () => {
      // Tenta buscar via /professionals/services primeiro
      try {
        const data = await fetchMyServices();
        return data;
      } catch {
        // Fallback para /professionals/{id}/services
        if (professionalId) {
          return fetchProfessionalServices(professionalId);
        }
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    enabled: !!professionalId,
  });

  // Normalize services data
  const services: Service[] = servicesData.map((s) => ({
    ...s,
    id: s.serviceId || s.service?.id || s.id,
    name: s.service?.name || s.name,
    description: s.description || s.service?.description,
    price: s.price ?? s.service?.price ?? null,
    duration: s.service?.duration || s.duration,
    categoryId: s.service?.categoryId || s.categoryId,
  }));

  // Fetch all available services from catalog
  const { data: availableServicesData, isLoading: loadingAvailable } = useQuery({
    queryKey: ["allServices"],
    queryFn: () => fetchServices(),
    enabled: showAddDialog,
  });
  const availableServices: Service[] = availableServicesData?.data || availableServicesData || [];

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: showEditDialog || showCreateDialog,
  });
  const categories: Category[] = categoriesData?.data || categoriesData || [];

  // Filter out services already linked
  const linkedServiceIds = new Set(services.map((s) => s.id));
  const filteredAvailableServices = availableServices.filter(
    (s) =>
      !linkedServiceIds.has(s.id) &&
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const linkServiceMutation = useMutation({
    mutationFn: ({ serviceId, data }: { 
      serviceId: string; 
      data?: {
        price?: number;
        description?: string;
        duration?: string;
        schedule?: ServiceSchedule[];
      }
    }) => {
      if (!professionalId) throw new Error("Professional ID not found");
      return linkMyService(professionalId, serviceId, data);
    },
    onSuccess: () => {
      toast.success("Serviço vinculado com sucesso!");
      refetchServices();
      setShowAddDialog(false);
      setShowEditDialog(false);
      setSearchQuery("");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao vincular serviço");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, data }: { 
      serviceId: string; 
      data: {
        price?: number;
        description?: string;
        duration?: string;
        schedule?: ServiceSchedule[];
      }
    }) => {
      if (!professionalId) throw new Error("Professional ID not found");
      return updateMyService(professionalId, serviceId, data);
    },
    onSuccess: () => {
      toast.success("Serviço atualizado com sucesso!");
      refetchServices();
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: createService,
    onSuccess: (newService) => {
      toast.success("Serviço criado com sucesso!");
      linkServiceMutation.mutate({ 
        serviceId: newService.id, 
        data: {
          price: formData.price ? parseFloat(formData.price) : undefined,
          description: formData.description || undefined,
          duration: formData.duration ? `${formData.duration} min` : undefined,
          schedule: formData.schedule.length > 0 ? formData.schedule : undefined,
        }
      });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar serviço");
    },
  });

  const unlinkServiceMutation = useMutation({
    mutationFn: (serviceId: string) => {
      if (!professionalId) throw new Error("Professional ID not found");
      return unlinkMyService(professionalId, serviceId);
    },
    onSuccess: () => {
      toast.success("Serviço removido com sucesso!");
      refetchServices();
      setShowDeleteDialog(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover serviço");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      duration: "30",
      categoryId: "",
      schedule: [],
    });
    setSelectedService(null);
    setIsEditMode(false);
  };

  // Extrai o número de minutos de uma string de duração (ex: "30min", "1h", "30 min")
const parseDuration = (duration: string | number | undefined): string => {
  if (!duration) return "30";
  if (typeof duration === "number") return String(duration);
  
  const str = String(duration).toLowerCase().trim();
  
  // Tenta extrair número de minutos (ex: "30min", "30 min", "30")
  const minMatch = str.match(/^(\d+)\s*min/);
  if (minMatch) return minMatch[1];
  
  // Tenta extrair horas e converter para minutos (ex: "1h", "1h30", "1h 30min")
  const hourMatch = str.match(/^(\d+)\s*h\s*(\d*)/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]) || 0;
    const mins = parseInt(hourMatch[2]) || 0;
    return String(hours * 60 + mins);
  }
  
  // Se for só um número, retorna ele
  const numMatch = str.match(/^(\d+)/);
  if (numMatch) return numMatch[1];
  
  return "30";
};

const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      price: "",
      description: "",
      duration: parseDuration(service.duration),
      categoryId: String(service.categoryId || ""),
      schedule: [],
    });
    setShowAddDialog(false);
    setShowEditDialog(true);
    setIsEditMode(false);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      price: service.price !== null && service.price !== undefined ? String(service.price) : "",
      description: service.description || "",
      duration: parseDuration(service.duration),
      categoryId: String(service.categoryId || ""),
      schedule: service.schedule || [],
    });
    setShowEditDialog(true);
    setIsEditMode(true);
  };

  const handleSaveService = () => {
    if (!selectedService) return;

    const data = {
      price: formData.price ? parseFloat(formData.price) : undefined,
      description: formData.description || undefined,
      duration: formData.duration ? `${formData.duration} min` : undefined,
      schedule: formData.schedule.length > 0 ? formData.schedule : undefined,
    };

    if (isEditMode) {
      updateServiceMutation.mutate({ serviceId: selectedService.id, data });
    } else {
      linkServiceMutation.mutate({ serviceId: selectedService.id, data });
    }
  };

  const handleCreateService = () => {
    if (!formData.name || !formData.categoryId) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }

    const duration = parseInt(formData.duration);
    if (!duration || duration < 5) {
      toast.error("Duração deve ser no mínimo 5 minutos");
      return;
    }

    createServiceMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price) || 0,
      duration: duration,
      categoryId: parseInt(formData.categoryId),
    });
  };

  const handleUnlinkService = (service: Service) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  const getNextAvailableDay = (currentSchedule: ServiceSchedule[]) => {
    if (currentSchedule.length === 0) return 1; // Segunda-feira
    const usedDays = new Set(currentSchedule.map(s => s.dayOfWeek));
    // Procura o próximo dia disponível (1-6, depois 0)
    const orderedDays = [1, 2, 3, 4, 5, 6, 0];
    for (const day of orderedDays) {
      if (!usedDays.has(day)) return day;
    }
    return 1; // Fallback
  };

  const addScheduleItem = () => {
    let updatedSchedule: ServiceSchedule[];
    
    // Se estamos editando, atualiza o horário existente
    if (editingScheduleIndex !== null) {
      // Verifica se o novo dia já existe em outro horário (não o que estamos editando)
      const existingIndex = formData.schedule.findIndex(
        (s, i) => s.dayOfWeek === newSchedule.dayOfWeek && i !== editingScheduleIndex
      );
      
      if (existingIndex >= 0) {
        toast.error("Já existe um horário para este dia.");
        return;
      }
      
      updatedSchedule = [...formData.schedule];
      updatedSchedule[editingScheduleIndex] = { ...newSchedule };
      setFormData({ ...formData, schedule: updatedSchedule });
      setEditingScheduleIndex(null);
    } else {
      // Verifica se já existe horário para este dia
      const existingIndex = formData.schedule.findIndex(
        s => s.dayOfWeek === newSchedule.dayOfWeek
      );
      
      if (existingIndex >= 0) {
        toast.error("Já existe um horário para este dia. Use o botão editar.");
        return;
      }
      
      updatedSchedule = [...formData.schedule, { ...newSchedule }];
      setFormData({
        ...formData,
        schedule: updatedSchedule,
      });
    }
    
    // Auto seleciona o próximo dia disponível baseado no schedule atualizado
    const nextDay = getNextAvailableDay(updatedSchedule);
    setNewSchedule({
      dayOfWeek: nextDay,
      startTime: "09:00",
      endTime: "17:00",
    });
  };

  const editScheduleItem = (index: number) => {
    const item = formData.schedule[index];
    setNewSchedule({ ...item });
    setEditingScheduleIndex(index);
  };

  const cancelScheduleEdit = () => {
    setEditingScheduleIndex(null);
    const nextDay = getNextAvailableDay(formData.schedule);
    setNewSchedule({
      dayOfWeek: nextDay,
      startTime: "09:00",
      endTime: "17:00",
    });
  };

  const removeScheduleItem = (index: number) => {
    const newScheduleList = formData.schedule.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      schedule: newScheduleList,
    });
    // Se estávamos editando este item, cancela a edição
    if (editingScheduleIndex === index) {
      setEditingScheduleIndex(null);
    } else if (editingScheduleIndex !== null && editingScheduleIndex > index) {
      setEditingScheduleIndex(editingScheduleIndex - 1);
    }
  };

  const getServiceInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ProfessionalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">Meus Serviços</h1>
            <p className="text-muted-foreground">
              Cadastre os serviços que você oferece como profissional. Você poderá definir preços, duração e disponibilidade para cada um deles.
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Serviço
          </Button>
        </div>

        {/* Services List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : services.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não vinculou nenhum serviço ao seu perfil
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeiro serviço
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12 bg-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getServiceInitials(service.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{service.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {service.description || "Sem descrição disponível"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration)}
                        </span>
                        <span className={service.price ? "text-primary font-medium" : "text-amber-600"}>
                          {formatPrice(service.price)}
                        </span>
                        {service.schedule && service.schedule.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {service.schedule.length} horário(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleUnlinkService(service)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Service Dialog */}
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
                placeholder="Buscar serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
              {loadingAvailable ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredAvailableServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "Nenhum serviço encontrado"
                    : "Todos os serviços já foram vinculados"}
                </div>
              ) : (
                filteredAvailableServices.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(service.duration)}
                            </span>
                            <span className="flex items-center gap-1 text-primary font-medium">
                              {formatPrice(service.price)}
                            </span>
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
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar novo serviço
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit/Configure Service Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Editar Serviço" : "Configurar Serviço"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Atualize as configurações do serviço"
                  : "Configure o serviço antes de adicionar ao seu perfil"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              {formData.categoryId && (
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={categories.find((c) => String(c.id) === formData.categoryId)?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}

              {/* Service Schedule */}
              <div className="space-y-3">
                <Label>Horários do serviço</Label>
                
                {formData.schedule.length > 0 && (
                  <div className="space-y-2">
                    {formData.schedule.map((item, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                          editingScheduleIndex === index 
                            ? "bg-primary/10 border border-primary" 
                            : "bg-muted"
                        }`}
                      >
                        <span className="text-sm flex-1 font-medium">
                          {DAYS_OF_WEEK.find((d) => d.value === item.dayOfWeek)?.label}
                        </span>
                        <span className="text-sm">
                          {item.startTime} - {item.endTime}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editScheduleItem(index)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => removeScheduleItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 border rounded-md space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={String(newSchedule.dayOfWeek)}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="w-[110px]"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="w-[110px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addScheduleItem}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {editingScheduleIndex !== null ? "Atualizar horário" : "Adicionar horário"}
                    </Button>
                    {editingScheduleIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelScheduleEdit}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveService}
                disabled={linkServiceMutation.isPending || updateServiceMutation.isPending}
              >
                {(linkServiceMutation.isPending || updateServiceMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create New Service Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Serviço</DialogTitle>
              <DialogDescription>
                Crie um novo serviço personalizado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  placeholder="Nome do serviço"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-price">Preço (R$)</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Descrição</Label>
                <Textarea
                  id="create-description"
                  placeholder="Descreva o serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-duration">Duração (minutos)</Label>
                <Input
                  id="create-duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                >
                  <SelectTrigger>
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

              {/* Service Schedule */}
              <div className="space-y-3">
                <Label>Horários do serviço</Label>
                
                {formData.schedule.length > 0 && (
                  <div className="space-y-2">
                    {formData.schedule.map((item, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                          editingScheduleIndex === index 
                            ? "bg-primary/10 border border-primary" 
                            : "bg-muted"
                        }`}
                      >
                        <span className="text-sm flex-1 font-medium">
                          {DAYS_OF_WEEK.find((d) => d.value === item.dayOfWeek)?.label}
                        </span>
                        <span className="text-sm">
                          {item.startTime} - {item.endTime}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editScheduleItem(index)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => removeScheduleItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 border rounded-md space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={String(newSchedule.dayOfWeek)}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="w-[110px]"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="w-[110px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addScheduleItem}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {editingScheduleIndex !== null ? "Atualizar horário" : "Adicionar horário"}
                    </Button>
                    {editingScheduleIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelScheduleEdit}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateService}
                disabled={createServiceMutation.isPending || !formData.name || !formData.categoryId || !formData.duration}
              >
                {createServiceMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar e Adicionar
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
                Tem certeza que deseja remover o serviço &quot;{selectedService?.name}&quot; do seu perfil?
                Você poderá adicioná-lo novamente depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  selectedService && unlinkServiceMutation.mutate(selectedService.id)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {unlinkServiceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProfessionalLayout>
  );
}
