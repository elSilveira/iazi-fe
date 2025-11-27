"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Mail, Phone, Calendar, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  professionalId?: string;
  isActive?: boolean;
  appointmentsCount?: number;
  averageRating?: number;
}

interface StaffListProps {
  staff: StaffMember[];
  isLoading: boolean;
  onEdit?: (staff: StaffMember) => void;
  onRemove?: (staffId: string) => void;
  onViewProfile?: (staff: StaffMember) => void;
}

export function StaffList({ staff, isLoading, onEdit, onRemove, onViewProfile }: StaffListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
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
          <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {staff.map((member) => (
        <Card key={member.id} className="relative">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>
                    {member.name?.[0]?.toUpperCase() || "F"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role || "Funcionário"}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewProfile && (
                    <DropdownMenuItem onClick={() => onViewProfile(member)}>
                      Ver Perfil
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onRemove(member.id)}
                    >
                      Remover
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              {member.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              {member.appointmentsCount !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{member.appointmentsCount} agend.</span>
                </div>
              )}
              {member.averageRating !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{member.averageRating.toFixed(1)}</span>
                </div>
              )}
              <Badge variant={member.isActive !== false ? "default" : "secondary"} className="ml-auto">
                {member.isActive !== false ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
