"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  Star,
  DollarSign,
  User,
  Building2,
  ChevronRight,
  Share2,
  Scissors,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { fetchServiceDetails, fetchProfessionals } from "@/lib/api";

interface ServiceCategory {
  id: number;
  name: string;
  icon?: string;
}

interface ServiceDetails {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: string | number;
  image?: string;
  category?: ServiceCategory;
  companyId?: string | null;
}

interface Professional {
  id: string;
  name?: string;
  image?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  company?: {
    id: string;
    name: string;
  } | null;
  services?: Array<{
    serviceId?: string;
    price?: string | number | null;
    service?: {
      id: string;
      name: string;
      price?: string | number;
    };
  }>;
}

interface ProfessionalsResponse {
  data: Professional[];
  pagination?: {
    totalItems: number;
  };
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [activeTab, setActiveTab] = useState("professionals");

  // Fetch service details
  const { data: service, isLoading: loadingService } = useQuery<ServiceDetails>({
    queryKey: ["service", serviceId],
    queryFn: () => fetchServiceDetails(serviceId),
    enabled: !!serviceId,
  });

  // Fetch professionals that offer this service
  const { data: professionalsData, isLoading: loadingProfessionals } = useQuery<ProfessionalsResponse>({
    queryKey: ["professionals", "byService", serviceId],
    queryFn: () => fetchProfessionals({ serviceId }),
    enabled: !!serviceId,
  });

  const professionals = professionalsData?.data || [];

  const formatPrice = (price?: string | number) => {
    if (price === null || price === undefined) return null;
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice)
      ? null
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(numPrice);
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

  const getProfessionalPrice = (professional: Professional): string | null => {
    if (!professional.services) return null;
    const serviceLink = professional.services.find(
      (s) => s.serviceId === serviceId || s.service?.id === serviceId
    );
    if (serviceLink) {
      const price = serviceLink.price ?? serviceLink.service?.price;
      return formatPrice(price);
    }
    return formatPrice(service?.price);
  };

  const handleBookProfessional = (professionalId: string) => {
    router.push(`/booking/${professionalId}?serviceId=${serviceId}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.name || "Serviço",
          text: service?.description || "Confira este serviço",
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loadingService) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <Skeleton className="h-64 w-full" />
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Navigation />
        <main className="container max-w-4xl mx-auto py-8 px-4 mt-16">
          <Card>
            <CardContent className="py-12 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Serviço não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                O serviço que você está procurando não existe ou foi removido.
              </p>
              <Button onClick={() => router.push("/search")}>Buscar Serviços</Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        {/* Service Image/Banner */}
        <div className="relative h-64 bg-muted">
          {service.image ? (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Scissors className="h-24 w-24 text-muted-foreground/50" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-20 left-4 bg-background/80 hover:bg-background"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-20 right-4 bg-background/80 hover:bg-background"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Service Info */}
        <div className="container max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              {/* Service Header Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {service.category && (
                    <Badge variant="secondary" className="mb-2">
                      {service.category.name}
                    </Badge>
                  )}
                  <h1 className="text-2xl font-bold mb-2">{service.name}</h1>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {service.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {service.duration}
                      </span>
                    )}
                    {service.price && (
                      <span className="flex items-center gap-1 text-primary font-semibold text-base">
                        {formatPrice(service.price)}
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <p className="text-muted-foreground">{service.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="professionals">Profissionais</TabsTrigger>
                  <TabsTrigger value="includes">O que inclui</TabsTrigger>
                  <TabsTrigger value="faq">Perguntas frequentes</TabsTrigger>
                </TabsList>

                {/* Professionals Tab */}
                <TabsContent value="professionals" className="space-y-4">
                  {loadingProfessionals ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : professionals.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhum profissional disponível
                        </h3>
                        <p className="text-muted-foreground">
                          Não há profissionais oferecendo este serviço no momento.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    professionals.map((professional) => (
                      <Card
                        key={professional.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={professional.image || professional.user?.avatarUrl}
                              />
                              <AvatarFallback>
                                {getInitials(professional.name || professional.user?.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {professional.name || professional.user?.name || "Profissional"}
                              </h3>
                              
                              {/* Rating */}
                              {professional.rating !== undefined && professional.rating > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {professional.rating.toFixed(1)}
                                  </span>
                                  {(professional.reviewCount || professional.totalReviews) && (
                                    <span className="text-muted-foreground">
                                      ({professional.reviewCount || professional.totalReviews} avaliações)
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Services offered */}
                              {professional.services && professional.services.length > 1 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {professional.services
                                    .slice(0, 3)
                                    .map((s) => s.service?.name || "")
                                    .filter(Boolean)
                                    .join(" • ")}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className="font-semibold text-primary">
                                {getProfessionalPrice(professional) || formatPrice(service.price)}
                              </span>
                              <span className="text-xs text-muted-foreground">por serviço</span>
                              <Button
                                size="sm"
                                onClick={() => handleBookProfessional(professional.id)}
                              >
                                Agendar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* What's Included Tab */}
                <TabsContent value="includes">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">Serviço completo</h4>
                            <p className="text-sm text-muted-foreground">
                              {service.description || "Descrição do serviço não disponível."}
                            </p>
                          </div>
                        </div>
                        {service.duration && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">Duração estimada</h4>
                              <p className="text-sm text-muted-foreground">
                                Aproximadamente {service.duration}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">Profissional qualificado</h4>
                            <p className="text-sm text-muted-foreground">
                              Atendimento realizado por profissionais experientes
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* FAQ Tab */}
                <TabsContent value="faq">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Como funciona o agendamento?
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            Escolha o profissional desejado, selecione a data e horário disponível,
                            e confirme seu agendamento. Você receberá uma confirmação por email.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Posso cancelar meu agendamento?
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            Sim, você pode cancelar ou reagendar seu compromisso através da
                            página de agendamentos até 24 horas antes do horário marcado.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Como são definidos os preços?
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            Cada profissional define seu próprio preço para o serviço. O valor
                            pode variar conforme a experiência e localização do profissional.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Related Services */}
            <div className="lg:w-80">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Serviços Relacionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Em breve você poderá ver serviços relacionados aqui.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA for Mobile */}
        {professionals.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden">
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleBookProfessional(professionals[0].id)}
            >
              Agendar Serviço
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
