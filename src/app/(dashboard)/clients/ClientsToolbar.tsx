"use client";

import { FilterBarModal, type FilterConfig } from "@/components/common/FilterBarModal";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListFilter, Rows } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

interface ClientsToolbarProps {
  uniquePlans: string[];
  initialQuery: string;
  initialStatus: string;
  initialPlan: string;
  initialView: string;
}

export default function ClientsToolbar({ uniquePlans, initialQuery, initialStatus, initialPlan, initialView }: ClientsToolbarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const [open, setOpen] = useState(false);

  const view = sp?.get("view") || initialView || "list";

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        name: "q",
        type: "text",
        placeholder: "Buscar por nome ou email...",
        label: "Busca",
        defaultValue: initialQuery,
      },
      {
        name: "status",
        type: "select",
        label: "Status",
        options: [
          { value: "", label: "Todos os status" },
          { value: "new", label: "Novo" },
          { value: "onboarding", label: "Onboarding" },
          { value: "active", label: "Ativo" },
          { value: "paused", label: "Pausado" },
          { value: "closed", label: "Encerrado" },
        ],
        defaultValue: initialStatus,
      },
      {
        name: "plan",
        type: "select",
        label: "Plano",
        options: [
          { value: "", label: "Todos os planos" },
          ...uniquePlans.map((p) => ({ value: p, label: p })),
        ],
        defaultValue: initialPlan,
      },
    ],
    [uniquePlans, initialQuery, initialStatus, initialPlan]
  );

  const setParam = (key: string, val?: string) => {
    const url = new URL(window.location.href);
    if (val === undefined || val === null || val === "") url.searchParams.delete(key);
    else url.searchParams.set(key, val);
    router.push(url.pathname + url.search);
  };

  const handleSubmit = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (!v) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    router.push(url.pathname + url.search);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`h-9 rounded-md border-slate-700 bg-slate-800 text-sm font-medium ${view === "grid"
              ? "border-slate-600 bg-slate-700 text-white"
              : "text-slate-300 hover:bg-slate-700"
            }`}
          onClick={() => setParam("view", "grid")}
          title="Visualizar em grade"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="ml-2">Grade</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 rounded-md border-slate-700 bg-slate-800 text-sm font-medium ${view === "list"
              ? "border-slate-600 bg-slate-700 text-white"
              : "text-slate-300 hover:bg-slate-700"
            }`}
          onClick={() => setParam("view", "list")}
          title="Visualizar em lista"
        >
          <Rows className="h-4 w-4" />
          <span className="ml-2">Lista</span>
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 rounded-md border-slate-700 bg-slate-800 text-sm font-medium text-slate-200 hover:bg-slate-700"
      >
        <ListFilter className="h-4 w-4 mr-2" />
        Filtros
      </Button>

      <FilterBarModal filters={filters} open={open} setOpen={setOpen} onSubmit={handleSubmit} />
    </div>
  );
}
