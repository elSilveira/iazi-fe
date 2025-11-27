"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Star,
  BarChart3,
  Settings,
  ClipboardList,
} from "lucide-react";

const sidebarLinks = [
  {
    href: "/professional/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/professional/calendar",
    label: "Calendário",
    icon: Calendar,
  },
  {
    href: "/professional/bookings",
    label: "Agendamentos",
    icon: ClipboardList,
  },
  {
    href: "/professional/services",
    label: "Serviços",
    icon: Briefcase,
  },
  {
    href: "/professional/reviews",
    label: "Avaliações",
    icon: Star,
  },
  {
    href: "/professional/reports",
    label: "Relatórios",
    icon: BarChart3,
  },
  {
    href: "/professional/settings",
    label: "Configurações",
    icon: Settings,
  },
];

interface ProfessionalLayoutProps {
  children: ReactNode;
}

export function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="professional">
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
