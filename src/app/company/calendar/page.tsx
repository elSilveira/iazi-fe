"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Check,
  X,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";
import { fetchCompanyAppointments, fetchCompanyStaff, updateAppointmentStatus } from "@/lib/api";
import { toast } from "sonner";
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

// API returns appointments in this format
interface APIAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  professional?: {
    id: string;
    name?: string;
    image?: string;
    user?: {
      name: string;
      avatar?: string;
    };
  };
  professionalId?: string;
  services?: Array<{
    serviceId: string;
    service: {
      id: string;
      name: string;
      duration?: string;
      price?: string;
    };
  }>;
}

// Normalized appointment for display
interface Appointment {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAvatar?: string;
  professionalName: string;
  professionalId: string;
  serviceName: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
}

type ViewMode = "week" | "month";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-gray-400",
  NO_SHOW: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não Compareceu",
};

// Normalize API appointment to display format
function normalizeAppointment(apt: APIAppointment): Appointment {
  const startDate = parseISO(apt.startTime);
  const endDate = parseISO(apt.endTime);
  
  // Calculate duration in minutes
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMins = Math.round(durationMs / 60000);
  
  // Get client name
  const clientName = apt.user?.name || "Cliente";
  
  // Get professional name
  const professionalName = apt.professional?.name 
    || apt.professional?.user?.name 
    || "Profissional";
  
  // Get service name from first service
  const serviceName = apt.services?.[0]?.service?.name || "Serviço";
  
  return {
    id: apt.id,
    clientName,
    clientEmail: apt.user?.email,
    clientPhone: apt.user?.phone,
    clientAvatar: apt.user?.avatar,
    professionalName,
    professionalId: apt.professional?.id || apt.professionalId || "",
    serviceName,
    date: format(startDate, "yyyy-MM-dd"),
    time: format(startDate, "HH:mm"),
    endTime: format(endDate, "HH:mm"),
    duration: durationMins,
    status: apt.status,
    notes: apt.notes,
  };
}

export default function CompanyCalendarPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);

  // Calculate date range for fetching
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { dateFrom: format(start, "yyyy-MM-dd"), dateTo: format(end, "yyyy-MM-dd") };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { dateFrom: format(start, "yyyy-MM-dd"), dateTo: format(end, "yyyy-MM-dd") };
    }
  }, [currentDate, viewMode]);

  const { data: rawAppointments = [], isLoading: appointmentsLoading } = useQuery<APIAppointment[]>({
    queryKey: ["companyAppointments", companyId, dateRange.dateFrom, dateRange.dateTo],
    queryFn: () => fetchCompanyAppointments(companyId!, { 
      dateFrom: dateRange.dateFrom, 
      dateTo: dateRange.dateTo,
      include: "user,professional,service",
    }),
    enabled: !!companyId,
  });

  // Normalize appointments
  const appointments: Appointment[] = useMemo(() => {
    return rawAppointments.map(normalizeAppointment);
  }, [rawAppointments]);

  const { data: staff = [] } = useQuery({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: string }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyAppointments", companyId] });
      setShowAppointmentDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
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
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${statusColors[apt.status]} bg-opacity-20 border-l-2 ${statusColors[apt.status].replace("bg-", "border-")}`}
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowAppointmentDialog(true);
                            }}
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
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setShowAppointmentDialog(true);
                    }}
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
                          {apt.time} - {apt.endTime}
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
                      variant={apt.status === "CONFIRMED" ? "default" : "secondary"}
                    >
                      {statusLabels[apt.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {apt.status === "PENDING" && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ appointmentId: apt.id, status: "CONFIRMED" });
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Confirmar
                          </DropdownMenuItem>
                        )}
                        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ appointmentId: apt.id, status: "COMPLETED" });
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Marcar como Concluído
                          </DropdownMenuItem>
                        )}
                        {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              statusMutation.mutate({ appointmentId: apt.id, status: "CANCELLED" });
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details Dialog */}
        <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
              <DialogDescription>
                Informações completas do agendamento
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                {/* Client Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedAppointment.clientAvatar} />
                    <AvatarFallback>
                      {selectedAppointment.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedAppointment.clientName}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {selectedAppointment.clientPhone && (
                        <a href={`tel:${selectedAppointment.clientPhone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="h-3 w-3" />
                          {selectedAppointment.clientPhone}
                        </a>
                      )}
                      {selectedAppointment.clientEmail && (
                        <a href={`mailto:${selectedAppointment.clientEmail}`} className="flex items-center gap-1 hover:text-primary">
                          <Mail className="h-3 w-3" />
                          {selectedAppointment.clientEmail}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium">{selectedAppointment.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="font-medium">{selectedAppointment.professionalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {format(parseISO(selectedAppointment.date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">
                      {selectedAppointment.time} - {selectedAppointment.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{selectedAppointment.duration} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={selectedAppointment.status === "CONFIRMED" ? "default" : "secondary"}>
                      {statusLabels[selectedAppointment.status]}
                    </Badge>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="pt-2">
                      <span className="text-muted-foreground text-sm">Observações:</span>
                      <p className="text-sm mt-1 bg-muted p-2 rounded">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              {selectedAppointment?.status === "PENDING" && (
                <Button
                  onClick={() => statusMutation.mutate({ appointmentId: selectedAppointment.id, status: "CONFIRMED" })}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Confirmar
                </Button>
              )}
              {(selectedAppointment?.status === "PENDING" || selectedAppointment?.status === "CONFIRMED") && (
                <Button
                  variant="outline"
                  onClick={() => statusMutation.mutate({ appointmentId: selectedAppointment!.id, status: "COMPLETED" })}
                  disabled={statusMutation.isPending}
                >
                  Marcar Concluído
                </Button>
              )}
              {selectedAppointment?.status !== "CANCELLED" && selectedAppointment?.status !== "COMPLETED" && (
                <Button
                  variant="destructive"
                  onClick={() => statusMutation.mutate({ appointmentId: selectedAppointment!.id, status: "CANCELLED" })}
                  disabled={statusMutation.isPending}
                >
                  Cancelar Agendamento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CompanyLayout>
  );
}
