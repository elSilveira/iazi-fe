"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    stars: number;
    count: number;
    percentage: number;
  }[];
}

interface ReviewStatsCardProps {
  stats: ReviewStats;
}

export function ReviewStatsCard({ stats }: ReviewStatsCardProps) {
  // Generate distribution if not provided
  const distribution = stats.ratingDistribution || [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Avaliações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-4 w-4 ${
                    value <= Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.totalReviews} {stats.totalReviews === 1 ? "avaliação" : "avaliações"}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {distribution.map(({ stars, count, percentage }) => (
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
  );
}
