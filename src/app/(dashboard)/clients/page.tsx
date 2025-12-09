import { ClientsPageClient } from "@/app/(dashboard)/clients/ClientsPageClient";
import ClientsToolbar from "@/app/(dashboard)/clients/ClientsToolbar";
import { Button } from "@/components/ui/button";
import { GenerateInvoiceButton } from "@/components/GenerateInvoiceButton";
import { can } from "@/lib/permissions";
import { CLIENT_PLAN_LABELS, SOCIAL_CHANNEL_LABELS } from "@/lib/prisma-enums";
import { formatDate } from "@/lib/utils";
import { getSessionProfile } from "@/services/auth/session";
import { listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import type { AppClient } from "@/types/tables";
import type { ClientPlan, SocialChannel } from "@prisma/client";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string>>;
}

function statusPill(status: string) {
  const label = CLIENT_STATUS_LABELS[status as keyof typeof CLIENT_STATUS_LABELS] ?? status;
  return <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">{label}</span>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { user, orgId, role } = await getSessionProfile();
  const params = (await searchParams) || {};
  const query = params.q || "";
  const status = params.status || "";
  const plan = params.plan || "";
  const view = params.view || "list";

  if (!user || !orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8 text-slate-700">
        <div className="max-w-md space-y-3 rounded-lg border bg-white p-6 text-center shadow-sm">
          <p>Você precisa estar autenticado para ver os clientes.</p>
          <Button asChild className="w-full justify-center">
            <Link href="/login">Ir para login</Link>
          </Button>
        </div>
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
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8 text-slate-700">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          Erro ao carregar clientes. Tente novamente.
        </div>
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
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
          <header className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Clientes</p>
                <h1 className="text-3xl font-semibold">Meus clientes</h1>
                <p className="text-sm text-slate-600">Organize contatos, planos e comunicações em um só lugar.</p>
              </div>
              {canCreateClient && (
                <Button asChild className="h-10 rounded-md bg-slate-900 text-white">
                  <Link href="/clients/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo cliente
                  </Link>
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ label: "Total", value: total }, { label: "Ativos", value: activeCount }, { label: "Pausados", value: pausedCount }, { label: "Encerrados", value: closedCount }].map((item) => (
                <div key={item.label} className="rounded-lg border bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                  <p className="text-xl font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </header>

          <section className="space-y-4">
            <ClientsToolbar
              uniquePlans={uniquePlans}
              initialQuery={query}
              initialStatus={status}
              initialPlan={plan}
              initialView={view}
            />

            {!clients.length ? (
              <div className="rounded-lg border border-dashed bg-white p-8 text-center text-slate-600 shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100">
                  <Users className="h-5 w-5" />
                </div>
                <p className="font-medium">{query || status || plan ? "Nenhum cliente encontrado com esses filtros." : "Nenhum cliente cadastrado ainda."}</p>
                <p className="mt-1 text-sm">{query || status || plan ? "Ajuste os filtros ou limpe a busca." : "Crie o primeiro cliente para começar."}</p>
                {canCreateClient && !(query || status || plan) && (
                  <div className="mt-4 flex justify-center">
                    <Button asChild className="h-10 rounded-md bg-slate-900 text-white">
                      <Link href="/clients/new" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar cliente
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
                {clients.map((client) => (
                  <div key={client.id} className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Link href={`/clients/${client.id}/info`} className="text-base font-semibold text-slate-900 hover:underline">
                          {client.name}
                        </Link>
                        <p className="text-sm text-slate-600">{client.email || "Sem email cadastrado"}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                          <span>Plano: {client.plan ? CLIENT_PLAN_LABELS[client.plan as ClientPlan] : "—"}</span>
                          <span>Canal: {client.main_channel ? SOCIAL_CHANNEL_LABELS[client.main_channel as SocialChannel] : "—"}</span>
                        </div>
                        <p className="text-xs text-slate-500">Criado em {formatDate(client.created_at)}</p>
                      </div>
                      {statusPill(client.status)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <Button asChild variant="outline" size="sm" className="h-9 rounded-md text-slate-800">
                        <Link href={`/clients/${client.id}/info`}>Detalhes</Link>
                      </Button>
                      <GenerateInvoiceButton clientId={client.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ClientsPageClient>
  );
}
