import { ClientsPageClient } from "@/app/(dashboard)/clients/ClientsPageClient";
import ClientsToolbar from "@/app/(dashboard)/clients/ClientsToolbar";
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
import { Building2, Clock, Plus, TrendingUp, Users } from "lucide-react";
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
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 space-y-6 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gestão</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mt-2">Meus Clientes</h1>
              <p className="text-sm text-slate-400 mt-2">Visualize e gerencie todos os seus clientes</p>
            </div>
            {canCreateClient && (
              <Button asChild className="h-11 rounded-lg bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/80 hover:to-blue-700/80 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link href="/clients/new" className="flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  Novo cliente
                </Link>
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-lg group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total de Clientes</p>
              <h3 className="text-2xl font-bold text-white">{total}</h3>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-lg group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-emerald-500/20 p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Clientes Ativos</p>
              <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-6 backdrop-blur-lg group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-orange-500/20 p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Clientes Pausados</p>
              <h3 className="text-2xl font-bold text-white">{pausedCount}</h3>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-lg group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-500/20 p-3 rounded-xl group-hover:scale-105 transition-transform">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Clientes Encerrados</p>
              <h3 className="text-2xl font-bold text-white">{closedCount}</h3>
            </div>
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
            <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-900/30 rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/40">
                  <Users className="h-8 w-8 text-slate-500" />
                </div>
                <p className="font-semibold text-slate-100 text-lg">{query || status || plan ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}</p>
                <p className="text-sm text-slate-400 mt-2">{query || status || plan ? "Ajuste os filtros ou limpe a busca." : "Crie o primeiro cliente para começar."}</p>
                {canCreateClient && !(query || status || plan) && (
                  <Button asChild className="mt-6 bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/80 hover:to-blue-700/80 text-white font-semibold">
                    <Link href="/clients/new" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar cliente
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}/info`}>
                  <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/30 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/80 transition-all group cursor-pointer">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition">{client.name}</h3>
                        <p className="text-xs text-slate-400 truncate mt-1">{client.email || "Sem email"}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${client.status === "active" ? "bg-emerald-500/20" :
                        client.status === "paused" ? "bg-amber-500/20" :
                          "bg-red-500/20"
                        }`}>
                        <span className={`text-xs font-bold ${client.status === "active" ? "text-emerald-400" :
                          client.status === "paused" ? "text-amber-400" :
                            "text-red-400"
                          }`}>
                          {client.status === "active" ? "✓" : client.status === "paused" ? "⏸" : "✕"}
                        </span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-700/30">
                      <div className="bg-slate-800/40 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Plano</p>
                        <p className="text-white font-semibold text-xs mt-1">{client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "—"}</p>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Canal</p>
                        <p className="text-white font-semibold text-xs mt-1">{client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Desde {formatDate(client.created_at)}</span>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${client.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                        client.status === "paused" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </ClientsPageClient>
  );
}
