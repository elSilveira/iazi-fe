"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Calendar,
  ClipboardList,
  Settings,
  Star,
  Users,
  BarChart3,
} from "lucide-react";

const sidebarLinks = [
  {
    href: "/company/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/company/profile",
    label: "Perfil da Empresa",
    icon: Building,
  },
  {
    href: "/company/calendar",
    label: "Calendário",
    icon: Calendar,
  },
  {
    href: "/company/services",
    label: "Serviços",
    icon: ClipboardList,
  },
  {
    href: "/company/staff",
    label: "Funcionários",
    icon: Users,
  },
  {
    href: "/company/reviews",
    label: "Avaliações",
    icon: Star,
  },
  {
    href: "/company/reports",
    label: "Relatórios",
    icon: BarChart3,
  },
  {
    href: "/company/settings",
    label: "Configurações",
    icon: Settings,
  },
];

interface CompanyLayoutProps {
  children: ReactNode;
}

export function CompanyLayout({ children }: CompanyLayoutProps) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="company">
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-64px)]">
            <nav className="flex-1 p-4 space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
            <nav className="flex justify-around py-2">
              {sidebarLinks.slice(0, 5).map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-1 text-xs",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
