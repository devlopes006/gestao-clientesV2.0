import { openApiSpec } from '@/lib/openapi'
import { NextResponse } from 'next/server'

/**
 * Serves OpenAPI JSON specification
 * Access at: /api-docs
 */
export async function GET() {
  return NextResponse.json(openApiSpec)
}
