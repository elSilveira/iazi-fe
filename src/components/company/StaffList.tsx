"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Mail, Phone, Star, Briefcase, Clock, User, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  image?: string;
  coverImage?: string;
  bio?: string;
  professionalId?: string;
  userId?: string;
  isActive?: boolean;
  rating?: number;
  totalReviews?: number;
  services?: Array<{ service?: { id: string; name: string } }>;
  workingHours?: Record<string, { start?: string; end?: string; isOpen?: boolean }>;
}

interface StaffListProps {
  staff: StaffMember[];
  isLoading: boolean;
  onEdit?: (staff: StaffMember) => void;
  onRemove?: (staffId: string) => void;
  onViewProfile?: (staff: StaffMember) => void;
}

// Helper to check if professional is working today
function isWorkingToday(workingHours?: StaffMember["workingHours"]): boolean {
  if (!workingHours) return false;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const todayHours = workingHours[today];
  return todayHours?.isOpen === true;
}

// Helper to format working hours for today
function getTodayHours(workingHours?: StaffMember["workingHours"]): string | null {
  if (!workingHours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const todayHours = workingHours[today];
  if (todayHours?.isOpen && todayHours.start && todayHours.end) {
    return `${todayHours.start} - ${todayHours.end}`;
  }
  return null;
}

export function StaffList({ staff, isLoading, onEdit, onRemove, onViewProfile }: StaffListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione profissionais à sua equipe para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {staff.map((member) => {
        const avatarSrc = member.image || member.avatar;
        const servicesCount = member.services?.length || 0;
        const isWorking = isWorkingToday(member.workingHours);
        const todayHours = getTodayHours(member.workingHours);
        
        return (
          <Card key={member.id} className="relative overflow-hidden">
            {/* Cover Image */}
            {member.coverImage && (
              <div 
                className="h-20 bg-cover bg-center"
                style={{ backgroundImage: `url(${member.coverImage})` }}
              />
            )}
            
            <CardContent className={`p-6 ${member.coverImage ? '-mt-8' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-16 w-16 border-4 border-background ${member.coverImage ? 'shadow-lg' : ''}`}>
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {member.name?.[0]?.toUpperCase() || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.role || "Profissional"}</p>
                    {/* Rating */}
                    {member.rating !== undefined && member.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{member.rating.toFixed(1)}</span>
                        {member.totalReviews !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            ({member.totalReviews} avaliações)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/professional/${member.id}`} className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Ver Perfil Público
                      </Link>
                    </DropdownMenuItem>
                    {onViewProfile && (
                      <DropdownMenuItem onClick={() => onViewProfile(member)}>
                        <User className="h-4 w-4 mr-2" />
                        Detalhes
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(member)}>
                          Editar
                        </DropdownMenuItem>
                      </>
                    )}
                    {onRemove && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onRemove(member.id)}
                        >
                          Remover da Equipe
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {member.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-2 text-sm mb-4">
                {member.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Stats & Status */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                {servicesCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {servicesCount} {servicesCount === 1 ? 'serviço' : 'serviços'}
                  </Badge>
                )}
                
                {todayHours && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {todayHours}
                  </Badge>
                )}
                
                <Badge 
                  variant={isWorking ? "default" : "secondary"} 
                  className="ml-auto"
                >
                  {isWorking ? "Disponível Hoje" : "Indisponível"}
                </Badge>
              </div>

              {/* View Profile Button */}
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/professional/${member.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
