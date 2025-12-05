import { Task } from '@/domain/task/entities/task.entity'
import {
  TaskPriority,
  TaskStatus,
} from '@/domain/task/value-objects/task-type.vo'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { z } from 'zod'

export const ListTasksInputSchema = z.object({
  orgId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
  status: z.array(z.nativeEnum(TaskStatus)).optional(),
  priority: z.array(z.nativeEnum(TaskPriority)).optional(),
  assignee: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
})

export type ListTasksInput = z.infer<typeof ListTasksInputSchema>

export interface ListTasksOutput {
  tasks: Task[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Use Case: Listar Tarefas
 */
export class ListTasksUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: ListTasksInput): Promise<ListTasksOutput> {
    const validated = ListTasksInputSchema.parse(input)

    const { tasks, total } = await this.repository.findByOrgId(
      validated.orgId,
      {
        page: validated.page,
        limit: validated.limit,
        status: validated.status,
        priority: validated.priority,
        assignee: validated.assignee,
        clientId: validated.clientId,
      }
    )

    const totalPages = Math.ceil(total / validated.limit)

    return {
      tasks,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages,
    }
  }
}
