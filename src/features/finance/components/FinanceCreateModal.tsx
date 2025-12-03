"use client"
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientTypeahead } from '@/features/clients/components/ClientTypeahead'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/prisma-enums'
import { Calendar, DollarSign, FileText, Plus, Tag, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function FinanceCreateModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [financeType, setFinanceType] = useState<'income' | 'expense'>('income')

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    // Extract and validate amount
    const amountStr = fd.get('amount') as string
    const amount = parseFloat(amountStr)

    if (!amountStr || isNaN(amount) || amount === 0 || amountStr.trim() === '' || amountStr === '-') {
      toast.error('Valor deve ser um número válido diferente de zero')
      return
    }

    // Build JSON payload
    const payload = {
      type: fd.get('type'),
      amount,
      description: fd.get('description') || '',
      category: fd.get('category'),
      date: fd.get('date') || new Date().toISOString().split('T')[0], // Default: hoje
      clientId: fd.get('clientId') || null,
    }

    try {
      setLoading(true)
      const res = await fetch('/api/billing/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Falha ao criar lançamento')
      }
      toast.success('Lançamento adicionado')
      setOpen(false)
      // refresh page
      window.location.reload()
    } catch (err) {
      toast.error('Não foi possível adicionar', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-2">
          <Icon as={Plus} size="sm" className="" decorative={true} />
          Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${financeType === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {financeType === 'income' ? <Icon as={TrendingUp} size="md" decorative={false} ariaLabel={financeType === 'income' ? 'Receita' : 'Despesa'} /> : <Icon as={TrendingDown} size="md" decorative={false} ariaLabel={financeType === 'income' ? 'Receita' : 'Despesa'} />}
            </div>
            <div>
              <DialogTitle className="text-xl">Novo lançamento financeiro</DialogTitle>
              <DialogDescription className="text-sm">
                Registre uma nova {financeType === 'income' ? 'receita' : 'despesa'} para controle financeiro
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Tipo e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium">
                {financeType === 'income' ? <Icon as={TrendingUp} size="sm" className="text-emerald-600" decorative={true} /> : <Icon as={TrendingDown} size="sm" className="text-red-600" decorative={true} />}
                Tipo
              </Label>
              <Select value={financeType} onValueChange={(v) => setFinanceType(v as 'income' | 'expense')}>
                <SelectTrigger className={`w-full ${financeType === 'income' ? 'border-emerald-200 focus:border-emerald-400' : 'border-red-200 focus:border-red-400'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <span className="flex items-center gap-2">
                      <Icon as={TrendingUp} size="sm" className="text-emerald-600" decorative={true} />
                      Receita
                    </span>
                  </SelectItem>
                  <SelectItem value="expense">
                    <span className="flex items-center gap-2">
                      <Icon as={TrendingDown} size="sm" className="text-red-600" decorative={true} />
                      Despesa
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={financeType} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium">
                <Icon as={DollarSign} size="sm" className="text-blue-600" decorative={true} />
                Valor
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="text-lg font-semibold"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
              <Icon as={FileText} size="sm" className="text-purple-600" decorative={true} />
              Descrição
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Pagamento de mensalidade do cliente X"
              className="w-full"
            />
          </div>

          {/* Categoria e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                <Icon as={Tag} size="sm" className="text-orange-600" decorative={true} />
                Categoria
              </Label>
              <Select name="category" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(financeType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Icon as={Calendar} size="sm" className="text-cyan-600" decorative={true} />
                Data
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Icon as={User} size="sm" className="text-indigo-600" decorative={true} />
              Cliente <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <ClientTypeahead name="clientId" placeholder="Buscar cliente..." />
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={financeType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Salvando...' : 'Salvar lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
