"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Save, User, Bell, Calendar, Shield, Clock, Copy, Check } from "lucide-react";
import { fetchProfessionalMe, updateProfessionalProfile } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  workingHours?: WorkingHours;
}

interface DaySchedule {
  isOpen: boolean;
  start: string;
  end: string;
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

const DAYS_OF_WEEK = [
  { key: "monday" as const, label: "Segunda-feira", short: "Seg" },
  { key: "tuesday" as const, label: "Terça-feira", short: "Ter" },
  { key: "wednesday" as const, label: "Quarta-feira", short: "Qua" },
  { key: "thursday" as const, label: "Quinta-feira", short: "Qui" },
  { key: "friday" as const, label: "Sexta-feira", short: "Sex" },
  { key: "saturday" as const, label: "Sábado", short: "Sáb" },
  { key: "sunday" as const, label: "Domingo", short: "Dom" },
];

const EMPTY_WORKING_HOURS: WorkingHours = {
  monday: { isOpen: false, start: "09:00", end: "18:00" },
  tuesday: { isOpen: false, start: "09:00", end: "18:00" },
  wednesday: { isOpen: false, start: "09:00", end: "18:00" },
  thursday: { isOpen: false, start: "09:00", end: "18:00" },
  friday: { isOpen: false, start: "09:00", end: "18:00" },
  saturday: { isOpen: false, start: "09:00", end: "13:00" },
  sunday: { isOpen: false, start: "09:00", end: "13:00" },
};

export default function ProfessionalSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);

  const { data: profile, isLoading } = useQuery<ProfessionalProfile>({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  // Initialize working hours from profile
  useEffect(() => {
    if (profile) {
      setWorkingHours(profile.workingHours || null);
    }
  }, [profile]);

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

  const updateWorkingHoursMutation = useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionalMe"] });
      toast.success("Horários de trabalho atualizados com sucesso!");
      setIsEditingHours(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar horários de trabalho");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleSaveWorkingHours = () => {
    if (workingHours) {
      updateWorkingHoursMutation.mutate({ workingHours });
    }
  };

  const initializeWorkingHours = () => {
    setWorkingHours(EMPTY_WORKING_HOURS);
    setIsEditingHours(true);
  };

  const handleDayToggle = (day: keyof WorkingHours) => {
    if (!workingHours) return;
    setWorkingHours({
      ...workingHours,
      [day]: { ...workingHours[day], isOpen: !workingHours[day].isOpen },
    });
  };

  const handleTimeChange = (day: keyof WorkingHours, field: "start" | "end", value: string) => {
    if (!workingHours) return;
    setWorkingHours({
      ...workingHours,
      [day]: { ...workingHours[day], [field]: value },
    });
  };

  const copyToAllDays = (sourceDay: keyof WorkingHours) => {
    if (!workingHours) return;
    const source = workingHours[sourceDay];
    const newHours = { ...workingHours };
    DAYS_OF_WEEK.forEach(({ key }) => {
      if (key !== sourceDay) {
        newHours[key] = { ...source };
      }
    });
    setWorkingHours(newHours);
    toast.success("Horários copiados para todos os dias");
  };

  const copyToWeekdays = (sourceDay: keyof WorkingHours) => {
    if (!workingHours) return;
    const source = workingHours[sourceDay];
    const newHours = { ...workingHours };
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((key) => {
      if (key !== sourceDay) {
        newHours[key as keyof WorkingHours] = { ...source };
      }
    });
    setWorkingHours(newHours);
    toast.success("Horários copiados para dias úteis");
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
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horários de Trabalho
                  </CardTitle>
                  <CardDescription>
                    Configure seus horários de disponibilidade para cada dia da semana.
                    Seus clientes só poderão agendar nos horários configurados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!workingHours ? (
                    /* Empty state - no working hours configured */
                    <div className="text-center py-8 space-y-4">
                      <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <div>
                        <p className="font-medium">Horários não configurados</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Configure seus horários de trabalho para que seus clientes possam agendar serviços.
                        </p>
                      </div>
                      <Button onClick={initializeWorkingHours}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Configurar Horários
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Quick actions */}
                      {isEditingHours && (
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground mr-2">Ações rápidas:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToWeekdays("monday")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar Segunda para dias úteis
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToAllDays("monday")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar Segunda para todos
                          </Button>
                        </div>
                      )}

                      {/* Days list */}
                      <div className="space-y-4">
                        {DAYS_OF_WEEK.map(({ key, label, short }) => (
                          <div
                            key={key}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border transition-colors",
                              workingHours[key].isOpen 
                                ? "bg-background" 
                                : "bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between sm:w-48">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={workingHours[key].isOpen}
                                  onCheckedChange={() => handleDayToggle(key)}
                                  disabled={!isEditingHours}
                                />
                                <div>
                                  <p className="font-medium hidden sm:block">{label}</p>
                                  <p className="font-medium sm:hidden">{short}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {workingHours[key].isOpen ? "Aberto" : "Fechado"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {workingHours[key].isOpen && (
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`${key}-start`} className="text-sm text-muted-foreground whitespace-nowrap">
                                    Das
                                  </Label>
                                  <Input
                                    id={`${key}-start`}
                                    type="time"
                                    value={workingHours[key].start}
                                    onChange={(e) => handleTimeChange(key, "start", e.target.value)}
                                    className="w-32"
                                    disabled={!isEditingHours}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`${key}-end`} className="text-sm text-muted-foreground whitespace-nowrap">
                                    às
                                  </Label>
                                  <Input
                                    id={`${key}-end`}
                                    type="time"
                                    value={workingHours[key].end}
                                    onChange={(e) => handleTimeChange(key, "end", e.target.value)}
                                    className="w-32"
                                    disabled={!isEditingHours}
                                  />
                                </div>
                              </div>
                            )}

                            {!workingHours[key].isOpen && (
                              <div className="flex-1 text-sm text-muted-foreground italic">
                                Não disponível para agendamentos
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Save/Edit buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {isEditingHours ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingHours(false);
                                // Reset to original values
                                setWorkingHours(profile?.workingHours || null);
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleSaveWorkingHours}
                              disabled={updateWorkingHoursMutation.isPending}
                            >
                              {updateWorkingHoursMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              Salvar Horários
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => setIsEditingHours(true)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Editar Horários
                          </Button>
                        )}
                      </div>

                      {/* Info box */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Dica:</strong> Os horários disponíveis são gerados automaticamente a cada 15 minutos 
                          dentro do período configurado. Agendamentos existentes e bloqueios de agenda serão 
                          considerados ao exibir a disponibilidade para seus clientes.
                        </p>
                      </div>
                    </>
                  )}
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
