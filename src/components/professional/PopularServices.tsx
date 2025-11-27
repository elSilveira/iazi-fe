"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Star, Briefcase } from "lucide-react";

export interface PopularService {
  id: string;
  name: string;
  appointmentCount: number;
  rating: number;
}

interface PopularServicesProps {
  services: PopularService[];
  isLoading: boolean;
}

export function PopularServices({ services, isLoading }: PopularServicesProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Serviços Populares</h3>
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando serviços...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Serviços Populares</h3>
      {services.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum serviço disponível</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead className="text-center">Agendamentos</TableHead>
              <TableHead className="text-center">Avaliação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-center">{service.appointmentCount}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {service.rating.toFixed(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
