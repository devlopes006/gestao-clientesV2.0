"use client";

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContractManagerProps {
  clientId: string;
  clientName: string;
  contractStart?: string | null;
  contractEnd?: string | null;
  paymentDay?: number | null;
  contractValue?: number | null;
  paymentStatus?: string;
}

export default function ContractManager({
  clientId,
  clientName,
  contractStart,
  contractEnd,
  paymentDay,
  contractValue,
  paymentStatus = "PENDING",
}: ContractManagerProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(paymentStatus);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Não definido";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentStatusColor = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return "text-green-600 dark:text-green-400";
      case "LATE":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getPaymentStatusIcon = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "LATE":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getPaymentStatusText = () => {
    switch (currentStatus) {
      case "CONFIRMED":
        return "Pago";
      case "LATE":
        return "Atrasado";
      default:
        return "Pendente";
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm(`Confirmar pagamento de ${clientName}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/clients/${clientId}/payments/confirm`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao confirmar pagamento");
      }

      setCurrentStatus("CONFIRMED");
      toast.success("Pagamento confirmado com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao confirmar pagamento",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if contract is active
  const isContractActive = () => {
    if (!contractStart) return false;
    const now = new Date();
    const start = new Date(contractStart);
    if (now < start) return false;
    if (contractEnd) {
      const end = new Date(contractEnd);
      if (now > end) return false;
    }
    return true;
  };

  const getDaysUntilPayment = () => {
    if (!paymentDay) return null;
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay <= paymentDay) {
      return paymentDay - currentDay;
    }
    // Next month
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      paymentDay,
    );
    const diff = Math.ceil(
      (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const daysUntilPayment = getDaysUntilPayment();

  return (
    <div className="space-y-6">
      {/* Informações do Contrato */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <span className="text-base font-semibold text-blue-700">Informações do Contrato</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Início</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatDate(contractStart)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Término</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{contractEnd ? formatDate(contractEnd) : "Indeterminado"}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <DollarSign className="w-4 h-4" />
              <span>Valor Mensal</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(contractValue)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Dia de Pagamento</span>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{paymentDay ? `Dia ${paymentDay}` : "Não definido"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Status do Contrato</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isContractActive() ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>{isContractActive() ? "Ativo" : "Inativo"}</span>
        </div>
      </div>

      {/* Pagamento do Mês Atual */}
      {isContractActive() && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-base font-semibold text-green-700">Pagamento do Mês Atual</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${getPaymentStatusColor()}`}>{getPaymentStatusIcon()}</div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{getPaymentStatusText()}</p>
                {daysUntilPayment !== null && currentStatus === "PENDING" && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {daysUntilPayment === 0
                      ? "Vence hoje"
                      : daysUntilPayment > 0
                        ? `Vence em ${daysUntilPayment} ${daysUntilPayment === 1 ? "dia" : "dias"}`
                        : `Atrasado ${Math.abs(daysUntilPayment)} ${Math.abs(daysUntilPayment) === 1 ? "dia" : "dias"}`}
                  </p>
                )}
              </div>
            </div>
            {currentStatus === "PENDING" && (
              <Button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow"
              >
                {loading ? "Confirmando..." : "Confirmar Pagamento"}
              </Button>
            )}
            {currentStatus === "CONFIRMED" && (
              <div className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Pago ✓</div>
            )}
          </div>
        </div>
      )}

      {/* Aviso de contrato não cadastrado */}
      {!contractStart && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">Nenhuma informação de contrato cadastrada. Edite o cliente para adicionar informações de contrato.</p>
        </div>
      )}
    </div>
  );
}
