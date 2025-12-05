import { TaskPriority, TaskStatus } from '../value-objects/task-type.vo'

/**
 * Task Entity
 * Representa uma tarefa relacionada a um cliente ou organização
 *
 * Regras de Negócio:
 * - Tarefas canceladas não podem ser reabertas
 * - Apenas tarefas em revisão podem ser concluídas
 * - Prioridade não pode ser vazia
 * - Data de vencimento pode ser vazia (sem prazo)
 */

export interface TaskProps {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  clientId?: string | null
  orgId: string
  assignee?: string | null
  dueDate?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string | null
  updatedBy?: string | null
  deletedBy?: string | null
}

export class Task {
  private constructor(private props: TaskProps) {
    this.validateInvariant()
  }

  // ============ Getters ============

  get id(): string {
    return this.props.id
  }

  get title(): string {
    return this.props.title
  }

  get description(): string | null {
    return this.props.description ?? null
  }

  get status(): TaskStatus {
    return this.props.status
  }

  get priority(): TaskPriority {
    return this.props.priority
  }

  get clientId(): string | null {
    return this.props.clientId ?? null
  }

  get orgId(): string {
    return this.props.orgId
  }

  get assignee(): string | null {
    return this.props.assignee ?? null
  }

  get dueDate(): Date | null {
    return this.props.dueDate ?? null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null
  }

  get createdBy(): string | null {
    return this.props.createdBy ?? null
  }

  get updatedBy(): string | null {
    return this.props.updatedBy ?? null
  }

  get deletedBy(): string | null {
    return this.props.deletedBy ?? null
  }

  // ============ Factory Methods ============

  /**
   * Cria uma nova tarefa
   */
  static create(props: {
    title: string
    orgId: string
    priority: TaskPriority
    description?: string
    clientId?: string
    assignee?: string
    dueDate?: Date
    createdBy?: string
  }): Task {
    return new Task({
      id: '', // Será gerado pelo repositório
      title: props.title,
      description: props.description,
      status: TaskStatus.TODO,
      priority: props.priority,
      clientId: props.clientId,
      orgId: props.orgId,
      assignee: props.assignee,
      dueDate: props.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: props.createdBy,
      updatedBy: null,
      deletedBy: null,
    })
  }

  /**
   * Restaura uma tarefa existente do banco
   */
  static restore(props: TaskProps): Task {
    return new Task(props)
  }

  // ============ Business Logic ============

  /**
   * Muda para "Em Progresso"
   */
  startProgress(): void {
    if (this.props.status === TaskStatus.CANCELLED) {
      throw new Error('Tarefa cancelada não pode ser iniciada')
    }

    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser reaberta')
    }

    this.props.status = TaskStatus.IN_PROGRESS
    this.props.updatedAt = new Date()
  }

  /**
   * Muda para "Em Revisão"
   */
  moveToReview(): void {
    if (this.props.status === TaskStatus.CANCELLED) {
      throw new Error('Tarefa cancelada não pode ser revisada')
    }

    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser movida para revisão')
    }

    this.props.status = TaskStatus.REVIEW
    this.props.updatedAt = new Date()
  }

  /**
   * Conclui a tarefa
   */
  complete(): void {
    if (this.props.status === TaskStatus.CANCELLED) {
      throw new Error('Tarefa cancelada não pode ser concluída')
    }

    this.props.status = TaskStatus.DONE
    this.props.updatedAt = new Date()
  }

  /**
   * Cancela a tarefa
   */
  cancel(): void {
    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser cancelada')
    }

    this.props.status = TaskStatus.CANCELLED
    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza a prioridade
   */
  updatePriority(priority: TaskPriority): void {
    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser alterada')
    }

    this.props.priority = priority
    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza o título
   */
  updateTitle(title: string): void {
    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser alterada')
    }

    this.props.title = title
    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza o assignee
   */
  updateAssignee(assignee?: string): void {
    if (this.props.status === TaskStatus.DONE) {
      throw new Error('Tarefa concluída não pode ser alterada')
    }

    this.props.assignee = assignee
    this.props.updatedAt = new Date()
  }

  /**
   * Soft delete
   */
  softDelete(): void {
    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Verifica se está atrasada
   */
  isOverdue(): boolean {
    if (!this.props.dueDate || this.props.status === TaskStatus.DONE) {
      return false
    }

    return new Date() > this.props.dueDate
  }

  /**
   * Verifica se pode ser editada
   */
  canBeEdited(): boolean {
    return this.props.status !== TaskStatus.DONE && !this.props.deletedAt
  }

  /**
   * Calcula progresso (para filtros)
   */
  getProgress(): number {
    const progressMap: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 50,
      [TaskStatus.REVIEW]: 75,
      [TaskStatus.DONE]: 100,
      [TaskStatus.CANCELLED]: 0,
    }

    return progressMap[this.props.status]
  }

  // ============ Validações ============

  /**
   * Valida invariantes da entidade
   */
  private validateInvariant(): void {
    // Título não pode ser vazio
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error('Título da tarefa não pode ser vazio')
    }
  }
}
