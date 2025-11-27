"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export function UserReviews() {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl">Minhas Avaliações</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Você ainda não fez nenhuma avaliação</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Após utilizar um serviço, você poderá avaliar o profissional e compartilhar sua
            experiência com outros usuários.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
