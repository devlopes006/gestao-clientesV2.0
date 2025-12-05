import { z } from 'zod'

export const TaskStatusEnum = z.enum([
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'CANCELLED',
])
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const TaskBoardItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  clientName: z.string(),
  clientId: z.string(),
  dueDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export type TaskBoardItem = z.infer<typeof TaskBoardItemSchema>

export const TaskBoardDataSchema = z.object({
  tasks: z.array(TaskBoardItemSchema),
})
export type TaskBoardData = z.infer<typeof TaskBoardDataSchema>
