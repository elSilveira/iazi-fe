"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  Star,
  User,
  Building2,
  ChevronRight,
  Share2,
  Scissors,
  HelpCircle,
  CheckCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { fetchServiceDetails, fetchSearch, type SearchProfessionalService } from "@/lib/api";

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

// Aggregated service data from all professionals
interface AggregatedServiceInfo {
  minPrice: number;
  maxPrice: number;
  minDuration: string;
  maxDuration: string;
  avgRating: number;
  totalProfessionals: number;
  professionals: Array<{
    id: string;
    name: string;
    image: string | null;
    rating: number;
    price: number;
    duration: string;
    serviceId: string;
    company: { id: string; name: string } | null;
  }>;
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

  // Fetch professionals using the search API with service name
  const { data: searchData, isLoading: loadingProfessionals } = useQuery({
    queryKey: ["search", "service-professionals", service?.name],
    queryFn: () => fetchSearch({ 
      q: service?.name,
      type: "all",
      limit: 50,
    }),
    enabled: !!service?.name,
  });

  // Get professional_services from search and filter/aggregate by service name
  const aggregatedInfo = useMemo<AggregatedServiceInfo | null>(() => {
    if (!searchData?.professional_services || !service?.name) return null;
    
    const professionalServices = searchData.professional_services as SearchProfessionalService[];
    
    // Filter services that match this service name (case insensitive)
    const matchingServices = professionalServices.filter(
      ps => ps.name.toLowerCase().trim() === service.name.toLowerCase().trim()
    );
    
    if (matchingServices.length === 0) return null;
    
    // Extract all professionals with their prices
    const professionals: AggregatedServiceInfo['professionals'] = [];
    let minPrice = Infinity;
    let maxPrice = 0;
    let minDuration = "";
    let maxDuration = "";
    let totalRating = 0;
    let ratingCount = 0;
    
    matchingServices.forEach(ps => {
      const price = typeof ps.price === 'number' ? ps.price : parseFloat(String(ps.price)) || 0;
      
      if (price > 0) {
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      }
      
      if (ps.duration) {
        if (!minDuration) minDuration = ps.duration;
        maxDuration = ps.duration;
      }
      
      if (ps.profissional) {
        if (ps.profissional.rating > 0) {
          totalRating += ps.profissional.rating;
          ratingCount++;
        }
        
        professionals.push({
          id: ps.profissional.id,
          name: ps.profissional.name,
          image: ps.profissional.image,
          rating: ps.profissional.rating,
          price: price,
          duration: ps.duration,
          serviceId: ps.id,
          company: ps.profissional.company || ps.company,
        });
      }
    });
    
    // Sort by rating (best first)
    professionals.sort((a, b) => b.rating - a.rating);
    
    return {
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      totalProfessionals: professionals.length,
      professionals,
    };
  }, [searchData, service?.name]);

  const formatPrice = (price?: number) => {
    if (price === null || price === undefined || price === 0) return null;
    return `R$ ${price.toFixed(0)}`;
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    // If already formatted, return as is
    if (duration.includes("h") || duration.includes("min")) return duration;
    // If just a number, treat as minutes
    const mins = parseInt(duration);
    if (isNaN(mins)) return duration;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
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

  const handleBookProfessional = (professionalId: string, serviceId: string) => {
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
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const hasPriceRange = aggregatedInfo && aggregatedInfo.minPrice !== aggregatedInfo.maxPrice;

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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {service.category && (
                        <Badge variant="secondary" className="mb-2">
                          {service.category.name}
                        </Badge>
                      )}
                      <h1 className="text-2xl font-bold mb-3">{service.name}</h1>
                      
                      {service.description && (
                        <p className="text-muted-foreground mb-4">{service.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Aggregated Stats */}
                  {aggregatedInfo && aggregatedInfo.totalProfessionals > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                      {/* Price Range */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Valor</p>
                        {hasPriceRange ? (
                          <p className="font-semibold text-primary">
                            {formatPrice(aggregatedInfo.minPrice)} - {formatPrice(aggregatedInfo.maxPrice)}
                          </p>
                        ) : (
                          <p className="font-semibold text-primary">
                            {formatPrice(aggregatedInfo.minPrice) || formatPrice(Number(service.price))}
                          </p>
                        )}
                      </div>
                      
                      {/* Duration */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Duração</p>
                        <p className="font-semibold flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(aggregatedInfo.minDuration) || formatDuration(service.duration)}
                        </p>
                      </div>
                      
                      {/* Rating */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Avaliação</p>
                        <p className="font-semibold flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {aggregatedInfo.avgRating > 0 ? aggregatedInfo.avgRating.toFixed(1) : "Novo"}
                        </p>
                      </div>
                      
                      {/* Professionals Count */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Profissionais</p>
                        <p className="font-semibold flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          {aggregatedInfo.totalProfessionals}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="professionals">
                    Profissionais
                    {aggregatedInfo && (
                      <span className="ml-1 text-xs">({aggregatedInfo.totalProfessionals})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="includes">O que inclui</TabsTrigger>
                  <TabsTrigger value="faq">Perguntas</TabsTrigger>
                </TabsList>

                {/* Professionals Tab */}
                <TabsContent value="professionals" className="space-y-3">
                  {loadingProfessionals ? (
                    <div className="space-y-3">
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
                  ) : !aggregatedInfo || aggregatedInfo.professionals.length === 0 ? (
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
                    aggregatedInfo.professionals.map((professional, index) => (
                      <Card
                        key={professional.id}
                        className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${
                          index === 0 ? "border-l-primary" : "border-l-transparent"
                        }`}
                        onClick={() => handleBookProfessional(professional.id, professional.serviceId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={professional.image || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(professional.name)}
                                </AvatarFallback>
                              </Avatar>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                                  <TrendingUp className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">
                                  {professional.name}
                                </h3>
                                {index === 0 && (
                                  <Badge variant="default" className="text-xs shrink-0">
                                    Melhor avaliado
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {/* Rating */}
                                {professional.rating > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    {professional.rating.toFixed(1)}
                                  </span>
                                )}
                                
                                {/* Duration */}
                                {professional.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDuration(professional.duration)}
                                  </span>
                                )}
                                
                                {/* Company */}
                                {professional.company && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{professional.company.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(professional.price) || formatPrice(Number(service.price))}
                              </span>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                        {(aggregatedInfo?.minDuration || service.duration) && (
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-medium">Duração estimada</h4>
                              <p className="text-sm text-muted-foreground">
                                Aproximadamente {formatDuration(aggregatedInfo?.minDuration) || formatDuration(service.duration)}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">Profissional qualificado</h4>
                            <p className="text-sm text-muted-foreground">
                              {aggregatedInfo && aggregatedInfo.totalProfessionals > 0
                                ? `Escolha entre ${aggregatedInfo.totalProfessionals} profissionais qualificados`
                                : "Atendimento realizado por profissionais experientes"}
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
                            Por que os preços variam?
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            Cada profissional define seu próprio preço para o serviço. O valor
                            pode variar conforme a experiência, localização e qualificações do profissional.
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Quick Stats */}
            <div className="lg:w-80">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Resumo do Serviço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Range Summary */}
                  {aggregatedInfo && aggregatedInfo.totalProfessionals > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor</span>
                        <span className="font-semibold text-primary">
                          {hasPriceRange
                            ? `${formatPrice(aggregatedInfo.minPrice)} - ${formatPrice(aggregatedInfo.maxPrice)}`
                            : formatPrice(aggregatedInfo.minPrice) || formatPrice(Number(service.price))
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duração</span>
                        <span className="font-medium">
                          {formatDuration(aggregatedInfo.minDuration) || formatDuration(service.duration)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Profissionais</span>
                        <span className="font-medium">{aggregatedInfo.totalProfessionals} disponíveis</span>
                      </div>
                      
                      {/* Top Professionals Avatars */}
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Melhores avaliados</p>
                        <div className="flex -space-x-2">
                          {aggregatedInfo.professionals.slice(0, 5).map((prof) => (
                            <Avatar key={prof.id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={prof.image || undefined} />
                              <AvatarFallback className="text-xs">
                                {prof.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {aggregatedInfo.totalProfessionals > 5 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                              +{aggregatedInfo.totalProfessionals - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* CTA Button */}
                  {aggregatedInfo && aggregatedInfo.professionals.length > 0 && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleBookProfessional(
                        aggregatedInfo.professionals[0].id,
                        aggregatedInfo.professionals[0].serviceId
                      )}
                    >
                      Agendar com o melhor avaliado
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA for Mobile */}
        {aggregatedInfo && aggregatedInfo.professionals.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">A partir de</p>
                <p className="font-bold text-lg text-primary">
                  {formatPrice(aggregatedInfo.minPrice) || formatPrice(Number(service.price))}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => handleBookProfessional(
                  aggregatedInfo.professionals[0].id,
                  aggregatedInfo.professionals[0].serviceId
                )}
              >
                Agendar Agora
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
