import { Task } from '@/domain/task/entities/task.entity'
import { TaskPriority } from '@/domain/task/value-objects/task-type.vo'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { z } from 'zod'

export const CreateTaskInputSchema = z.object({
  title: z.string().min(3).max(255),
  orgId: z.string().uuid(),
  priority: z.nativeEnum(TaskPriority),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  assignee: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  createdBy: z.string().uuid().optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>

export interface CreateTaskOutput {
  taskId: string
}

/**
 * Use Case: Criar Tarefa
 */
export class CreateTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const validated = CreateTaskInputSchema.parse(input)

    const task = Task.create({
      title: validated.title,
      orgId: validated.orgId,
      priority: validated.priority,
      description: validated.description,
      clientId: validated.clientId,
      assignee: validated.assignee,
      dueDate: validated.dueDate,
      createdBy: validated.createdBy,
    })

    await this.repository.save(task)

    return { taskId: task.id }
  }
}
