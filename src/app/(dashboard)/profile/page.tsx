import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { getSessionProfile } from "@/services/auth/session";
import { getSessionOrg } from "@/services/org/session";
import { User as UserIcon } from "lucide-react";
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
      <PageLayout centered={false} maxWidth="2xl" className="p-4 sm:p-6 lg:p-8 w-full">
        <PageHeader
          title="Meu Perfil"
          description="Veja e edite suas informações pessoais."
          icon={UserIcon}
          iconColor="bg-blue-600"
        />

        <Card className="p-6 sm:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-200 rounded-xl w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-10 w-full">
            {/* Avatar com ícone */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-500/20 group hover:ring-8 transition-all duration-200" aria-label="Avatar do usuário">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || user.email}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                  className="object-cover group-hover:scale-110 transition-transform duration-200"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-5xl font-bold group-hover:scale-110 transition-transform duration-200">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg ring-2 ring-white dark:ring-slate-700 transition-transform group-hover:scale-110">
                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </span>
            </div>
            {/* Informações do usuário */}
            <div className="flex-1 w-full min-w-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2 truncate">
                {user.name ?? "Sem nome"}
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mb-3 truncate">{user.email}</div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium transition-all duration-200 hover:shadow-md hover:scale-105" aria-label="Papel do usuário">
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
                  className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all duration-200 font-medium"
                  aria-label="Editar perfil"
                >
                  Editar perfil
                </Link>
                {role === "OWNER" && (
                  <Link
                    href="/settings#org"
                    className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all duration-200 font-medium"
                    aria-label="Editar organização"
                  >
                    Editar organização
                  </Link>
                )}
                <form action={handleLogout} className="inline">
                  <button
                    type="submit"
                    className="text-sm sm:text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded transition-all duration-200 font-medium"
                    aria-label="Sair da conta"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de informações da organização */}
        {org && (
          <Card className="mt-6 sm:mt-8 p-6 sm:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-200 rounded-xl w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Organização</h3>
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">Informações da empresa vinculada à sua conta.</p>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Nome:</span> {org.name || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">CNPJ:</span> {org.cnpj || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Telefone:</span> {org.phone || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Website:</span> {org.website || "-"}
              </div>
              <div className="md:col-span-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Endereço:</span> {org.addressLine1 || "-"} {org.addressLine2 ? `, ${org.addressLine2}` : ""}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Cidade:</span> {org.city || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">Estado:</span> {org.state || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">CEP:</span> {org.postalCode || "-"}
              </div>
              <div className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                <span className="font-semibold text-slate-900 dark:text-white">País:</span> {org.country || "-"}
              </div>
              {org.description && (
                <div className="md:col-span-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Descrição:</span> {org.description}
                </div>
              )}
            </div>
          </Card>
        )}
      </PageLayout>
    </AppShell>
  );
}
