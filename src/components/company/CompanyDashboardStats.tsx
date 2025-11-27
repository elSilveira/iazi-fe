"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Users, Star } from "lucide-react";

export interface CompanyDashboardStatsData {
  appointmentsToday: number;
  monthlyRevenue: number;
  clientsThisMonth: number;
  averageRating: number;
}

interface CompanyDashboardStatsProps {
  stats: CompanyDashboardStatsData | null;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CompanyDashboardStats({ stats, isLoading }: CompanyDashboardStatsProps) {
  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: stats?.appointmentsToday ?? 0,
      icon: Calendar,
      format: (v: number) => v.toString(),
    },
    {
      title: "Receita Mensal",
      value: stats?.monthlyRevenue ?? 0,
      icon: DollarSign,
      format: formatCurrency,
    },
    {
      title: "Clientes (Mês)",
      value: stats?.clientsThisMonth ?? 0,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      title: "Avaliação Média",
      value: stats?.averageRating ?? 0,
      icon: Star,
      format: (v: number) => `${v.toFixed(1)}/5.0`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stat.format(stat.value)}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
