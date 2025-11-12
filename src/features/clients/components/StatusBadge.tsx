import { ClientStatus } from "@/types/client";

const statusStyles: Record<ClientStatus, string> = {
  new: "bg-slate-100 text-slate-600 border-slate-200",
  onboarding: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-orange-100 text-orange-700 border-orange-200",
  closed: "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
