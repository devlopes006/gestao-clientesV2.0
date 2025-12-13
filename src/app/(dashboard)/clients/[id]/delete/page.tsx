"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import { can } from "@/lib/permissions";
import { AlertTriangle, ShieldX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ClientDeletePageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDeletePage({ params }: ClientDeletePageProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    // Buscar role do usuário
    fetch("/api/session", { credentials: 'include' }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      }
    });
  }, []);

  // Precisa ser async para unwrap params
  const handleDelete = async () => {
    const { id } = await params;

    if (confirmation !== "EXCLUIR") {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar API de exclusão
      console.log("Excluindo cliente:", id);

      // Simulação de delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/clients");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissão
  const canDelete = userRole ? can(userRole as "OWNER" | "STAFF" | "CLIENT", "delete", "client") : false;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-900">
        <div className="text-center">
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!canDelete) {
    return (
      <div className="max-w-2xl">
        <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldX className="h-5 w-5 text-red-400" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 mb-4">
              Você não tem permissão para excluir clientes. Apenas proprietários (OWNER) podem realizar esta ação.
            </p>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-slate-800 border border-slate-700/50 text-white hover:bg-slate-700"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto bg-slate-900 min-h-screen p-4 sm:p-6 rounded-2xl">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 shadow-lg text-center">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Zona de Perigo</h2>
        <p className="text-sm sm:text-base text-slate-200 mt-1">
          Ações irreversíveis que afetam permanentemente este cliente
        </p>
      </div>

      <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Excluir Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm sm:text-base text-slate-200">
            <p className="font-semibold text-slate-100">
              Esta ação NÃO pode ser desfeita. Será excluído permanentemente:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li className="text-slate-300">Todas as informações do cliente</li>
              <li className="text-slate-300">Tarefas associadas</li>
              <li className="text-slate-300">Mídias e arquivos</li>
              <li className="text-slate-300">Histórico financeiro</li>
              <li className="text-slate-300">Relatórios e documentos</li>
              <li className="text-slate-300">Reuniões agendadas</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-sm sm:text-base text-slate-200 mb-3">
              Para confirmar, digite <strong className="font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700/50 text-white">EXCLUIR</strong> no campo abaixo:
            </p>
            <Input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              className="mb-4 bg-slate-800 border border-slate-700/50 text-white placeholder:text-slate-300"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="bg-slate-800 border border-slate-700/50 text-white hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmation !== "EXCLUIR" || loading}
                className="bg-red-600 hover:bg-red-500 text-white gap-2 rounded-2xl"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? "Excluindo..." : "Excluir Permanentemente"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg">
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold text-white mb-2">Alternativas à exclusão:</h3>
          <ul className="text-sm sm:text-base text-slate-200 space-y-1">
            <li>• Alterar o status do cliente para "Encerrado" ou "Pausado"</li>
            <li>• Arquivar o cliente (funcionalidade futura)</li>
            <li>• Exportar dados antes de excluir</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
