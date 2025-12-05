import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { z } from 'zod'

export const DeleteTaskInputSchema = z.object({
  taskId: z.string().uuid(),
})

export type DeleteTaskInput = z.infer<typeof DeleteTaskInputSchema>

export interface DeleteTaskOutput {
  success: boolean
}

/**
 * Use Case: Deletar Tarefa
 */
export class DeleteTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: DeleteTaskInput): Promise<DeleteTaskOutput> {
    const validated = DeleteTaskInputSchema.parse(input)

    const exists = await this.repository.exists(validated.taskId)

    if (!exists) {
      throw new Error('Tarefa não encontrada')
    }

    await this.repository.delete(validated.taskId)

    return { success: true }
  }
}
