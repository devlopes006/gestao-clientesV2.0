import { z } from 'zod'

/**
 * Advanced validation schemas and utilities
 */

/**
 * CPF Validation
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  cpf = cpf.replace(/\D/g, '')

  // Check length
  if (cpf.length !== 11) return false

  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cpf.charAt(9))) return false

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0
  if (checkDigit !== parseInt(cpf.charAt(10))) return false

  return true
}

/**
 * CNPJ Validation
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-digits
  cnpj = cnpj.replace(/\D/g, '')

  // Check length
  if (cnpj.length !== 14) return false

  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  // Validate first check digit
  let length = cnpj.length - 2
  let numbers = cnpj.substring(0, length)
  const digits = cnpj.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  // Validate second check digit
  length = length + 1
  numbers = cnpj.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

/**
 * Invoice Number Validation
 * Format: ORG-YYYY-NNNN (e.g., ABC-2025-0001)
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^[A-Z0-9]{3,10}-\d{4}-\d{4,6}$/
  return pattern.test(invoiceNumber)
}

/**
 * Generate Invoice Number
 */
export function generateInvoiceNumber(
  orgPrefix: string,
  year: number,
  sequence: number
): string {
  const prefix = orgPrefix.substring(0, 3).toUpperCase()
  const seq = sequence.toString().padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}

/**
 * Zod schema for CPF
 */
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF inválido')
  .refine(validateCPF, {
    message: 'CPF inválido',
  })
  .transform((cpf) => cpf.replace(/\D/g, ''))

/**
 * Zod schema for CNPJ
 */
export const cnpjSchema = z
  .string()
  .min(14, 'CNPJ deve ter 14 dígitos')
  .max(18, 'CNPJ inválido')
  .refine(validateCNPJ, {
    message: 'CNPJ inválido',
  })
  .transform((cnpj) => cnpj.replace(/\D/g, ''))

/**
 * Zod schema for Invoice Number
 */
export const invoiceNumberSchema = z
  .string()
  .min(1, 'Número da fatura é obrigatório')
  .refine(validateInvoiceNumber, {
    message: 'Formato de número de fatura inválido. Use: XXX-YYYY-NNNN',
  })

/**
 * Email validation schema (enhanced)
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(5, 'Email muito curto')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .trim()

/**
 * Phone validation schema (Brazilian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?55?\s?\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/, {
    message: 'Telefone inválido. Use formato: (XX) XXXXX-XXXX',
  })
  .transform((phone) => phone.replace(/\D/g, ''))

/**
 * Postal code validation schema (CEP)
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, {
    message: 'CEP inválido. Use formato: XXXXX-XXX',
  })
  .transform((cep) => cep.replace(/\D/g, ''))

/**
 * Currency amount validation (BRL)
 */
export const currencyAmountSchema = z
  .number()
  .min(0.01, 'Valor deve ser maior que zero')
  .max(999999999.99, 'Valor muito alto')
  .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais')

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['endDate'],
  })

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Client creation schema with validation
 */
export const clientCreateSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
    email: emailSchema.optional().nullable(),
    phone: phoneSchema.optional().nullable(),
    cpf: cpfSchema.optional().nullable(),
    cnpj: cnpjSchema.optional().nullable(),
    contractValue: currencyAmountSchema.optional().nullable(),
    contractStart: z.coerce.date().optional().nullable(),
    contractEnd: z.coerce.date().optional().nullable(),
    paymentDay: z.number().int().min(1).max(31).optional().nullable(),
  })
  .refine(
    (data) => {
      // At least one document (CPF or CNPJ) should be provided if email is not present
      if (!data.email && !data.cpf && !data.cnpj) {
        return false
      }
      return true
    },
    {
      message:
        'Pelo menos um dos campos (email, CPF ou CNPJ) deve ser fornecido',
      path: ['email'],
    }
  )
  .refine(
    (data) => {
      // If both dates are present, validate range
      if (data.contractStart && data.contractEnd) {
        return data.contractEnd >= data.contractStart
      }
      return true
    },
    {
      message:
        'Data de término do contrato deve ser maior ou igual à data de início',
      path: ['contractEnd'],
    }
  )

/**
 * Invoice creation schema with validation
 */
export const invoiceCreateSchema = z.object({
  clientId: z.string().cuid('ID do cliente inválido'),
  number: invoiceNumberSchema.optional(),
  dueDate: z.coerce.date(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Descrição é obrigatória').max(500),
        quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1'),
        unitAmount: currencyAmountSchema,
      })
    )
    .min(1, 'Pelo menos um item é obrigatório'),
  discount: currencyAmountSchema.default(0),
  tax: currencyAmountSchema.default(0),
  notes: z.string().max(1000).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
})

/**
 * Transaction creation schema with validation
 */
export const transactionCreateSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Tipo deve ser INCOME ou EXPENSE',
  }),
  subtype: z.enum([
    'INVOICE_PAYMENT',
    'OTHER_INCOME',
    'INTERNAL_COST',
    'FIXED_EXPENSE',
    'OTHER_EXPENSE',
  ]),
  amount: currencyAmountSchema,
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  category: z.string().max(100).optional().nullable(),
  date: z.coerce.date(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).default('CONFIRMED'),
  clientId: z.string().cuid().optional().nullable(),
  invoiceId: z.string().cuid().optional().nullable(),
  costItemId: z.string().cuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})
