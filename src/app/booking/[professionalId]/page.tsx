"use client";

import { useState, useMemo } from "react";
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
  bio?: string;
  jobTitle?: string;
  rating?: number;
  reviewCount?: number;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AvailabilityResponse {
  professionalId: string;
  date: string;
  availableSlots: TimeSlot[];
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

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

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

  // Pre-select service if provided in URL
  useMemo(() => {
    if (preSelectedServiceId && services.length > 0 && !selectedService) {
      const service = services.find((s) => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(service);
        setCurrentStep(2);
      }
    }
  }, [preSelectedServiceId, services, selectedService]);

  // Fetch availability for selected date
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery<AvailabilityResponse>({
    queryKey: ["availability", professionalId, selectedDate, selectedService?.id],
    queryFn: () =>
      fetchProfessionalAvailability(
        professionalId,
        format(selectedDate!, "yyyy-MM-dd"),
        selectedService?.id
      ),
    enabled: !!professionalId && !!selectedDate && !!selectedService,
  });

  const availableSlots = availabilityData?.availableSlots?.filter((slot) => slot.available) || [];

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
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

    const startTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createMutation.mutate({
      serviceId: selectedService.id,
      professionalId,
      startTime: startTime.toISOString(),
      notes: notes || undefined,
    });
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
                <AvatarImage src={professional.user?.avatarUrl} />
                <AvatarFallback>{getInitials(professional.user?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{professional.user?.name || "Profissional"}</h2>
                {professional.jobTitle && (
                  <p className="text-sm text-muted-foreground">{professional.jobTitle}</p>
                )}
                {professional.rating !== undefined && professional.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{professional.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-sm mt-1 font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-16 sm:w-24 h-1 mx-2",
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Selecione a Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  disabled={disabledDays}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Selecione o Horário
                </CardTitle>
                {selectedDate && (
                  <CardDescription>
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione uma data primeiro
                  </p>
                ) : loadingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum horário disponível nesta data.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tente selecionar outra data.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.startTime}
                        variant={selectedTime === slot.startTime ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectTime(slot.startTime)}
                        className="w-full"
                      >
                        {slot.startTime}
                      </Button>
                    ))}
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
                <CardTitle>Confirme seu Agendamento</CardTitle>
                <CardDescription>Revise os detalhes antes de confirmar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="font-medium">{professional.user?.name}</span>
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
                disabled={createMutation.isPending || !isAuthenticated}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
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
