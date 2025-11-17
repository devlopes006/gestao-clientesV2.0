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
import { useState } from "react";

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "objective" as Strategy["type"],
    content: "",
  });

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

    if (editingStrategy) {
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === editingStrategy.id
            ? { ...s, ...formData, createdAt: s.createdAt }
            : s,
        ),
      );
      setShowToast("Estratégia atualizada!");
    } else {
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setStrategies((prev) => [newStrategy, ...prev]);
      setShowToast("Estratégia adicionada!");
    }

    setIsModalOpen(false);
    resetForm(modalType || undefined);
    setTimeout(() => setShowToast(null), 2000);
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

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta estratégia?")) {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      setShowToast("Estratégia removida!");
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
      <div className="relative bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        <div className="relative space-y-6 p-6">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-700 via-purple-600 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
              Estratégia
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Planejamento estratégico e objetivos
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
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
                  className="relative group rounded-3xl shadow-2xl border-0 bg-linear-to-br from-blue-50 via-purple-50 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 p-0 overflow-hidden transition-transform hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 m-4">
                    <Button
                      size="sm"
                      className="gap-1 bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105"
                      onClick={() => {
                        resetForm(type);
                        setIsModalOpen(true);
                        setModalType(type);
                      }}
                    >
                      <Plus className="h-5 w-5" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-col items-center justify-center pt-10 pb-6 px-8">
                    <div className="mb-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 p-4 shadow-lg">
                        {getIconForType(type)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-700 via-purple-600 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 mb-2">
                      {getTitleForType(type)}
                    </h3>
                    <div className="w-full">
                      {typeStrategies.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <p className="text-base">Nenhum item cadastrado</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {typeStrategies.map((strategy) => (
                            <div
                              key={strategy.id}
                              className="p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white truncate">
                                    {strategy.title}
                                  </h4>
                                  {strategy.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      {strategy.description}
                                    </p>
                                  )}
                                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 line-clamp-2">
                                    {strategy.content}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(strategy)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(strategy.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

        {/* Toast feedback */}
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg animate-fade-in">
            {showToast}
          </div>
        )}

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {editingStrategy
                        ? "Editar Estratégia"
                        : modalType
                          ? `Nova ${getTitleForType(modalType)}`
                          : "Nova Estratégia"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Adicione objetivos, planos de ação, definição de
                      público-alvo ou KPIs.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
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
                      <SelectTrigger>
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
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      placeholder={typeHelp[formData.type].title}
                    />
                    <p className="text-xs text-slate-500 mt-1">{typeHelp[formData.type].description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo Detalhado</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      required
                      rows={6}
                      placeholder={typeHelp[formData.type].content}
                    />
                    <p className="text-xs text-slate-500 mt-1">{typeHelp[formData.type].content}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                      {editingStrategy ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
