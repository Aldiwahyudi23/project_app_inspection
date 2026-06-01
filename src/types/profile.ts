export interface UserRole {
  role: string
  status: string
}

export interface Region {
  id: number
  name: string
  code: string
  address: string | null
  city: string | null
  province: string | null
  is_active: boolean

  pivot: UserRole
}

export interface RegionTeam {
  id: number
  status: string
  description: string | null

  region: {
    id: number | null
    name: string | null
    code: string | null
  }
}

export interface BankAccount {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  is_primary: boolean
}

export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string | null
  type: string
  is_active: boolean

  email_verified: boolean
  email_verified_at: string | null

  device: {
    device_id: string | null
    device_name: string | null
    device_platform: string | null
    device_verified_at: string | null
  }

  roles: string[]

  regions: Region[]

  region_teams: RegionTeam[]

  primary_bank_account: BankAccount | null

  bank_accounts: BankAccount[]

  inspection_stats: InspectionStats | null

  created_at: string
}

export interface ProfileResponse {
  success: boolean
  message: string

  data: {
    user: UserProfile
  }
}

export interface InspectionStats {
  total_inspections: number
  this_month: number
  last_month: number
  difference: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}