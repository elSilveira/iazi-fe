"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { DashboardStats, DashboardStatsData } from "@/components/professional/DashboardStats";
import { UpcomingAppointments, Appointment } from "@/components/professional/UpcomingAppointments";
import { PopularServices, PopularService } from "@/components/professional/PopularServices";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  fetchProfessionalMe,
  fetchProfessionalDashboardStats,
  fetchUpcomingAppointments,
  fetchProfessionalPopularServices,
} from "@/lib/api";

export default function ProfessionalDashboardPage() {
  const { user } = useAuth();

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // First, fetch the professional profile to get the ID
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchProfessionalMe();
        setProfessionalId(profile.id);
      } catch (err) {
        console.error("Erro ao buscar perfil profissional:", err);
        setError("Erro ao carregar perfil profissional");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Then fetch dashboard data using the professional ID
  useEffect(() => {
    if (!professionalId) return;

    const fetchStats = async () => {
      try {
        const data = await fetchProfessionalDashboardStats(professionalId);
        setStats(data);
      } catch (err) {
        console.error("Erro ao buscar estatísticas:", err);
        // Don't set error, just log - stats might not be available
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId) return;

    const fetchNextAppointments = async () => {
      try {
        const data = await fetchUpcomingAppointments(professionalId);
        setAppointments(data);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchNextAppointments();
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId) return;

    const fetchServices = async () => {
      try {
        const data = await fetchProfessionalPopularServices(professionalId);
        setPopularServices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar serviços populares:", err);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [professionalId]);

  const isLoading = isLoadingProfile || isLoadingStats || isLoadingAppointments || isLoadingServices;

  return (
    <ProfessionalLayout>
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.name?.split(" ")[0] || "Profissional"}!
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !error ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando dados do dashboard...</span>
          </div>
        ) : (
          <>
            <DashboardStats stats={stats} isLoading={isLoadingStats} />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <UpcomingAppointments appointments={appointments} isLoading={isLoadingAppointments} />
              <PopularServices services={popularServices} isLoading={isLoadingServices} />
            </div>
          </>
        )}
      </div>
    </ProfessionalLayout>
  );
}
