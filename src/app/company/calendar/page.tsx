"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  Calendar as CalendarIcon,
} from "lucide-react";
import { fetchCompanyAppointments, fetchCompanyStaff } from "@/lib/api";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  clientName: string;
  clientAvatar?: string;
  professionalName: string;
  professionalId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

type ViewMode = "week" | "month";

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-400",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function CompanyCalendarPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["companyAppointments", companyId],
    queryFn: () => fetchCompanyAppointments(companyId!),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  const days = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Get first day of the week for the start of month
      const calendarStart = startOfWeek(start, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(end, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [currentDate, viewMode]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (selectedProfessional !== "all") {
      filtered = filtered.filter((apt) => apt.professionalId === selectedProfessional);
    }
    return filtered;
  }, [appointments, selectedProfessional]);

  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter((apt) =>
      isSameDay(parseISO(apt.date), date)
    );
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateRange = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
    } else {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Calendário</h1>
          <p className="text-muted-foreground">
            Visualize os agendamentos da empresa
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 font-medium capitalize">{formatDateRange()}</span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {staff.map((member: { id: string; name: string }) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar Grid */}
        {appointmentsLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div
                className={`grid grid-cols-7 gap-1 ${
                  viewMode === "month" ? "auto-rows-[120px]" : "auto-rows-[200px]"
                }`}
              >
                {days.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true;
                  const today = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`border rounded-lg p-2 ${
                        !isCurrentMonth ? "bg-muted/50" : ""
                      } ${today ? "border-primary" : ""}`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          today
                            ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                            : !isCurrentMonth
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </div>

                      <div className="space-y-1 overflow-y-auto max-h-[calc(100%-28px)]">
                        {dayAppointments.slice(0, viewMode === "month" ? 3 : 10).map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded ${statusColors[apt.status]} bg-opacity-20 border-l-2 ${statusColors[apt.status].replace("bg-", "border-")}`}
                          >
                            <div className="font-medium truncate">
                              {apt.time} - {apt.serviceName}
                            </div>
                            {viewMode === "week" && (
                              <>
                                <div className="truncate text-muted-foreground">
                                  {apt.clientName}
                                </div>
                                <div className="truncate text-muted-foreground">
                                  {apt.professionalName}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {dayAppointments.length > (viewMode === "month" ? 3 : 10) && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - (viewMode === "month" ? 3 : 10)} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded ${statusColors[status as keyof typeof statusColors]}`}
              />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Today's Appointments Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getAppointmentsForDay(new Date()).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {getAppointmentsForDay(new Date()).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    <Avatar>
                      <AvatarImage src={apt.clientAvatar} />
                      <AvatarFallback>
                        {apt.clientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{apt.clientName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {apt.serviceName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.professionalName}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={apt.status === "confirmed" ? "default" : "secondary"}
                    >
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyLayout>
  );
}
