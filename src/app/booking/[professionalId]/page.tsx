"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Star,
  Check,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchProfessionalDetails,
  fetchProfessionalServices,
  fetchProfessionalAvailability,
  createAppointment,
  rescheduleAppointmentById,
} from "@/lib/api";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  categoryId?: string;
}

interface Professional {
  id: string;
  name: string;
  image?: string;
  coverImage?: string;
  bio?: string;
  role?: string;
  phone?: string;
  rating?: number;
  totalReviews?: number;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  // Legacy support
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  reason?: string;
  isAllDay: boolean;
}

interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  duration: string;
  slots: string[];
  availableSlots: string[];
  scheduled?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
  message?: string;
}

interface AvailabilityResponse {
  professionalId: string;
  date: string;
  openHours?: {
    start: string;
    end: string;
  } | null;
  scheduleBlocks?: ScheduleBlock[];
  services?: ServiceAvailability[];
}

const STEPS = [
  { id: 1, title: "Serviço", description: "Escolha o serviço" },
  { id: 2, title: "Data e Hora", description: "Selecione quando" },
  { id: 3, title: "Confirmação", description: "Revise e confirme" },
];

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const professionalId = params.professionalId as string;
  const preSelectedServiceId = searchParams.get("serviceId");
  const preSelectedDate = searchParams.get("date");
  const preSelectedTime = searchParams.get("time");
  const appointmentId = searchParams.get("appointmentId"); // For rescheduling
  const isRescheduling = !!appointmentId;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Fetch professional details
  const { data: professional, isLoading: loadingProfessional } = useQuery<Professional>({
    queryKey: ["professional", professionalId],
    queryFn: () => fetchProfessionalDetails(professionalId),
    enabled: !!professionalId,
  });

  // Fetch professional services
  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["professionalServices", professionalId],
    queryFn: () => fetchProfessionalServices(professionalId),
    enabled: !!professionalId,
  });
  const services: Service[] = servicesData?.data || servicesData || [];

  // Pre-select service, date, and time if provided in URL
  useEffect(() => {
    if (initialized || services.length === 0) return;
    
    let hasPreSelection = false;
    
    if (preSelectedServiceId) {
      const service = services.find((s) => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(service);
        hasPreSelection = true;
        
        // If date is also provided
        if (preSelectedDate) {
          const date = new Date(preSelectedDate + 'T12:00:00');
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
            
            // If time is also provided, pre-select it but stay on step 2 for user to confirm/change
            if (preSelectedTime) {
              setSelectedTime(preSelectedTime);
            }
            setCurrentStep(2);
          } else {
            setCurrentStep(2);
          }
        } else {
          setCurrentStep(2);
        }
      }
    }
    
    if (hasPreSelection) {
      setInitialized(true);
    }
  }, [preSelectedServiceId, preSelectedDate, preSelectedTime, services, initialized]);

  // Fetch availability for selected date
  const { data: availabilityData, isLoading: loadingAvailability, error: availabilityError } = useQuery<AvailabilityResponse>({
    queryKey: ["availability", professionalId, selectedDate, selectedService?.id],
    queryFn: () =>
      fetchProfessionalAvailability(
        professionalId,
        format(selectedDate!, "yyyy-MM-dd"),
        selectedService?.id
      ),
    enabled: !!professionalId && !!selectedDate && !!selectedService,
  });

  // Extract available slots from the new API response format
  // When rescheduling, include the original time slots as available (they will be freed up)
  const { availableSlots, unavailableMessage } = useMemo(() => {
    if (!availabilityData || !selectedService) {
      return { availableSlots: [], unavailableMessage: null };
    }
    
    // Find the service in the response
    const serviceData = availabilityData.services?.find(
      (s) => s.serviceId === selectedService.id
    );
    
    if (!serviceData) {
      // Service not found in response - may not be available this day
      return { 
        availableSlots: [], 
        unavailableMessage: "Serviço não disponível nesta data." 
      };
    }
    
    // Check if there's a message (professional doesn't work this day for this service)
    if (serviceData.message) {
      return { 
        availableSlots: [], 
        unavailableMessage: serviceData.message 
      };
    }
    
    // Get the available slots
    let slots = [...(serviceData.availableSlots || [])];
    
    // If we're rescheduling (preSelectedTime exists) and we're on the same date,
    // add slots that are blocked by the current appointment as available (they will be freed up)
    if (preSelectedTime && preSelectedDate && selectedDate) {
      const preSelectedDateStr = preSelectedDate;
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (preSelectedDateStr === selectedDateStr) {
        // Get all possible slots for this service
        const allSlots = serviceData.slots || [];
        
        // Parse the preSelectedTime to calculate which slots are blocked by the current appointment
        const [startHour, startMinute] = preSelectedTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        
        // Get service duration in minutes
        let durationMinutes = 30; // default
        if (serviceData.duration) {
          const durationMatch = serviceData.duration.match(/(\d+)/);
          if (durationMatch) {
            durationMinutes = parseInt(durationMatch[1], 10);
            // Check if it's in hours format (e.g., "1h" or "1h30min")
            if (serviceData.duration.includes('h')) {
              const hoursMatch = serviceData.duration.match(/(\d+)h/);
              const minsMatch = serviceData.duration.match(/(\d+)min/);
              durationMinutes = (hoursMatch ? parseInt(hoursMatch[1], 10) * 60 : 0) + 
                               (minsMatch ? parseInt(minsMatch[1], 10) : 0);
              if (durationMinutes === 0) durationMinutes = parseInt(hoursMatch?.[1] || '1', 10) * 60;
            }
          }
        }
        
        const endTimeMinutes = startTimeMinutes + durationMinutes;
        
        // Find all slots that fall within the current appointment time range
        // These should be made available since the appointment will be freed
        allSlots.forEach((slot: string) => {
          const [slotHour, slotMinute] = slot.split(':').map(Number);
          const slotMinutes = slotHour * 60 + slotMinute;
          
          // If slot is within the current appointment range and not already available
          if (slotMinutes >= startTimeMinutes && slotMinutes < endTimeMinutes && !slots.includes(slot)) {
            slots.push(slot);
          }
        });
        
        // Sort slots chronologically
        slots.sort((a: string, b: string) => {
          const [aH, aM] = a.split(':').map(Number);
          const [bH, bM] = b.split(':').map(Number);
          return (aH * 60 + aM) - (bH * 60 + bM);
        });
      }
    }
    
    return { 
      availableSlots: slots, 
      unavailableMessage: null 
    };
  }, [availabilityData, selectedService, preSelectedTime, preSelectedDate, selectedDate]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: (data) => {
      toast.success("Agendamento realizado com sucesso!");
      router.push(`/bookings?success=${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar agendamento");
    },
  });

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: string; data: { date: string; time: string; notes?: string } }) => 
      rescheduleAppointmentById(appointmentId, data),
    onSuccess: (data) => {
      toast.success("Agendamento remarcado com sucesso!");
      router.push(`/bookings?success=${data.appointment?.id || appointmentId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remarcar agendamento");
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDuration = (duration: number | string) => {
    // If duration is already a formatted string like "30min" or "1h30min", return it
    if (typeof duration === "string") {
      // If it's just a number as string, parse it
      const parsed = parseInt(duration, 10);
      if (!isNaN(parsed) && duration === String(parsed)) {
        const hours = Math.floor(parsed / 60);
        const mins = parsed % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
        if (hours > 0) return `${hours}h`;
        return `${mins}min`;
      }
      // It's already formatted (e.g., "30min", "1h"), return as-is
      return duration;
    }
    // Handle number type
    const minutes = duration;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setCurrentStep(2);
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para agendar");
      router.push(`/login?redirect=/booking/${professionalId}`);
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error("Por favor, selecione serviço, data e horário");
      return;
    }

    // Format date as YYYY-MM-DD and time as HH:MM for the API
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const timeStr = selectedTime; // Already in HH:MM format from availableSlots

    // If rescheduling, use the reschedule API
    if (isRescheduling && appointmentId) {
      rescheduleMutation.mutate({
        appointmentId,
        data: {
          date: dateStr,
          time: timeStr,
          notes: notes || undefined,
        },
      });
    } else {
      // Create new appointment
      createMutation.mutate({
        serviceId: selectedService.id,
        professionalId,
        date: dateStr,
        time: timeStr,
        notes: notes || undefined,
      });
    }
  };

  const canProceedToStep3 = selectedService && selectedDate && selectedTime;

  const disabledDays = (date: Date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  if (loadingProfessional) {
    return (
      <>
        <Navigation />
        <main className="container max-w-4xl mx-auto py-8 px-4 mt-16">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!professional) {
    return (
      <>
        <Navigation />
        <main className="container max-w-4xl mx-auto py-8 px-4 mt-16">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Profissional não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                O profissional que você está procurando não existe ou foi removido.
              </p>
              <Button onClick={() => router.push("/search")}>Buscar Profissionais</Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container max-w-4xl mx-auto py-8 px-4 mt-16">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/professional/${professionalId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao perfil
        </Button>

        {/* Professional Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={professional.image || professional.user?.avatarUrl} />
                <AvatarFallback>{getInitials(professional.name || professional.user?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{professional.name || professional.user?.name}</h2>
                {professional.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{professional.bio}</p>
                )}
                {professional.rating !== undefined && professional.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {professional.rating.toFixed(1)}
                      {professional.totalReviews !== undefined && (
                        <span className="text-muted-foreground"> ({professional.totalReviews} avaliações)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-sm mt-2 font-medium hidden sm:block">{step.title}</span>
                <span className="text-xs text-muted-foreground hidden md:block">{step.description}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-16 sm:w-24 md:w-32 h-2 mx-4 rounded-full transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o Serviço</CardTitle>
              <CardDescription>Selecione o serviço que deseja agendar</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Este profissional não possui serviços disponíveis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                        selectedService?.id === service.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() => handleSelectService(service)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{formatPrice(service.price)}</p>
                          {selectedService?.id === service.id && (
                            <Badge className="mt-1">Selecionado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Date & Time */}
        {currentStep === 2 && selectedService && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Selected Service Summary */}
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{selectedService.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(selectedService.duration)} • {formatPrice(selectedService.price)}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Alterar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Selecione a Data
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="w-full flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelectDate}
                    disabled={disabledDays}
                    locale={ptBR}
                    className="rounded-md border mx-auto"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horários Disponíveis
                </CardTitle>
                {selectedDate && (
                  <CardDescription>
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Selecione uma data
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Escolha uma data no calendário para ver os horários disponíveis
                    </p>
                  </div>
                ) : loadingAvailability ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando horários...</p>
                  </div>
                ) : availabilityError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-destructive/50 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Erro ao carregar horários
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(availabilityError as Error).message || "Tente novamente mais tarde."}
                    </p>
                  </div>
                ) : unavailableMessage ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-amber-500/50 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Indisponível nesta data
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {unavailableMessage}
                      <br />
                      Tente selecionar outra data.
                    </p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Nenhum horário disponível
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {availabilityData?.openHours === null 
                        ? "O profissional ainda não configurou seus horários de trabalho."
                        : "Todos os horários já estão ocupados nesta data."}
                      <br />
                      Tente selecionar outra data.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {availableSlots.length} horário{availableSlots.length !== 1 ? "s" : ""} disponíve{availableSlots.length !== 1 ? "is" : "l"}
                      </span>
                      {selectedTime && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          {selectedTime}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectTime(slot)}
                          className={cn(
                            "w-full transition-all",
                            selectedTime === slot && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {canProceedToStep3 && (
                  <Button className="w-full mt-6" onClick={() => setCurrentStep(3)}>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && selectedService && selectedDate && selectedTime && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isRescheduling ? "Confirme a Remarcação" : "Confirme seu Agendamento"}</CardTitle>
                <CardDescription>
                  {isRescheduling 
                    ? "Revise os novos detalhes antes de confirmar a remarcação"
                    : "Revise os detalhes antes de confirmar"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Profissional</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={professional.image || professional.user?.avatarUrl} />
                        <AvatarFallback>{getInitials(professional.name || professional.user?.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{professional.name || professional.user?.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{formatDuration(selectedService.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold text-lg text-primary">
                      {formatPrice(selectedService.price)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Observações (opcional)
                  </label>
                  <Textarea
                    placeholder="Alguma informação adicional para o profissional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {!isAuthenticated && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você precisa estar logado para confirmar o agendamento.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push(`/login?redirect=/booking/${professionalId}`)}
                      >
                        Fazer login
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmBooking}
                disabled={createMutation.isPending || rescheduleMutation.isPending || !isAuthenticated}
              >
                {(createMutation.isPending || rescheduleMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRescheduling ? "Remarcando..." : "Confirmando..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isRescheduling ? "Confirmar Remarcação" : "Confirmar Agendamento"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
