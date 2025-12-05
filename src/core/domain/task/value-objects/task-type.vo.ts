/**
 * Task Type Value Object
 * Representa os status e prioridades de tarefas
 */

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'A Fazer',
  [TaskStatus.IN_PROGRESS]: 'Em Progresso',
  [TaskStatus.REVIEW]: 'Em Revisão',
  [TaskStatus.DONE]: 'Concluída',
  [TaskStatus.CANCELLED]: 'Cancelada',
}

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Baixa',
  [TaskPriority.MEDIUM]: 'Média',
  [TaskPriority.HIGH]: 'Alta',
  [TaskPriority.URGENT]: 'Urgente',
}
