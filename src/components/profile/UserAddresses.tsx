"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchUserAddresses, createUserAddress, updateUserAddress, deleteUserAddress } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, Trash2, Plus, Loader2, AlertCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

// Schema for address form
const addressSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF inválido").max(2, "UF inválido"),
  zipCode: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  isPrimary: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface UserAddress {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
}

export function UserAddresses() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Fetch addresses
  const { data: addresses = [], isLoading, isError, error } = useQuery<UserAddress[], Error>({
    queryKey: ["userAddresses"],
    queryFn: fetchUserAddresses,
  });

  // Setup form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      isPrimary: false,
    },
  });

  const isPrimaryValue = watch("isPrimary");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      if (editingAddress) {
        reset({
          id: editingAddress.id,
          street: editingAddress.street,
          number: editingAddress.number,
          complement: editingAddress.complement || "",
          neighborhood: editingAddress.neighborhood,
          city: editingAddress.city,
          state: editingAddress.state,
          zipCode: editingAddress.zipCode,
          isPrimary: editingAddress.isPrimary,
        });
      } else {
        reset({
          id: undefined,
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          isPrimary: false,
        });
      }
    } else {
      setEditingAddress(null);
    }
  }, [isModalOpen, editingAddress, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createUserAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Endereço adicionado com sucesso!");
      setIsModalOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erro ao adicionar endereço.");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: AddressFormData) => {
      if (!data.id) throw new Error("ID do endereço é necessário para atualização.");
      const { id, ...updateData } = data;
      return updateUserAddress(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Endereço atualizado com sucesso!");
      setIsModalOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar endereço.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUserAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      toast.success("Endereço removido com sucesso!");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erro ao remover endereço.");
    },
  });

  const onSubmit = (formData: AddressFormData) => {
    if (editingAddress) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (addressId: string) => {
    toast.warning("Tem certeza que deseja remover este endereço?", {
      action: {
        label: "Confirmar",
        onClick: () => deleteMutation.mutate(addressId),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const openEditModal = (address: UserAddress) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Endereços</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Endereços</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os endereços.
              {error?.message && <p className="text-xs mt-2">Detalhes: {error.message}</p>}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.refetchQueries({ queryKey: ["userAddresses"] })}
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-2xl">Meus Endereços</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Editar Endereço" : "Adicionar Novo Endereço"}
              </DialogTitle>
              <DialogDescription>
                {editingAddress
                  ? "Atualize os detalhes do seu endereço."
                  : "Preencha os detalhes do novo endereço."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="street" className="text-right">
                  Rua
                </Label>
                <div className="col-span-3">
                  <Input id="street" {...register("street")} disabled={isSubmitting} />
                  {errors.street && (
                    <p className="text-sm text-destructive mt-1">{errors.street.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number" className="text-right">
                  Número
                </Label>
                <div className="col-span-3">
                  <Input id="number" {...register("number")} disabled={isSubmitting} />
                  {errors.number && (
                    <p className="text-sm text-destructive mt-1">{errors.number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="complement" className="text-right">
                  Complemento
                </Label>
                <div className="col-span-3">
                  <Input
                    id="complement"
                    {...register("complement")}
                    disabled={isSubmitting}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="neighborhood" className="text-right">
                  Bairro
                </Label>
                <div className="col-span-3">
                  <Input id="neighborhood" {...register("neighborhood")} disabled={isSubmitting} />
                  {errors.neighborhood && (
                    <p className="text-sm text-destructive mt-1">{errors.neighborhood.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  Cidade
                </Label>
                <div className="col-span-3">
                  <Input id="city" {...register("city")} disabled={isSubmitting} />
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  Estado (UF)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="state"
                    {...register("state")}
                    maxLength={2}
                    disabled={isSubmitting}
                    className="uppercase"
                    placeholder="SP"
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zipCode" className="text-right">
                  CEP
                </Label>
                <div className="col-span-3">
                  <Input
                    id="zipCode"
                    {...register("zipCode")}
                    disabled={isSubmitting}
                    placeholder="00000-000"
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isPrimary" className="text-right">
                  Endereço Principal
                </Label>
                <div className="col-span-3 flex items-center">
                  <Checkbox
                    id="isPrimary"
                    checked={isPrimaryValue}
                    onCheckedChange={(checked) => setValue("isPrimary", checked as boolean)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAddress ? "Salvar Alterações" : "Adicionar Endereço"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {addresses.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum endereço cadastrado.</p>
            <Button variant="outline" className="mt-4" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar seu primeiro endereço
            </Button>
          </div>
        )}
        {addresses.map((address) => (
          <div
            key={address.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="space-y-1">
              <h3 className="font-medium text-lg">
                {address.street}, {address.number}
                {address.isPrimary && (
                  <span className="text-xs text-primary ml-2 bg-primary/10 px-2 py-0.5 rounded">
                    Principal
                  </span>
                )}
              </h3>
              {address.complement && (
                <p className="text-muted-foreground">{address.complement}</p>
              )}
              <p className="text-muted-foreground">
                {address.neighborhood}, {address.city} - {address.state}
              </p>
              <p className="text-muted-foreground">CEP: {address.zipCode}</p>
            </div>
            <div className="flex space-x-2 flex-shrink-0 ml-4">
              <Button
                size="icon"
                variant="outline"
                className="hover:text-primary hover:border-primary"
                onClick={() => openEditModal(address)}
                disabled={deleteMutation.isPending}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="hover:text-destructive hover:border-destructive"
                onClick={() => handleDelete(address.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
