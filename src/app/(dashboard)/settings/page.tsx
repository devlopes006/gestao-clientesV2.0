import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { Building2, Settings as SettingsIcon, User } from "lucide-react";
import { redirect } from "next/navigation";
import { OrgForm } from "./OrgForm";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageLayout centered={false} maxWidth="4xl">
        <div className="py-6 sm:py-8 lg:py-10 space-y-8">
          {/* Header Premium */}
          <div className="relative">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl shadow-blue-500/30">
                <SettingsIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
                  Configurações
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Gerencie suas informações de perfil e preferências da conta
                </p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="group relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Perfil do Usuário
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    Atualize suas informações pessoais
                  </p>
                </div>
              </div>
              <ProfileForm initialName={user.name} initialImage={user.image} />
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
          </Card>

          {role === "OWNER" && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <span className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Organização</span>
                <span className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Organization Card */}
              <Card className="group relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300" id="org">
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Dados da Organização
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        CNPJ, endereço e informações de contato
                      </p>
                    </div>
                  </div>
                  <OrgForm />
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
              </Card>
            </>
          )}
        </div>
      </PageLayout>
    </div>
  );
}
