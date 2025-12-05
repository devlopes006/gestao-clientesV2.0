import { Task } from '@/domain/task/entities/task.entity'
import {
  TaskPriority,
  TaskStatus,
} from '@/domain/task/value-objects/task-type.vo'

/**
 * Interface do Repository de Tasks
 */

export interface ITaskRepository {
  /**
   * Salva uma tarefa
   */
  save(task: Task): Promise<void>

  /**
   * Busca uma tarefa por ID
   */
  findById(id: string): Promise<Task | null>

  /**
   * Lista tarefas de uma organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: TaskStatus[]
      priority?: TaskPriority[]
      assignee?: string
      clientId?: string
    }
  ): Promise<{ tasks: Task[]; total: number }>

  /**
   * Lista tarefas de um cliente
   */
  findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ tasks: Task[]; total: number }>

  /**
   * Deleta uma tarefa
   */
  delete(id: string): Promise<void>

  /**
   * Verifica se existe
   */
  exists(id: string): Promise<boolean>

  /**
   * Lista tarefas atrasadas
   */
  findOverdue(orgId: string): Promise<Task[]>
}
