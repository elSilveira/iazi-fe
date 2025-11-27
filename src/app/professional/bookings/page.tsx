"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Clock, User, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchProfessionalMe, fetchProfessionalAppointments, updateAppointmentStatus } from "@/lib/api";
import { toast } from "sonner";

type AppointmentStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: { id: string; name: string; duration: number };
  user?: { id: string; name: string; email?: string; phone?: string };
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    case "confirmed":
      return <Badge className="bg-blue-100 text-blue-800">Confirmado</Badge>;
    case "in_progress":
      return <Badge className="bg-purple-100 text-purple-800">Em Andamento</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
    case "no_show":
      return <Badge className="bg-gray-100 text-gray-800">Não Compareceu</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ProfessionalBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const dateFrom = startOfMonth(new Date(selectedMonth + "-01")).toISOString().split("T")[0];
  const dateTo = endOfMonth(new Date(selectedMonth + "-01")).toISOString().split("T")[0];

  // First get the professional profile to get the ID
  const { data: professional } = useQuery({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  const professionalId = professional?.id;

  const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["professionalBookings", professionalId, dateFrom, dateTo],
    queryFn: () => fetchProfessionalAppointments(professionalId!, dateFrom, dateTo),
    enabled: !!professionalId,
  });

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      toast.success("Status atualizado com sucesso!");
      refetch();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === "all") return true;
    return apt.status.toLowerCase() === statusFilter;
  });

  const groupedByDate = filteredAppointments.reduce(
    (acc, apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
      return acc;
    },
    {} as Record<string, Appointment[]>
  );

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <ProfessionalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos</p>
          </div>

          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AppointmentStatus)}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedDates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="font-medium text-lg mb-3 sticky top-0 bg-background py-2">
                  {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="space-y-3">
                  {groupedByDate[dateKey].map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(parseISO(apt.startTime), "HH:mm")} -{" "}
                                {format(parseISO(apt.endTime), "HH:mm")}
                              </span>
                              {getStatusBadge(apt.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{apt.user?.name || "Cliente"}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {apt.service?.name || "Serviço"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {apt.status.toLowerCase() === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {apt.status.toLowerCase() === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}
