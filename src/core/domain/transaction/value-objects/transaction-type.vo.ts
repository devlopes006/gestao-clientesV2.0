/**
 * Transaction Type Value Object
 * Representa os tipos de transação
 */

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionSubtype {
  INVOICE_PAYMENT = 'INVOICE_PAYMENT',
  OTHER_INCOME = 'OTHER_INCOME',
  INTERNAL_COST = 'INTERNAL_COST',
  FIXED_EXPENSE = 'FIXED_EXPENSE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export const TransactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.INCOME]: 'Receita',
  [TransactionType.EXPENSE]: 'Despesa',
}

export const TransactionSubtypeLabels: Record<TransactionSubtype, string> = {
  [TransactionSubtype.INVOICE_PAYMENT]: 'Pagamento de Fatura',
  [TransactionSubtype.OTHER_INCOME]: 'Outra Receita',
  [TransactionSubtype.INTERNAL_COST]: 'Custo Interno',
  [TransactionSubtype.FIXED_EXPENSE]: 'Despesa Fixa',
  [TransactionSubtype.OTHER_EXPENSE]: 'Outra Despesa',
}

export const TransactionStatusLabels: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'Pendente',
  [TransactionStatus.CONFIRMED]: 'Confirmada',
  [TransactionStatus.CANCELLED]: 'Cancelada',
}
