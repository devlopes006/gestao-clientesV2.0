"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function GenerateInvoiceButton({ clientId, onSuccess }: { clientId: string; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    if (res.ok) {
      if (onSuccess) onSuccess();
      alert("Fatura gerada com sucesso!");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao gerar fatura.");
    }
  }

  return (
    <Button type="button" size="sm" onClick={handleClick} disabled={loading} className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 flex-1 h-8 rounded-md text-xs">
      {loading ? "Gerando..." : "Gerar fatura"}
    </Button>
  );
}
