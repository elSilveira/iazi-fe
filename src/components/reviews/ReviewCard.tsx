"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface ReviewCardProps {
  review: Review;
  showService?: boolean;
}

export function ReviewCard({ review, showService = false }: ReviewCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardContent className="pt-4">
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
                {showService && review.service && (
                  <p className="text-xs text-muted-foreground">
                    {review.service.name}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(review.createdAt)}
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
      </CardContent>
    </Card>
  );
}
