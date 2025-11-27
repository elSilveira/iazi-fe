"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchProfessionalMe, fetchProfessionalAppointments } from "@/lib/api";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: { id: string; name: string };
  user?: { id: string; name: string };
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500";
    case "confirmed":
      return "bg-blue-500";
    case "in_progress":
      return "bg-purple-500";
    case "completed":
      return "bg-green-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function ProfessionalCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const dateFrom = format(weekStart, "yyyy-MM-dd");
  const dateTo = format(weekEnd, "yyyy-MM-dd");

  // First get the professional profile to get the ID
  const { data: professional } = useQuery({
    queryKey: ["professionalMe"],
    queryFn: fetchProfessionalMe,
  });

  const professionalId = professional?.id;

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["professionalCalendar", professionalId, dateFrom, dateTo],
    queryFn: () => fetchProfessionalAppointments(professionalId!, dateFrom, dateTo),
    enabled: !!professionalId,
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.startTime), date));
  };

  const selectedDayAppointments = getAppointmentsForDay(selectedDate);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

  return (
    <ProfessionalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Calendário</h1>
            <p className="text-muted-foreground">
              {format(weekStart, "dd MMM", { locale: ptBR })} -{" "}
              {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Mini Calendar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          {/* Week View */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Week Header */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {weekDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`p-2 text-center rounded-lg transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : isToday
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div className="text-xs font-medium">
                              {format(day, "EEE", { locale: ptBR })}
                            </div>
                            <div className="text-lg font-bold">{format(day, "d")}</div>
                            <div className="flex justify-center gap-0.5 mt-1">
                              {getAppointmentsForDay(day)
                                .slice(0, 3)
                                .map((apt) => (
                                  <div
                                    key={apt.id}
                                    className={`w-1.5 h-1.5 rounded-full ${getStatusColor(apt.status)}`}
                                  />
                                ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Day Appointments */}
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-4">
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      {selectedDayAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum agendamento para este dia
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedDayAppointments
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map((apt) => (
                              <div
                                key={apt.id}
                                className={`p-3 rounded-lg border-l-4 ${getStatusColor(apt.status)} bg-muted/50`}
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(parseISO(apt.startTime), "HH:mm")} -{" "}
                                    {format(parseISO(apt.endTime), "HH:mm")}
                                  </span>
                                </div>
                                <p className="font-medium mt-1">{apt.service?.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <User className="h-3 w-3" />
                                  {apt.user?.name}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfessionalLayout>
  );
}
