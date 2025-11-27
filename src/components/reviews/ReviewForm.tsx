"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  isLoading?: boolean;
  initialRating?: number;
  initialComment?: string;
}

export function ReviewForm({
  onSubmit,
  isLoading = false,
  initialRating = 0,
  initialComment = "",
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  const getRatingText = (value: number) => {
    const texts = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
    return texts[value] || "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Sua avaliação</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  value <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {getRatingText(hoverRating || rating)}
          </span>
        </div>
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">
            Clique nas estrelas para avaliar
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comentário (opcional)</Label>
        <Textarea
          id="comment"
          placeholder="Conte como foi sua experiência..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || isLoading}
        className="w-full"
      >
        {isLoading ? "Enviando..." : "Enviar Avaliação"}
      </Button>
    </form>
  );
}
