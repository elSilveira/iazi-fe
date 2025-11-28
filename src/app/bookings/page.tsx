"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { fetchAppointments, cancelAppointment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  X, 
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Star,
  Repeat
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentService {
  appointmentId: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    description?: string;
    duration: string;
    price: string;
    image?: string;
  };
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  reviewSummary?: {
    serviceReviews?: Array<{
      id: string;
      rating: number;
      comment?: string;
    }>;
    clientReview?: {
      id: string;
      rating: number;
      comment?: string;
    };
  };
  // Services is an array in the API response
  services?: AppointmentService[];
  // Professional data
  professional?: {
    id: string;
    name: string;
    role?: string;
    image?: string;
    phone?: string;
    company?: {
      id: string;
      name: string;
    } | null;
  };
  professionalId?: string;
  // Company info
  company?: {
    id: string;
    name: string;
    address?: string;
  } | null;
  companyId?: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDING: { 
    label: "Pendente", 
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />
  },
  CONFIRMED: { 
    label: "Confirmado", 
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />
  },
  COMPLETED: { 
    label: "Concluído", 
    variant: "outline",
    icon: <CheckCircle className="h-3 w-3" />
  },
  CANCELLED: { 
    label: "Cancelado", 
    variant: "destructive",
    icon: <X className="h-3 w-3" />
  },
  NO_SHOW: { 
    label: "Não Compareceu", 
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />
  },
};

function BookingsPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  // Check for success parameter and invalidate cache
  const successId = searchParams.get("success");
  
  useEffect(() => {
    if (successId) {
      // Show success message
      setShowSuccessAlert(true);
      // Invalidate cache to refresh appointments list
      queryClient.invalidateQueries({ queryKey: ["userAppointments"] });
      // Hide alert after 5 seconds
      const timer = setTimeout(() => setShowSuccessAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [successId, queryClient]);

  // Fetch user appointments
  const { data: appointments, isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["userAppointments", user?.id],
    queryFn: () => fetchAppointments({ userId: user?.id }),
    enabled: !!user?.id,
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["userAppointments"] });
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento. Tente novamente.");
    },
  });

  // Filter appointments based on tab
  const filteredAppointments = appointments?.filter((apt) => {
    const aptDate = parseISO(apt.startTime);
    
    switch (activeTab) {
      case "upcoming":
        return (isFuture(aptDate) || isToday(aptDate)) && 
               !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status);
      case "past":
        return isPast(aptDate) || apt.status === "COMPLETED";
      case "cancelled":
        return apt.status === "CANCELLED" || apt.status === "NO_SHOW";
      default:
        return true;
    }
  }) || [];

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "HH:mm");
  };

  const canCancel = (apt: Appointment) => {
    const aptDate = parseISO(apt.startTime);
    return (
      (apt.status === "PENDING" || apt.status === "CONFIRMED") &&
      isFuture(aptDate)
    );
  };

  const renderAppointmentCard = (apt: Appointment) => {
    const status = statusConfig[apt.status] || statusConfig.PENDING;
    const aptDate = parseISO(apt.startTime);
    const isUpcoming = isFuture(aptDate) && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status);
    const isCompleted = apt.status === "COMPLETED";

    // Extract service data from the services array (first service)
    const firstService = apt.services?.[0]?.service;
    const serviceName = firstService?.name || "Serviço";
    const servicePrice = firstService?.price;
    const serviceDuration = firstService?.duration;

    // Extract professional data
    const professionalName = apt.professional?.name || "Profissional";
    const professionalPhone = apt.professional?.phone;
    const professionalId = apt.professional?.id || apt.professionalId;
    const professionalImage = apt.professional?.image;

    // Extract company data
    const companyName = apt.professional?.company?.name || apt.company?.name;
    const companyAddress = apt.company?.address;

    // Format price - handle string price
    const formatServicePrice = (price: string | undefined) => {
      if (!price) return null;
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) return null;
      return `R$ ${numPrice.toFixed(2)}`;
    };

    return (
      <Card key={apt.id} className={`overflow-hidden ${apt.status === "CANCELLED" ? "opacity-60" : ""}`}>
        <div className={`h-1 ${isUpcoming ? "bg-primary" : isCompleted ? "bg-green-500" : "bg-gray-300"}`} />
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Service Name and Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {serviceName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {professionalName}
                    {companyName && ` • ${companyName}`}
                  </p>
                </div>
                <Badge variant={status.variant} className="flex items-center gap-1">
                  {status.icon}
                  {status.label}
                </Badge>
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="capitalize">{formatDate(apt.startTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                  </span>
                </div>
                {companyAddress && (
                  <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                    <MapPin className="h-4 w-4" />
                    <span>{companyAddress}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              {formatServicePrice(servicePrice) && (
                <div className="text-sm font-medium">
                  Valor: {formatServicePrice(servicePrice)}
                </div>
              )}

              {/* Notes */}
              {apt.notes && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  <strong>Observações:</strong> {apt.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2">
              {isUpcoming && professionalPhone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${professionalPhone}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    Ligar
                  </a>
                </Button>
              )}
              
              {canCancel(apt) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar o agendamento de{" "}
                        <strong>{serviceName}</strong> no dia{" "}
                        <strong className="capitalize">{formatDate(apt.startTime)}</strong> às{" "}
                        <strong>{formatTime(apt.startTime)}</strong>?
                        <br /><br />
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate(apt.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isCompleted && professionalId && !apt.reviewSummary?.serviceReviews?.length && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/professional/${professionalId}?review=true`}>
                    <Star className="h-4 w-4 mr-1" />
                    Avaliar
                  </Link>
                </Button>
              )}

              {isCompleted && (apt.reviewSummary?.serviceReviews?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  Avaliado
                </Badge>
              )}

              {/* Botão Repetir Agendamento para concluídos e cancelados */}
              {(apt.status === "COMPLETED" || apt.status === "CANCELLED" || apt.status === "NO_SHOW") && professionalId && firstService?.id && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/booking/${professionalId}?serviceId=${firstService.id}`}>
                    <Repeat className="h-4 w-4 mr-1" />
                    Repetir Agendamento
                  </Link>
                </Button>
              )}

              {isUpcoming && professionalId && (
                <Button variant="default" size="sm" asChild>
                  <Link href={`/booking/${professionalId}?serviceId=${firstService?.id || ''}&date=${format(aptDate, 'yyyy-MM-dd')}&time=${formatTime(apt.startTime)}&appointmentId=${apt.id}`}>
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Remarcar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string) => {
    const messages = {
      upcoming: {
        title: "Nenhum agendamento futuro",
        description: "Você não tem agendamentos próximos. Que tal agendar um serviço?",
        action: (
          <Button asChild>
            <Link href="/search">Buscar Serviços</Link>
          </Button>
        ),
      },
      past: {
        title: "Nenhum agendamento passado",
        description: "Você ainda não completou nenhum agendamento.",
        action: null,
      },
      cancelled: {
        title: "Nenhum agendamento cancelado",
        description: "Você não tem agendamentos cancelados.",
        action: null,
      },
    };

    const msg = messages[type as keyof typeof messages] || messages.upcoming;

    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <CalendarDays className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">{msg.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{msg.description}</p>
          </div>
          {msg.action}
        </div>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const upcomingCount = appointments?.filter((apt) => {
    const aptDate = parseISO(apt.startTime);
    return (isFuture(aptDate) || isToday(aptDate)) && 
           !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status);
  }).length || 0;

  const pastCount = appointments?.filter((apt) => {
    const aptDate = parseISO(apt.startTime);
    return isPast(aptDate) || apt.status === "COMPLETED";
  }).length || 0;

  const cancelledCount = appointments?.filter((apt) => 
    apt.status === "CANCELLED" || apt.status === "NO_SHOW"
  ).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Alert */}
          {showSuccessAlert && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Agendamento confirmado!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Meus Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie seus agendamentos de serviços
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{upcomingCount}</div>
              <div className="text-xs text-muted-foreground">Próximos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{pastCount}</div>
              <div className="text-xs text-muted-foreground">Concluídos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-500">{cancelledCount}</div>
              <div className="text-xs text-muted-foreground">Cancelados</div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">
                Próximos {upcomingCount > 0 && `(${upcomingCount})`}
              </TabsTrigger>
              <TabsTrigger value="past">
                Histórico {pastCount > 0 && `(${pastCount})`}
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelados {cancelledCount > 0 && `(${cancelledCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map(renderAppointmentCard)
              ) : (
                renderEmptyState("upcoming")
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map(renderAppointmentCard)
              ) : (
                renderEmptyState("past")
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map(renderAppointmentCard)
              ) : (
                renderEmptyState("cancelled")
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <BookingsPageContent />
    </ProtectedRoute>
  );
}
