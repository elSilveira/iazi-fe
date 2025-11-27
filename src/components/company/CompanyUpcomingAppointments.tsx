"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CompanyAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: { id: string; name: string };
  user?: { id: string; name: string; avatar?: string };
  professional?: { id: string; name: string };
}

interface CompanyUpcomingAppointmentsProps {
  appointments: CompanyAppointment[];
  isLoading: boolean;
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
    case "confirmed":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmado</Badge>;
    case "in_progress":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Em Andamento</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Concluído</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function CompanyUpcomingAppointments({ appointments, isLoading }: CompanyUpcomingAppointmentsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum agendamento próximo
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.slice(0, 5).map((apt) => (
        <div key={apt.id} className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={apt.user?.avatar} />
            <AvatarFallback>
              {apt.user?.name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{apt.user?.name || "Cliente"}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {format(parseISO(apt.startTime), "dd/MM HH:mm", { locale: ptBR })}
              </span>
              <span className="truncate">• {apt.service?.name}</span>
            </div>
            {apt.professional && (
              <p className="text-xs text-muted-foreground">
                Profissional: {apt.professional.name}
              </p>
            )}
          </div>
          {getStatusBadge(apt.status)}
        </div>
      ))}
    </div>
  );
}
