"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bell,
  BellDot,
  Calendar,
  MessageSquare,
  Star,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// API Response interface
interface APINotification {
  id: string;
  userId: string;
  activityType: string;
  referenceId?: string;
  relatedEntityType?: string;
  details?: {
    message?: string;
    [key: string]: unknown;
  };
  read?: boolean;
  createdAt: string;
}

// Mapped notification for UI
interface Notification {
  id: string;
  type: "appointment" | "review" | "message" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  referenceId?: string;
  activityType: string;
}

// Map activity type to notification type
const getNotificationType = (activityType: string): Notification["type"] => {
  const typeMap: Record<string, Notification["type"]> = {
    APPOINTMENT_CREATED: "appointment",
    APPOINTMENT_CONFIRMED: "appointment",
    APPOINTMENT_CANCELLED: "appointment",
    APPOINTMENT_COMPLETED: "appointment",
    APPOINTMENT_RESCHEDULED: "appointment",
    APPOINTMENT_REMINDER: "appointment",
    NEW_REVIEW: "review",
    REVIEW_RECEIVED: "review",
    NEW_MESSAGE: "message",
    MESSAGE_RECEIVED: "message",
  };
  return typeMap[activityType] || "system";
};

// Map activity type to title
const getNotificationTitle = (activityType: string): string => {
  const titleMap: Record<string, string> = {
    APPOINTMENT_CREATED: "Novo Agendamento",
    APPOINTMENT_CONFIRMED: "Agendamento Confirmado",
    APPOINTMENT_CANCELLED: "Agendamento Cancelado",
    APPOINTMENT_COMPLETED: "Agendamento Concluído",
    APPOINTMENT_RESCHEDULED: "Agendamento Remarcado",
    APPOINTMENT_REMINDER: "Lembrete de Agendamento",
    NEW_REVIEW: "Nova Avaliação",
    REVIEW_RECEIVED: "Avaliação Recebida",
    NEW_MESSAGE: "Nova Mensagem",
    MESSAGE_RECEIVED: "Mensagem Recebida",
  };
  return titleMap[activityType] || "Notificação";
};

// Map API notification to UI notification
const mapNotification = (apiNotification: APINotification): Notification => ({
  id: apiNotification.id,
  type: getNotificationType(apiNotification.activityType),
  title: getNotificationTitle(apiNotification.activityType),
  message: apiNotification.details?.message || "",
  read: apiNotification.read ?? false,
  createdAt: apiNotification.createdAt,
  referenceId: apiNotification.referenceId,
  activityType: apiNotification.activityType,
});

const getNotificationIcon = (activityType: string) => {
  switch (activityType) {
    case "APPOINTMENT_CREATED":
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case "APPOINTMENT_CONFIRMED":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "APPOINTMENT_CANCELLED":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "APPOINTMENT_COMPLETED":
      return <Check className="h-5 w-5 text-green-600" />;
    case "APPOINTMENT_RESCHEDULED":
      return <RefreshCw className="h-5 w-5 text-orange-500" />;
    case "APPOINTMENT_REMINDER":
      return <Clock className="h-5 w-5 text-amber-500" />;
    case "NEW_REVIEW":
    case "REVIEW_RECEIVED":
      return <Star className="h-5 w-5 text-yellow-500" />;
    case "NEW_MESSAGE":
    case "MESSAGE_RECEIVED":
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    data: apiNotifications = [],
    isLoading,
    isError,
    error,
  } = useQuery<APINotification[], Error>({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
  });

  // Map API notifications to UI format
  const notifications = apiNotifications.map(mapNotification);

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
    onError: () => {
      toast.error("Erro ao marcar notificações como lidas");
    },
  });

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold">Notificações</h1>
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BellDot className="mr-2 h-4 w-4" />
                  )}
                  Marcar todas como lidas
                </Button>
              )}
            </div>

            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">
                  Não lidas {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  Não foi possível carregar as notificações.
                  {error?.message && <p className="text-xs mt-2">Detalhes: {error.message}</p>}
                </AlertDescription>
              </Alert>
            )}

            {/* Notifications List */}
            {!isLoading && !isError && (
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {filter === "unread"
                          ? "Nenhuma notificação não lida"
                          : "Nenhuma notificação"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.activityType)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={`font-medium ${
                                  !notification.read ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {notification.read && (
                            <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
