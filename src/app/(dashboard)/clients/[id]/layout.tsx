import TabsNav from "@/components/common/TabsNav";
import AppShell from "@/components/layout/AppShell";
import GradientPageHeader from "@/components/layout/GradientPageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLIENT_PLAN_LABELS } from "@/lib/prisma-enums";
import { getSessionProfile } from "@/services/auth/session";
import { getClientById, listClientsByOrg } from "@/services/repositories/clients";
import { CLIENT_STATUS_LABELS } from "@/types/enums";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface ClientLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const { id } = await params;
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId) {
    redirect("/login");
  }

  const client = await getClientById(id);

  if (!client || client.orgId !== orgId) {
    notFound();
  }

  // Se for CLIENT, verificar se tem acesso a este cliente
  if (role === "CLIENT" && client.clientUserId !== user.id) {
    notFound();
  }

  // Definir navegação baseada no role
  const allNavItems = [
    { href: `/clients/${id}/info`, label: "Informações", icon: "info", roles: ["OWNER", "STAFF", "CLIENT"] },
    { href: `/clients/${id}/tasks`, label: "Tarefas", icon: "listTodo", roles: ["OWNER", "STAFF"] },
    { href: `/clients/${id}/media`, label: "Mídias", icon: "image", roles: ["OWNER", "STAFF", "CLIENT"] },
    { href: `/clients/${id}/strategy`, label: "Estratégia", icon: "lightbulb", roles: ["OWNER", "STAFF"] },
    { href: `/clients/${id}/branding`, label: "Branding", icon: "briefcase", roles: ["OWNER", "STAFF"] },
    { href: `/clients/${id}/meetings`, label: "Reuniões", icon: "calendar", roles: ["OWNER", "STAFF", "CLIENT"] },
    { href: `/clients/${id}/billing`, label: "Cobrança", icon: "briefcase", roles: ["OWNER"] },
    {
      href: `/clients/${id}/delete`,
      label: "Excluir",
      icon: "trash2",
      destructive: true,
      roles: ["OWNER"],
    },
  ];

  // Filtrar itens baseado no role
  const navItems = allNavItems.filter(item =>
    item.roles.includes(role || "")
  );

  // Buscar todos os clientes para navegação prev/next
  const allClients = await listClientsByOrg(orgId);
  const currentIndex = allClients.findIndex((c) => c.id === id);
  const prevClient = currentIndex > 0 ? allClients[currentIndex - 1] : null;
  const nextClient = currentIndex < allClients.length - 1 ? allClients[currentIndex + 1] : null;

  // Gerar avatar inicial
  // Avatar initials (kept for potential future usage)

  return (
    <AppShell>
      <PageLayout centered={false} maxWidth="7xl">
        {/* Header aligned with design system */}
        <div className="mb-3 sm:mb-4">
          <div className="mb-2 sm:mb-3">
            <Button variant="outline" size="sm" className="gap-2 rounded-lg" asChild>
              <Link href="/clients" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
          <GradientPageHeader
            icon={Info}
            title={client.name}
            subtitle={`Cliente desde ${new Date(client.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
            gradient="primary"
            actions={(
              <div className="flex items-center gap-2">
                <Badge variant={client.status === 'active' ? 'success' : client.status === 'new' ? 'info' : client.status === 'onboarding' ? 'warning' : client.status === 'paused' ? 'warning' : 'danger'}>
                  {CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS]}
                </Badge>
                {client.plan && (
                  <Badge variant="secondary" className="font-semibold">{CLIENT_PLAN_LABELS[client.plan as keyof typeof CLIENT_PLAN_LABELS]}</Badge>
                )}
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  {prevClient ? (
                    <Button variant="ghost" size="sm" className="gap-1 rounded-lg" title={`Anterior: ${prevClient.name}`} asChild>
                      <Link href={`/clients/${prevClient.id}/info`} className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden lg:inline">Anterior</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled className="gap-1 rounded-lg">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden lg:inline">Anterior</span>
                    </Button>
                  )}
                  {nextClient ? (
                    <Button variant="ghost" size="sm" className="gap-1 rounded-lg" title={`Próximo: ${nextClient.name}`} asChild>
                      <Link href={`/clients/${nextClient.id}/info`} className="flex items-center gap-1">
                        <span className="hidden lg:inline">Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled className="gap-1 rounded-lg">
                      <span className="hidden lg:inline">Próximo</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-2 sm:mb-3">
          <nav className="flex gap-0.5 pb-0.5 no-scrollbar justify-center">
            <TabsNav items={navItems} />
          </nav>
        </div>

        {/* Page Content */}
        {children}
      </PageLayout>
    </AppShell>
  );
}
