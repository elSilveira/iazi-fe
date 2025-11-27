"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Bell,
  Shield,
  Calendar,
  DollarSign,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchCompanyDetails, updateCompanyDetails } from "@/lib/api";

interface CompanySettings {
  // Scheduling
  slotDuration: number;
  advanceBookingDays: number;
  cancellationPolicy: number;
  allowInstantBooking: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderHours: number;

  // Payment
  acceptOnlinePayment: boolean;
  requireDeposit: boolean;
  depositPercentage: number;

  // Business Hours
  businessHours: {
    [key: string]: { open: string; close: string; enabled: boolean };
  };
}

const defaultSettings: CompanySettings = {
  slotDuration: 30,
  advanceBookingDays: 30,
  cancellationPolicy: 24,
  allowInstantBooking: true,
  emailNotifications: true,
  smsNotifications: false,
  reminderHours: 24,
  acceptOnlinePayment: false,
  requireDeposit: false,
  depositPercentage: 20,
  businessHours: {
    monday: { open: "09:00", close: "18:00", enabled: true },
    tuesday: { open: "09:00", close: "18:00", enabled: true },
    wednesday: { open: "09:00", close: "18:00", enabled: true },
    thursday: { open: "09:00", close: "18:00", enabled: true },
    friday: { open: "09:00", close: "18:00", enabled: true },
    saturday: { open: "09:00", close: "14:00", enabled: true },
    sunday: { open: "09:00", close: "14:00", enabled: false },
  },
};

const dayLabels: { [key: string]: string } = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => fetchCompanyDetails(companyId!),
    enabled: !!companyId,
    select: (data) => {
      // Merge API settings with defaults
      if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) =>
      updateCompanyDetails(companyId!, { settings: data }),
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyDetails", companyId] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const updateSetting = <K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateBusinessHour = (
    day: string,
    field: "open" | "close" | "enabled",
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Configurações</h1>
            <p className="text-muted-foreground">
              Configure as preferências da empresa
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Scheduling Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamento
                </CardTitle>
                <CardDescription>
                  Configure como os clientes podem agendar serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slotDuration">Duração do slot (minutos)</Label>
                    <Select
                      value={settings.slotDuration.toString()}
                      onValueChange={(v) => updateSetting("slotDuration", parseInt(v))}
                    >
                      <SelectTrigger id="slotDuration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="advanceBookingDays">
                      Antecedência máxima (dias)
                    </Label>
                    <Input
                      id="advanceBookingDays"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.advanceBookingDays}
                      onChange={(e) =>
                        updateSetting("advanceBookingDays", parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellationPolicy">
                      Política de cancelamento (horas)
                    </Label>
                    <Select
                      value={settings.cancellationPolicy.toString()}
                      onValueChange={(v) =>
                        updateSetting("cancellationPolicy", parseInt(v))
                      }
                    >
                      <SelectTrigger id="cancellationPolicy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 horas antes</SelectItem>
                        <SelectItem value="6">6 horas antes</SelectItem>
                        <SelectItem value="12">12 horas antes</SelectItem>
                        <SelectItem value="24">24 horas antes</SelectItem>
                        <SelectItem value="48">48 horas antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowInstantBooking">Agendamento instantâneo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que clientes agendem sem confirmação manual
                    </p>
                  </div>
                  <Switch
                    id="allowInstantBooking"
                    checked={settings.allowInstantBooking}
                    onCheckedChange={(checked) =>
                      updateSetting("allowInstantBooking", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Funcionamento
                </CardTitle>
                <CardDescription>
                  Defina os horários de operação da empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.businessHours).map(([day, hours]) => (
                    <div
                      key={day}
                      className="flex items-center gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex items-center gap-2 w-40">
                        <Switch
                          checked={hours.enabled}
                          onCheckedChange={(checked) =>
                            updateBusinessHour(day, "enabled", checked)
                          }
                        />
                        <span
                          className={`text-sm ${
                            !hours.enabled ? "text-muted-foreground" : ""
                          }`}
                        >
                          {dayLabels[day]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) =>
                            updateBusinessHour(day, "open", e.target.value)
                          }
                          disabled={!hours.enabled}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) =>
                            updateBusinessHour(day, "close", e.target.value)
                          }
                          disabled={!hours.enabled}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como você e seus clientes recebem notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações de novos agendamentos por email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("emailNotifications", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes por SMS para clientes
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("smsNotifications", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="reminderHours">Lembrete de agendamento</Label>
                  <Select
                    value={settings.reminderHours.toString()}
                    onValueChange={(v) =>
                      updateSetting("reminderHours", parseInt(v))
                    }
                  >
                    <SelectTrigger id="reminderHours" className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora antes</SelectItem>
                      <SelectItem value="2">2 horas antes</SelectItem>
                      <SelectItem value="6">6 horas antes</SelectItem>
                      <SelectItem value="12">12 horas antes</SelectItem>
                      <SelectItem value="24">24 horas antes</SelectItem>
                      <SelectItem value="48">48 horas antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pagamentos
                </CardTitle>
                <CardDescription>
                  Configure as opções de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptOnlinePayment">Pagamento online</Label>
                    <p className="text-sm text-muted-foreground">
                      Aceitar pagamentos online no momento do agendamento
                    </p>
                  </div>
                  <Switch
                    id="acceptOnlinePayment"
                    checked={settings.acceptOnlinePayment}
                    onCheckedChange={(checked) =>
                      updateSetting("acceptOnlinePayment", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireDeposit">Exigir depósito</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir um depósito para confirmar o agendamento
                    </p>
                  </div>
                  <Switch
                    id="requireDeposit"
                    checked={settings.requireDeposit}
                    onCheckedChange={(checked) =>
                      updateSetting("requireDeposit", checked)
                    }
                  />
                </div>

                {settings.requireDeposit && (
                  <div className="space-y-2">
                    <Label htmlFor="depositPercentage">Percentual do depósito</Label>
                    <Select
                      value={settings.depositPercentage.toString()}
                      onValueChange={(v) =>
                        updateSetting("depositPercentage", parseInt(v))
                      }
                    >
                      <SelectTrigger id="depositPercentage" className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="100">100%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações irreversíveis que afetam sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Empresa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é permanente e não pode ser desfeita. Todos os dados
                        da empresa, incluindo funcionários, serviços e histórico de
                        agendamentos serão excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          toast.info("Funcionalidade não implementada");
                        }}
                      >
                        Excluir Empresa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CompanyLayout>
  );
}
