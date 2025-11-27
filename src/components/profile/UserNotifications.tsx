"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const notificationPreferences = [
  { id: "email", label: "Notificações por Email", description: "Receba atualizações importantes por email" },
  { id: "sms", label: "Notificações por SMS", description: "Receba lembretes de agendamentos por SMS" },
  { id: "push", label: "Notificações Push", description: "Receba notificações em tempo real no navegador" },
  { id: "marketing", label: "Comunicações de Marketing", description: "Receba ofertas e promoções especiais" },
];

export function UserNotifications() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências de Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationPreferences.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between space-x-4 p-4 border rounded-lg"
          >
            <div className="space-y-0.5">
              <Label htmlFor={pref.id} className="text-base font-medium cursor-pointer">
                {pref.label}
              </Label>
              <p className="text-sm text-muted-foreground">{pref.description}</p>
            </div>
            <Switch id={pref.id} defaultChecked={pref.id === "email" || pref.id === "push"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
