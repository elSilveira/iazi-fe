"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, ThumbsUp, TrendingUp, Filter } from "lucide-react";
import { fetchCompanyReviews, fetchCompanyStaff } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  clientName: string;
  clientAvatar?: string;
  professionalName: string;
  professionalId: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

export default function CompanyReviewsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["companyReviews", companyId],
    queryFn: () => fetchCompanyReviews(companyId!),
    enabled: !!companyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  // Calculate stats from reviews
  const stats: ReviewStats = {
    averageRating:
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0,
    totalReviews: reviews.length,
    ratingDistribution: reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number }),
  };

  const filteredReviews = reviews.filter((review) => {
    if (selectedProfessional !== "all" && review.professionalId !== selectedProfessional) {
      return false;
    }
    if (selectedRating !== "all" && review.rating !== parseInt(selectedRating)) {
      return false;
    }
    return true;
  });

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "sm") => {
    const sizeClass = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Avaliações</h1>
          <p className="text-muted-foreground">
            Acompanhe o feedback dos clientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  {renderStars(Math.round(stats.averageRating), "sm")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalReviews}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">5 Estrelas</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div className="text-3xl font-bold">
                  {stats.ratingDistribution[5] || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa Positiva</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div className="text-3xl font-bold">
                  {stats.totalReviews > 0
                    ? (
                        (((stats.ratingDistribution[4] || 0) +
                          (stats.ratingDistribution[5] || 0)) /
                          stats.totalReviews) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage =
                  stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {staff.map((member: { id: string; name: string }) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <SelectTrigger className="w-[140px]">
              <Star className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estrelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="5">5 Estrelas</SelectItem>
              <SelectItem value="4">4 Estrelas</SelectItem>
              <SelectItem value="3">3 Estrelas</SelectItem>
              <SelectItem value="2">2 Estrelas</SelectItem>
              <SelectItem value="1">1 Estrela</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {reviews.length === 0
                  ? "Ainda não há avaliações"
                  : "Nenhuma avaliação encontrada com os filtros selecionados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.clientAvatar} />
                      <AvatarFallback>
                        {review.clientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{review.clientName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(review.date), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{review.serviceName}</Badge>
                          <Badge variant="outline">{review.professionalName}</Badge>
                        </div>
                      </div>

                      <p className="mt-3 text-muted-foreground">{review.comment}</p>

                      {review.reply && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Resposta da empresa:</p>
                          <p className="text-sm text-muted-foreground">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
