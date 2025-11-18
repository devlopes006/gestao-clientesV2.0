"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Lightbulb,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Strategy {
  id: string;
  title: string;
  description?: string;
  type: "objective" | "action-plan" | "target-audience" | "kpi";
  content: string;
  createdAt: Date;
}

interface StrategyManagerProps {
  clientId: string;
  initialStrategies?: Strategy[];
}

export function StrategyManager({
  clientId,
  initialStrategies = [],
}: StrategyManagerProps) {
  // Ajuda/contexto para cada tipo
  const typeHelp: Record<Strategy["type"], { title: string; description: string; content: string }> = {
    objective: {
      title: "Ex: Aumentar engajamento em 50%",
      description: "Descreva o objetivo principal, de forma clara e mensurável.",
      content: "Detalhe como o objetivo será alcançado, quais métricas serão usadas para medir o sucesso e o prazo esperado.",
    },
    "action-plan": {
      title: "Ex: Realizar campanha de marketing digital",
      description: "Descreva o plano de ação, etapas e responsáveis.",
      content: "Liste as ações, prazos, recursos necessários e responsáveis por cada etapa.",
    },
    "target-audience": {
      title: "Ex: Jovens de 18 a 25 anos, universitários",
      description: "Defina o público-alvo, perfil e necessidades.",
      content: "Detalhe características, comportamentos, dores e desejos do público que será impactado.",
    },
    kpi: {
      title: "Ex: Taxa de conversão acima de 10%",
      description: "Defina o indicador-chave de desempenho (KPI).",
      content: "Descreva a métrica, como será medida, meta numérica e frequência de acompanhamento.",
    },
  };
  // `clientId` is reserved for future use (keeps API consistent)
  void clientId;
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [modalType, setModalType] = useState<Strategy["type"] | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "objective" as Strategy["type"],
    content: "",
  });

  const parseStrategy = (s: Record<string, unknown>): Strategy => ({
    id: s.id as string,
    title: s.title as string,
    description: s.description as string | undefined,
    type: s.type as Strategy["type"],
    content: s.content as string,
    createdAt: new Date(s.createdAt as string),
  });

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/strategy`, {
        method: "GET",
      });
      if (!res.ok) throw new Error("Falha ao carregar estratégias");
      const data = await res.json();
      setStrategies(Array.isArray(data) ? data.map(parseStrategy) : []);
    } catch (e) {
      console.error(e);
      setShowToast("Erro ao carregar estratégias");
      setTimeout(() => setShowToast(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const resetForm = (type?: Strategy["type"]) => {
    setFormData({
      title: "",
      description: "",
      type: type || "objective",
      content: "",
    });
    setEditingStrategy(null);
    setModalType(type || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStrategy) {
        const res = await fetch(`/api/clients/${clientId}/strategy?id=${editingStrategy.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description || undefined,
              type: formData.type,
              content: formData.content,
            }),
          },
        );
        if (!res.ok) throw new Error("Falha ao atualizar estratégia");
        const updated = parseStrategy(await res.json());
        setStrategies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setShowToast("Estratégia atualizada!");
      } else {
        const res = await fetch(`/api/clients/${clientId}/strategy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || undefined,
            type: formData.type,
            content: formData.content,
          }),
        });
        if (!res.ok) {
          let msg = "Falha ao criar estratégia";
          try {
            const err = await res.json();
            msg = err?.error || msg;
          } catch { }
          throw new Error(msg);
        }
        const created = parseStrategy(await res.json());
        setStrategies((prev) => [created, ...prev]);
        setShowToast("Estratégia adicionada!");
      }
      setIsModalOpen(false);
      resetForm(modalType || undefined);
      setTimeout(() => setShowToast(null), 2000);
    } catch (err) {
      console.error(err);
      setShowToast(editingStrategy ? "Erro ao atualizar" : "Erro ao criar");
      setTimeout(() => setShowToast(null), 2000);
    }
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      title: strategy.title,
      description: strategy.description || "",
      type: strategy.type,
      content: strategy.content,
    });
    setModalType(strategy.type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta estratégia?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/strategy?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao deletar estratégia");
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      setShowToast("Estratégia removida!");
      setTimeout(() => setShowToast(null), 2000);
    } catch (err) {
      console.error(err);
      setShowToast("Erro ao deletar estratégia");
      setTimeout(() => setShowToast(null), 2000);
    }
  };

  const getIconForType = (type: Strategy["type"]) => {
    switch (type) {
      case "objective":
        return <Lightbulb className="h-5 w-5" />;
      case "action-plan":
        return <Target className="h-5 w-5" />;
      case "target-audience":
        return <Users className="h-5 w-5" />;
      case "kpi":
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getTitleForType = (type: Strategy["type"]) => {
    switch (type) {
      case "objective":
        return "Objetivos";
      case "action-plan":
        return "Plano de Ação";
      case "target-audience":
        return "Público-Alvo";
      case "kpi":
        return "Indicadores (KPIs)";
    }
  };

  const getStrategiesByType = (type: Strategy["type"]) => {
    return strategies.filter((s) => s.type === type);
  };

  return (
    <>
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Estratégia
              </h1>
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium pl-[52px]">
              Planejamento estratégico e objetivos do cliente
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {([
              "objective",
              "action-plan",
              "target-audience",
              "kpi",
            ] as Strategy["type"][]).map((type) => {
              const typeStrategies = getStrategiesByType(type);
              return (
                <div
                  key={type}
                  className="relative group rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-0 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute top-0 right-0 m-5">
                    <Button
                      size="lg"
                      className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 transition-transform font-semibold"
                      onClick={() => {
                        resetForm(type);
                        setIsModalOpen(true);
                        setModalType(type);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-col items-center justify-center pt-12 pb-6 px-6">
                    <div className="mb-5">
                      <span className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-500 p-3.5 shadow-lg text-white">
                        {getIconForType(type) && <span className="[&>svg]:h-6 [&>svg]:w-6">{getIconForType(type)}</span>}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      {getTitleForType(type)}
                    </h3>
                    <div className="w-full">
                      {loading ? (
                        <div className="text-center py-10 text-slate-500">
                          <p className="text-sm font-medium">Carregando...</p>
                        </div>
                      ) : typeStrategies.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                          <p className="text-sm font-medium">Nenhum item cadastrado</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {typeStrategies.map((strategy) => (
                            <div
                              key={strategy.id}
                              className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                    {strategy.title}
                                  </h4>
                                  {strategy.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                                      {strategy.description}
                                    </p>
                                  )}
                                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-2.5 line-clamp-2">
                                    {strategy.content}
                                  </p>
                                </div>
                                <div className="flex gap-1.5">
                                  <Button
                                    size="lg"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 hover:bg-blue-100 hover:scale-110 transition-transform"
                                    onClick={() => handleEdit(strategy)}
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="lg"
                                    className="h-9 w-9 p-0 hover:bg-red-100 hover:scale-110 transition-transform"
                                    variant="ghost"
                                    onClick={() => handleDelete(strategy.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast feedback */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl font-semibold animate-fade-in">
          {showToast}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-auto m-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-0">
              {/* Header with gradient */}
              <div className="flex items-center justify-between p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-linear-to-r from-blue-500 to-purple-500">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    {editingStrategy
                      ? "Editar Estratégia"
                      : modalType
                        ? `Nova ${getTitleForType(modalType)}`
                        : "Nova Estratégia"}
                  </h2>
                  <p className="text-sm text-white/90 mt-1.5 font-medium">
                    Adicione objetivos, planos de ação, definição de público-alvo ou KPIs
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-semibold text-slate-900 dark:text-white">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as Strategy["type"],
                      })
                    }
                    disabled={!!modalType}
                  >
                    <SelectTrigger className="border-2 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="objective">Objetivo</SelectItem>
                      <SelectItem value="action-plan">Plano de Ação</SelectItem>
                      <SelectItem value="target-audience">Público-Alvo</SelectItem>
                      <SelectItem value="kpi">KPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold text-slate-900 dark:text-white">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder={typeHelp[formData.type].title}
                    className="border-2 h-11"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1.5">{typeHelp[formData.type].description}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold text-slate-900 dark:text-white">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Breve descrição complementar"
                    className="border-2 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="font-semibold text-slate-900 dark:text-white">Conteúdo Detalhado</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    rows={6}
                    placeholder={typeHelp[formData.type].content}
                    className="border-2 resize-none"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1.5">{typeHelp[formData.type].content}</p>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="border-2 font-semibold"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 font-semibold"
                  >
                    {editingStrategy ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
