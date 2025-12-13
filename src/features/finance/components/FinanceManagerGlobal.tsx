"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput, parseDateInput, toLocalISOString } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Filter,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Finance {
  id: string;
  type: "INCOME" | "EXPENSE";
  subtype?: string;
  amount: number;
  description?: string | null;
  category?: string | null;
  date: Date | string;
  createdAt: Date | string;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
  } | null;
}

interface FinanceManagerGlobalProps {
  orgId: string;
}

const CATEGORIES = {
  INCOME: [
    "Pagamento Cliente",
    "Investimento",
    "Serviços",
    "Consultoria",
    "Outro",
  ],
  EXPENSE: [
    "Anúncios",
    "Ferramentas",
    "Freelancer",
    "Hospedagem",
    "Salários",
    "Infraestrutura",
    "Outro",
  ],
};

export function FinanceManagerGlobal({ orgId }: FinanceManagerGlobalProps) {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Finance | null>(null);
  const [filter, setFilter] = useState<"all" | "INCOME" | "EXPENSE">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    type: "INCOME" as Finance["type"],
    amount: "",
    description: "",
    category: "",
    date: formatDateInput(new Date()),
    clientId: "",
  });

  // Installments for current month
  const [installments, setInstallments] = useState<
    Array<{
      id: string;
      number: number;
      amount: number;
      dueDate: string;
      clientId: string;
      client: { id: string; name: string };
    }>
  >([]);

  // Load finances and clients
  useEffect(() => {
    loadData();
    loadInstallments();
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [financesRes, clientsRes] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/mobile/clients?page=1&limit=100"),
      ]);

      if (financesRes.ok) {
        const data = await financesRes.json();
        setFinances(data || []);
      }

      if (clientsRes.ok) {
        const response = await clientsRes.json();
        setClients(response.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar finanças");
    } finally {
      setLoading(false);
    }
  };

  const loadInstallments = async () => {
    try {
      const res = await fetch("/api/installments", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setInstallments(j.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar parcelas:", err);
    }
  };

  const confirmInstallment = async (id: string) => {
    try {
      const res = await fetch(
        `/api/installments?id=${encodeURIComponent(id)}`,
        { method: "PATCH" },
      );
      if (!res.ok) throw new Error("Falha ao confirmar parcela");
      toast.success("Parcela confirmada e recebimento registrado!");
      await Promise.all([loadInstallments(), loadData()]);
    } catch {
      toast.error("Não foi possível confirmar a parcela");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "INCOME",
      amount: "",
      description: "",
      category: "",
      date: formatDateInput(new Date()),
      clientId: "",
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    setSubmitting(true);

    // Converte a data corretamente para evitar diferença de timezone
    const dateToSave = toLocalISOString(parseDateInput(formData.date));

    try {
      if (editingItem) {
        const res = await fetch(`/api/finance?id=${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
            clientId: formData.clientId || null,
          }),
        });

        if (!res.ok) throw new Error("Falha ao atualizar transação");
        const updated = await res.json();
        setFinances((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item)),
        );
        toast.success("Transação atualizada!");
      } else {
        const res = await fetch("/api/finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
            clientId: formData.clientId || null,
          }),
        });

        if (!res.ok) throw new Error("Falha ao criar transação");
        const created = await res.json();
        setFinances((prev) => [created, ...prev]);
        toast.success("Transação criada!");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar transação",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Finance) => {
    setEditingItem(item);
    const date = new Date(item.date);
    setFormData({
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || "",
      category: item.category || "",
      date: formatDateInput(date),
      clientId: item.clientId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta transação?")) return;

    try {
      const res = await fetch(`/api/finance?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao deletar transação");

      setFinances((prev) => prev.filter((item) => item.id !== id));
      toast.success("Transação deletada!");
    } catch {
      toast.error("Erro ao deletar transação");
    }
  };

  const totals = useMemo(() => {
    const income = finances
      .filter((f) => f.type === "INCOME")
      .reduce((sum, f) => sum + f.amount, 0);

    const expense = finances
      .filter((f) => f.type === "EXPENSE")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      incomeCount: finances.filter((f) => f.type === "INCOME").length,
      expenseCount: finances.filter((f) => f.type === "EXPENSE").length,
    };
  }, [finances]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { amount: number; count: number }> = {};

    finances.forEach((f) => {
      const category = f.category || "Sem categoria";
      if (!stats[category]) {
        stats[category] = { amount: 0, count: 0 };
      }
      stats[category].amount += f.type === "INCOME" ? f.amount : -f.amount;
      stats[category].count += 1;
    });

    return Object.entries(stats)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }, [finances]);

  // Map percentage to a Tailwind width utility class without inline styles
  const PCT_WIDTH_CLASSES: Record<number, string> = {
    0: "w-[0%]",
    10: "w-[10%]",
    20: "w-[20%]",
    30: "w-[30%]",
    40: "w-[40%]",
    50: "w-[50%]",
    60: "w-[60%]",
    70: "w-[70%]",
    80: "w-[80%]",
    90: "w-[90%]",
    100: "w-[100%]",
  };
  const getWidthClass = (value: number, maxAbs: number) => {
    if (maxAbs <= 0) return PCT_WIDTH_CLASSES[0];
    const pct = Math.min(
      100,
      Math.max(0, Math.round((Math.abs(value) / maxAbs) * 100)),
    );
    const step = Math.round(pct / 10) * 10;
    return (
      PCT_WIDTH_CLASSES[step as keyof typeof PCT_WIDTH_CLASSES] ||
      PCT_WIDTH_CLASSES[0]
    );
  };

  const filteredFinances = useMemo(() => {
    let result = [...finances];

    if (filter !== "all") {
      result = result.filter((f) => f.type === filter);
    }

    if (clientFilter !== "all") {
      if (clientFilter === "" || clientFilter === "__NONE__") {
        result = result.filter((f) => !f.clientId);
      } else {
        result = result.filter((f) => f.clientId === clientFilter);
      }
    }

    if (dateFilter) {
      const [year, month] = dateFilter.split("-");
      result = result.filter((f) => {
        const date = new Date(f.date);
        return (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() + 1 === parseInt(month)
        );
      });
    }

    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [finances, filter, clientFilter, dateFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" variant="primary" />
          <p className="text-sm text-slate-500">Carregando finanças...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-x-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative space-y-6 sm:space-y-8 py-6 sm:py-8 lg:py-10 max-w-6xl mx-auto px-3 sm:px-4">
          {/* Premium Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 shadow-2xl shadow-emerald-500/30">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">
                  Financeiro
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Gestão completa de receitas e despesas da organização
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              size="default"
              className="gap-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 shrink-0 w-full sm:w-auto font-bold"
            >
              <Plus className="h-5 w-5" />
              Nova Transação
            </Button>
          </div>

          {/* Stats Cards Premium */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
            <Card className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-slate-900 via-emerald-50/30 to-green-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Receita Total
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {totals.incomeCount} transação{totals.incomeCount !== 1 ? "ões" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums wrap-break-word">
                  {formatCurrency(totals.income)}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
            </Card>

            <Card className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-slate-900 via-red-50/30 to-rose-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 shadow-lg shadow-red-500/30">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Despesas
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {totals.expenseCount} transação{totals.expenseCount !== 1 ? "ões" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 tabular-nums wrap-break-word">
                  {formatCurrency(totals.expense)}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl" />
            </Card>

            <Card className={`group relative overflow-visible rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 ${totals.balance >= 0 ? 'bg-gradient-to-br from-slate-900 via-blue-50/30 to-indigo-50/40' : 'bg-gradient-to-br from-slate-900 via-orange-50/30 to-red-50/40'} dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl ${totals.balance >= 0 ? 'hover:shadow-blue-500/20' : 'hover:shadow-orange-500/20'} transition-all duration-300`}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${totals.balance >= 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30' : 'bg-gradient-to-br from-orange-600 to-red-600 shadow-lg shadow-orange-500/30'}`}>
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Saldo
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {totals.balance >= 0 ? "✓ Positivo" : "⚠ Negativo"} • {totals.incomeCount + totals.expenseCount} total
                    </p>
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-black tabular-nums wrap-break-word ${totals.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(totals.balance)}
                </div>
              </div>
              <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${totals.balance >= 0 ? 'bg-gradient-to-br from-blue-400/20 to-indigo-400/20' : 'bg-gradient-to-br from-orange-400/20 to-red-400/20'}`} />
              <div className={`absolute bottom-0 left-0 w-full h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl ${totals.balance >= 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-orange-600 to-red-600'}`} />
            </Card>
          </div>

          {/* Top Categorias - Resumo Visual */}
          {categoryStats.length > 0 && (
            <Card className="rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/30">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Top 5 Categorias
                  </h3>
                </div>
                <div className="space-y-3">
                  {categoryStats.map((stat, index) => (
                    <div key={stat.category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                          <span className="text-xs font-bold text-slate-400 shrink-0">
                            #{index + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {stat.category}
                          </p>
                          <span className="text-xs text-slate-500 shrink-0">
                            ({stat.count})
                          </span>
                        </div>
                        <div
                          className={`text-sm font-bold shrink-0 ${stat.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          {stat.amount >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(stat.amount))}
                        </div>
                      </div>
                      <div className="h-2 bg-slate-900/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stat.amount >= 0
                            ? "bg-linear-to-r from-green-500 to-emerald-500"
                            : "bg-linear-to-r from-red-500 to-rose-500"
                            } ${getWidthClass(stat.amount, Math.max(...categoryStats.map((s) => Math.abs(s.amount))))}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}          {/* Parcelas deste mês */}
          {installments.length > 0 && (
            <Card className="rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/30">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Parcelas deste mês
                  </h3>
                </div>
                <div className="space-y-3">
                  {installments.map((i) => (
                    <div
                      key={i.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-2 rounded-lg hover:border-violet-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="text-sm font-medium text-slate-900">
                          {i.client.name}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                          Parcela {i.number}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="font-bold text-lg text-green-600 flex-1 sm:flex-initial">
                          {formatCurrency(i.amount)}
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 shrink-0"
                          onClick={() => confirmInstallment(i.id)}
                        >
                          Registrar pagamento
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    Filtros:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className="text-xs flex-1 sm:flex-initial"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filter === "INCOME" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("INCOME")}
                    className="text-xs gap-1 flex-1 sm:flex-initial"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    Receitas
                  </Button>
                  <Button
                    variant={filter === "EXPENSE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("EXPENSE")}
                    className="text-xs gap-1 flex-1 sm:flex-initial"
                  >
                    <ArrowDownCircle className="h-3 w-3" />
                    Despesas
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <Select
                    value={clientFilter || "__NONE__"}
                    onValueChange={(value) =>
                      setClientFilter(value === "__NONE__" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-48 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      <SelectItem value="__NONE__">Sem cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <Input
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 sm:w-40 h-8 text-xs"
                  />
                  {dateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateFilter("")}
                      className="h-8 px-2 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Transactions List */}
          <Card className="rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-6">
                Histórico de Transações
              </h3>
              {filteredFinances.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm mt-1">
                    {filter !== "all" || dateFilter || clientFilter !== "all"
                      ? "Tente ajustar os filtros"
                      : "Comece adicionando uma transação"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-x-hidden">
                  {filteredFinances.map((finance) => (
                    <div
                      key={finance.id}
                      className={`flex flex-col sm:flex-row items-start gap-3 p-3 sm:p-4 rounded-xl shadow-sm transition-all hover:shadow-md ${finance.type === "INCOME"
                        ? "bg-green-50/50"
                        : "bg-red-50/50"
                        }`}
                    >
                      <div className="flex items-start gap-3 flex-1 w-full min-w-0">
                        <div
                          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shrink-0 ${finance.type === "INCOME"
                            ? "bg-green-100"
                            : "bg-red-100"
                            }`}
                        >
                          {finance.type === "INCOME" ? (
                            <ArrowUpCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base wrap-break-word">
                              {finance.description || "Sem descrição"}
                            </h4>
                            {finance.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium shrink-0">
                                {finance.category}
                              </span>
                            )}
                            {finance.client && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1 shrink-0">
                                <Building2 className="h-3 w-3" />
                                {finance.client.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(finance.date)}
                          </p>
                          <div className="mt-2 sm:hidden">
                            <div
                              className={`text-xl font-bold ${finance.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                            >
                              {finance.type === "INCOME" ? "+" : "-"}
                              {formatCurrency(finance.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex text-right shrink-0 items-center">
                        <div
                          className={`text-xl sm:text-2xl font-bold ${finance.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {finance.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(finance.amount)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(finance)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-1 sm:flex-initial"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(finance.id)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <Card className="w-full max-w-lg shadow-2xl my-8">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl">
                      {editingItem ? "Editar Transação" : "Nova Transação"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            type: value as "INCOME" | "EXPENSE",
                            category: "",
                          })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">Receita</SelectItem>
                          <SelectItem value="EXPENSE">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        Valor <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        placeholder="0.00"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientId">Cliente (opcional)</Label>
                      <Select
                        value={formData.clientId || "__NONE__"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            clientId: value === "__NONE__" ? "" : value,
                          })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__NONE__">
                            Sem cliente específico
                          </SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category || "__NONE__"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category: value === "__NONE__" ? "" : value,
                          })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__NONE__">Selecione...</SelectItem>
                          {CATEGORIES[formData.type].map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Detalhes da transação"
                        rows={3}
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {submitting && (
                          <Spinner size="sm" className="mr-2" />
                        )}
                        {editingItem ? "Salvar" : "Criar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
