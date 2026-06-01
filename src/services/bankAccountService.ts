import api from './api'

import type {
  BankAccountPayload,
  BankAccountResponse,
  SingleBankAccountResponse,
} from '../types/bank-account'

// ─── GET BANK ACCOUNTS ────────────────────────────────────────
export const getBankAccounts = () =>
  api.get<BankAccountResponse>(
    '/app-inspection/bank-accounts'
  )

// ─── GET DETAIL ───────────────────────────────────────────────
export const getBankAccountDetail = (id: number) =>
  api.get<SingleBankAccountResponse>(
    `/app-inspection/bank-accounts/${id}`
  )

// ─── STORE ────────────────────────────────────────────────────
export const storeBankAccount = (
  payload: BankAccountPayload
) =>
  api.post(
    '/app-inspection/bank-accounts',
    payload
  )

// ─── UPDATE ───────────────────────────────────────────────────
export const updateBankAccount = (
  id: number,
  payload: BankAccountPayload
) =>
  api.put(
    `/app-inspection/bank-accounts/${id}`,
    payload
  )

// ─── DELETE ───────────────────────────────────────────────────
export const deleteBankAccount = (id: number) =>
  api.delete(
    `/app-inspection/bank-accounts/${id}`
  )

// ─── TOGGLE ACTIVE ────────────────────────────────────────────
export const toggleActiveBankAccount = (
  id: number
) =>
  api.patch(
    `/app-inspection/bank-accounts/${id}/toggle-active`
  )

// ─── SET PRIMARY ──────────────────────────────────────────────
export const setPrimaryBankAccount = (
  id: number
) =>
  api.patch(
    `/app-inspection/bank-accounts/${id}/set-primary`
  )