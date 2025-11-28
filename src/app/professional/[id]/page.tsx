"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  Calendar as CalendarIcon,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Share,
  Image,
  FileText,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { fetchProfessionalDetails, fetchProfessionalReviews, fetchProfessionalAvailability } from "@/lib/api";
import { formatDistanceToNow, parseISO, isBefore, startOfDay } from "date-fns";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  duration: number | string;
  image?: string;
}

interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  duration: string;
  slots: string[];
  availableSlots: string[];
  message?: string;
}

interface AvailabilityResponse {
  professionalId: string;
  date: string;
  openHours?: {
    start: string;
    end: string;
  } | null;
  services?: ServiceAvailability[];
}

interface Professional {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialties?: string[];
  averageRating?: number;
  reviewCount?: number;
  services?: Service[];
  experiences?: Array<{
    id: string;
    title: string;
    companyName: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  educations?: Array<{
    id: string;
    degree: string;
    institutionName: string;
    endDate?: string;
  }>;
  portfolioItems?: Array<{
    id: string;
    imageUrl: string;
    description?: string;
  }>;
  company?: {
    id: string;
    name: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  service?: {
    id: string;
    name: string;
  };
  professionalResponse?: string;
}

const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'R$ 0,00';
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numPrice);
};

const formatDuration = (duration: number | string) => {
  if (typeof duration === "string") {
    // Already formatted like "30min" or "2h"
    const parsed = parseInt(duration, 10);
    if (!isNaN(parsed) && duration === String(parsed)) {
      const hours = Math.floor(parsed / 60);
      const mins = parsed % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours}h`;
      return `${mins}min`;
    }
    return duration;
  }
  const minutes = duration;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${
        i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
      }`}
    />
  ));
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatReviewDate = (dateString: string) => {
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return dateString;
  }
};

export default function ProfessionalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const [activeTab, setActiveTab] = useState("services");
  
  // Availability tab state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: professional, isLoading, error } = useQuery<Professional>({
    queryKey: ["professional", professionalId],
    queryFn: () => fetchProfessionalDetails(professionalId),
    enabled: !!professionalId,
  });

  // Fetch reviews for this professional
  const { data: reviews, isLoading: loadingReviews } = useQuery<Review[]>({
    queryKey: ["professionalReviews", professionalId],
    queryFn: () => fetchProfessionalReviews(professionalId),
    enabled: !!professionalId && activeTab === "reviews",
  });

  // Fetch availability when date is selected in availability tab
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery<AvailabilityResponse>({
    queryKey: ["professionalAvailability", professionalId, selectedDate],
    queryFn: () => fetchProfessionalAvailability(professionalId, format(selectedDate!, "yyyy-MM-dd")),
    enabled: !!professionalId && !!selectedDate && activeTab === "availability",
  });

  // Get all available slots across all services
  const allAvailableSlots = useMemo(() => {
    if (!availabilityData?.services) return [];
    const slotsSet = new Set<string>();
    availabilityData.services.forEach(service => {
      service.availableSlots?.forEach(slot => slotsSet.add(slot));
    });
    return Array.from(slotsSet).sort();
  }, [availabilityData]);

  // Get services available for the selected time slot
  const servicesForSelectedTime = useMemo(() => {
    if (!selectedTime || !availabilityData?.services || !professional?.services) return [];
    
    return professional.services.filter(service => {
      const serviceAvailability = availabilityData.services?.find(s => s.serviceId === service.id);
      return serviceAvailability?.availableSlots?.includes(selectedTime);
    });
  }, [selectedTime, availabilityData, professional?.services]);

  // Calculate review stats
  const reviewStats = reviews && reviews.length > 0 ? {
    averageRating: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
    totalReviews: reviews.length,
    distribution: [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      return {
        stars,
        count,
        percentage: (count / reviews.length) * 100,
      };
    }),
  } : null;

  // Disable past dates
  const disabledDays = (date: Date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  // Handle date selection - reset time and service
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedService(null);
  };

  // Handle time selection - reset service
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedService(null);
  };

  // Handle booking confirmation
  const handleBookNow = () => {
    if (!selectedDate || !selectedTime || !selectedService) return;
    
    // Navigate to booking page with pre-filled data
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    router.push(`/booking/${professionalId}?serviceId=${selectedService.id}&date=${dateStr}&time=${selectedTime}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Profissional não encontrado</p>
              <Link href="/">
                <Button variant="outline" className="mt-4">
                  Voltar para o início
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarImage src={professional.avatar} />
                  <AvatarFallback className="text-3xl">
                    {professional.name?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold">{professional.name}</h1>

                  {professional.title && (
                    <p className="text-primary text-lg mb-2">{professional.title}</p>
                  )}

                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                      {professional.specialties.map((specialty, i) => (
                        <Badge key={i} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {professional.averageRating !== undefined && (
                    <div className="flex items-center gap-1 mb-4 justify-center md:justify-start">
                      <div className="flex">{renderStars(professional.averageRating)}</div>
                      <span className="font-semibold">
                        {professional.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({professional.reviewCount || 0} avaliações)
                      </span>
                    </div>
                  )}

                  {professional.company && (
                    <p className="text-sm text-muted-foreground">
                      Associado a:{" "}
                      <Link
                        href={`/company/${professional.company.id}`}
                        className="text-primary hover:underline"
                      >
                        {professional.company.name}
                      </Link>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => setActiveTab("availability")}>Ver Agenda</Button>
                  <Button variant="outline" size="icon">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto">
              <TabsTrigger value="services" className="gap-2">
                <FileText className="h-4 w-4" />
                Serviços ({professional.services?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="availability" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Disponibilidade
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2">
                <User className="h-4 w-4" />
                Sobre
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Experiência
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" />
                Avaliações
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-2">
                <Image className="h-4 w-4" />
                Portfólio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Serviços Oferecidos</h2>
                  {professional.services && professional.services.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {professional.services.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              <span className="font-semibold text-primary">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mb-3">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDuration(service.duration)}
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {service.description}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/service/${service.id}`}>Detalhes</Link>
                              </Button>
                              <Button size="sm" className="flex-1" asChild>
                                <Link
                                  href={`/booking/${professional.id}?serviceId=${service.id}`}
                                >
                                  Agendar
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Nenhum serviço oferecido por este profissional.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability">
              <div className="space-y-6">
                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {selectedDate ? <CheckCircle className="h-4 w-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">1</span>}
                    Data
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    selectedTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {selectedTime ? <CheckCircle className="h-4 w-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">2</span>}
                    Horário
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                    selectedService ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {selectedService ? <CheckCircle className="h-4 w-4" /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">3</span>}
                    Serviço
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Selecione a Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
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
                        Horários Disponíveis
                      </CardTitle>
                      {selectedDate && (
                        <CardDescription>
                          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {!selectedDate ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Selecione uma data para ver os horários</p>
                        </div>
                      ) : loadingAvailability ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : allAvailableSlots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhum horário disponível nesta data</p>
                          <p className="text-sm mt-1">Tente selecionar outra data</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {allAvailableSlots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTimeSelect(slot)}
                              className={cn(
                                "transition-all",
                                selectedTime === slot && "ring-2 ring-primary ring-offset-2"
                              )}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Services for selected time */}
                {selectedTime && servicesForSelectedTime.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Serviços Disponíveis às {selectedTime}
                      </CardTitle>
                      <CardDescription>
                        Selecione o serviço que deseja agendar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {servicesForSelectedTime.map((service) => (
                          <div
                            key={service.id}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                              selectedService?.id === service.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                                : "border-border"
                            )}
                            onClick={() => setSelectedService(service)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              <span className="font-semibold text-primary">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDuration(service.duration)}
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            {selectedService?.id === service.id && (
                              <Badge className="mt-2">Selecionado</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Booking Summary and Action */}
                {selectedService && selectedDate && selectedTime && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Resumo do Agendamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={professional.avatar} />
                              <AvatarFallback>{professional.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{professional.name}</p>
                              <p className="text-sm text-muted-foreground">{professional.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span className="capitalize">
                              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{selectedTime}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Serviço</p>
                            <p className="font-medium">{selectedService.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duração</p>
                            <p className="font-medium">{formatDuration(selectedService.duration)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="font-semibold text-lg text-primary">
                              {formatPrice(selectedService.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-6" 
                        size="lg"
                        onClick={handleBookNow}
                      >
                        Agendar Agora
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Sobre</h2>
                    {professional.bio ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {professional.bio}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma biografia fornecida.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informações de Contato</h3>
                    <div className="space-y-3">
                      {professional.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span>{professional.address}</span>
                        </div>
                      )}
                      {professional.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          <span>{professional.phone}</span>
                        </div>
                      )}
                      {professional.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-primary" />
                          <span>{professional.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card>
                <CardContent className="p-6 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Experiência Profissional</h2>
                    {professional.experiences && professional.experiences.length > 0 ? (
                      <div className="space-y-6">
                        {professional.experiences.map((exp) => (
                          <div key={exp.id} className="border-l-2 border-primary pl-4">
                            <div className="font-medium text-lg">{exp.title}</div>
                            <div className="text-primary">{exp.companyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {exp.startDate} - {exp.endDate || "Presente"}
                            </div>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma experiência profissional listada.
                      </p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-6">Formação Acadêmica</h2>
                    {professional.educations && professional.educations.length > 0 ? (
                      <div className="space-y-6">
                        {professional.educations.map((edu) => (
                          <div key={edu.id} className="border-l-2 border-primary pl-4">
                            <div className="font-medium text-lg">{edu.degree}</div>
                            <div className="text-primary">{edu.institutionName}</div>
                            {edu.endDate && (
                              <div className="text-sm text-muted-foreground">{edu.endDate}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma formação acadêmica listada.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                {/* Stats Card */}
                {reviewStats && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Average Rating */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary">
                            {reviewStats.averageRating.toFixed(1)}
                          </div>
                          <div className="flex items-center justify-center gap-0.5 my-1">
                            {renderStars(reviewStats.averageRating)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "avaliação" : "avaliações"}
                          </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="flex-1 w-full md:w-auto space-y-2">
                          {reviewStats.distribution.map(({ stars, count, percentage }) => (
                            <div key={stars} className="flex items-center gap-2">
                              <span className="text-sm w-4">{stars}</span>
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <Progress value={percentage} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">
                      Avaliações ({reviews?.length || professional.reviewCount || 0})
                    </h2>
                    
                    {loadingReviews ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-l-4 border-l-primary/50 pl-4 py-2">
                            <div className="flex gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.user?.avatarUrl} />
                                <AvatarFallback>{getInitials(review.user?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {review.user?.name || "Usuário"}
                                    </p>
                                    {review.service && (
                                      <p className="text-xs text-muted-foreground">
                                        {review.service.name}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatReviewDate(review.createdAt)}
                                  </span>
                                </div>

                                {/* Stars */}
                                <div className="flex items-center gap-0.5 my-1">
                                  {[1, 2, 3, 4, 5].map((value) => (
                                    <Star
                                      key={value}
                                      className={`h-4 w-4 ${
                                        value <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-gray-200 text-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {review.comment}
                                  </p>
                                )}

                                {/* Professional Response */}
                                {review.professionalResponse && (
                                  <div className="mt-3 pl-3 border-l-2 border-primary/30 bg-muted/50 p-2 rounded-r">
                                    <p className="text-xs font-medium text-primary mb-1">
                                      Resposta do profissional
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {review.professionalResponse}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Este profissional ainda não recebeu avaliações.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="portfolio">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Portfólio</h2>
                  {professional.portfolioItems && professional.portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {professional.portfolioItems.map((item) => (
                        <div
                          key={item.id}
                          className="aspect-square rounded-lg overflow-hidden relative group"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.description || "Portfolio item"}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {item.description && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                              <p className="text-white text-sm">{item.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground italic">
                        Nenhum item no portfólio.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
