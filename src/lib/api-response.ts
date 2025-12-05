import { NextResponse } from 'next/server'

/**
 * Standard API Response Types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    totalPages?: number
    total?: number
    [key: string]: unknown
  }
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: unknown
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard API Response Helpers
 */
export class ApiResponseHandler {
  /**
   * Success response with data
   */
  static success<T>(
    data: T,
    status = 200,
    meta?: ApiSuccessResponse<T>['meta']
  ): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    }
    return NextResponse.json(response, { status })
  }

  /**
   * Error response with message
   */
  static error(
    error: string,
    status = 400,
    details?: unknown,
    code?: string
  ): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
      success: false,
      error,
    }
    if (details !== undefined) {
      response.details = details
    }
    if (code) {
      response.code = code
    }
    return NextResponse.json(response, { status })
  }

  /**
   * Validation error (400)
   */
  static validationError(
    message: string,
    details?: unknown
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 400, details, 'VALIDATION_ERROR')
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(
    message = 'Não autorizado'
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 401, undefined, 'UNAUTHORIZED')
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(message = 'Acesso negado'): NextResponse<ApiErrorResponse> {
    return this.error(message, 403, undefined, 'FORBIDDEN')
  }

  /**
   * Not found error (404)
   */
  static notFound(resource = 'Recurso'): NextResponse<ApiErrorResponse> {
    return this.error(`${resource} não encontrado`, 404, undefined, 'NOT_FOUND')
  }

  /**
   * Rate limit exceeded (429)
   */
  static rateLimitExceeded(resetAt?: string): NextResponse<ApiErrorResponse> {
    return this.error(
      'Limite de requisições excedido. Tente novamente mais tarde.',
      429,
      resetAt ? { resetAt } : undefined,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  /**
   * Internal server error (500)
   */
  static serverError(
    message = 'Erro interno do servidor',
    details?: unknown
  ): NextResponse<ApiErrorResponse> {
    return this.error(message, 500, details, 'INTERNAL_ERROR')
  }

  /**
   * Created response (201)
   */
  static created<T>(
    data: T,
    meta?: ApiSuccessResponse<T>['meta']
  ): NextResponse<ApiSuccessResponse<T>> {
    return this.success(data, 201, meta)
  }

  /**
   * No content response (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  /**
   * Paginated list response
   */
  static paginatedList<T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  ): NextResponse<ApiSuccessResponse<T[]>> {
    return this.success(data, 200, {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
    })
  }
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false
}
