import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ClientKPICard,
  ClientPageLayout,
  ClientSectionCard,
} from "@/components/clients";
import { ClientInfoDisplay } from "@/features/clients/components/ClientInfoDisplay";
import { can } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { getClientDashboard } from "@/services/clients/getClientDashboard";
import { getClientById } from "@/services/repositories/clients";
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  Image as ImageIcon,
} from "lucide-react";

interface ClientInfoPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params;
  const { orgId, role } = await getSessionProfile();

  if (!role) return null;

  const client = await getClientById(id);

  if (!client || client.orgId !== orgId) {
    return null;
  }

  const dash = await getClientDashboard(orgId, id);

  // Permissions
  const canEditClient = can(role, "update", "client");
  const canManageFinance = can(role, "update", "finance");

  const taskStats = {
    total: dash?.counts.tasks.total ?? 0,
    completed: dash?.counts.tasks.done ?? 0,
    inProgress: dash?.counts.tasks.inProgress ?? 0,
    pending: dash?.counts.tasks.todo ?? 0,
    completionRate:
      dash && dash.counts.tasks.total > 0
        ? Math.round((dash.counts.tasks.done / dash.counts.tasks.total) * 100)
        : 0,
  };

  const mediaStats = {
    total: dash?.counts.media ?? 0,
  };

  const meetingStats = {
    upcoming: dash?.counts.meetings.upcoming ?? 0,
  };

  return (
    <ProtectedRoute>
      <ClientPageLayout>
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <ClientKPICard
            icon={CheckCircle2}
            label="Taxa de Conclusão"
            value={`${taskStats.completionRate}%`}
            color="green"
          />
          <ClientKPICard
            icon={FolderKanban}
            label="Tarefas Ativas"
            value={taskStats.total - taskStats.completed}
            color="blue"
          />
          <ClientKPICard
            icon={ImageIcon}
            label="Total de Mídias"
            value={mediaStats.total}
            color="purple"
          />
          <ClientKPICard
            icon={Calendar}
            label="Reuniões Agendadas"
            value={meetingStats.upcoming}
            color="amber"
          />
        </div>

        {/* Client Info Section */}
        <ClientSectionCard title="Informações do Cliente">
          <ClientInfoDisplay client={client} canEdit={canEditClient} />
        </ClientSectionCard>

        {/* Finance Summary (if authorized) */}
        {canManageFinance && (
          <ClientSectionCard title="Resumo Financeiro">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-sm text-slate-300">
                Você tem acesso para visualizar dados financeiros deste cliente.
              </div>
              <a
                href={`/clients/${client.id}/finance`}
                className="inline-block text-blue-400 hover:text-blue-300 font-semibold text-sm"
              >
                Ver Finanças Completas →
              </a>
            </div>
          </ClientSectionCard>
        )}
      </ClientPageLayout>
    </ProtectedRoute>
  );
}
