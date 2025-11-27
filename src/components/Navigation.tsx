"use client";

import Link from "next/link";
import { useAuth, getEffectiveUserRole } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, 
  LogOut, 
  User, 
  Star, 
  Award, 
  Briefcase, 
  Building, 
  LayoutDashboard, 
  Menu,
  X,
  Search,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { InviteModal } from "@/components/InviteModal";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const userRole = getEffectiveUserRole(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-2xl text-primary">iAzi</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/bookings" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Meus Agendamentos
            </Link>
            <Link 
              href="/search" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Explorar
            </Link>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 mx-4 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar serviços, profissionais..."
              className="w-full h-9 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center justify-end space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <Link 
                href="/notifications" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 text-xs text-muted-foreground font-mono bg-muted rounded mb-1 cursor-default select-none">
                    {userRole}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  {user.isProfessional && (
                    <DropdownMenuItem asChild>
                      <Link href="/professional/dashboard" className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Painel Profissional
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {!user.isProfessional && (
                    <DropdownMenuItem asChild>
                      <Link href="/become-professional" className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Seja um Profissional
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.hasCompany || user.companyId ? (
                    <DropdownMenuItem asChild>
                      <Link href="/company/dashboard" className="flex items-center">
                        <Building className="mr-2 h-4 w-4" />
                        Painel da Empresa
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/register-company" className="flex items-center">
                        <Building className="mr-2 h-4 w-4" />
                        Cadastrar Empresa
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/reviews" className="flex items-center">
                      <Star className="mr-2 h-4 w-4" />
                      Avaliações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/gamification" className="flex items-center">
                      <Award className="mr-2 h-4 w-4" />
                      Conquistas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <InviteModal 
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Convidar Amigos
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Registrar
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar serviços..."
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-2">
            <Link 
              href="/bookings" 
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Meus Agendamentos
            </Link>
            <Link 
              href="/search" 
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explorar
            </Link>
          </div>

          {isAuthenticated && user ? (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center space-x-3 pb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Link 
                href="/profile" 
                className="block py-2 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Meu Perfil
              </Link>
              {user.isProfessional ? (
                <Link 
                  href="/professional/dashboard" 
                  className="block py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Painel Profissional
                </Link>
              ) : (
                <Link 
                  href="/become-professional" 
                  className="block py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Seja um Profissional
                </Link>
              )}
              {(user.hasCompany || user.companyId) ? (
                <Link 
                  href="/company/dashboard" 
                  className="block py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Painel da Empresa
                </Link>
              ) : (
                <Link 
                  href="/register-company" 
                  className="block py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cadastrar Empresa
                </Link>
              )}
              <div className="py-2">
                <InviteModal 
                  trigger={
                    <button className="flex items-center text-sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Convidar Amigos
                    </button>
                  }
                />
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block py-2 text-sm text-destructive"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t flex gap-2">
              <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Registrar</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
