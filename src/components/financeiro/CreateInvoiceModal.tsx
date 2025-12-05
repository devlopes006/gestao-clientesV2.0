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
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type InvoiceItemField = 'description' | 'quantity' | 'unitAmount';

interface Client {
  id: string;
  name: string;
  email: string | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitAmount: string;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  clientId: string;
  dueDate: string;
  items: InvoiceItem[];
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    dueDate: '',
    items: [{ id: '1', description: '', quantity: '1', unitAmount: '' }],
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar clientes ao abrir modal
  useEffect(() => {
    if (open) {
      fetchClients();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (
    itemId: string,
    field: InvoiceItemField,
    value: string
  ): void => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = (): void => {
    const newId = String(
      Math.max(...formData.items.map((i) => parseInt(i.id) || 0)) + 1
    );
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, description: '', quantity: '1', unitAmount: '' },
      ],
    }));
  };

  const removeItem = (itemId: string): void => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.clientId.trim()) {
      setError('ID do cliente é obrigatório');
      return false;
    }

    if (!formData.dueDate) {
      setError('Data de vencimento é obrigatória');
      return false;
    }

    if (formData.items.length === 0) {
      setError('Adicione pelo menos um item');
      return false;
    }

    for (const item of formData.items) {
      if (!item.description.trim()) {
        setError('Todos os itens devem ter descrição');
        return false;
      }

      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError('Todos os itens devem ter quantidade maior que 0');
        return false;
      }

      if (!item.unitAmount || parseFloat(item.unitAmount) <= 0) {
        setError('Todos os itens devem ter valor unitário maior que 0');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          dueDate: new Date(formData.dueDate),
          items: formData.items.map((item) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitAmount: parseFloat(item.unitAmount),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar fatura');
      }

      setFormData({
        clientId: '',
        dueDate: '',
        items: [{ id: '1', description: '', quantity: '1', unitAmount: '' }],
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fatura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Fatura</DialogTitle>
          <DialogDescription>Crie uma nova fatura para o cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Itens *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.items.map((item) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`desc-${item.id}`} className="text-xs">
                      Descrição
                    </Label>
                    <Input
                      id={`desc-${item.id}`}
                      placeholder="Descrição do item"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(item.id, 'description', e.target.value)
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="w-20">
                    <Label htmlFor={`qty-${item.id}`} className="text-xs">
                      Quantidade
                    </Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', e.target.value)
                      }
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div className="w-24">
                    <Label htmlFor={`val-${item.id}`} className="text-xs">
                      Valor Unit.
                    </Label>
                    <Input
                      id={`val-${item.id}`}
                      type="number"
                      placeholder="0.00"
                      value={item.unitAmount}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unitAmount', e.target.value)
                      }
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={loading || formData.items.length === 1}
                    className="mb-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
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
              {loading ? 'Criando...' : 'Criar Fatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
