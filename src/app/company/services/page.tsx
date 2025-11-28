"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";
import { 
  fetchCompanyServices, 
  createCompanyService, 
  updateCompanyService, 
  deleteCompanyService,
  fetchCategories,
  fetchCompanyStaff,
} from "@/lib/api";

// Interface baseada na resposta da API
interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string | number;
  duration: string | number;
  categoryId: number;
  companyId: string;
  image?: string;
  category?: Category;
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
}

const initialFormData: FormData = {
  name: "",
  description: "",
  price: "",
  duration: "",
  categoryId: "",
  image: "",
};

export default function CompanyServicesPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Buscar serviços da empresa
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["companyServices", companyId],
    queryFn: () => fetchCompanyServices(companyId!),
    enabled: !!companyId,
  });

  // Buscar categorias disponíveis
  const { data: categoriesData } = useQuery<Category[] | { data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  // Normalizar categorias (pode vir como array ou { data: [...] })
  const categories: Category[] = Array.isArray(categoriesData) 
    ? categoriesData 
    : categoriesData?.data || [];

  // Buscar profissionais da empresa (para exibir quantos estão vinculados)
  const { data: staff = [] } = useQuery({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  // Mutation para criar serviço
  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createCompanyService(data),
    onSuccess: () => {
      toast.success("Serviço criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyServices", companyId] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar serviço");
    },
  });

  // Mutation para atualizar serviço
  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateCompanyService(id, data),
    onSuccess: () => {
      toast.success("Serviço atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyServices", companyId] });
      handleCloseDialog();
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

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setIsEditing(false);
    setSelectedService(null);
    setFormData(initialFormData);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: String(service.duration),
      categoryId: String(service.categoryId),
      image: service.image || "",
    });
    setIsEditing(true);
    setShowAddDialog(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  const handleSubmit = () => {
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
      duration: formData.duration, // API aceita como string (minutos)
      categoryId: parseInt(formData.categoryId),
      companyId: companyId,
    };

    // Adicionar imagem se fornecida
    if (formData.image.trim()) {
      data.image = formData.image.trim();
    }

    if (isEditing && selectedService) {
      // Na atualização, não enviamos companyId
      delete data.companyId;
      updateServiceMutation.mutate({ id: selectedService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
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
            Novo Serviço
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

        {/* Add/Edit Service Dialog */}
        <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Atualize as informações do serviço"
                  : "Preencha as informações do novo serviço. Após criar, você poderá vincular profissionais a este serviço."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
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
                  <div className="mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md bg-muted">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Serviço"}
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
