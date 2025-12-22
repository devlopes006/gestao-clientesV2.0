import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { getSessionOrg } from "@/services/org/session";
import { User as UserIcon, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { user, role } = await getSessionProfile();
  if (!user) redirect("/login");

  // Função de logout (simples, pode ser aprimorada)
  async function handleLogout() {
    'use server';
    redirect("/logout");
  }

  // Busca dados da organização diretamente do serviço server-side
  const org = await getSessionOrg();

  return (
    <AppShell>
      <PageLayout centered={false} maxWidth="2xl" className="p-4 sm:p-6 lg:p-8 w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <PageHeader
          title="Meu Perfil"
          description="Veja e edite suas informações pessoais."
          icon={UserIcon}
          iconColor="bg-blue-600"
        />

        {/* Card de Usuário - Com padrão do Dashboard */}
        <Card className="p-6 sm:p-8 lg:p-10 border rounded-2xl w-full transition-all duration-300 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 backdrop-blur-lg hover:shadow-lg hover:shadow-blue-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-10 w-full">
            {/* Avatar com ícone */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-full overflow-hidden shadow-xl ring-4 ring-blue-500/30 group hover:ring-8 hover:ring-blue-500/50 transition-all duration-300" aria-label="Avatar do usuário">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || user.email}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-5xl font-black group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 bg-slate-900 rounded-full p-1.5 shadow-lg ring-2 ring-white transition-transform group-hover:scale-110">
                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" aria-hidden="true" />
              </span>
            </div>
            {/* Informações do usuário */}
            <div className="flex-1 w-full min-w-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 truncate">
                {user.name ?? "Sem nome"}
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-slate-400 mb-3 truncate">{user.email}</div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs sm:text-sm px-3 py-1.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105" aria-label="Papel do usuário">
                  {role === "OWNER"
                    ? "Administrador"
                    : role === "STAFF"
                      ? "Equipe"
                      : role === "CLIENT"
                        ? "Cliente"
                        : "Usuário"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                <Link
                  href="/settings"
                  className="text-sm sm:text-base text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all duration-200 font-medium"
                  aria-label="Editar perfil"
                >
                  Editar perfil
                </Link>
                {role === "OWNER" && (
                  <Link
                    href="/settings#org"
                    className="text-sm sm:text-base text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all duration-200 font-medium"
                    aria-label="Editar organização"
                  >
                    Editar organização
                  </Link>
                )}
                <form action={handleLogout} className="inline">
                  <button
                    type="submit"
                    className="text-sm sm:text-base text-red-400 hover:text-red-300 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded transition-all duration-200 font-medium"
                    aria-label="Sair da conta"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de informações da organização - Com padrão do Dashboard */}
        {org && (
          <Card className="mt-6 sm:mt-8 p-6 sm:p-8 lg:p-10 border rounded-2xl w-full transition-all duration-300 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 backdrop-blur-lg hover:shadow-lg hover:shadow-purple-500/20">
            <div className="mb-4 sm:mb-6 flex items-start gap-3">
              <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Organização</h3>
                <p className="text-xs sm:text-sm lg:text-base text-slate-400 mt-1">Informações da empresa vinculada à sua conta.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 text-sm sm:text-base text-slate-300">
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Nome</span>
                <span className="text-slate-200">{org.name || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">CNPJ</span>
                <span className="text-slate-200">{org.cnpj || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Telefone</span>
                <span className="text-slate-200">{org.phone || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Website</span>
                <span className="text-slate-200">{org.website || "-"}</span>
              </div>
              <div className="md:col-span-2 hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Endereço</span>
                <span className="text-slate-200">{org.addressLine1 || "-"} {org.addressLine2 ? `, ${org.addressLine2}` : ""}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Cidade</span>
                <span className="text-slate-200">{org.city || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Estado</span>
                <span className="text-slate-200">{org.state || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">CEP</span>
                <span className="text-slate-200">{org.postalCode || "-"}</span>
              </div>
              <div className="hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">País</span>
                <span className="text-slate-200">{org.country || "-"}</span>
              </div>
              {org.description && (
                <div className="md:col-span-2 hover:bg-slate-800/40 p-3 rounded-lg transition-all duration-200">
                  <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider text-purple-300 mb-1">Descrição</span>
                  <span className="text-slate-200">{org.description}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </PageLayout>
    </AppShell>
  );
}
