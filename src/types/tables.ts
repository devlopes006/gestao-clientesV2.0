import { ClientStatus } from './client'

export interface AppClient {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  plan: string | null
  main_channel: string | null
  orgId: string
  clientUserId: string | null
  contract_value: number | null
  payment_day: number | null
  contract_start: string | null
  contract_end: string | null
  created_at: string
  updated_at: string
}
