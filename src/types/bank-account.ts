export interface BankAccount {
  id: number
  user_id: number | null

  label: string | null
  owner_name: string
  bank_name: string
  bank_code: string | null
  account_number: string

  type:
    | 'company'
    | 'inspector'
    | 'vendor'
    | 'customer'
    | 'cash'
    | 'ewallet'

  is_primary: boolean
  is_active: boolean

  note: string | null

  created_at: string
  updated_at: string
}

export interface BankAccountResponse {
  success: boolean
  message: string
  data: BankAccount[]
}

export interface SingleBankAccountResponse {
  success: boolean
  message: string
  data: BankAccount
}

export interface BankAccountPayload {
  label?: string | null
  owner_name: string
  bank_name: string
  bank_code?: string | null
  account_number: string
  type: string
  note?: string | null
}