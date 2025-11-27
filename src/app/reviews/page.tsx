"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPendingReviews, fetchMyReviews } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Star, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface PendingReview {
  id: string;
  startTime: string;
  service?: {
    id: string;
    name: string;
    price: number;
  };
  professional?: {
    id: string;
    user?: {
      name: string;
      avatarUrl?: string;
    };
  };
}

interface MyReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  service?: {
    id: string;
    name: string;
  };
  professional?: {
    id: string;
    user?: {
      name: string;
      avatarUrl?: string;
    };
  };
  professionalResponse?: string;
}

function ReviewsPageContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAppointment, setSelectedAppointment] = useState<PendingReview | null>(null);
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

  const handleReviewClick = (appointment: PendingReview) => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
            <p className="text-muted-foreground">
              Avalie os serviços que você utilizou e veja suas avaliações anteriores
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Histórico {historyCount > 0 && `(${historyCount})`}
              </TabsTrigger>
            </TabsList>

            {/* Pending Reviews */}
            <TabsContent value="pending" className="space-y-4">
              {loadingPending ? (
                <LoadingSkeleton />
              ) : pendingReviews && pendingReviews.length > 0 ? (
                pendingReviews.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={appointment.professional?.user?.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(appointment.professional?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {appointment.service?.name || "Serviço"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {appointment.professional?.user?.name || "Profissional"} •{" "}
                            {formatDate(appointment.startTime)}
                          </p>
                        </div>
                        <Button onClick={() => handleReviewClick(appointment)}>
                          <Star className="h-4 w-4 mr-2" />
                          Avaliar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                myReviews.map((review) => (
                  <Card key={review.id} className="border-l-4 border-l-primary/50">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.professional?.user?.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(review.professional?.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">
                                {review.service?.name || "Serviço"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {review.professional?.user?.name} • {formatDate(review.createdAt)}
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
                ))
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
          professionalName={selectedAppointment.professional?.user?.name}
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
