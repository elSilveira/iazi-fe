"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { CompanyDashboardStats, CompanyDashboardStatsData } from "@/components/company/CompanyDashboardStats";
import { CompanyUpcomingAppointments, CompanyAppointment } from "@/components/company/CompanyUpcomingAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Bell } from "lucide-react";
import {
  fetchCompanyDetails,
  fetchCompanyAppointments,
  fetchCompanyServices,
} from "@/lib/api";

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [stats, setStats] = useState<CompanyDashboardStatsData | null>(null);

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany, error: companyError } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => fetchCompanyDetails(companyId!),
    enabled: !!companyId,
  });

  // Fetch company appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<CompanyAppointment[]>({
    queryKey: ["companyAppointments", companyId],
    queryFn: () => fetchCompanyAppointments(companyId!, { include: "user,service,professional" }),
    enabled: !!companyId,
  });

  // Fetch company services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["companyServices", companyId],
    queryFn: () => fetchCompanyServices(companyId!),
    enabled: !!companyId,
  });

  // Calculate stats from fetched data
  useEffect(() => {
    if (appointments) {
      const today = new Date().toDateString();
      const currentMonth = new Date().getMonth();

      const appointmentsToday = appointments.filter(
        (apt) => new Date(apt.startTime).toDateString() === today
      ).length;

      const monthlyRevenue = appointments.reduce((sum, apt: any) => {
        const apptMonth = new Date(apt.startTime).getMonth();
        const price = apt.service?.price || apt.price || 0;
        return apptMonth === currentMonth ? sum + price : sum;
      }, 0);

      const clientsThisMonth = new Set(
        appointments
          .filter((apt) => new Date(apt.startTime).getMonth() === currentMonth)
          .map((apt: any) => apt.userId || apt.user?.id)
      ).size;

      setStats({
        appointmentsToday,
        monthlyRevenue,
        clientsThisMonth,
        averageRating: company?.averageRating || 0,
      });
    }
  }, [appointments, company]);

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.startTime) >= new Date() && apt.status !== "CANCELLED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const isLoading = isLoadingCompany || isLoadingAppointments || isLoadingServices;

  if (!companyId) {
    return (
      <CompanyLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não possui uma empresa cadastrada. Cadastre sua empresa para acessar este painel.
          </AlertDescription>
        </Alert>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Dashboard - {company?.name || "Minha Empresa"}
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel administrativo da sua empresa
          </p>
        </div>

        {companyError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados da empresa.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <CompanyDashboardStats stats={stats} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyUpcomingAppointments
                appointments={upcomingAppointments}
                isLoading={isLoadingAppointments}
              />
            </CardContent>
          </Card>

          {/* Notifications/Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação nova</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum serviço cadastrado
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{services.length}</div>
                  <p className="text-sm text-muted-foreground">Serviços Ativos</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "COMPLETED").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Atendimentos (Mês)</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "PENDING").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyLayout>
  );
}
