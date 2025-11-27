"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  Star,
  Users,
  Briefcase,
} from "lucide-react";

const companyMenu = [
  {
    href: "/company/dashboard",
    label: "Dashboard",
    icon: BarChart3,
  },
  {
    href: "/company/profile",
    label: "Perfil da Empresa",
    icon: Building,
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
    href: "/company/calendar",
    label: "Calendário",
    icon: Calendar,
  },
  {
    href: "/company/reviews",
    label: "Avaliações",
    icon: Star,
  },
  {
    href: "/company/reports",
    label: "Relatórios",
    icon: FileText,
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
        
        {/* Top Navigation Bar */}
        <div className="sticky top-14 z-40 bg-background border-b shadow-sm">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-center h-12 overflow-x-auto px-4 scrollbar-hide">
              {companyMenu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 mx-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
