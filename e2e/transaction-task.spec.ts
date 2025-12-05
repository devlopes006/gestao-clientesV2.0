/**
 * Teste de Integração - Transaction e Task APIs v2
 *
 * Para rodar: npm test e:integration -- transaction-task.test.ts
 */

import { describe, expect, it } from 'vitest'

const BASE_URL = 'http://localhost:3000/api'
const TEST_ORG_ID = 'test-org-123'
const TEST_CLIENT_ID = 'test-client-456'

describe('Transaction API v2', () => {
  describe('POST /api/transactions/v2 - Criar Transação', () => {
    it('deve criar uma transação de receita', async () => {
      const response = await fetch(`${BASE_URL}/transactions/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCOME',
          subtype: 'OTHER_INCOME',
          amount: 1000,
          orgId: TEST_ORG_ID,
          description: 'Venda de produto',
          category: 'Vendas',
          clientId: TEST_CLIENT_ID,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('transactionId')
      expect(data.transactionId).toBeDefined()
    })

    it('deve criar uma transação de despesa', async () => {
      const response = await fetch(`${BASE_URL}/transactions/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EXPENSE',
          subtype: 'FIXED_EXPENSE',
          amount: 500,
          orgId: TEST_ORG_ID,
          description: 'Aluguel mensal',
          category: 'Despesas Fixas',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('transactionId')
    })

    it('deve retornar erro para valores inválidos', async () => {
      const response = await fetch(`${BASE_URL}/transactions/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCOME',
          subtype: 'OTHER_INCOME',
          amount: -100, // Valor negativo inválido
          orgId: TEST_ORG_ID,
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/transactions/v2 - Listar Transações', () => {
    it('deve listar transações de uma organização', async () => {
      const response = await fetch(
        `${BASE_URL}/transactions/v2?orgId=${TEST_ORG_ID}&page=1&limit=10`,
        {
          method: 'GET',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('transactions')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.transactions)).toBe(true)
    })

    it('deve filtrar por status', async () => {
      const response = await fetch(
        `${BASE_URL}/transactions/v2?orgId=${TEST_ORG_ID}&status=PENDING`,
        {
          method: 'GET',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.transactions)).toBe(true)
    })
  })
})

describe('Task API v2', () => {
  let taskId: string

  describe('POST /api/tasks/v2 - Criar Tarefa', () => {
    it('deve criar uma nova tarefa', async () => {
      const response = await fetch(`${BASE_URL}/tasks/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Revisar contrato',
          orgId: TEST_ORG_ID,
          priority: 'HIGH',
          description: 'Revisar e aprovar novo contrato do cliente',
          clientId: TEST_CLIENT_ID,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('taskId')
      taskId = data.taskId
    })

    it('deve retornar erro para título vazio', async () => {
      const response = await fetch(`${BASE_URL}/tasks/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          orgId: TEST_ORG_ID,
          priority: 'MEDIUM',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/tasks/v2 - Listar Tarefas', () => {
    it('deve listar tarefas de uma organização', async () => {
      const response = await fetch(
        `${BASE_URL}/tasks/v2?orgId=${TEST_ORG_ID}&page=1&limit=10`,
        {
          method: 'GET',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('tasks')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.tasks)).toBe(true)
    })

    it('deve filtrar por status', async () => {
      const response = await fetch(
        `${BASE_URL}/tasks/v2?orgId=${TEST_ORG_ID}&status=TODO`,
        {
          method: 'GET',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.tasks)).toBe(true)
    })
  })

  describe('GET /api/tasks/v2/[id] - Obter Tarefa', () => {
    it('deve retornar uma tarefa específica', async () => {
      if (!taskId) {
        console.log('Pulando teste - taskId não definido')
        return
      }

      const response = await fetch(`${BASE_URL}/tasks/v2/${taskId}`, {
        method: 'GET',
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('task')
      expect(data.task.id).toBe(taskId)
    })

    it('deve retornar 404 para tarefa inexistente', async () => {
      const response = await fetch(`${BASE_URL}/tasks/v2/inexistente-123`, {
        method: 'GET',
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/tasks/v2/[id] - Atualizar Tarefa', () => {
    it('deve atualizar título da tarefa', async () => {
      if (!taskId) {
        console.log('Pulando teste - taskId não definido')
        return
      }

      const response = await fetch(`${BASE_URL}/tasks/v2/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Revisar e aprovar contrato',
          priority: 'URGENT',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('taskId')
    })
  })

  describe('DELETE /api/tasks/v2/[id] - Deletar Tarefa', () => {
    it('deve deletar uma tarefa', async () => {
      // Criar uma tarefa para deletar
      const createResponse = await fetch(`${BASE_URL}/tasks/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Tarefa para deletar',
          orgId: TEST_ORG_ID,
          priority: 'LOW',
        }),
      })

      const createData = await createResponse.json()
      const deleteTaskId = createData.taskId

      const deleteResponse = await fetch(
        `${BASE_URL}/tasks/v2/${deleteTaskId}`,
        {
          method: 'DELETE',
        }
      )

      expect(deleteResponse.status).toBe(200)
      const data = await deleteResponse.json()
      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
    })
  })
})
