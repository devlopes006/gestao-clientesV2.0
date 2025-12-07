import { ClientsPageClient } from "@/app/(dashboard)/clients/ClientsPageClient";
import ClientsToolbar from "@/app/(dashboard)/clients/ClientsToolbar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { GenerateInvoiceButton } from "@/components/GenerateInvoiceButton";
import GradientPageHeader from "@/components/layout/GradientPageHeader";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { can } from "@/lib/permissions";
import { CLIENT_PLAN_LABELS, SOCIAL_CHANNEL_LABELS } from "@/lib/prisma-enums";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import type { AppClient } from "@/types/tables";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { CheckCircle2, PauseCircle, Plus, Users, XCircle } from "lucide-react";
import Link from "next/link";

// Config de cache
export const revalidate = 60; // 1 minuto
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string>>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { user, orgId, role } = await getSessionProfile();
  const params = (await searchParams) || {};
  const query = params.q || "";
  const status = params.status || "";
  const plan = params.plan || "";
  const view = params.view || "grid";

  if (!user || !orgId) {
    return (
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
        <Card className="p-8 text-center text-slate-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-dashed space-y-3 max-w-md">
          <p>Você precisa estar autenticado para ver os clientes.</p>
          <Button
            size="sm"
            className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            asChild
          >
            <Link href="/login">Ir para login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  let clients: AppClient[] = [];
  try {
    const allClients = await listClientsByOrg(orgId);

    // Filter clients
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
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
        <Card className="p-6 text-red-600 bg-rose-50/80 dark:bg-rose-950/20 backdrop-blur-sm border-rose-200 dark:border-rose-900 shadow-sm max-w-md">
          Erro ao carregar clientes. Tente novamente.
        </Card>
      </div>
    );
  }

  const canCreateClient = role ? can(role, "create", "client") : false;

  // Get unique plans for filter
  const uniquePlans = Array.from(
    new Set((clients.map((c) => c.plan).filter(Boolean) as string[]))
  ).sort();

  const total = clients.length;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const pausedCount = clients.filter((c) => c.status === "paused").length;
  const closedCount = clients.filter((c) => c.status === "closed").length;

  // // Filtros para o modal
  // const filterConfigs = [
  //   {
  //     name: "q",
  //     type: "text",
  //     placeholder: "Buscar por nome ou email...",
  //     label: "Busca",
  //     defaultValue: query,
  //   },
  //   {
  //     name: "status",
  //     type: "select",
  //     label: "Status",
  //     options: [
  //       { value: "", label: "Todos os status" },
  //       { value: "new", label: "Novo" },
  //       { value: "onboarding", label: "Onboarding" },
  //       { value: "active", label: "Ativo" },
  //       { value: "paused", label: "Pausado" },
  //       { value: "closed", label: "Encerrado" },
  //     ],
  //     defaultValue: status,
  //   },
  //   {
  //     name: "plan",
  //     type: "select",
  //     label: "Plano",
  //     options: [
  //       { value: "", label: "Todos os planos" },
  //       ...uniquePlans.map((p) => ({ value: p ?? "", label: p ?? "" })),
  //     ],
  //     defaultValue: plan,
  //   },
  // ];

  // Estado do modal


  return (
    <ClientsPageClient>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="page-shell py-6 sm:py-8 lg:py-10 space-y-8">
          <GradientPageHeader
            icon={Users}
            title="Meus Clientes"
            subtitle="Visualize e gerencie todos os clientes da sua organização com informações atualizadas."
            gradient="primary"
            actions={
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link href="/clients/new">
                  <Button
                    size="sm"
                    className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 w-full sm:w-auto transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Novo Cliente</span>
                    <span className="inline sm:hidden">Novo</span>
                  </Button>
                </Link>
              </div>
            }
          />
          {/* KPI Header */}
          <KpiGrid columns={4} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              variant="blue"
              icon={Users}
              value={total}
              label="Total de Clientes"
              description="Base atual"
            />
            <KpiCard
              variant="emerald"
              icon={CheckCircle2}
              value={activeCount}
              label="Ativos"
              description={total > 0 ? `${Math.round((activeCount / total) * 100)}% da base` : "0% da base"}
              progress={total > 0 ? Math.round((activeCount / total) * 100) : 0}
            />
            <KpiCard
              variant="amber"
              icon={PauseCircle}
              value={pausedCount}
              label="Pausados"
              description="Temporariamente inativos"
            />
            <KpiCard
              variant="red"
              icon={XCircle}
              value={closedCount}
              label="Encerrados"
              description="Contratos finalizados"
            />
          </KpiGrid>
          <ClientsToolbar
            uniquePlans={uniquePlans}
            initialQuery={query}
            initialStatus={status}
            initialPlan={plan}
            initialView={view}
          />

          {!clients.length ? (
            <Card className="p-6 sm:p-8 lg:p-12 text-center border-2 border-dashed border-slate-300/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl space-y-3 sm:space-y-4 transition-all duration-300 hover:shadow-xl shadow-slate-200/50 dark:shadow-black/20">
              <div className="inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-800 items-center justify-center text-3xl sm:text-4xl mb-2 shadow-lg">
                <div className="animate-pulse">👥</div>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {query || status || plan
                    ? "Nenhum cliente encontrado com esses filtros."
                    : "Nenhum cliente cadastrado ainda."}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                  {query || status || plan
                    ? "Tente ajustar os filtros ou limpar a busca."
                    : "Que tal começar agora?"}
                </p>
              </div>
              {canCreateClient && !(query || status || plan) && (
                <Button
                  size="sm"
                  className="mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-95"
                  asChild
                >
                  <Link href="/clients/new" className="flex items-center gap-2">
                    <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Adicionar Cliente
                  </Link>
                </Button>
              )}
            </Card>
          ) : view === "list" ? (
            /* List View - Premium Design */
            <div className="space-y-3">
              {clients.map((client, index) => (
                <Card
                  key={client.id}
                  className="group relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-r from-white/95 via-blue-50/40 to-purple-50/40 dark:from-slate-900/95 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
                      {/* Avatar & Name Section */}
                      <Link href={`/clients/${client.id}/info`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
                            <span className="text-2xl sm:text-3xl font-black text-white">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 truncate">
                            {client.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                            {client.email || "Sem email cadastrado"}
                          </p>
                        </div>
                      </Link>

                      {/* Status & Info Section */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">
                        <Badge
                          variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm"
                        >
                          {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                        </Badge>

                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "Sem plano"}
                          </span>
                        </div>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-100/60 to-pink-100/60 dark:from-purple-950/40 dark:to-pink-950/40 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}
                          </span>
                        </div>

                        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-100/60 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                            {formatDate(client.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
                            asChild
                          >
                            <Link href={`/clients/${client.id}/info`}>Abrir</Link>
                          </Button>
                          <GenerateInvoiceButton clientId={client.id} />
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Grid View - Enhanced Sophistication */
            <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-2 sm:mt-4">
              {clients.map((client, index) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}/info`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="group relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm p-5 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full">
                    {/* Avatar Section */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <span className="text-2xl font-black text-white">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white dark:border-slate-900 shadow-md animate-pulse" />
                      </div>

                      <Badge
                        variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'}
                        className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl shadow-sm"
                      >
                        {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                      </Badge>
                    </div>

                    {/* Content Section */}
                    <div className="relative flex flex-col gap-3 z-10">
                      <div>
                        <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2 mb-1">
                          {client.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                          {client.email || "Sem email"}
                        </p>
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-100/80 to-indigo-100/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-800/50">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200/50 dark:border-purple-800/50">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Criado em{" "}
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatDate(client.created_at)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-indigo-600/0 to-purple-600/0 group-hover:from-blue-600/5 group-hover:via-indigo-600/5 group-hover:to-purple-600/5 rounded-3xl transition-all duration-300 pointer-events-none" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientsPageClient>
  );
}
