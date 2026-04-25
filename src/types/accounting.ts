export type LedgerCategory = 'booking' | 'expense' | 'adjustment'

export type LedgerStatus = 'posted' | 'pending'

export interface LedgerEntry {
  id: string
  dateIso: string
  description: string
  category: LedgerCategory
  amount: number
  status: LedgerStatus
}

export interface LedgerSummary {
  income: number
  expenses: number
  net: number
}
