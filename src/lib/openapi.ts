/**
 * OpenAPI/Swagger specification for Gestão Clientes API
 * This provides API documentation accessible via /api-docs
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Gestão Clientes API',
    version: '1.0.0',
    description: 'API for client and financial management system',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: 'Transactions', description: 'Financial transaction management' },
    { name: 'Invoices', description: 'Invoice management' },
    { name: 'Reports', description: 'Financial reporting and analytics' },
    { name: 'Clients', description: 'Client management' },
  ],
  paths: {
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions',
        description: 'Get paginated list of transactions with optional filters',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            description: 'Filter by transaction type',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE'] },
            description: 'Filter by payment status',
          },
          {
            name: 'clientId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by client ID',
          },
          {
            name: 'dateFrom',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter from date (inclusive)',
          },
          {
            name: 'dateTo',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter to date (inclusive)',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50, maximum: 100 },
            description: 'Items per page',
          },
        ],
        responses: {
          '200': {
            description: 'Transactions list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                    meta: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create transaction',
        description: 'Create a new financial transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TransactionInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Transaction created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Transaction' },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/transactions/summary': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction summary',
        description:
          'Get aggregated financial summary with income/expense totals',
        parameters: [
          {
            name: 'dateFrom',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Start date for summary',
          },
          {
            name: 'dateTo',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'End date for summary',
          },
        ],
        responses: {
          '200': {
            description: 'Transaction summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionSummary' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices',
        description: 'Get paginated list of invoices with optional filters',
        parameters: [
          {
            name: 'clientId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by client ID',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'OVERDUE'],
            },
            description: 'Filter by invoice status',
          },
          {
            name: 'dateFrom',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter from due date',
          },
          {
            name: 'dateTo',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter to due date',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Invoices list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Invoice' },
                    },
                    meta: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create invoice',
        description: 'Create a new invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InvoiceInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Invoice created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/invoices/{id}/approve-payment': {
      post: {
        tags: ['Invoices'],
        summary: 'Approve invoice payment',
        description: 'Mark invoice as paid and create income transaction',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Invoice ID',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  paidAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Payment date (defaults to now)',
                  },
                  notes: { type: 'string', description: 'Payment notes' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/reports/dashboard': {
      get: {
        tags: ['Reports'],
        summary: 'Get dashboard data',
        description:
          'Get comprehensive dashboard with KPIs, projections, and top clients',
        parameters: [
          {
            name: 'year',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filter year (defaults to current year)',
          },
          {
            name: 'month',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 12 },
            description: 'Filter month (defaults to current month)',
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Dashboard' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
  components: {
    schemas: {
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orgId: { type: 'string' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          subtype: {
            type: 'string',
            enum: ['INVOICE_PAYMENT', 'SUBSCRIPTION', 'COST', 'OTHER'],
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
          },
          amount: { type: 'number', format: 'decimal' },
          description: { type: 'string' },
          category: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date-time' },
          clientId: { type: 'string', nullable: true },
          clientName: { type: 'string', nullable: true },
          invoiceId: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      TransactionInput: {
        type: 'object',
        required: ['type', 'amount', 'description', 'date'],
        properties: {
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          subtype: {
            type: 'string',
            enum: ['INVOICE_PAYMENT', 'SUBSCRIPTION', 'COST', 'OTHER'],
          },
          amount: { type: 'number', format: 'decimal', minimum: 0.01 },
          description: { type: 'string', minLength: 1 },
          category: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING', 'PAID'] },
          clientId: { type: 'string' },
          invoiceId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
      TransactionSummary: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number', format: 'decimal' },
          totalExpense: { type: 'number', format: 'decimal' },
          netBalance: { type: 'number', format: 'decimal' },
          pendingIncome: { type: 'number', format: 'decimal' },
          pendingExpense: { type: 'number', format: 'decimal' },
          transactionCount: { type: 'integer' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orgId: { type: 'string' },
          clientId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'OVERDUE'],
          },
          dueDate: { type: 'string', format: 'date-time' },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          amount: { type: 'number', format: 'decimal' },
          discount: { type: 'number', format: 'decimal', default: 0 },
          tax: { type: 'number', format: 'decimal', default: 0 },
          total: { type: 'number', format: 'decimal' },
          items: { type: 'array', items: { type: 'object' } },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      InvoiceInput: {
        type: 'object',
        required: ['clientId', 'dueDate', 'items'],
        properties: {
          clientId: { type: 'string' },
          dueDate: { type: 'string', format: 'date' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['description', 'quantity', 'unitPrice'],
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number', minimum: 0.01 },
                unitPrice: { type: 'number', format: 'decimal', minimum: 0 },
              },
            },
          },
          discount: { type: 'number', format: 'decimal', default: 0 },
          tax: { type: 'number', format: 'decimal', default: 0 },
          notes: { type: 'string' },
          internalNotes: { type: 'string' },
        },
      },
      Dashboard: {
        type: 'object',
        properties: {
          revenue: { type: 'number', format: 'decimal' },
          expenses: { type: 'number', format: 'decimal' },
          netIncome: { type: 'number', format: 'decimal' },
          pendingInvoices: { type: 'integer' },
          overdueInvoices: { type: 'integer' },
          activeClients: { type: 'integer' },
          projectedRevenue: { type: 'number', format: 'decimal' },
          topClients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                clientId: { type: 'string' },
                clientName: { type: 'string' },
                totalRevenue: { type: 'number', format: 'decimal' },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
    },
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'Session-based authentication',
      },
    },
  },
  security: [{ sessionAuth: [] }],
}
