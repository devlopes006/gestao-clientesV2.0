import { getSessionProfile } from "@/services/auth/session";
import { Building2, Settings as SettingsIcon, User } from "lucide-react";
import { redirect } from "next/navigation";
import { OrgForm } from "./OrgForm";
import { ProfileForm } from "./ProfileForm";

export default async function SettingsPage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header Premium */}
        <header className="space-y-4">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-2xl shadow-blue-500/30">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                Configurações
              </h1>
              <p className="text-slate-400 text-base sm:text-lg mt-2 max-w-2xl">
                Gerencie suas informações de perfil e preferências da conta
              </p>
            </div>
          </div>
        </header>

        {/* Profile Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-900/80 shadow-2xl backdrop-blur-xl hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-300" />
          <div className="p-8 sm:p-10 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  Perfil do Usuário
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Atualize suas informações pessoais
                </p>
              </div>
            </div>
            <ProfileForm initialName={user.name} initialImage={user.image} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {role === "OWNER" && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 py-4">
              <span className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Organização</span>
              <span className="flex-1 h-1 rounded-full bg-slate-800/50" />
            </div>

            {/* Organization Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 to-slate-900/80 shadow-2xl backdrop-blur-xl hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-300" />
              <div className="p-8 sm:p-10 relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      Dados da Organização
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      CNPJ, endereço e informações de contato
                    </p>
                  </div>
                </div>
                <OrgForm />
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
