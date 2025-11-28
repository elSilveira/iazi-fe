"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Star,
  UserX,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isPast, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  fetchProfessionalMe,
  fetchProfessionalAppointments,
  updateAppointmentStatus,
  createClientReview,
  markClientNoShow,
  getClientStats,
  ClientStats,
} from "@/lib/api";
import { toast } from "sonner";

type AppointmentStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

interface AppointmentService {
  service: {
    id: string;
    name: string;
    duration?: number;
  };
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: { id: string; name: string; duration?: number };
  services?: AppointmentService[];
  user?: { id: string; name: string; email?: string; phone?: string };
  clientReviewExists?: boolean;
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
    case "no_show":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Não Compareceu</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Star Rating Component
function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hoverValue || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Client Stats Badge Component
function ClientStatsBadge({ stats }: { stats: ClientStats | null }) {
  if (!stats || stats.totalReviews === 0) return null;

  const isHighNoShow = stats.noShowRate > 0.2;

  return (
    <div className="flex items-center gap-2 text-xs mt-2">
      <span className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        {stats.averageRating.toFixed(1)}
      </span>
      <span className="text-muted-foreground">({stats.totalReviews} avaliações)</span>
      {isHighNoShow && (
        <span className="flex items-center gap-1 text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          {Math.round(stats.noShowRate * 100)}% faltas
        </span>
      )}
    </div>
  );
}

export default function ProfessionalBookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isNoShowMode, setIsNoShowMode] = useState(false);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);

  // Parse the selected month correctly to avoid timezone issues
  const selectedMonthDate = parse(selectedMonth, "yyyy-MM", new Date());
  const dateFrom = format(startOfMonth(selectedMonthDate), "yyyy-MM-dd");
  const dateTo = format(endOfMonth(selectedMonthDate), "yyyy-MM-dd");

  // First get the professional profile to get the ID
  const { data: professional } = useQuery({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  const professionalId = professional?.id;

  // Map filter to API status parameter
  const getApiStatus = (filter: AppointmentStatus): string | undefined => {
    switch (filter) {
      case "all":
        return undefined; // No filter - show all
      case "pending":
        return "PENDING";
      case "confirmed":
        return "CONFIRMED";
      case "completed":
        return "COMPLETED";
      case "no_show":
        return "NO_SHOW";
      case "cancelled":
        return "CANCELLED";
      default:
        return undefined;
    }
  };

  const apiStatus = getApiStatus(statusFilter);

  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery<Appointment[]>({
    queryKey: ["professionalBookings", professionalId, dateFrom, dateTo, statusFilter],
    queryFn: () => fetchProfessionalAppointments(professionalId!, dateFrom, dateTo, apiStatus),
    enabled: !!professionalId,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: string }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Client review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: string; data: { rating: number; comment?: string } }) =>
      createClientReview(appointmentId, data),
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      setReviewDialogOpen(false);
      resetReviewDialog();
      refetch();
    },
    onError: () => {
      toast.error("Erro ao enviar avaliação");
    },
  });

  // No-show mutation
  const noShowMutation = useMutation({
    mutationFn: ({ appointmentId, comment }: { appointmentId: string; comment?: string }) =>
      markClientNoShow(appointmentId, comment),
    onSuccess: () => {
      toast.success("Cliente marcado como faltoso");
      setReviewDialogOpen(false);
      resetReviewDialog();
      refetch();
    },
    onError: () => {
      toast.error("Erro ao registrar falta");
    },
  });

  const resetReviewDialog = () => {
    setSelectedAppointment(null);
    setReviewRating(5);
    setReviewComment("");
    setIsNoShowMode(false);
    setClientStats(null);
  };

  const openReviewDialog = async (appointment: Appointment, noShowMode = false) => {
    setSelectedAppointment(appointment);
    setIsNoShowMode(noShowMode);
    setReviewDialogOpen(true);

    // Fetch client stats if user exists
    if (appointment.user?.id) {
      try {
        const stats = await getClientStats(appointment.user.id);
        setClientStats(stats);
      } catch {
        // Ignore error - stats not available
      }
    }
  };

  const handleSubmitReview = () => {
    if (!selectedAppointment) return;

    if (isNoShowMode) {
      noShowMutation.mutate({
        appointmentId: selectedAppointment.id,
        comment: reviewComment || undefined,
      });
    } else {
      reviewMutation.mutate({
        appointmentId: selectedAppointment.id,
        data: {
          rating: reviewRating,
          comment: reviewComment || undefined,
        },
      });
    }
  };

  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    statusMutation.mutate({ appointmentId, status: newStatus });
  };

  // Helper to get service name
  const getServiceName = (apt: Appointment): string => {
    if (apt.services && apt.services.length > 0) {
      return apt.services[0].service?.name || "Serviço não disponível";
    }
    return apt.service?.name || "Serviço não disponível";
  };

  // Check if appointment can be reviewed (completed - no time restriction for early completions)
  const canReviewAppointment = (apt: Appointment): boolean => {
    const isCompleted = apt.status.toLowerCase() === "completed";
    return isCompleted && !apt.clientReviewExists;
  };

  // Check if appointment can be marked as no-show (confirmed, pending, or completed - past start time)
  const canMarkNoShow = (apt: Appointment): boolean => {
    const status = apt.status.toLowerCase();
    const isConfirmed = status === "confirmed";
    const isPending = status === "pending";
    const isCompleted = status === "completed";
    const isPastStartTime = isPast(parseISO(apt.startTime));
    return (isConfirmed || isPending || isCompleted) && isPastStartTime;
  };

  // Group appointments by date (no local filter needed - API handles it)
  const groupedByDate = appointments.reduce(
    (acc, apt) => {
      const dateKey = format(parseISO(apt.startTime), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
      return acc;
    },
    {} as Record<string, Appointment[]>
  );

  const sortedDates = Object.keys(groupedByDate).sort();

  const isSubmitting = reviewMutation.isPending || noShowMutation.isPending;

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

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="no_show">Faltas</TabsTrigger>
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
                <h3 className="font-medium text-lg mb-3 sticky top-0 bg-background py-2 z-10">
                  {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="space-y-3">
                  {groupedByDate[dateKey]
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((apt) => (
                      <Card key={apt.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
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
                              <p className="text-sm text-muted-foreground">{getServiceName(apt)}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Pending Actions */}
                              {apt.status.toLowerCase() === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                                    disabled={statusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive"
                                    onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                                    disabled={statusMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </>
                              )}

                              {/* Confirmed Actions */}
                              {apt.status.toLowerCase() === "confirmed" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                                    disabled={statusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Concluir
                                  </Button>
                                  {canMarkNoShow(apt) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                      onClick={() => openReviewDialog(apt, true)}
                                    >
                                      <UserX className="h-4 w-4 mr-1" />
                                      Faltou
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Completed Actions */}
                              {apt.status.toLowerCase() === "completed" && (
                                <>
                                  {canReviewAppointment(apt) && (
                                    <Button size="sm" variant="outline" onClick={() => openReviewDialog(apt)}>
                                      <Star className="h-4 w-4 mr-1" />
                                      Avaliar
                                    </Button>
                                  )}
                                  {canMarkNoShow(apt) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                      onClick={() => openReviewDialog(apt, true)}
                                    >
                                      <UserX className="h-4 w-4 mr-1" />
                                      Faltou
                                    </Button>
                                  )}
                                </>
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

      {/* Review/No-Show Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={(open) => !open && resetReviewDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNoShowMode ? "Registrar Falta do Cliente" : "Avaliar Cliente"}</DialogTitle>
            <DialogDescription>
              {isNoShowMode
                ? "Registre que o cliente não compareceu ao agendamento."
                : "Avalie como foi o atendimento com este cliente."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedAppointment.user?.name || "Cliente"}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{getServiceName(selectedAppointment)}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedAppointment.startTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {clientStats && <ClientStatsBadge stats={clientStats} />}
              </div>

              {/* No-Show Warning */}
              {isNoShowMode && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Atenção</p>
                    <p className="text-sm text-orange-700">
                      Ao registrar a falta, o agendamento será marcado como "Não Compareceu" e isso afetará a
                      reputação do cliente.
                    </p>
                  </div>
                </div>
              )}

              {/* Rating (only for normal review) */}
              {!isNoShowMode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Avaliação</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
              )}

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentário (opcional)
                </label>
                <Textarea
                  placeholder={
                    isNoShowMode ? "Ex: Cliente não compareceu e não avisou..." : "Ex: Cliente pontual e educado..."
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              variant={isNoShowMode ? "destructive" : "default"}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : isNoShowMode ? (
                <UserX className="h-4 w-4 mr-2" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              {isNoShowMode ? "Registrar Falta" : "Enviar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfessionalLayout>
  );
}
