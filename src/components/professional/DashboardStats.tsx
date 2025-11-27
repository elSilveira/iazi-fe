"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Users, CreditCard, Calendar } from "lucide-react";

export interface DashboardStatsData {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  currentMonthAppointments: number;
  previousMonthAppointments: number;
  currentMonthNewClients: number;
  previousMonthNewClients: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData | null;
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-32 mt-2" />
            <Skeleton className="h-4 w-40 mt-2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statsCards = [
    {
      title: "Faturamento",
      icon: CreditCard,
      value: formatCurrency(stats.currentMonthRevenue),
      current: stats.currentMonthRevenue,
      previous: stats.previousMonthRevenue,
    },
    {
      title: "Agendamentos",
      icon: Calendar,
      value: stats.currentMonthAppointments.toString(),
      current: stats.currentMonthAppointments,
      previous: stats.previousMonthAppointments,
    },
    {
      title: "Novos Clientes",
      icon: Users,
      value: stats.currentMonthNewClients.toString(),
      current: stats.currentMonthNewClients,
      previous: stats.previousMonthNewClients,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statsCards.map((stat) => {
        const percentChange = calculatePercentageChange(stat.current, stat.previous);
        const isPositive = percentChange >= 0;

        return (
          <Card key={stat.title} className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium tracking-tight">{stat.title}</h3>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span
                className={`inline-flex items-center ${
                  isPositive ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3" />
                )}
                {Math.abs(percentChange)}%
              </span>{" "}
              em relação ao mês passado
            </p>
          </Card>
        );
      })}
    </div>
  );
}
