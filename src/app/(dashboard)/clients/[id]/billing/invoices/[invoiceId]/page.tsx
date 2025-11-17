import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";

interface InvoiceDetailPageProps { params: Promise<{ id: string; invoiceId: string }> }

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role) return null
  if (!can(role, "read", "finance")) return null

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, payments: true, client: true } })
  if (!invoice || invoice.orgId !== orgId || invoice.clientId !== id) return null

  // Helper para status visual
  const statusMap: Record<string, { label: string; class: string }> = {
    PAID: { label: "Pago", class: "bg-emerald-100 text-emerald-700" },
    OVERDUE: { label: "Vencida", class: "bg-red-100 text-red-700" },
    VOID: { label: "Cancelada", class: "bg-slate-200 text-slate-600" },
    PENDING: { label: "Pendente", class: "bg-slate-100 text-slate-700" },
    DRAFT: { label: "Rascunho", class: "bg-slate-100 text-slate-500" },
  };

  // Feedback visual (simples, pois é server component)
  const feedback = "";

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fatura #{invoice.number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Cliente: <a href={`/dashboard/clients/${invoice.clientId}`} className="font-semibold text-blue-700 hover:underline">{invoice.client.name}</a></div>
            <div>Emissão: <span className="font-mono text-xs">{new Date(invoice.issueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></div>
            <div>Vencimento: <span className="font-mono text-xs">{new Date(invoice.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></div>
            <div>Status: <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusMap[invoice.status]?.class}`}>{statusMap[invoice.status]?.label || invoice.status}</span></div>
            <div>Total: <span className="font-bold text-lg">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(invoice.total)}</span></div>
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.payments.length === 0 && can(role, 'create', 'finance') && (
              <form method="post" action={`/api/billing/invoices/${invoice.id}/cancel`} className="mt-3" onSubmit={e => { if (!confirm('Tem certeza que deseja cancelar esta fatura?')) e.preventDefault(); }}>
                <button className="px-3 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-all">Cancelar fatura</button>
              </form>
            )}
            {feedback && <div className="mt-2 text-xs text-emerald-700">{feedback}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens.</p>
            ) : (
              <div className="divide-y">
                {invoice.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-white">{it.description}</span> × <span className="font-mono">{it.quantity}</span>
                    </div>
                    <div className="font-bold text-blue-700">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(it.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pagamentos.</p>
            ) : (
              <div className="divide-y">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : p.status === 'PENDING' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                      <span className="ml-2 font-mono text-xs text-slate-600">{p.method}</span>
                    </div>
                    <div>
                      {p.paidAt ? <span className="font-mono text-xs">{new Date(p.paidAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span> : <span className="text-slate-400">—</span>}
                      <span className="mx-2">•</span>
                      <span className="font-bold text-emerald-700">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: invoice.currency || "BRL" }).format(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {invoice.status !== "PAID" && can(role, "create", "finance") && (
              <form method="post" action={`/api/billing/invoices/${invoice.id}/pay`} className="mt-3" onSubmit={e => { if (!confirm('Marcar esta fatura como paga?')) e.preventDefault(); }}>
                <button className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all">Marcar pago</button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
