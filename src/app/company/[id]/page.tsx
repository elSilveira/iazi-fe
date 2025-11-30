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
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Users,
  Scissors,
  Share2,
  Calendar,
} from "lucide-react";
import { fetchCompanyDetails, fetchCompanyServices, fetchCompanyStaff, fetchCompanyReviews } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  totalReviews?: number;
  yearEstablished?: string;
  categories?: string[];
  workingHours?: Record<string, { isOpen: boolean; open?: string; close?: string }>;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  duration: string | number;
  image?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface Professional {
  id: string;
  name?: string;
  image?: string;
  bio?: string;
  role?: string;
  rating?: number;
  totalReviews?: number;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function CompanyPublicPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [activeTab, setActiveTab] = useState("services");

  // Fetch company details
  const { data: company, isLoading: loadingCompany } = useQuery<Company>({
    queryKey: ["companyDetails", companyId],
    queryFn: () => fetchCompanyDetails(companyId),
    enabled: !!companyId,
  });

  // Fetch company services
  const { data: services = [], isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ["companyServices", companyId],
    queryFn: () => fetchCompanyServices(companyId),
    enabled: !!companyId,
  });

  // Fetch company staff
  const { data: staff = [], isLoading: loadingStaff } = useQuery<Professional[]>({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId),
    enabled: !!companyId,
  });

  // Fetch company reviews
  const { data: reviews = [], isLoading: loadingReviews } = useQuery<Review[]>({
    queryKey: ["companyReviews", companyId],
    queryFn: () => fetchCompanyReviews(companyId),
    enabled: !!companyId,
  });

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numPrice);
  };

  const formatDuration = (duration: number | string) => {
    const minutes = typeof duration === "string" ? parseInt(duration) : duration;
    if (isNaN(minutes)) return duration;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "E";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: company?.name || "Empresa",
          text: company?.description || "Confira esta empresa",
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookWithProfessional = (professionalId: string) => {
    router.push(`/booking/${professionalId}`);
  };

  if (loadingCompany) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <Skeleton className="h-64 w-full" />
          <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Navigation />
        <main className="container max-w-5xl mx-auto py-8 px-4 mt-16">
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Empresa não encontrada</h3>
              <p className="text-muted-foreground mb-4">
                A empresa que você está procurando não existe ou foi removida.
              </p>
              <Button onClick={() => router.push("/search")}>Buscar Empresas</Button>
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
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-muted">
          {company.coverImage ? (
            <img
              src={company.coverImage}
              alt={`Capa de ${company.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Building2 className="h-24 w-24 text-muted-foreground/30" />
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

        {/* Company Info */}
        <div className="container max-w-5xl mx-auto px-4 -mt-16 relative z-10">
          {/* Header Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={company.logo} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(company.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  {/* Name and Categories */}
                  <div>
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    {company.categories && company.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {company.categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-muted-foreground">{company.description}</p>
                  )}

                  {/* Contact & Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {company.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.address.street}, {company.address.number} - {company.address.city}/{company.address.state}
                      </span>
                    )}
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="h-4 w-4" />
                        {company.phone}
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-4 w-4" />
                        {company.email}
                      </a>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 pt-2">
                    {company.rating !== undefined && company.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{company.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({company.totalReviews || 0} avaliações)
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{services.length}</span>
                      <span className="text-muted-foreground">serviços</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{staff.length}</span>
                      <span className="text-muted-foreground">profissionais</span>
                    </div>
                    {company.yearEstablished && (
                      <div className="text-sm">
                        <span className="font-semibold">Desde {company.yearEstablished}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="professionals">Profissionais</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações</TabsTrigger>
              <TabsTrigger value="hours">Horários</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              {loadingServices ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum serviço disponível</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {services.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {service.image && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{service.name}</h3>
                            {service.category && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {service.category.name}
                              </Badge>
                            )}
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(service.duration)}
                              </span>
                              <span className="font-semibold text-primary">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Professionals Tab */}
            <TabsContent value="professionals">
              {loadingStaff ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-32 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : staff.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum profissional cadastrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {staff.map((professional) => (
                    <Card key={professional.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-20 w-20 mb-3">
                            <AvatarImage src={professional.image || professional.user?.avatar} />
                            <AvatarFallback>
                              {getInitials(professional.name || professional.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">
                            {professional.name || professional.user?.name || "Profissional"}
                          </h3>
                          {professional.role && (
                            <p className="text-sm text-muted-foreground">{professional.role}</p>
                          )}
                          {professional.rating !== undefined && professional.rating > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{professional.rating.toFixed(1)}</span>
                              {professional.totalReviews !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  ({professional.totalReviews})
                                </span>
                              )}
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={() => handleBookWithProfessional(professional.id)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              {loadingReviews ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.user?.avatar} />
                            <AvatarFallback>
                              {getInitials(review.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{review.user?.name || "Usuário"}</h4>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Working Hours Tab */}
            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horário de Funcionamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {company.workingHours ? (
                    <div className="space-y-3">
                      {DAYS_OF_WEEK.map(({ key, label }) => {
                        const schedule = company.workingHours?.[key];
                        const isOpen = schedule?.isOpen;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                          >
                            <span className="font-medium">{label}</span>
                            {isOpen && schedule?.open && schedule?.close ? (
                              <span className="text-muted-foreground">
                                {schedule.open} - {schedule.close}
                              </span>
                            ) : (
                              <Badge variant="secondary">Fechado</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Horários não informados
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
