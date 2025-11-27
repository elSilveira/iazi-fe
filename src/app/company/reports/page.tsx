"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Download,
  BarChart3,
  PieChart,
  Star,
} from "lucide-react";
import { fetchCompanyAppointments, fetchCompanyStaff, fetchCompanyServices, fetchCompanyReviews } from "@/lib/api";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, subQuarters } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  status: string;
  userId: string;
  price?: number;
  serviceId?: string;
  professionalId?: string;
}

export default function CompanyReportsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [period, setPeriod] = useState("month");

  // Get date range based on period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "week":
        return { from: startOfWeek(now), to: endOfWeek(now) };
      case "month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "quarter":
        return { from: subQuarters(now, 1), to: now };
      case "year":
        return { from: startOfYear(now), to: now };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["companyAppointments", companyId, period],
    queryFn: () => fetchCompanyAppointments(companyId!, {
      dateFrom: dateRange.from.toISOString().split("T")[0],
      dateTo: dateRange.to.toISOString().split("T")[0],
    }),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["companyServices", companyId],
    queryFn: () => fetchCompanyServices(companyId!),
    enabled: !!companyId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["companyReviews", companyId],
    queryFn: () => fetchCompanyReviews(companyId!),
    enabled: !!companyId,
  });

  const isLoading = appointmentsLoading;

  // Calculate report data from fetched data
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED");
  const pendingAppointments = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");
  
  const totalRevenue = completedAppointments.reduce((acc, a) => acc + (a.price || 0), 0);
  const uniqueClients = new Set(appointments.map((a) => a.userId)).size;
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviews.length
    : 0;

  // Calculate top services
  const serviceCountMap: Record<string, { count: number; revenue: number }> = {};
  appointments.forEach((apt) => {
    if (apt.serviceId) {
      if (!serviceCountMap[apt.serviceId]) {
        serviceCountMap[apt.serviceId] = { count: 0, revenue: 0 };
      }
      serviceCountMap[apt.serviceId].count += 1;
      if (apt.status === "COMPLETED") {
        serviceCountMap[apt.serviceId].revenue += apt.price || 0;
      }
    }
  });

  const topServices = Object.entries(serviceCountMap)
    .map(([id, data]) => {
      const service = services.find((s: { id: string; name: string }) => s.id === id);
      return { name: service?.name || "Serviço", ...data };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate top professionals
  const professionalCountMap: Record<string, { appointments: number }> = {};
  appointments.forEach((apt) => {
    if (apt.professionalId) {
      if (!professionalCountMap[apt.professionalId]) {
        professionalCountMap[apt.professionalId] = { appointments: 0 };
      }
      professionalCountMap[apt.professionalId].appointments += 1;
    }
  });

  const topProfessionals = Object.entries(professionalCountMap)
    .map(([id, data]) => {
      const professional = staff.find((s: { id: string; name: string; rating?: number }) => s.id === id);
      return { 
        name: professional?.name || "Profissional", 
        appointments: data.appointments,
        rating: professional?.rating || 0,
      };
    })
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 5);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getPeriodLabel = () => {
    switch (period) {
      case "week":
        return "Esta semana";
      case "month":
        return format(new Date(), "MMMM yyyy", { locale: ptBR });
      case "quarter":
        return "Último trimestre";
      case "year":
        return "Este ano";
      default:
        return "";
    }
  };

  const completionRate = appointments.length > 0
    ? (completedAppointments.length / appointments.length) * 100
    : 0;

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise de desempenho da empresa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {completedAppointments.length} serviços concluídos
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {appointments.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {completedAppointments.length} concluídos, {cancelledAppointments.length} cancelados
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {uniqueClients}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    clientes únicos no período
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {completionRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Agendamentos concluídos
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status dos Agendamentos
            </CardTitle>
            <CardDescription>{getPeriodLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum agendamento no período
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concluídos</span>
                    <span className="font-medium">
                      {completedAppointments.length} ({completionRate.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={completionRate} className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cancelados</span>
                    <span className="font-medium">
                      {cancelledAppointments.length} (
                      {appointments.length > 0
                        ? ((cancelledAppointments.length / appointments.length) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                  <Progress
                    value={
                      appointments.length > 0
                        ? (cancelledAppointments.length / appointments.length) * 100
                        : 0
                    }
                    className="bg-muted [&>div]:bg-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pendentes</span>
                    <span className="font-medium">
                      {pendingAppointments.length} (
                      {appointments.length > 0
                        ? ((pendingAppointments.length / appointments.length) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                  <Progress
                    value={
                      appointments.length > 0
                        ? (pendingAppointments.length / appointments.length) * 100
                        : 0
                    }
                    className="bg-muted [&>div]:bg-yellow-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Services and Professionals */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Serviços Mais Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topServices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum serviço no período
                </p>
              ) : (
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.count} agendamentos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(service.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profissionais em Destaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topProfessionals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum profissional no período
                </p>
              ) : (
                <div className="space-y-4">
                  {topProfessionals.map((professional, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{professional.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {professional.appointments} agendamentos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">
                          {professional.rating > 0 ? professional.rating.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rating Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviews.length} avaliações
                </p>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground">
                  {averageRating >= 4.5
                    ? "Excelente! Seus clientes estão muito satisfeitos."
                    : averageRating >= 4
                    ? "Muito bom! Continue mantendo a qualidade."
                    : averageRating >= 3
                    ? "Bom, mas há espaço para melhorias."
                    : reviews.length > 0
                    ? "Atenção! Revise o feedback dos clientes."
                    : "Ainda não há avaliações suficientes."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CompanyLayout>
  );
}
