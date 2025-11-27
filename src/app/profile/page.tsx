"use client";

import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileInfo } from "@/components/profile/UserProfileInfo";
import { UserAddresses } from "@/components/profile/UserAddresses";
import { UserPaymentMethods } from "@/components/profile/UserPaymentMethods";
import { UserNotifications } from "@/components/profile/UserNotifications";
import { UserReviews } from "@/components/profile/UserReviews";
import { UserPrivacy } from "@/components/profile/UserPrivacy";
import { UserRound } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
              <UserRound className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold">Meu Perfil</h1>
            </div>

            <Tabs defaultValue="personal" className="space-y-4">
              <div className="bg-card rounded-md shadow-sm border">
                <TabsList className="w-full justify-start p-1 bg-muted/20 border-b rounded-t-md rounded-b-none flex-wrap h-auto">
                  <TabsTrigger value="personal" className="rounded-sm">
                    Informações Pessoais
                  </TabsTrigger>
                  <TabsTrigger value="addresses" className="rounded-sm">
                    Endereços
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="rounded-sm">
                    Pagamento
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="rounded-sm">
                    Notificações
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-sm">
                    Avaliações
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="rounded-sm">
                    Privacidade
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="personal" className="mt-0">
                    <UserProfileInfo />
                  </TabsContent>
                  <TabsContent value="addresses" className="mt-0">
                    <UserAddresses />
                  </TabsContent>
                  <TabsContent value="payments" className="mt-0">
                    <UserPaymentMethods />
                  </TabsContent>
                  <TabsContent value="notifications" className="mt-0">
                    <UserNotifications />
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-0">
                    <UserReviews />
                  </TabsContent>
                  <TabsContent value="privacy" className="mt-0">
                    <UserPrivacy />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
