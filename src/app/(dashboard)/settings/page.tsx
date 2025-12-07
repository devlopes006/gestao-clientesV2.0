import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { Settings as SettingsIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { OrgForm } from "./OrgForm";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <PageLayout centered={false} maxWidth="3xl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          title="Configurações"
          description="Edite suas informações de perfil e preferências da conta."
          icon={SettingsIcon}
          iconColor="bg-slate-600"
        />

        <div className="space-y-8">
          <Card className="p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm">
            <h2 className="text-lg font-black mb-4 text-slate-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Perfil do Usuário</h2>
            <ProfileForm initialName={user.name} initialImage={user.image} />
          </Card>

          {role === "OWNER" && (
            <>
              <div className="flex items-center gap-2 my-2">
                <span className="h-1 w-8 rounded bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Organização</span>
                <span className="flex-1 h-1 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <Card className="p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm" id="org">
                <h2 className="text-lg font-black mb-4 text-slate-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Dados da Organização</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Atualize CNPJ, endereço e informações de contato da sua empresa.
                </p>
                <OrgForm />
              </Card>
            </>
          )}
        </div>
      </PageLayout>
    </AppShell>
  );
}
