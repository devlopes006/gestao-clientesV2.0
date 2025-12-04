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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/prisma-enums';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
}

interface FormData {
  type: 'INCOME' | 'EXPENSE';
  subtype: string;
  amount: string;
  description: string;
  category: string;
  date: string;
  clientId: string;
}

const INCOME_SUBTYPES = [
  { value: 'INVOICE_PAYMENT', label: 'Pagamento de Fatura' },
  { value: 'OTHER_INCOME', label: 'Outra Receita' },
];

const EXPENSE_SUBTYPES = [
  { value: 'INTERNAL_COST', label: 'Custo Interno (MLabs, Canva, etc.)' },
  { value: 'FIXED_EXPENSE', label: 'Despesa Fixa Recorrente' },
  { value: 'OTHER_EXPENSE', label: 'Outra Despesa' },
];

const CATEGORY_OPTIONS = {
  INCOME: INCOME_CATEGORIES as readonly string[],
  EXPENSE: EXPENSE_CATEGORIES as readonly string[],
} as const;

export function CreateTransactionModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateTransactionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    type: 'EXPENSE',
    subtype: 'OTHER_EXPENSE',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
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
      const response = await fetch('/api/clients?limit=100');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClients(data.data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Atualizar subtype quando type mudar
  useEffect(() => {
    if (formData.type === 'INCOME') {
      setFormData(prev => ({ ...prev, subtype: 'INVOICE_PAYMENT' }));
    } else {
      setFormData(prev => ({ ...prev, subtype: 'OTHER_EXPENSE' }));
    }
  }, [formData.type]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valor é obrigatório e deve ser maior que 0');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
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
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          subtype: formData.subtype,
          amount: parseFloat(formData.amount),
          description: formData.description,
          category: formData.category || null,
          date: formData.date ? new Date(formData.date) : new Date(),
          status: 'CONFIRMED',
          clientId: formData.clientId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar transação');
      }

      setFormData({
        type: 'EXPENSE',
        subtype: 'OTHER_EXPENSE',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        clientId: '',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao criar transação'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>Crie uma nova transação no sistema</DialogDescription>
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
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value as 'INCOME' | 'EXPENSE' }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">💰 Receita</SelectItem>
                  <SelectItem value="EXPENSE">💸 Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo *</Label>
              <Select
                value={formData.subtype}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, subtype: value }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(formData.type === 'INCOME' ? INCOME_SUBTYPES : EXPENSE_SUBTYPES).map(
                    (st) => (
                      <SelectItem key={st.value} value={st.value}>
                        {st.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                disabled={loading}
                required
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Digite a descrição da transação"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS[formData.type].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">
              Cliente {loadingClients && '(carregando...)'}
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, clientId: value }))
              }
              disabled={loading || loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 && !loadingClients && (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                )}
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? 'Criando...' : 'Criar Transação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
