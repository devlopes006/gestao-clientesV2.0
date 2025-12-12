'use client';

import {
  ClientKPICard,
  ClientNavigationTabs,
  ClientPageLayout,
  ClientSectionCard,
  FinanceCard,
  MeetingItem,
  TaskItem,
} from '@/components/clients';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FolderKanban,
  Image,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Example: Client Detail Page with New Component System
 * 
 * This is a reference implementation showing how to use the new client components.
 * Copy and adapt this structure for actual pages.
 */

export default function ClientDetailPageExample() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const client = {
    id: '123',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+55 11 99999-9999',
    status: 'active' as const,
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Zap },
    { id: 'tasks', label: 'Tarefas', icon: FolderKanban },
    { id: 'meetings', label: 'Reuniões', icon: Calendar },
    { id: 'finance', label: 'Finanças', icon: DollarSign },
    { id: 'media', label: 'Mídia', icon: Image },
  ];

  const mockTasks = [
    {
      id: '1',
      title: 'Implementar Dashboard',
      description: 'Criar dashboard com KPIs principais',
      status: 'pending' as const,
      dueDate: '2025-12-15',
      assignee: 'João Silva',
      priority: 'high' as const,
    },
    {
      id: '2',
      title: 'Revisar Contrato',
      description: 'Revisar documentação do contrato',
      status: 'completed' as const,
      dueDate: '2025-12-10',
      assignee: 'Maria Santos',
      priority: 'medium' as const,
    },
    {
      id: '3',
      title: 'Atualizar Branding',
      status: 'overdue' as const,
      dueDate: '2025-12-05',
      assignee: 'Carlos Oliveira',
      priority: 'high' as const,
    },
  ];

  const mockMeetings = [
    {
      id: '1',
      title: 'Reunião Estratégica',
      date: '15/12/2025',
      time: '14:00',
      duration: '1h 30min',
      attendees: ['João Silva', 'Maria Santos'],
      location: 'Sala de Conferência A',
      type: 'in-person' as const,
      status: 'scheduled' as const,
    },
    {
      id: '2',
      title: 'Apresentação de Resultados',
      date: '12/12/2025',
      time: '10:00',
      duration: '1h',
      attendees: ['Todos'],
      type: 'video' as const,
      status: 'scheduled' as const,
    },
    {
      id: '3',
      title: 'Reunião com Stakeholders',
      date: '08/12/2025',
      time: '16:00',
      type: 'video' as const,
      status: 'completed' as const,
    },
  ];

  return (
    <ClientPageLayout>
      {/* KPI Cards - Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <ClientKPICard
          icon={CheckCircle2}
          label="Taxa de Conclusão"
          value="68%"
          color="green"
          trend="up"
          trendValue="+5% vs mês anterior"
        />
        <ClientKPICard
          icon={FolderKanban}
          label="Tarefas Ativas"
          value="12"
          color="blue"
          trend="down"
          trendValue="-3 completadas"
        />
        <ClientKPICard
          icon={Calendar}
          label="Reuniões Próximas"
          value="3"
          color="amber"
        />
        <ClientKPICard
          icon={Image}
          label="Ativos Digitais"
          value="24"
          color="purple"
          trend="up"
          trendValue="+8 novos"
        />
      </div>

      {/* Navigation Tabs */}
      <ClientNavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Client Info Section */}
          <ClientSectionCard title="Informações do Cliente" icon={Users}>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
                    Nome
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-slate-50 mt-1">
                    {client.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-slate-50 mt-1">
                    {client.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
                    Telefone
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-slate-50 mt-1">
                    {client.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider">
                    Status
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-emerald-300 mt-1">
                    Ativo
                  </p>
                </div>
              </div>
            </div>
          </ClientSectionCard>

          {/* Quick Stats */}
          <ClientSectionCard title="Estatísticas Rápidas" icon={Zap}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <FinanceCard
                type="income"
                label="Receita Mensal"
                amount="12500"
                currency="R$"
                trend="up"
                trendValue="+15%"
              />
              <FinanceCard
                type="expense"
                label="Gastos Mensais"
                amount="4200"
                currency="R$"
                trend="down"
                trendValue="-5%"
              />
              <FinanceCard
                type="balance"
                label="Saldo Atual"
                amount="8300"
                currency="R$"
                trend="up"
                trendValue="+20%"
              />
            </div>
          </ClientSectionCard>
        </>
      )}

      {activeTab === 'tasks' && (
        <ClientSectionCard title="Tarefas" icon={FolderKanban}>
          <div className="space-y-2 sm:space-y-3">
            {mockTasks.map((task) => (
              <TaskItem
                key={task.id}
                {...task}
                onClick={() => console.log('Abrir tarefa:', task.id)}
              />
            ))}
          </div>
        </ClientSectionCard>
      )}

      {activeTab === 'meetings' && (
        <ClientSectionCard title="Reuniões" icon={Calendar}>
          <div className="space-y-2 sm:space-y-3">
            {mockMeetings.map((meeting) => (
              <MeetingItem
                key={meeting.id}
                {...meeting}
                onClick={() => console.log('Abrir reunião:', meeting.id)}
              />
            ))}
          </div>
        </ClientSectionCard>
      )}

      {activeTab === 'finance' && (
        <ClientSectionCard title="Finanças" icon={DollarSign}>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <FinanceCard
                type="income"
                label="Total de Receitas"
                amount="45800"
                currency="R$"
                description="Últimos 3 meses"
                trend="up"
                trendValue="+12%"
              />
              <FinanceCard
                type="expense"
                label="Total de Despesas"
                amount="28400"
                currency="R$"
                description="Últimos 3 meses"
                trend="down"
                trendValue="-8%"
              />
              <FinanceCard
                type="balance"
                label="Balanço Final"
                amount="17400"
                currency="R$"
                description="Últimos 3 meses"
                trend="up"
                trendValue="+22%"
              />
            </div>
            <ClientSectionCard title="Previsão" icon={Zap}>
              <div className="space-y-3 sm:space-y-4">
                <FinanceCard
                  type="forecast"
                  label="Receita Projetada (Dez)"
                  amount="15200"
                  currency="R$"
                  period="Dezembro 2025"
                />
                <FinanceCard
                  type="forecast"
                  label="Despesa Projetada (Dez)"
                  amount="9800"
                  currency="R$"
                  period="Dezembro 2025"
                />
              </div>
            </ClientSectionCard>
          </div>
        </ClientSectionCard>
      )}

      {activeTab === 'media' && (
        <ClientSectionCard title="Mídia" icon={Image}>
          <div className="text-slate-300 text-sm">
            <p>Nenhum arquivo de mídia adicionado ainda.</p>
            <p className="text-slate-400 text-xs mt-2">
              Envie imagens, vídeos ou documentos para manter tudo organizado.
            </p>
          </div>
        </ClientSectionCard>
      )}
    </ClientPageLayout>
  );
}
