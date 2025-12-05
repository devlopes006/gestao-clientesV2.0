'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Client {
  id: string;
  name: string;
  email: string | null;
}

interface CostItem {
  id: string;
  name: string;
  description: string | null;
  amount: number;
}

interface CreateCostSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  clientId: string;
  costItemId: string;
  startDate: string;
  endDate: string;
}

export function CreateCostSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCostSubscriptionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    costItemId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingCostItems, setLoadingCostItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados ao abrir modal
  useEffect(() => {
    if (open) {
      fetchClients();
      fetchCostItems();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/mobile/clients?page=1&limit=100');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClients(data.data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchCostItems = async () => {
    try {
      setLoadingCostItems(true);
      const response = await fetch('/api/cost-items?limit=100');
      if (!response.ok) throw new Error('Erro ao buscar itens de custo');
      const data = await response.json();
      setCostItems(data.data || []);
    } catch (err) {
      console.error('Erro ao buscar itens de custo:', err);
    } finally {
      setLoadingCostItems(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.clientId) {
      setError('Cliente é obrigatório');
      return false;
    }

    if (!formData.costItemId) {
      setError('Item de custo é obrigatório');
      return false;
    }

    if (!formData.startDate) {
      setError('Data de início é obrigatória');
      return false;
    }

    if (formData.endDate && formData.startDate > formData.endDate) {
      setError('Data de fim deve ser posterior à data de início');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/cost-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          costItemId: formData.costItemId,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Erro ao criar associação de custo'
        );
      }

      setFormData({
        clientId: '',
        costItemId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao criar associação de custo'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Associação de Custo</DialogTitle>
          <DialogDescription>
            Associe um item de custo a um cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientId">
              Cliente * {loadingClients && '(carregando...)'}
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, clientId: value }))
              }
              disabled={loading || loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costItemId">
              Item de Custo * {loadingCostItems && '(carregando...)'}
            </Label>
            <Select
              value={formData.costItemId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, costItemId: value }))
              }
              disabled={loading || loadingCostItems}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item de custo" />
              </SelectTrigger>
              <SelectContent>
                {costItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {formatCurrency(item.amount)}/mês
                    {item.description && ` (${item.description})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data de Término</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Criando...' : 'Criar Associação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
