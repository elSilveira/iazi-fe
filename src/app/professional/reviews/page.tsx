"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2, Star, MessageSquare } from "lucide-react";
import { fetchProfessionalMe, fetchProfessionalReviews } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  service?: {
    id: string;
    name: string;
  };
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${
        i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
      }`}
    />
  ));
};

export default function ProfessionalReviewsPage() {
  // First get the professional profile to get the ID
  const { data: professional } = useQuery({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  const professionalId = professional?.id;

  const { data, isLoading } = useQuery<Review[]>({
    queryKey: ["professionalReviews", professionalId],
    queryFn: () => fetchProfessionalReviews(professionalId!),
    enabled: !!professionalId,
  });

  const reviews = data || [];
  
  // Calculate stats from reviews
  const stats = {
    averageRating: reviews.length > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0,
    totalReviews: reviews.length,
    distribution: reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number }),
  };

  return (
    <ProfessionalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Avaliações</h1>
          <p className="text-muted-foreground">Veja o que seus clientes dizem sobre você</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center gap-1 my-2">
                    {renderStars(Math.round(stats.averageRating))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalReviews} avaliações
                  </p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] || 0;
                    const percentage =
                      stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm w-3">{star}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Progress value={percentage} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground w-8">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não recebeu nenhuma avaliação
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={review.user?.avatar} />
                          <AvatarFallback>
                            {review.user?.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {review.user?.name || "Cliente"}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(review.rating)}</div>
                                {(review.updatedAt || review.createdAt) && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(review.updatedAt || review.createdAt!), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {review.service?.name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Serviço: {review.service.name}
                            </p>
                          )}
                          {review.comment && (
                            <p className="text-sm mt-2">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}
