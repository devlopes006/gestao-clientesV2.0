"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput, parseDateInput } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  Filter,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Finance {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  category?: string | null;
  date: Date | string;
  createdAt: Date | string;
}

interface FinanceManagerProps {
  clientId: string;
}

const CATEGORIES = {
  income: ["Pagamento", "Bônus", "Reembolso", "Outro"],
  expense: ["Anúncios", "Ferramentas", "Freelancer", "Hospedagem", "Outro"],
};

export function FinanceManagerV2({ clientId }: FinanceManagerProps) {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Finance | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [formData, setFormData] = useState({
    type: "income" as Finance["type"],
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const loadFinances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/finance`);
      if (!res.ok) throw new Error("Falha ao carregar finanças");
      const data = await res.json();
      setFinances(data || []);
    } catch {
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Load finances on mount / when clientId changes
  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      description: "",
      category: "",
      date: formatDateInput(new Date()),
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

    try {
      const dateToSave = parseDateInput(formData.date).toISOString();

      if (editingItem) {
        const res = await fetch(
          `/api/clients/${clientId}/finance?id=${editingItem.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: formData.type,
              amount,
              description: formData.description,
              category: formData.category,
              date: dateToSave,
            }),
          },
        );

        if (!res.ok) throw new Error("Falha ao atualizar transação");
        const updated = await res.json();
        setFinances((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item)),
        );
        toast.success("Transação atualizada!");
      } else {
        const res = await fetch(`/api/clients/${clientId}/finance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: formData.type,
            amount,
            description: formData.description,
            category: formData.category,
            date: dateToSave,
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
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta transação?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/finance?id=${id}`, {
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
      .filter((f) => f.type === "income")
      .reduce((sum, f) => sum + f.amount, 0);

    const expense = finances
      .filter((f) => f.type === "expense")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [finances]);

  const filteredFinances = useMemo(() => {
    let result = [...finances];

    if (filter !== "all") {
      result = result.filter((f) => f.type === filter);
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
  }, [finances, filter, dateFilter]);

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
          <p className="text-sm text-muted-foreground">
            Carregando finanças...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Gestão Financeira
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Controle completo de receitas e despesas
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              size="lg"
              className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </header>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 border-green-200/60 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Receita Total
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totals.income)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                  Total de entradas
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-red-200/60 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Despesas
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totals.expense)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                  Total de saídas
                </p>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${totals.balance >= 0
                ? "border-blue-200/60"
                : "border-orange-200/60"
                }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Saldo
                </CardTitle>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md ${totals.balance >= 0 ? "bg-linear-to-br from-blue-500 to-purple-500" : "bg-linear-to-br from-orange-500 to-red-500"
                    }`}
                >
                  <DollarSign
                    className="h-6 w-6 text-white"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${totals.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                    }`}
                >
                  {formatCurrency(totals.balance)}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                  {totals.balance >= 0 ? "Balanço positivo" : "Balanço negativo"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-2 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-slate-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Filtros:
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setFilter("all")}
                    className="text-xs font-semibold border-2"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filter === "income" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setFilter("income")}
                    className="text-xs gap-1.5 font-semibold border-2"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    Receitas
                  </Button>
                  <Button
                    variant={filter === "expense" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setFilter("expense")}
                    className="text-xs gap-1.5 font-semibold border-2"
                  >
                    <ArrowDownCircle className="h-3 w-3" />
                    Despesas
                  </Button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <Input
                    type="month"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40 h-10 text-xs border-2 font-medium"
                  />
                  {dateFilter && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setDateFilter("")}
                      className="h-10 w-10 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="border-2 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-linear-to-br from-slate-600 to-slate-700 rounded-xl shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="font-bold">Histórico de Transações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFinances.length === 0 ? (
                <div className="text-center py-14">
                  <div className="p-5 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full mb-5 shadow-inner inline-flex">
                    <DollarSign className="h-12 w-12 text-slate-500" />
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">Nenhuma transação encontrada</p>
                  <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 font-medium">
                    {filter !== "all" || dateFilter
                      ? "Tente ajustar os filtros"
                      : "Comece adicionando uma transação"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFinances.map((finance) => (
                    <div
                      key={finance.id}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${finance.type === "income"
                        ? "border-green-200 bg-green-50/50 dark:bg-green-950/20 hover:border-green-400"
                        : "border-red-200 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400"
                        }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-md ${finance.type === "income"
                            ? "bg-linear-to-br from-green-500 to-emerald-500"
                            : "bg-linear-to-br from-red-500 to-rose-500"
                            }`}
                        >
                          {finance.type === "income" ? (
                            <ArrowUpCircle className="h-7 w-7 text-white" />
                          ) : (
                            <ArrowDownCircle className="h-7 w-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">
                              {finance.description || "Sem descrição"}
                            </h4>
                            {finance.category && (
                              <span className="text-xs px-3 py-1 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                                {finance.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1.5">
                            {formatDate(finance.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${finance.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}
                          >
                            {finance.type === "income" ? "+" : "-"}
                            {formatCurrency(finance.amount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => handleEdit(finance)}
                          className="h-10 w-10 p-0 hover:bg-blue-100 dark:hover:bg-blue-950 hover:scale-110 transition-transform"
                        >
                          <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => handleDelete(finance.id)}
                          className="h-10 w-10 p-0 hover:bg-red-100 dark:hover:bg-red-950 hover:scale-110 transition-transform"
                        >
                          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              <Card className="w-full max-w-lg bg-card border-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <CardHeader className="border-b-2 border-slate-200 dark:border-slate-700 bg-linear-to-r from-emerald-500 to-teal-500 pb-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-bold flex items-center gap-2">
                      <DollarSign className="h-6 w-6" />
                      {editingItem ? "Editar Transação" : "Nova Transação"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="font-semibold text-slate-900 dark:text-white">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            type: value as "income" | "expense",
                            category: "",
                          })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger className="border-2 h-11 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Valor <span className="text-red-500">*</span>
                        </span>
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
                        className="border-2 h-11 font-medium"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="font-semibold text-slate-900 dark:text-white">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger className="border-2 h-11 font-medium">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES[formData.type].map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-semibold text-slate-900 dark:text-white">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Detalhes da transação"
                        rows={3}
                        className="border-2 resize-none font-medium"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date" className="font-semibold text-slate-900 dark:text-white">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="border-2 h-11 font-medium"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                      <Button
                        type="submit"
                        disabled={submitting}
                        size="lg"
                        className="flex-1 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold"
                      >
                        {submitting && (
                          <Spinner size="sm" />
                        )}
                        {editingItem ? "Salvar" : "Criar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="border-2 font-semibold"
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