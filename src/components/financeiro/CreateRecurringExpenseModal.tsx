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
import { EXPENSE_CATEGORIES } from '@/lib/prisma-enums';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CreateRecurringExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  amount: string;
  cycle: 'MONTHLY' | 'ANNUAL';
  nextDueDate: string; // used to derive dayOfMonth
  category?: string;
}

export function CreateRecurringExpenseModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateRecurringExpenseModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    amount: '',
    cycle: 'MONTHLY',
    nextDueDate: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valor é obrigatório e deve ser maior que 0');
      return false;
    }

    // For MONTHLY, nextDueDate helps derive the dayOfMonth, but it's optional.
    // If provided, we'll compute dayOfMonth from it.

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
      // Derive dayOfMonth from nextDueDate if present (used by backend)
      let dayOfMonth: number | undefined = undefined;
      if (formData.nextDueDate) {
        const d = new Date(formData.nextDueDate);
        if (!isNaN(d.getTime())) {
          dayOfMonth = d.getDate();
        }
      }

      const response = await fetch('/api/recurring-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          cycle: formData.cycle,
          dayOfMonth: dayOfMonth ?? '',
          category: formData.category || null,
          // category can be added later; active defaults to true on backend
        }),
      });

      if (!response.ok) {
        let message = 'Erro ao criar despesa recorrente';
        try {
          const errorData = await response.json();
          message = errorData.error || errorData.message || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      setFormData({
        name: '',
        description: '',
        amount: '',
        cycle: 'MONTHLY',
        nextDueDate: '',
        category: '',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao criar despesa recorrente'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Despesa Recorrente</DialogTitle>
          <DialogDescription>
            Crie uma nova despesa recorrente no sistema
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
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Aluguel"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Digite a descrição (opcional)"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

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
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cycle">Ciclo *</Label>
            <select
              id="cycle"
              name="cycle"
              value={formData.cycle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Ciclo de recorrência"
              disabled={loading}
            >
              <option value="MONTHLY">Mensal</option>
              <option value="ANNUAL">Anual</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Próximo Vencimento (opcional)</Label>
            <Input
              id="nextDueDate"
              name="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={handleInputChange}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Se informado, usamos o dia para criar a despesa mensal (ex.: 15).</p>
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
              {loading ? 'Criando...' : 'Criar Despesa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
