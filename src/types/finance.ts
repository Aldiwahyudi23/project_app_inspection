export interface BankAccount {
  id: number
  label: string | null
  owner_name: string
  bank_name: string
  bank_code: string | null
  account_number: string
}

export interface FinanceItem {
  id:               number
  inspector_name:   string | null
  vehicle_name:     string | null
  license_plate:    string | null
  display_image:    string | null
  inspection_date:  string | null
  type:             string
  amount:           number
  amount_formatted: string
  status:           string
  created_at:       string | null
}

export interface PendingPayout {
  id:                     number
  total_amount:           number
  total_amount_formatted: string
  created_at:             string
}

export interface WithdrawGroup {
  bank_account:           BankAccount | null
  has_primary_bank:       boolean
  bank_message:           string | null

  total_amount:           number
  total_amount_formatted: string

  items:                  FinanceItem[]

  has_pending_payout:     boolean
  pending_payout:         PendingPayout | null
}

export interface DepositGroup {
  company_banks:          BankAccount[]

  total_amount:           number
  total_amount_formatted: string

  items:                  FinanceItem[]

  has_pending_payout:     boolean
  pending_payout:         PendingPayout | null
}

export interface FinanceData {
  withdraw: WithdrawGroup
  deposit:  DepositGroup
}

export interface FinanceResponse {
  success: boolean
  data: FinanceData
}

export interface PayoutItem {
  id:           number
  type:         'withdraw' | 'deposit'
  total_amount: number
  status:       'pending' | 'approved' | 'cancelled'
  notes:        string | null
  created_at:   string
}

export interface PayoutResponse {
  success: boolean
  data: PayoutItem[]
}

export interface WithdrawPayload {
  transaction_ids: number[]
  notes?: string
}

export interface DepositPayload {
  transaction_ids: number[]
  proof_transfer: File
  notes?: string
}

// ============================================================
// FINANCE REPORT
// ============================================================

export interface FinanceReportResponse {
  status: string
  message: string
  data: FinanceReportData
}

export interface FinanceReportData {
  summary: FinanceSummary
  chart: FinanceChart[]
  inspections: FinanceInspection[]
  billings: FinanceBilling[]
  deposits: FinanceDeposit[]
  income: FinanceIncome[]
  withdraws: FinanceWithdraw[]
}

// ============================================================
// SUMMARY  — sesuai JSON: total_platform_fee, total_deposit, unpaid_bill, dsb.
// ============================================================

export interface FinanceSummary {
  total_inspections: number
  total_income: number
  total_income_format: string
  total_platform_fee: number
  total_platform_fee_format: string
  total_deposit: number
  total_deposit_format: string
  total_withdraw: number
  total_withdraw_format: string
  unpaid_bill: number
  unpaid_bill_format: string
}

// ============================================================
// CHART
// ============================================================

export interface FinanceChart {
  day: string
  amount: number
  amount_format: string
}

// ============================================================
// INSPECTIONS
// ============================================================

export interface FinanceInspection {
  id: number
  inspection_id: number | null
  vehicle_name: string | null
  license_plate: string | null
  paid_total: number
  paid_total_format: string
  inspector_income: number
  inspector_income_format: string
  platform_fee: number
  platform_fee_format: string
  source: string           // "inspector" | "platform"
  status: string           // "approved" | "pending" | dll.
  date: string | null
}

// ============================================================
// INCOME
// ============================================================

export interface FinanceIncome {
  id: number
  inspection_id: number | null
  vehicle_name: string | null
  license_plate: string | null
  income: number
  income_format: string
  source: string           // "inspector" | "platform"
  status: string           // "generated" | dll.
  date: string | null
}

// ============================================================
// BILLING  (tagihan platform fee yang belum dibayar)
// ============================================================

export interface FinanceBilling {
  id: number
  vehicle_name: string | null
  license_plate: string | null
  amount: number
  amount_format: string
  status: string           // "pending" | "paid"
  notes: string | null
  date: string | null
}

// ============================================================
// DEPOSIT
// ============================================================

export interface FinanceDeposit {
  id: number
  type: string             // "deposit"
  amount: number
  amount_format: string
  status: string           // "approved" | "cancelled" | "pending"
  notes: string | null
  proof_transfer: string | null
  approved_at: string | null
  date: string | null
}

// ============================================================
// WITHDRAW
// ============================================================

export interface FinanceWithdraw {
  id: number
  type: string             // "withdraw"
  amount: number
  amount_format: string
  status: string           // "approved" | "cancelled" | "pending"
  notes: string | null
  proof_transfer: string | null
  approved_at: string | null
  date: string | null
}

// ===========================================================
//Detail
//===========================================================
export interface PayoutDetailResponse {
  status: string
  data: PayoutDetail
}

export interface PayoutDetail {
  id: number

  type: 'withdraw' | 'deposit'
  type_label: string

  status: string

  total_amount: number
  total_amount_format: string

  notes: string | null

  proof_transfer: string | null

  approved_by: string | null
  approved_at: string | null

  created_at: string

  items: PayoutDetailItem[]
}

export interface PayoutDetailItem {
  transaction_id: number

  transaction_type: string
  direction: string
  status: string

  inspection_id: number | null

  vehicle_name: string
  license_plate: string

  amount: number
  amount_format: string

  notes: string | null

  date: string
}