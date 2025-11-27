"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";

export function UserPaymentMethods() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-2xl">Métodos de Pagamento</CardTitle>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Cartão
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum método de pagamento cadastrado</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Adicione um cartão de crédito ou débito para facilitar seus pagamentos e agilizar o
            processo de agendamento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
