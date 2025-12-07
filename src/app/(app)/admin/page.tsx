import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-sm p-8 max-w-md shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="space-y-4 text-center">
            <div className="text-6xl animate-bounce">🔒</div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              Acesso Restrito
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Apenas proprietários da organização podem acessar esta página.
            </p>
          </div>

          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-3xl opacity-100 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-pink-600 rounded-b-3xl" />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageLayout centered={false} maxWidth="7xl">
        <MembersAdminPage />
      </PageLayout>
    </div>
  );
}
