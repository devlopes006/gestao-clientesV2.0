"use client";

import {
  activateMemberAction,
  cancelInviteAction,
  deactivateMemberAction,
  deleteInviteAction,
  inviteStaffAction,
  resendInviteAction,
} from "@/app/(app)/admin/members/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteMemberButton } from "@/features/admin/components/DeleteMemberButton";
import { UpdateRoleForm } from "@/features/admin/components/UpdateRoleForm";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Mail,
  RefreshCcw,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// 🔹 Mapas de papéis
type Role = "OWNER" | "STAFF" | "CLIENT";

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Proprietário",
  STAFF: "Equipe",
  CLIENT: "Cliente",
};

const ROLE_DESCRIPTION: Record<Role, string> = {
  OWNER: "Acesso total e gestão de permissões",
  STAFF: "Pode gerenciar clientes e tarefas",
  CLIENT: "Acesso restrito à própria área",
};

// 🔹 Fetch helpers (React Query)
// Generic JSON fetcher with typed response
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar: ${url}`);
  return res.json();
}

// 🔹 Tipagem do membro
type Member = {
  id: string;
  user_id: string | null;
  role: string | null;
  status: string | null;
  full_name?: string | null;
  email?: string | null;
  created_at: string | null;
  org_id?: string | null;
  last_active_at?: string | null;
  online?: boolean;
};

interface Invite {
  id: string;
  status: string;
  email: string;
  roleRequested: string;
  expiresAt: string;
  token: string;
  created_at?: string;
}

interface ApiList<T> {
  data: T;
}

// 🔹 Utilitário de data (usar util compartilhado via import)

// Disable static generation for this admin page
export const dynamic = 'force-dynamic';

function MembersAdminPage() {
  const queryClient = useQueryClient();
  const {
    data: membersData,
    error,
    isLoading,
  } = useQuery<ApiList<Member[]>>({
    queryKey: ["members"],
    queryFn: () => fetchJson<ApiList<Member[]>>("/api/members"),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const { data: invitesData } = useQuery<ApiList<Invite[]>>({
    queryKey: ["invites"],
    queryFn: () => fetchJson<ApiList<Invite[]>>("/api/invites"),
  });
  const { data: clientsData } = useQuery<ApiList<{ id: string; name: string }[]>>({
    queryKey: ["clients", "lite"],
    queryFn: () => fetchJson<ApiList<{ id: string; name: string }[]>>("/api/mobile/clients?page=1&limit=100"),
  });
  const [selectedRole, setSelectedRole] = useState<Role>("STAFF");
  const [selectedClient, setSelectedClient] = useState<string | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [showInvites, setShowInvites] = useState(false);

  // Avatar inicial do membro (primeira letra do nome/email)
  function getAvatarInitial(name?: string | null, email?: string | null) {
    const base = (name || email || "").trim();
    return base ? base.charAt(0).toUpperCase() : "?";
  }

  // Filtrar apenas convites não aceitos (PENDING, CANCELED, EXPIRED)
  const activeInvites =
    invitesData?.data?.filter(
      (invite: { status: string }) => invite.status !== "ACCEPTED",
    ) || [];

  // 🕒 Carregamento elegante
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground">
        <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4 animate-pulse">
          <Clock className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-lg font-semibold">Carregando informações...</p>
      </div>
    );

  // 🧨 Erro de carregamento
  if (error || !membersData?.data)
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        Erro ao carregar membros.
      </div>
    );

  const members: Member[] = membersData.data;
  const totalByRole = members.reduce<Record<Role, number>>(
    (acc, member) => {
      const role = (member.role as Role) || "CLIENT";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    },
    { OWNER: 0, STAFF: 0, CLIENT: 0 },
  );

  // 🔹 Envio de convites
  async function handleInvite(formData: FormData) {
    setSubmitting(true);
    try {
      const result = (await inviteStaffAction(formData)) as
        | { ok: true; reusedToken: boolean; emailSent: boolean }
        | undefined;

      if (result && "ok" in result) {
        if (result.reusedToken) {
          toast.success(
            result.emailSent
              ? "Convite pendente encontrado: e-mail reenviado!"
              : "Convite pendente encontrado: não foi possível reenviar e-mail",
          );
        } else {
          toast.success(
            result.emailSent
              ? "Convite criado e e-mail enviado!"
              : "Convite criado, mas não foi possível enviar e-mail",
          );
        }
      } else {
        toast.success("Convite processado.");
      }
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar convite.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      if (!window.confirm("Cancelar este convite?")) return;
      const fd = new FormData();
      fd.append("invite_id", inviteId);
      await cancelInviteAction(fd);
      toast.success("Convite cancelado");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cancelar convite");
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    try {
      if (!window.confirm("Excluir este convite permanentemente?")) return;
      const fd = new FormData();
      fd.append("invite_id", inviteId);
      await deleteInviteAction(fd);
      toast.success("Convite excluído");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir convite");
    }
  }

  async function handleResendInvite(inviteId: string) {
    try {
      setResendingId(inviteId);
      const fd = new FormData();
      fd.append("invite_id", inviteId);
      await resendInviteAction(fd);
      toast.success("Convite reenviado");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reenviar convite");
    } finally {
      setResendingId(null);
    }
  }

  async function toggleMemberActive(
    memberId: string,
    currentStatus: string | null,
  ) {
    try {
      const fd = new FormData();
      fd.append("member_id", memberId);
      if (currentStatus === "inactive") {
        await activateMemberAction(fd);
        toast.success("Membro ativado");
      } else {
        if (!window.confirm("Desativar este membro? Ele perderá o acesso."))
          return;
        await deactivateMemberAction(fd);
        toast.success("Membro desativado");
      }
      queryClient.invalidateQueries({ queryKey: ["members"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status");
    }
  }

  function RoleBadge({ role }: { role: Role }) {
    const styles =
      role === "OWNER"
        ? "bg-violet-50 text-violet-700 border-violet-200"
        : role === "STAFF"
          ? "bg-sky-50 text-sky-700 border-sky-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}
      >
        {ROLE_LABEL[role]}
      </span>
    );
  }

  function MemberStatusBadge({ status }: { status: string | null }) {
    const active = status !== "inactive";
    const styles = active
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-muted text-muted-foreground border-border";
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles}`}
      >
        {active ? "Ativo" : "Inativo"}
      </span>
    );
  }

  function OnlineIndicator({
    online,
    lastActive,
  }: {
    online?: boolean;
    lastActive?: string | null;
  }) {
    const ts = lastActive ? new Date(lastActive) : null;
    let label = "";
    if (online) {
      label = "Online";
    } else if (ts) {
      const diffMs = Date.now() - ts.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 60) label = `Visto há ${diffMin} min`;
      else {
        const diffHr = Math.round(diffMin / 60);
        label = `Visto há ${diffHr} h`;
      }
    } else {
      label = "Nunca visto";
    }
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${online ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-muted-foreground"}`}
        />
        {label}
      </span>
    );
  }

  // Componente reutilizável: Card de Convite + Formulário
  function InviteCard({
    responsiveClass,
    idSuffix,
  }: {
    responsiveClass: string;
    idSuffix: string;
  }) {
    const [emailError, setEmailError] = useState<string | null>(null);

    function onInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
      const form = e.currentTarget as HTMLFormElement;

      // Native HTML5 validation first
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }

      // Client-side schema validation (defense in depth)
      const fd = new FormData(form);
      const rawEmail = String(fd.get("email") || "").toLowerCase().trim();
      const emailSchema = z.string().email({ message: "Email inválido" });
      try {
        emailSchema.parse(rawEmail);
        setEmailError(null);
        // allow submission to continue
      } catch (err) {
        e.preventDefault();
        if (err instanceof z.ZodError) {
          setEmailError(err.issues?.[0]?.message || "Email inválido");
        } else {
          setEmailError("Email inválido");
        }
        return;
      }
    }
    return (
      <Card className={`rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/60 dark:to-slate-950/60 shadow-lg backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300 ${responsiveClass}`}>
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 md:px-7 py-5 md:py-6 bg-gradient-to-r from-indigo-50/60 via-purple-50/60 to-pink-50/60 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Convidar Membro
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Expanda sua equipe</p>
            </div>
          </div>
        </div>

        <form action={handleInvite} className="p-6 md:p-7 space-y-5" onSubmit={onInviteSubmit}>
          <input type="hidden" name="allow_resend_existing" value="true" />
          {/* persist selected role and client in form data for server action */}
          <input type="hidden" name="role" value={selectedRole} />
          <input type="hidden" name="client_id" value={selectedClient ?? ""} />
          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label
                htmlFor={`invite-email-${idSuffix}`}
                className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide"
              >
                E-mail
              </Label>
              <Input
                id={`invite-email-${idSuffix}`}
                name="email"
                type="email"
                required
                placeholder="contato@empresa.com"
                autoComplete="email"
                inputMode="email"
                className="h-12 border-slate-200/70 dark:border-slate-800/70 bg-slate-900 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-lg font-medium"
                isInvalid={!!emailError}
                error={emailError ?? undefined}
              />
              {emailError && (
                <p id={`invite-email-${idSuffix}-error`} className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor={`invite-role-${idSuffix}`}
                className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide"
              >
                Papel
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as Role);
                  setSelectedClient(undefined);
                }}
                defaultValue="STAFF"
              >
                <SelectTrigger id={`invite-role-${idSuffix}`} className="h-12 bg-slate-900 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-lg font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Equipe</SelectItem>
                  <SelectItem value="CLIENT">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "CLIENT" && (
              <div className="space-y-2.5">
                <Label
                  htmlFor={`invite-client-${idSuffix}`}
                  className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide"
                >
                  Cliente
                </Label>
                <Select
                  value={selectedClient ?? "__AUTO__"}
                  onValueChange={(value) =>
                    setSelectedClient(value === "__AUTO__" ? undefined : value)
                  }
                >
                  <SelectTrigger id={`invite-client-${idSuffix}`} className="h-12 bg-slate-900 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded-lg font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__AUTO__">Criar novo automaticamente</SelectItem>
                    {clientsData?.data?.map((client: { id: string; name: string }) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-5 border-t border-slate-200/50 dark:border-slate-800/50 mt-5">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 h-12 gap-2 shadow-lg hover:shadow-xl transition-all font-bold rounded-lg"
              aria-busy={submitting}
              aria-disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Enviar convite
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  function InviteStatusBadge({ status }: { status: string }) {
    const styles =
      status === "PENDING"
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : status === "ACCEPTED"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : status === "CANCELED"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-rose-50 text-rose-700 border-rose-200";
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles}`}
      >
        {status}
      </span>
    );
  }


  return (
    <div className="space-y-8">
      {/* Header Premium com Background Animado */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 border border-indigo-700/30 shadow-2xl">
        {/* Elementos de Fundo Decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-96 h-96 bg-gradient-to-l from-indigo-500/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>

        {/* Conteúdo do Header */}
        <div className="relative z-10 p-8 md:p-12 lg:p-16">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-4 max-w-3xl flex-1">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xl">
                  <Shield className="h-9 w-9 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                    Administração
                  </h1>
                  <p className="text-indigo-200/90 font-semibold text-sm md:text-base mt-2">
                    Painel de controle da organização
                  </p>
                </div>
              </div>
              <p className="text-lg text-indigo-100/80 font-medium leading-relaxed">
                Gerencie membros, permissões, convites e controle total da sua organização
              </p>
            </div>
            <div className="hidden lg:block text-right flex-shrink-0">
              <p className="text-indigo-300/70 text-xs font-bold uppercase tracking-widest mb-2">Total de membros</p>
              <div className="space-y-1">
                <p className="text-6xl font-black text-white">{members.length}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Estatísticas por Role */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
        {(["OWNER", "STAFF", "CLIENT"] as Role[]).map((roleKey) => {
          const Icon =
            roleKey === "OWNER" ? Shield : roleKey === "STAFF" ? Users : User;
          const count = totalByRole[roleKey];
          const colors = {
            OWNER: "from-violet-600 to-purple-700 shadow-violet-500/30",
            STAFF: "from-blue-600 to-cyan-700 shadow-blue-500/30",
            CLIENT: "from-emerald-600 to-green-700 shadow-emerald-500/30",
          };
          const bgColors = {
            OWNER: "hover:bg-violet-50/60 dark:hover:bg-violet-950/30 border-violet-200/40 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/40 to-purple-50/40 dark:from-violet-950/20 dark:to-purple-950/20",
            STAFF: "hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/40 to-cyan-50/40 dark:from-blue-950/20 dark:to-cyan-950/20",
            CLIENT: "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border-emerald-200/40 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/40 to-green-50/40 dark:from-emerald-950/20 dark:to-green-950/20",
          };
          return (
            <Card
              key={roleKey}
              className={`rounded-2xl border-2 p-6 md:p-7 transition-all duration-300 hover:shadow-xl cursor-default group ${bgColors[roleKey]}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {ROLE_LABEL[roleKey]}
                  </p>
                  <div className="space-y-1">
                    <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      {count}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2">
                      {ROLE_DESCRIPTION[roleKey]}
                    </p>
                  </div>
                </div>
                <div className={`p-4 md:p-5 rounded-2xl bg-gradient-to-br ${colors[roleKey]} shadow-lg transform group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                  <Icon className="h-8 md:h-9 w-8 md:w-9 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid - 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left Column - Members List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members Section */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  Membros da Equipe
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Gerencie as pessoas e seus acessos</p>
              </div>
              <Badge className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg flex-shrink-0">
                {members.length}
              </Badge>
            </div>

            {members.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed rounded-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">Nenhum membro adicionado</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Comece convidando membros usando o formulário à direita</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 md:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-900/60 dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 hover:border-slate-300/70 dark:hover:border-slate-700/70 hover:shadow-md transition-all duration-200 group backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                        {getAvatarInitial(m.full_name, m.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {m.full_name || m.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end ml-3">
                      <div className="hidden sm:flex items-center gap-2 flex-wrap">
                        <RoleBadge role={(m.role as Role) || "CLIENT"} />
                        <MemberStatusBadge status={m.status} />
                        <OnlineIndicator online={m.online} lastActive={m.last_active_at} />
                      </div>

                      <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                        <UpdateRoleForm
                          memberId={m.id}
                          currentRole={m.role || "CLIENT"}
                          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["members"] })}
                        />
                        <Button
                          size="sm"
                          variant={m.status === "inactive" ? "default" : "outline"}
                          onClick={() => toggleMemberActive(m.id, m.status)}
                          className="rounded-lg h-9 text-xs md:text-sm"
                        >
                          {m.status === "inactive" ? "Ativar" : "Desativar"}
                        </Button>
                        {m.role !== "OWNER" && (
                          <DeleteMemberButton
                            memberId={m.id}
                            displayName={m.full_name || m.email || "Usuário"}
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["members"] })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invites Section */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                  Convites Pendentes
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acompanhe os convites enviados aos membros</p>
              </div>
              <Badge className="rounded-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg shadow-lg">
                {activeInvites.length}
              </Badge>
            </div>

            {activeInvites.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed rounded-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Mail className="h-10 w-10 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-lg">Nenhum convite pendente</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Convites aceitos serão movidos para membros</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 md:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-900 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 hover:border-slate-300/70 dark:hover:border-slate-700/70 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {invite.email}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-5.5">
                        Expira em {formatDate(invite.expiresAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end ml-3">
                      <RoleBadge role={(invite.roleRequested as Role) || "CLIENT"} />
                      <InviteStatusBadge status={invite.status} />

                      {invite.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(invite.id)}
                            disabled={resendingId === invite.id}
                            className="rounded-lg h-9 gap-1.5"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            {resendingId === invite.id ? "Reenviando..." : "Reenviar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvite(invite.id)}
                            className="rounded-lg h-9 gap-1.5"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="rounded-lg h-9"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Invite Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <InviteCard responsiveClass="" idSuffix="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-600 dark:text-slate-400">Carregando membros...</div></div>}>
      <MembersAdminPage />
    </Suspense>
  );
}
