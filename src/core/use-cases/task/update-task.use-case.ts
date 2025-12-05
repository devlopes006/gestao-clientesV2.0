import { TaskPriority } from '@/domain/task/value-objects/task-type.vo'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { z } from 'zod'

export const UpdateTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignee: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>

export interface UpdateTaskOutput {
  taskId: string
}

/**
 * Use Case: Atualizar Tarefa
 */
export class UpdateTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<UpdateTaskOutput> {
    const validated = UpdateTaskInputSchema.parse(input)

    const task = await this.repository.findById(validated.taskId)

    if (!task) {
      throw new Error('Tarefa não encontrada')
    }

    if (!task.canBeEdited()) {
      throw new Error('Tarefa não pode ser editada')
    }

    if (validated.title) {
      task.updateTitle(validated.title)
    }

    if (validated.priority) {
      task.updatePriority(validated.priority)
    }

    if (validated.assignee !== undefined) {
      task.updateAssignee(validated.assignee || undefined)
    }

    await this.repository.save(task)

    return { taskId: task.id }
  }
}
