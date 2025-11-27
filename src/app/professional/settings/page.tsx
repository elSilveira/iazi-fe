"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User, Bell, Calendar, Shield } from "lucide-react";
import { fetchProfessionalMe, updateProfessionalProfile } from "@/lib/api";
import { toast } from "sonner";

interface ProfessionalProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  title?: string;
  specialties?: string[];
  address?: string;
}

export default function ProfessionalSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfessionalProfile>({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    title: profile?.title || "",
    address: profile?.address || "",
  });

  const updateMutation = useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionalMe"] });
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <ProfessionalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências e informações</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="availability" className="gap-2">
                <Calendar className="h-4 w-4" />
                Disponibilidade
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Segurança
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações profissionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar} />
                      <AvatarFallback className="text-2xl">
                        {profile?.name?.[0]?.toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        Alterar foto
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name || profile?.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Título Profissional</Label>
                      <Input
                        id="title"
                        value={formData.title || profile?.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Cabeleireiro, Esteticista"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || profile?.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address || profile?.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || profile?.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Conte um pouco sobre você e sua experiência..."
                      className="min-h-[100px]"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                          {updateMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>
                    Configure como você deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { id: "email", label: "Notificações por Email", description: "Receba atualizações por email" },
                    { id: "sms", label: "Notificações por SMS", description: "Receba lembretes por SMS" },
                    { id: "push", label: "Notificações Push", description: "Notificações em tempo real" },
                    { id: "newBooking", label: "Novos Agendamentos", description: "Quando um cliente agendar" },
                    { id: "reminder", label: "Lembretes", description: "Lembretes de agendamentos próximos" },
                    { id: "review", label: "Novas Avaliações", description: "Quando receber uma avaliação" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked={item.id !== "sms"} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Trabalho</CardTitle>
                  <CardDescription>
                    Configure seus horários de disponibilidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Configuração de disponibilidade em desenvolvimento
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie a segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alterar Senha</Label>
                    <Button variant="outline">Alterar senha</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Autenticação de Dois Fatores</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança
                      </p>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProfessionalLayout>
  );
}
