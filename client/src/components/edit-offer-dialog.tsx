import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editOfferSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  rate: z.string().min(1, "Rate is required"),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["active", "paused"]),
});

type EditOfferFormData = z.infer<typeof editOfferSchema>;

interface Offer {
  id: number;
  userId: number;
  type: string;
  amount: string;
  rate: string;
  minAmount?: string;
  maxAmount?: string;
  terms?: string;
  status: string;
  paymentMethod: string;
}

interface EditOfferDialogProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditOfferDialog({ offer, isOpen, onClose }: EditOfferDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditOfferFormData>({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      amount: offer?.amount || "",
      rate: offer?.rate || "",
      minAmount: offer?.minAmount || "",
      maxAmount: offer?.maxAmount || "",
      terms: offer?.terms || "",
      status: (offer?.status as "active" | "paused") || "active",
    },
  });

  // Reset form when offer changes
  useEffect(() => {
    if (offer) {
      form.reset({
        amount: offer.amount,
        rate: offer.rate,
        minAmount: offer.minAmount || "",
        maxAmount: offer.maxAmount || "",
        terms: offer.terms || "",
        status: (offer.status as "active" | "paused") || "active",
      });
    }
  }, [offer, form]);

  const updateOfferMutation = useMutation({
    mutationFn: async (data: EditOfferFormData) => {
      if (!offer) throw new Error("No offer selected");
      
      const response = await apiRequest("PUT", `/api/offers/${offer.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update offer");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${offer?.userId}/offers`] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditOfferFormData) => {
    updateOfferMutation.mutate(data);
  };

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Edit {offer.type === "buy" ? "Buy" : "Sell"} Offer
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter USDT amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (₦ per USDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter exchange rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Minimum"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Maximum"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific terms or conditions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateOfferMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateOfferMutation.isPending}>
                {updateOfferMutation.isPending ? "Updating..." : "Update Offer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}