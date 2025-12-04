"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface CostDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "item" | "subscription"
  costId?: string
}

interface CostItem {
  id: string
  name: string
  description?: string
  amount: number
  createdAt: string
}

interface CostSubscription {
  id: string
  amount: number
  startDate: string
  endDate?: string
  clientId: string
  itemId: string
  client: { name: string }
  item: { name: string }
}

type CostData = CostItem | CostSubscription

export function CostDetailModal({ open, onOpenChange, type, costId }: CostDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CostData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCost = useCallback(async () => {
    if (!costId) return
    setLoading(true)
    setError(null)
    try {
      const endpoint = type === "item" ? `/api/cost-items/${costId}` : `/api/cost-subscriptions/${costId}`
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`Erro ao carregar ${type === "item" ? "item de custo" : "assinatura"}`)
      }
      const cost = await response.json()
      setData(cost)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [costId, type])

  useEffect(() => {
    if (open && costId) {
      fetchCost()
    } else if (!open) {
      setData(null)
      setError(null)
    }
  }, [open, costId, type, fetchCost])

  async function handleDelete() {
    if (!costId) return
    const itemType = type === "item" ? "item de custo" : "assinatura"
    const confirmed = confirm(`Tem certeza que deseja excluir este ${itemType}? Esta ação não pode ser desfeita.`)
    if (!confirmed) return
    setIsDeleting(true)
    setError(null)
    try {
      const endpoint = type === "item" ? `/api/cost-items/${costId}` : `/api/cost-subscriptions/${costId}`
      const response = await fetch(endpoint, { method: "DELETE" })
      if (!response.ok) {
        throw new Error(`Erro ao excluir ${itemType}`)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir")
    } finally {
      setIsDeleting(false)
    }
  }

  function isCostItem(d: CostData): d is CostItem {
    return "name" in d
  }
  function isCostSubscription(d: CostData): d is CostSubscription {
    return "client" in d && "item" in d
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type === "item" ? "Detalhes do Item de Custo" : "Detalhes da Assinatura"}</DialogTitle>
          <DialogDescription>Visualize as informações detalhadas</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && data && (
          <div className="space-y-4">
            {isCostItem(data) && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome</p>
                  <p className="text-xl font-bold">{data.name}</p>
                </div>
                {data.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-base">{data.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Custo Mensal</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                  <p className="text-base">{formatDate(data.createdAt)}</p>
                </div>
              </>
            )}

            {isCostSubscription(data) && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                  <p className="text-xl font-bold">{data.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Item</p>
                  <p className="text-base font-medium">{data.item.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Custo Mensal</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.amount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Início</p>
                    <p className="text-base">{formatDate(data.startDate)}</p>
                  </div>
                  {data.endDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data de Fim</p>
                      <p className="text-base">{formatDate(data.endDate)}</p>
                    </div>
                  )}
                </div>
                {!data.endDate && (
                  <Alert>
                    <AlertDescription>Esta assinatura está ativa e não possui data de término.</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Fechar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !data} isLoading={isDeleting}>
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
