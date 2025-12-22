import { MetricCard } from '@/components/dashboard/MetricCard'
import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { ArrowRight, Building2, CreditCard, PiggyBank, ShieldCheck, TrendingUp } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FinanceDashboardPage() {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'read', 'finance')) {
    return (
      <div className="p-6">Acesso negado ou não autenticado.</div>
    )
  }

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const baseUrl = resolveBaseUrl()
  const emptySummary = {
    grossRevenue: 0,
    variableExpenses: 0,
    fixedMonthly: 0,
    netProfit: 0,
    paidInvoicesCount: 0,
    overdueInvoicesCount: 0,
  }

  const emptyProjection = {
    estimatedRevenue: 0,
    fixedMonthly: 0,
    netEstimate: 0,
  }

  const [fixedExpenses, summary, projection] = await Promise.all([
    prisma.recurringExpense.findMany({ where: { orgId, active: true }, orderBy: { name: 'asc' } }),
    safeFetchJson(`${baseUrl}/api/finance/summary?month=${month}`, emptySummary),
    safeFetchJson(`${baseUrl}/api/finance/projection?month=${month}`, emptyProjection),
  ])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.1),transparent_32%),radial-gradient(circle_at_50%_70%,rgba(14,165,233,0.07),transparent_30%)]" />

      <div className="relative px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/80 to-indigo-900 shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="absolute -top-10 -right-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Painel consolidado
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Financeiro</h1>
                <p className="text-blue-100/80 mt-1 text-sm">Receitas, faturas e despesas fixas em um só lugar</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/billing/overdue"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:border-white/40 hover:bg-white/10"
              >
                Inadimplência
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`/api/billing/invoices/export`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
              >
                Exportar CSV
              </Link>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-2 border-t border-white/10 bg-white/5 px-6 py-4 sm:px-8">
            {[{ label: 'Resumo mensal', href: '#resumo' }, { label: 'Projeção', href: '#projecao' }, { label: 'Despesas fixas', href: '#despesas' }].map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur hover:border-white/30 hover:text-white"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </header>

        {/* Resumo */}
        <section id="resumo" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Mês {month}</p>
              <h2 className="text-xl sm:text-2xl font-semibold">Resumo consolidado</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              Atualizado em tempo real
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricCard
              value={formatCurrency(summary.grossRevenue)}
              label="Receita bruta"
              description="Entradas confirmadas"
              variant="emerald"
              icon={PiggyBank}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
            <MetricCard
              value={formatCurrency(summary.variableExpenses)}
              label="Despesas variáveis"
              description="Custos operacionais"
              variant="orange"
              icon={CreditCard}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
            <MetricCard
              value={formatCurrency(summary.fixedMonthly)}
              label="Despesas fixas"
              description="Recorrentes do mês"
              variant="pink"
              icon={Building2}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
            <MetricCard
              value={formatCurrency(summary.netProfit)}
              label="Lucro líquido"
              description="Após despesas"
              variant={summary.netProfit >= 0 ? 'emerald' : 'red'}
              icon={TrendingUp}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
            <MetricCard
              value={summary.paidInvoicesCount.toLocaleString('pt-BR')}
              label="Faturas pagas"
              description="Este mês"
              variant="blue"
              icon={ShieldCheck}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
            <MetricCard
              value={summary.overdueInvoicesCount.toLocaleString('pt-BR')}
              label="Faturas em atraso"
              description="Atenção imediata"
              variant="red"
              icon={CreditCard}
              className="bg-slate-900/60 backdrop-blur border border-white/5"
            />
          </div>
        </section>

        {/* Projeção */}
        <section id="projecao" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Próximo mês</p>
              <h2 className="text-xl sm:text-2xl font-semibold">Projeção</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProjectionCard title="Receita estimada" value={projection.estimatedRevenue} accent="from-emerald-500 via-green-500 to-teal-500" />
            <ProjectionCard title="Despesas fixas" value={projection.fixedMonthly} accent="from-rose-500 via-red-500 to-pink-500" />
            <ProjectionCard title="Resultado estimado" value={projection.netEstimate} accent="from-blue-500 via-indigo-500 to-purple-500" highlight />
          </div>
        </section>

        {/* Despesas fixas */}
        <section id="despesas" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Recorrência</p>
              <h2 className="text-xl sm:text-2xl font-semibold">Despesas fixas</h2>
            </div>
          </div>

          <FixedExpenseCreateForm />
          <FixedExpenseList items={fixedExpenses} />
        </section>
      </div>
    </div>
  )
}

async function serverUpdateFixedExpense(
  id: string,
  payload: Partial<{ name: string; amount: number; cycle: 'MONTHLY' | 'ANNUAL'; category: string; active: boolean }>
) {
  'use server'
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'update', 'finance')) return
  await fetch(`${resolveBaseUrl()}/api/finance/fixed-expenses`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, ...payload }),
  })
  revalidatePath('/dashboard/finance')
}

async function serverCreateFixedExpense(formData: FormData) {
  'use server'
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role || !can(role as unknown as AppRole, 'create', 'finance')) return
  const payload = {
    name: String(formData.get('name') || ''),
    amount: Number(formData.get('amount') || 0),
    cycle: String(formData.get('cycle') || 'MONTHLY') as 'MONTHLY' | 'ANNUAL',
    category: String(formData.get('category') || ''),
  }
  await fetch(`${resolveBaseUrl()}/api/finance/fixed-expenses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  revalidatePath('/dashboard/finance')
}

function FixedExpenseCreateForm() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Cadastrar</p>
          <h3 className="text-base font-semibold text-white">Nova despesa fixa</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Entrada rápida</span>
      </div>

      <form action={serverCreateFixedExpense} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          name="name"
          placeholder="Nome da despesa"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
          required
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Valor"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
          required
        />
        <select
          title="Ciclo"
          name="cycle"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
        >
          <option className="bg-slate-900" value="MONTHLY">Mensal</option>
          <option className="bg-slate-900" value="ANNUAL">Anual</option>
        </select>
        <input
          name="category"
          placeholder="Categoria (opcional)"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
        />
        <button
          type="submit"
          className="h-11 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-xl hover:shadow-cyan-500/40"
        >
          Adicionar
        </button>
      </form>
    </div>
  )
}

function FixedExpenseList({
  items,
}: {
  items: Array<{ id: string; name: string; amount: number; cycle: 'MONTHLY' | 'ANNUAL'; category: string | null }>
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 backdrop-blur">
          Nenhuma despesa fixa cadastrada.
        </div>
      )}

      {items.map((e) => (
        <div
          key={e.id}
          className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 p-4 shadow-xl backdrop-blur transition hover:border-white/20"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{e.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  {formatCycle(e.cycle)}
                </span>
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-100 border border-blue-500/30">
                  {e.category || 'Sem categoria'}
                </span>
              </div>
              <p className="text-xs text-white/60">Renovação automática com faturamento</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold text-white">
                {formatCurrency(e.amount)}
              </span>

              <form
                action={async () => {
                  'use server'
                  await serverUpdateFixedExpense(e.id, { active: false })
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-400/50 hover:bg-rose-500/25"
                >
                  Desativar
                </button>
              </form>

              <details className="group/edit relative">
                <summary className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                  Editar
                </summary>
                <div className="mt-2 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur">
                  <form
                    action={async (formData: FormData) => {
                      'use server'
                      await serverUpdateFixedExpense(e.id, {
                        name: String(formData.get('name') || e.name),
                        amount: Number(formData.get('amount') || e.amount),
                        cycle: String(formData.get('cycle') || e.cycle) as 'MONTHLY' | 'ANNUAL',
                        category: String(formData.get('category') || e.category || ''),
                      })
                    }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3"
                  >
                    <input
                      name="name"
                      defaultValue={e.name}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
                      placeholder="Nome"
                    />
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      defaultValue={e.amount}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
                      placeholder="Valor"
                    />
                    <select
                      name="cycle"
                      defaultValue={e.cycle}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
                    >
                      <option className="bg-slate-900" value="MONTHLY">Mensal</option>
                      <option className="bg-slate-900" value="ANNUAL">Anual</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        name="category"
                        defaultValue={e.category || ''}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/60 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30"
                        placeholder="Categoria"
                      />
                      <button
                        type="submit"
                        className="h-11 whitespace-nowrap rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:shadow-blue-500/40"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectionCard({
  title,
  value,
  accent,
  highlight,
}: {
  title: string
  value: number
  accent: string
  highlight?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg backdrop-blur">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-80`} />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{title}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{formatCurrency(value)}</h3>
      {highlight && (
        <p className="mt-1 text-sm font-semibold text-emerald-200">Cenário esperado</p>
      )}
    </div>
  )
}

function formatCycle(cycle: 'MONTHLY' | 'ANNUAL') {
  return cycle === 'MONTHLY' ? 'Mensal' : 'Anual'
}

function resolveBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.SITE_URL || 'http://localhost:3000'
}

async function safeFetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return fallback
    return (await response.json()) as T
  } catch (error) {
    console.error('Erro ao buscar dados financeiros', error)
    return fallback
  }
}
