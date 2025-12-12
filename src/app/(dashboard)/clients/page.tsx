import { ClientsPageClient } from "@/app/(dashboard)/clients/ClientsPageClient";
import ClientsToolbar from "@/app/(dashboard)/clients/ClientsToolbar";
import { GenerateInvoiceButton } from "@/components/GenerateInvoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { CLIENT_PLAN_LABELS, SOCIAL_CHANNEL_LABELS } from "@/lib/prisma-enums";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import type { AppClient } from "@/types/tables";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { ArrowUpRight, Building2, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string>>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "border-green-700/50 bg-gradient-to-br from-green-950/40 to-green-950/30 text-green-300";
    case "paused":
      return "border-amber-700/50 bg-gradient-to-br from-amber-950/40 to-amber-950/30 text-amber-300";
    case "closed":
      return "border-red-700/50 bg-gradient-to-br from-red-950/40 to-red-950/30 text-red-300";
    default:
      return "border-slate-700/50 bg-gradient-to-br from-slate-950/40 to-slate-950/30 text-slate-300";
  }
}

function getStatusLabel(status: string) {
  const label = CLIENT_STATUS_LABELS[status as keyof typeof CLIENT_STATUS_LABELS] ?? status;
  return label;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { user, orgId, role } = await getSessionProfile();
  const params = (await searchParams) || {};
  const query = params.q || "";
  const status = params.status || "";
  const plan = params.plan || "";

  if (!user || !orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 px-4 py-8">
        <Card className="max-w-md border-red-700/50 bg-gradient-to-br from-red-950/40 to-red-950/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-200">Você precisa estar autenticado para ver os clientes.</p>
            <Button asChild className="mt-4 w-full bg-red-600 hover:bg-red-700">
              <Link href="/login">Ir para login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let clients: AppClient[] = [];
  try {
    const allClients = await listClientsByOrg(orgId);
    clients = allClients.filter((client) => {
      const matchesQuery =
        !query ||
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.email?.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = !status || client.status === status;
      const matchesPlan = !plan || client.plan === plan;

      return matchesQuery && matchesStatus && matchesPlan;
    });
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 px-4 py-8">
        <Card className="max-w-md border-red-700/50 bg-gradient-to-br from-red-950/40 to-red-950/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-200">Erro ao carregar clientes. Tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canCreateClient = role ? can(role, "create", "client") : false;
  const uniquePlans = Array.from(new Set((clients.map((c) => c.plan).filter(Boolean) as string[]))).sort();

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const pausedCount = clients.filter((c) => c.status === "paused").length;
  const closedCount = clients.filter((c) => c.status === "closed").length;

  return (
    <ClientsPageClient>
      <main className="min-h-screen bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 space-y-1 sm:space-y-2 lg:space-y-3 p-4">
        <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gestão</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-50">Meus Clientes</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Visualize e gerencie todos os seus clientes</p>
            </div>
            {canCreateClient && (
              <Button asChild className="h-10 sm:h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link href="/clients/new" className="flex items-center gap-2">
                  <Plus className="h-4 w-4 sm:h-5" />
                  Novo cliente
                </Link>
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-3">
            <Card className="group relative overflow-hidden border border-blue-700/50 bg-gradient-to-br from-blue-950/40 to-blue-950/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm cursor-default min-w-0">
              <CardContent className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
                  <div className="p-1 sm:p-1.5 lg:p-2 bg-blue-900/40 rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 lg:h-6 text-blue-400" />
                  </div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-bold text-blue-300 truncate">{total}</div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-blue-200 leading-tight truncate">Total de Clientes</h3>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-green-700/50 bg-gradient-to-br from-green-950/40 to-green-950/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 backdrop-blur-sm cursor-default min-w-0">
              <CardContent className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
                  <div className="p-1 sm:p-1.5 lg:p-2 bg-green-900/40 rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 lg:h-6 text-green-400" />
                  </div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-bold text-green-300 truncate">{activeCount}</div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-green-200 leading-tight truncate">Ativos</h3>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-amber-700/50 bg-gradient-to-br from-amber-950/40 to-amber-950/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg shadow-amber-900/20 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 backdrop-blur-sm cursor-default min-w-0">
              <CardContent className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
                  <div className="p-1 sm:p-1.5 lg:p-2 bg-amber-900/40 rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                    <ArrowUpRight className="h-4 w-4 sm:h-5 lg:h-6 text-amber-400" />
                  </div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-bold text-amber-300 truncate">{pausedCount}</div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-amber-200 leading-tight truncate">Pausados</h3>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-red-700/50 bg-gradient-to-br from-red-950/40 to-red-950/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 backdrop-blur-sm cursor-default min-w-0">
              <CardContent className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
                  <div className="p-1 sm:p-1.5 lg:p-2 bg-red-900/40 rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0">
                    <Building2 className="h-4 w-4 sm:h-5 lg:h-6 text-red-400" />
                  </div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-bold text-red-300 truncate">{closedCount}</div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-red-200 leading-tight truncate">Encerrados</h3>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <ClientsToolbar
            uniquePlans={uniquePlans}
            initialQuery={query}
            initialStatus={status}
            initialPlan={plan}
            initialView="grid"
          />

          {/* Clients Grid */}
          {!clients.length ? (
            <Card className="border-dashed border-slate-700/50 bg-gradient-to-br from-slate-900/40 to-slate-900/30 rounded-lg sm:rounded-xl lg:rounded-2xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/40">
                  <Users className="h-7 w-7 text-slate-500" />
                </div>
                <p className="font-semibold text-slate-200 text-lg">{query || status || plan ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}</p>
                <p className="text-sm text-slate-400 mt-2">{query || status || plan ? "Ajuste os filtros ou limpe a busca." : "Crie o primeiro cliente para começar."}</p>
                {canCreateClient && !(query || status || plan) && (
                  <Button asChild className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold">
                    <Link href="/clients/new" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar cliente
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {clients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}/info`}>
                  <Card className={`group relative overflow-hidden border ${getStatusColor(client.status)} rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm cursor-pointer h-full hover:scale-105`}>
                    <CardContent className="p-3 sm:p-4 lg:p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-50 text-sm sm:text-base truncate group-hover:text-white transition">{client.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">{client.email || "Sem email"}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/60 text-slate-300 flex-shrink-0">
                          {getStatusLabel(client.status)}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Plano:</span>
                          <span className="text-slate-200 font-medium">{client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "—"}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Canal:</span>
                          <span className="text-slate-200 font-medium">{client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-700/50">
                          <span>Criado em:</span>
                          <span className="text-slate-200">{formatDate(client.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                        <Button asChild variant="outline" size="sm" className="flex-1 h-8 rounded-md text-xs bg-slate-800/60 border-slate-700/50 text-slate-200 hover:bg-slate-700/80">
                          <span>Ver Detalhes</span>
                        </Button>
                        <GenerateInvoiceButton clientId={client.id} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </ClientsPageClient>
  );
}
