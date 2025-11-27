"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Pendente
        </Badge>
      );
    case "confirmed":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Confirmado
        </Badge>
      );
    case "in_progress":
    case "in-progress":
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
          Em Andamento
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          Concluído
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function UpcomingAppointments({ appointments, isLoading }: UpcomingAppointmentsProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Próximos Agendamentos</h3>
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando agendamentos...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Próximos Agendamentos</h3>
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum agendamento próximo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">
                  {appointment.service?.name || "Serviço não disponível"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(appointment.startTime), "eee, dd/MM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointment.user?.name || "Cliente não identificado"}
                </p>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
