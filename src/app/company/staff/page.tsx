"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyLayout } from "@/components/company/CompanyLayout";
import { StaffList, StaffMember } from "@/components/company/StaffList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchCompanyStaff, addCompanyStaff, removeCompanyStaff } from "@/lib/api";

export default function CompanyStaffPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["companyStaff", companyId],
    queryFn: () => fetchCompanyStaff(companyId!),
    enabled: !!companyId,
  });

  const addStaffMutation = useMutation({
    mutationFn: (email: string) => addCompanyStaff(companyId!, { email }),
    onSuccess: () => {
      toast.success("Funcionário adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyStaff", companyId] });
      setShowAddDialog(false);
      setNewStaffEmail("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar funcionário");
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: (staffId: string) => removeCompanyStaff(companyId!, staffId),
    onSuccess: () => {
      toast.success("Funcionário removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["companyStaff", companyId] });
      setShowRemoveDialog(false);
      setSelectedStaffId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover funcionário");
    },
  });

  const handleAddStaff = () => {
    if (!newStaffEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    addStaffMutation.mutate(newStaffEmail);
  };

  const handleRemoveStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveStaff = () => {
    if (selectedStaffId) {
      removeStaffMutation.mutate(selectedStaffId);
    }
  };

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe da sua empresa
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Staff List */}
        <StaffList
          staff={filteredStaff}
          isLoading={isLoading}
          onRemove={handleRemoveStaff}
        />

        {/* Add Staff Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Funcionário</DialogTitle>
              <DialogDescription>
                Digite o email do profissional que deseja adicionar à equipe.
                O profissional precisa estar cadastrado na plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStaff} disabled={addStaffMutation.isPending}>
                {addStaffMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Staff Confirmation */}
        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Funcionário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este funcionário da equipe?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveStaff}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeStaffMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CompanyLayout>
  );
}
