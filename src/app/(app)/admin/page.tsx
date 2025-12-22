import { getSessionProfile } from "@/services/auth/session";
import { redirect } from "next/navigation";
import MembersAdminPage from "./members/page";

export default async function AdminPage() {
  const { user, orgId, role } = await getSessionProfile();

  if (!user || !orgId) {
    redirect("/login");
  }

  if (role !== "OWNER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-slate-900 to-slate-900/80 shadow-2xl backdrop-blur-xl p-8 max-w-md hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="space-y-6 text-center relative z-10">
            <div className="text-6xl">🔒</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
              Acesso Restrito
            </h1>
            <p className="text-slate-300 font-medium text-base">
              Apenas proprietários da organização podem acessar esta página.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-500 to-rose-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <MembersAdminPage />
      </div>
    </div>
  );
}
