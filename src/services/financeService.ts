import api from './api'
import type {
  FinanceResponse,
  PayoutResponse,
  WithdrawPayload,
  DepositPayload,

  FinanceReportResponse,
  PayoutDetailResponse
} from '../types/finance'

// ─── GET FINANCE DATA ─────────────────────────────────────────
export const getFinanceData = () =>
  api.get<FinanceResponse>('/app-inspection/finance/data')

// ─── GET PAYOUTS ──────────────────────────────────────────────
export const getPayouts = () =>
  api.get<PayoutResponse>('/app-inspection/finance/payouts')

// ─── REQUEST WITHDRAW ─────────────────────────────────────────
export const requestWithdraw = (payload: WithdrawPayload) =>
  api.post('/app-inspection/finance/withdraw/request', payload)

// ─── REQUEST DEPOSIT ─────────────────────────────────────────
export const requestDeposit = (payload: DepositPayload) => {
  const form = new FormData()
  payload.transaction_ids.forEach((id) =>
    form.append('transaction_ids[]', String(id))
  )
  form.append('proof_transfer', payload.proof_transfer)
  if (payload.notes) form.append('notes', payload.notes)
  return api.post('/app-inspection/finance/deposit/request', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ─── GET FINANCE REPORT ───────────────────────────────────────
export const getFinanceReport = (
  month?: number,
  year?: number
) =>
  api.get<FinanceReportResponse>(
    '/app-inspection/finance/report',
    {
      params: {
        month,
        year
      }
    }
  )

  // ─── GET PAYOUT DETAIL ───────────────────────────────────────
export const getPayoutDetail = (id: number | string) =>
  api.get<PayoutDetailResponse>(
    `/app-inspection/finance/payouts/${id}`
  )