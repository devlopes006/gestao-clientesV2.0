import { Task } from '@/domain/task/entities/task.entity'
import { ITaskRepository } from '@/ports/repositories/task.repository.interface'
import { z } from 'zod'

export const GetTaskInputSchema = z.object({
  taskId: z.string().uuid(),
})

export type GetTaskInput = z.infer<typeof GetTaskInputSchema>

export interface GetTaskOutput {
  task: Task
}

/**
 * Use Case: Obter Tarefa
 */
export class GetTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: GetTaskInput): Promise<GetTaskOutput> {
    const validated = GetTaskInputSchema.parse(input)

    const task = await this.repository.findById(validated.taskId)

    if (!task) {
      throw new Error('Tarefa não encontrada')
    }

    return { task }
  }
}
