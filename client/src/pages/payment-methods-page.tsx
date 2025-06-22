import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod, InsertPaymentMethod } from '@shared/schema';

type PaymentMethodType = 'bank_transfer' | 'digital_wallet' | 'mobile_money';

const PaymentMethodsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<InsertPaymentMethod>>({
    type: 'bank_transfer',
    name: '',
    details: {},
  });
  const [formDetailFields, setFormDetailFields] = useState<Record<string, string>>({});


  const { data: paymentMethods = [], isLoading, error } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payment-methods');
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    },
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setIsModalOpen(false);
      setCurrentPaymentMethod(null);
      setFormData({ type: 'bank_transfer', name: '', details: {} });
      setFormDetailFields({});
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  };

  const createMutation = useMutation({
    mutationFn: (newData: InsertPaymentMethod) => apiRequest('POST', '/api/payment-methods', newData).then(res => {
      if (!res.ok) throw new Error('Failed to create payment method');
      return res.json();
    }),
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions.onSuccess();
      toast({ title: 'Success', description: 'Payment method created.' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaymentMethod> }) =>
      apiRequest('PUT', `/api/payment-methods/${id}`, data).then(res => {
        if (!res.ok) throw new Error('Failed to update payment method');
        return res.json();
      }),
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions.onSuccess();
      toast({ title: 'Success', description: 'Payment method updated.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/payment-methods/${id}`).then(res => {
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete payment method');
      // For 204 No Content, there's no JSON body
      return res.status === 204 ? { success: true } : res.json();
    }),
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions.onSuccess(); // This will close modal if open, which is fine.
      toast({ title: 'Success', description: 'Payment method deleted.' });
    }
  });

  const handleOpenModal = (pm: PaymentMethod | null = null) => {
    setCurrentPaymentMethod(pm);
    if (pm) {
      setFormData({
        type: pm.type as PaymentMethodType,
        name: pm.name,
        details: pm.details || {}, // pm.details might be string or object from server
      });
      // Assuming details is always an object when it comes from server for editing
      setFormDetailFields(typeof pm.details === 'object' && pm.details !== null ? pm.details as Record<string, string> : {});
    } else {
      setFormData({ type: 'bank_transfer', name: '', details: {} });
      setFormDetailFields({});
    }
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDetailFields(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: PaymentMethodType) => {
    setFormData(prev => ({ ...prev, type: value, details: {} }));
    setFormDetailFields({}); // Reset detail fields on type change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...formData, details: formDetailFields };
    if (currentPaymentMethod) {
      updateMutation.mutate({ id: currentPaymentMethod.id, data: submissionData as Partial<PaymentMethod> });
    } else {
      createMutation.mutate(submissionData as InsertPaymentMethod);
    }
  };

  const renderDetailFields = (type: PaymentMethodType) => {
    switch (type) {
      case 'bank_transfer':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="accountNumber" value={formDetailFields.accountNumber || ''} onChange={handleDetailFieldChange} placeholder="e.g., 0123456789" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" value={formDetailFields.bankName || ''} onChange={handleDetailFieldChange} placeholder="e.g., Zenith Bank" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" name="accountName" value={formDetailFields.accountName || ''} onChange={handleDetailFieldChange} placeholder="e.g., John Doe" />
            </div>
          </>
        );
      case 'digital_wallet':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="walletProvider">Wallet Provider</Label>
              <Input id="walletProvider" name="walletProvider" value={formDetailFields.walletProvider || ''} onChange={handleDetailFieldChange} placeholder="e.g., Chipper Cash, OPay" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="walletTag">Wallet Tag/ID</Label>
              <Input id="walletTag" name="walletTag" value={formDetailFields.walletTag || ''} onChange={handleDetailFieldChange} placeholder="e.g., @johndoe or 08012345678" />
            </div>
          </>
        );
      case 'mobile_money':
         return (
          <>
            <div className="space-y-1">
              <Label htmlFor="provider">Mobile Money Provider</Label>
              <Input id="provider" name="provider" value={formDetailFields.provider || ''} onChange={handleDetailFieldChange} placeholder="e.g., MTN MoMo, Airtel Money" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formDetailFields.phoneNumber || ''} onChange={handleDetailFieldChange} placeholder="e.g., 08012345678" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (isLoading) return <div className="p-6">Loading payment methods...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading payment methods: {error.message}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Manage Your Payment Methods</CardTitle>
            <CardDescription>Add, edit, or remove your preferred ways to send and receive payments.</CardDescription>
          </div>
          <Button onClick={() => handleOpenModal()} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Method
          </Button>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-center text-gray-500 py-8">You haven't added any payment methods yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map(pm => (
                <Card key={pm.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{pm.name}</CardTitle>
                    <CardDescription className="capitalize">{pm.type.replace('_', ' ')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="text-sm space-y-1">
                      {pm.details && Object.entries(pm.details).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                          {String(value)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 p-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(pm)}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the payment method "{pm.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(pm.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentPaymentMethod ? 'Edit' : 'Add New'} Payment Method</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Nickname for this method</Label>
              <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} placeholder="e.g., My Main Bank, Chipper" required />
            </div>
            <div>
              <Label htmlFor="type">Payment Type</Label>
              <Select
                value={formData.type || 'bank_transfer'}
                onValueChange={(value: string) => handleTypeChange(value as PaymentMethodType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type && renderDetailFields(formData.type as PaymentMethodType)}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Payment Method'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsPage;
