"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  Copy, 
  Check, 
  Loader2, 
  Share2,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { generateInviteCode, fetchMyInvites } from "@/lib/api";

interface Invite {
  id: string;
  code: string;
  used: boolean;
  usedBy?: {
    name: string;
  };
  createdAt: string;
  expiresAt?: string;
}

interface InviteModalProps {
  trigger?: React.ReactNode;
}

export function InviteModal({ trigger }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: invitesData, isLoading: loadingInvites } = useQuery({
    queryKey: ["myInvites"],
    queryFn: fetchMyInvites,
    enabled: open,
  });
  const invites: Invite[] = invitesData?.data || invitesData || [];

  const generateMutation = useMutation({
    mutationFn: generateInviteCode,
    onSuccess: (data) => {
      toast.success("Código de convite gerado!");
      queryClient.invalidateQueries({ queryKey: ["myInvites"] });
      // Auto copy the new code
      if (data?.code) {
        copyToClipboard(data.code);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar código de convite");
    },
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Código copiado!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const copyInviteLink = async (code: string) => {
    try {
      const link = `${window.location.origin}/register?inviteCode=${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(`link-${code}`);
      toast.success("Link de convite copiado!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const shareInvite = async (code: string) => {
    const link = `${window.location.origin}/register?inviteCode=${code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Convite iAzi",
          text: "Você foi convidado para o iAzi! Use este link para se registrar:",
          url: link,
        });
      } catch {
        // User cancelled or share failed, copy to clipboard instead
        copyInviteLink(code);
      }
    } else {
      copyInviteLink(code);
    }
  };

  const activeInvites = invites.filter((i) => !i.used);
  const usedInvites = invites.filter((i) => i.used);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Convidar</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Amigos</DialogTitle>
          <DialogDescription>
            Gere códigos de convite para seus amigos se registrarem no iAzi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Generate New Code Button */}
          <Button 
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Gerar Novo Código
              </>
            )}
          </Button>

          {/* Active Invites */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Códigos Disponíveis</h4>
            {loadingInvites ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activeInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum código disponível. Gere um novo código acima.
              </p>
            ) : (
              activeInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={invite.code}
                      readOnly
                      className="w-32 font-mono text-center bg-background"
                    />
                    <Badge variant="outline" className="text-green-600">
                      Disponível
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(invite.code)}
                      title="Copiar código"
                    >
                      {copiedCode === invite.code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyInviteLink(invite.code)}
                      title="Copiar link"
                    >
                      {copiedCode === `link-${invite.code}` ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => shareInvite(invite.code)}
                      title="Compartilhar"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Used Invites */}
          {usedInvites.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Códigos Usados ({usedInvites.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {usedInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-2 border rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{invite.code}</span>
                      <Badge variant="secondary">Usado</Badge>
                    </div>
                    {invite.usedBy && (
                      <span className="text-xs text-muted-foreground">
                        por {invite.usedBy.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
