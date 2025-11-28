"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPendingReviews, fetchMyReviews, fetchMyClientReviews, getClientStats, ClientReview, ClientStats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Star, Clock, CheckCircle, MessageSquare, UserCheck, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface PendingReview {
  id: string;
  startTime: string;
  endTime?: string;
  status?: string;
  notes?: string | null;
  services?: Array<{
    appointmentId: string;
    serviceId: string;
    service: {
      id: string;
      name: string;
      description?: string;
      duration?: string;
      price?: string;
      image?: string;
    };
  }>;
  professional?: {
    id: string;
    name: string;
    image?: string;
    user?: {
      name: string;
      avatarUrl?: string;
    };
  };
}

interface MyReview {
  id: string;
  rating: number;
  comment?: string | null;
  updatedAt: string;
  createdAt?: string;
  userId: string;
  serviceId?: string | null;
  professionalId?: string | null;
  companyId?: string | null;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  service?: {
    id: string;
    name: string;
  };
  professional?: {
    id: string;
    user?: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
  professionalResponse?: string;
}

// Interface for selected appointment (for ReviewDialog)
interface SelectedAppointment {
  id: string;
  service?: {
    id: string;
    name: string;
  };
  professional?: {
    id: string;
    name?: string;
    user?: {
      name?: string;
      avatarUrl?: string;
    };
  };
}

function ReviewsPageContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Fetch pending reviews (completed appointments without review)
  const { data: pendingReviews, isLoading: loadingPending } = useQuery<PendingReview[]>({
    queryKey: ["pendingReviews"],
    queryFn: fetchPendingReviews,
    enabled: !!user,
  });

  // Fetch user's submitted reviews
  const { data: myReviews, isLoading: loadingMyReviews } = useQuery<MyReview[]>({
    queryKey: ["myReviews"],
    queryFn: fetchMyReviews,
    enabled: !!user,
  });

  // Fetch reviews received by user (as a client)
  const { data: receivedReviews, isLoading: loadingReceived } = useQuery<ClientReview[]>({
    queryKey: ["myClientReviews"],
    queryFn: fetchMyClientReviews,
    enabled: !!user,
  });

  // Fetch client stats
  const { data: clientStats } = useQuery<ClientStats>({
    queryKey: ["clientStats", user?.id],
    queryFn: () => getClientStats(user!.id),
    enabled: !!user?.id,
  });

  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d 'de' MMMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleReviewClick = (appointment: SelectedAppointment) => {
    setSelectedAppointment(appointment);
    setReviewDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const pendingCount = pendingReviews?.length || 0;
  const historyCount = myReviews?.length || 0;
  const receivedCount = receivedReviews?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
            <p className="text-muted-foreground">
              Avalie os serviços que você utilizou e veja suas avaliações
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{historyCount}</div>
                  <div className="text-xs text-muted-foreground">Realizadas</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{receivedCount}</div>
                  <div className="text-xs text-muted-foreground">Recebidas</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pendentes</span> {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Realizadas</span> {historyCount > 0 && `(${historyCount})`}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Recebidas</span> {receivedCount > 0 && `(${receivedCount})`}
              </TabsTrigger>
            </TabsList>

            {/* Pending Reviews */}
            <TabsContent value="pending" className="space-y-4">
              {loadingPending ? (
                <LoadingSkeleton />
              ) : pendingReviews && pendingReviews.length > 0 ? (
                pendingReviews.map((appointment) => {
                  // Extract service name from services array
                  const firstService = appointment.services?.[0]?.service;
                  const serviceName = firstService?.name || "Serviço";
                  const serviceId = firstService?.id;
                  
                  // Extract professional data
                  const professionalName = appointment.professional?.name || appointment.professional?.user?.name;
                  const professionalImage = appointment.professional?.image || appointment.professional?.user?.avatarUrl;
                  const professionalId = appointment.professional?.id;
                  
                  return (
                    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={professionalImage} />
                            <AvatarFallback>
                              {getInitials(professionalName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">
                              {serviceName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {professionalName || "Profissional"} •{" "}
                              {formatDate(appointment.startTime)}
                            </p>
                          </div>
                          <Button onClick={() => handleReviewClick({
                            id: appointment.id,
                            service: firstService ? { id: firstService.id, name: firstService.name } : undefined,
                            professional: professionalId ? { 
                              id: professionalId, 
                              name: professionalName,
                              user: { name: professionalName, avatarUrl: professionalImage } 
                            } : undefined,
                          })}>
                            <Star className="h-4 w-4 mr-2" />
                            Avaliar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Tudo avaliado!</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Você não tem serviços pendentes de avaliação.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/bookings">Ver Agendamentos</Link>
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* Review History */}
            <TabsContent value="history" className="space-y-4">
              {loadingMyReviews ? (
                <LoadingSkeleton />
              ) : myReviews && myReviews.length > 0 ? (
                myReviews.map((review) => {
                  // Get professional name and avatar from professional.user
                  const professionalName = review.professional?.user?.name;
                  const professionalAvatar = review.professional?.user?.avatar;
                  // Get service name directly from service
                  const serviceName = review.service?.name;
                  
                  return (
                    <Card key={review.id} className="border-l-4 border-l-primary/50">
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={professionalAvatar || undefined} />
                            <AvatarFallback>
                              {getInitials(professionalName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {serviceName || "Serviço"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {professionalName ? `com ${professionalName}` : "Profissional"} • {formatDate(review.updatedAt || review.createdAt || "")}
                                </p>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5 my-2">
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
                              <p className="text-sm text-muted-foreground">
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
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Você ainda não fez nenhuma avaliação.
                  </p>
                  {pendingCount > 0 && (
                    <Button onClick={() => setActiveTab("pending")}>
                      Ver Pendentes
                    </Button>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* Received Reviews (from professionals) */}
            <TabsContent value="received" className="space-y-4">
              {/* Client Stats Summary */}
              {clientStats && (
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {clientStats.averageRating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-0.5 justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Star
                                key={value}
                                className={`h-3 w-3 ${
                                  value <= Math.round(clientStats.averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sua nota média
                          </p>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div className="text-center">
                          <div className="text-2xl font-bold">{clientStats.totalReviews}</div>
                          <p className="text-xs text-muted-foreground">Avaliações</p>
                        </div>
                        {clientStats.noShowCount > 0 && (
                          <>
                            <div className="h-12 w-px bg-border" />
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-lg font-bold">{clientStats.noShowCount}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Faltas</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingReceived ? (
                <LoadingSkeleton />
              ) : receivedReviews && receivedReviews.length > 0 ? (
                receivedReviews.map((review) => {
                  // Get professional info from API response (professional.user.name)
                  const professionalName = review.professional?.user?.name || review.professional?.name;
                  const professionalImage = review.professional?.user?.avatar || review.professional?.image;
                  // Get service from appointment.services
                  const serviceName = review.appointment?.services?.[0]?.service?.name;
                  
                  return (
                    <Card key={review.id} className={`border-l-4 ${review.wasNoShow ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={professionalImage || undefined} />
                            <AvatarFallback>{getInitials(professionalName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {professionalName ? `Avaliação de ${professionalName}` : "Avaliação de Profissional"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {serviceName && `${serviceName} • `}
                                  {review.appointment?.startTime 
                                    ? formatDate(review.appointment.startTime)
                                    : formatDate(review.createdAt)
                                  }
                                </p>
                              </div>
                              {review.wasNoShow && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Não compareceu
                                </Badge>
                              )}
                            </div>

                          {/* Stars */}
                          <div className="flex items-center gap-0.5 my-2">
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
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação recebida</h3>
                  <p className="text-muted-foreground text-sm">
                    Os profissionais ainda não avaliaram você.
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Review Dialog */}
      {selectedAppointment && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          appointmentId={selectedAppointment.id}
          professionalId={selectedAppointment.professional?.id || ""}
          serviceId={selectedAppointment.service?.id}
          serviceName={selectedAppointment.service?.name}
          professionalName={selectedAppointment.professional?.name || selectedAppointment.professional?.user?.name}
        />
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <ProtectedRoute>
      <ReviewsPageContent />
    </ProtectedRoute>
  );
}
