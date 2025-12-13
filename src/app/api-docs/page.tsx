import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - Gestão Clientes',
  description: 'OpenAPI/Swagger documentation for Gestão Clientes API',
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          <p className="mt-2 text-gray-600">
            OpenAPI 3.0 specification for Gestão Clientes API
          </p>
        </div>

        <div className="rounded-lg bg-slate-900 p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Swagger UI</h2>
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View JSON Spec →
            </a>
          </div>

          <div className="prose max-w-none">
            <p className="text-sm text-gray-600">
              This API provides endpoints for managing clients, financial transactions,
              invoices, and reports. All endpoints require authentication via session
              cookie and OWNER role.
            </p>

            <h3 className="mt-6 text-lg font-semibold">Key Features</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Rate limiting on all endpoints (100 requests/10 minutes)</li>
              <li>5-minute cache on heavy reporting endpoints</li>
              <li>Pagination support (max 100 items per page)</li>
              <li>Soft delete support with includeDeleted filter</li>
              <li>Comprehensive error handling with Sentry integration</li>
            </ul>

            <h3 className="mt-6 text-lg font-semibold">API Endpoints</h3>
            <div className="mt-4 space-y-4">
              <EndpointCard
                method="GET"
                path="/api/transactions"
                description="List transactions with filters and pagination"
              />
              <EndpointCard
                method="POST"
                path="/api/transactions"
                description="Create a new transaction"
              />
              <EndpointCard
                method="GET"
                path="/api/transactions/summary"
                description="Get aggregated financial summary (cached)"
              />
              <EndpointCard
                method="GET"
                path="/api/invoices"
                description="List invoices with filters and pagination"
              />
              <EndpointCard
                method="POST"
                path="/api/invoices"
                description="Create a new invoice"
              />
              <EndpointCard
                method="POST"
                path="/api/invoices/{id}/approve-payment"
                description="Approve invoice payment and create income transaction"
              />
              <EndpointCard
                method="GET"
                path="/api/reports/dashboard"
                description="Get comprehensive dashboard data (cached)"
              />
            </div>

            <h3 className="mt-6 text-lg font-semibold">Authentication</h3>
            <p className="text-sm text-gray-600">
              All endpoints require session-based authentication. The session cookie is
              automatically included in requests from the browser. For API clients,
              ensure you authenticate first and maintain the session cookie.
            </p>

            <h3 className="mt-6 text-lg font-semibold">Rate Limiting</h3>
            <p className="text-sm text-gray-600">
              API endpoints are rate-limited to 100 requests per 10 minutes per IP
              address. If exceeded, you&apos;ll receive a 429 response with a{' '}
              <code>resetAt</code> timestamp.
            </p>

            <h3 className="mt-6 text-lg font-semibold">Response Format</h3>
            <p className="text-sm text-gray-600">
              All successful responses return JSON. List endpoints return an object with{' '}
              <code>data</code> (array of items) and <code>meta</code> (pagination
              info). Errors return <code>{`{ error: string, details?: object }`}</code>
              .
            </p>
          </div>

          <div className="mt-8 rounded border border-blue-200 bg-blue-50 p-4">
            <h4 className="font-semibold text-blue-900">
              💡 Interactive API Testing
            </h4>
            <p className="mt-2 text-sm text-blue-800">
              To explore the API interactively, you can use tools like:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-blue-800">
              <li>
                <a
                  href="https://editor.swagger.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Swagger Editor
                </a>{' '}
                (paste the JSON spec from <code>/api/openapi</code>)
              </li>
              <li>Postman or Insomnia (import OpenAPI spec)</li>
              <li>cURL with session cookie from browser DevTools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function EndpointCard({
  method,
  path,
  description,
}: {
  method: string
  path: string
  description: string
}) {
  const methodColors = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PATCH: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  }

  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span
          className={`rounded px-2 py-1 text-xs font-semibold ${methodColors[method as keyof typeof methodColors]}`}
        >
          {method}
        </span>
        <div className="flex-1">
          <code className="text-sm font-mono text-gray-900">{path}</code>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}
