export type Role = 'admin' | 'head_coach' | 'fitness_coach' | 'medical' | 'analyst' | 'player'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: Role
  player_id?: string | null
  avatar_url?: string | null
  created_at: string
}

export interface Player {
  id: string
  number: number
  full_name: string
  short_name: string
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  nationality: string
  flag: string
  age: number
  status: 'active' | 'injured' | 'recovering' | 'rest'
  pts_avg: number
  reb_avg: number
  ast_avg: number
  fg2_pct: number
  injury_note?: string
  return_date?: string
  created_at: string
}

export interface RpeEntry {
  id: string
  player_id: string
  session_type: string
  session_date: string
  rpe: number
  duration_mins: number
  tl: number
  comment?: string
  created_by: string
  created_at: string
  player?: Player
}

export interface MedicalRecord {
  id: string
  player_id: string
  diagnosis: string
  injury_date: string
  expected_return?: string
  status: 'active' | 'recovering' | 'cleared'
  notes?: string
  created_by: string
  created_at: string
  player?: Player
}

export interface CoachStaff {
  id: string
  full_name: string
  role_title: string
  role: Role
  color: string
  detail?: string
}

export interface WeeklyLoad {
  player_id: string
  player_name: string
  position: string
  number: number
  mon?: number; tue?: number; wed?: number; thu?: number; fri?: number; sat?: number
  avg_rpe: number
  total_tl: number
  acwr?: number
}

export interface DashboardStats {
  totalPlayers: number
  injured: number
  avgRpe: number
  winPct: number
  nextMatch?: string
}
