"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview } from "@/lib/api";
import { ReviewForm } from "./ReviewForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  professionalId: string;
  serviceId?: string;
  serviceName?: string;
  professionalName?: string;
}

export function ReviewDialog({
  open,
  onOpenChange,
  appointmentId,
  professionalId,
  serviceId,
  serviceName,
  professionalName,
}: ReviewDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      createReview({
        rating: data.rating,
        comment: data.comment || undefined,
        appointmentId,
        professionalId,
        serviceId,
      }),
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      // Force refetch of all related queries
      queryClient.invalidateQueries({ queryKey: ["pendingReviews"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["myReviews"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["userAppointments"], refetchType: "all" });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Serviço</DialogTitle>
          <DialogDescription>
            {serviceName && professionalName ? (
              <>
                Como foi sua experiência com <strong>{serviceName}</strong> por{" "}
                <strong>{professionalName}</strong>?
              </>
            ) : (
              "Conte como foi sua experiência com este serviço."
            )}
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
