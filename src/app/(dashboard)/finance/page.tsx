import { PageLayout } from "@/components/layout/PageLayout";
import { FinanceManagerGlobal } from "@/features/finance/components/FinanceManagerGlobalLazy";
import { can, type AppRole } from "@/lib/permissions";
import { getSessionProfile } from "@/services/auth/session";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const { user, orgId, role } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!orgId) redirect("/");
  if (!role || !can(role as unknown as AppRole, "read", "finance"))
    redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <PageLayout centered={false}>
        <FinanceManagerGlobal orgId={orgId} />
      </PageLayout>
    </div>
  );
}
