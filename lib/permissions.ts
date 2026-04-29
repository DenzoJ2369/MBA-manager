import type { Role } from '@/types'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  head_coach: 'Главный тренер',
  fitness_coach: 'Тренер по физподготовке',
  medical: 'Врач / медперсонал',
  analyst: 'Аналитик',
  player: 'Игрок',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'text-red-400 bg-red-400/10',
  head_coach: 'text-amber-400 bg-amber-400/10',
  fitness_coach: 'text-blue-400 bg-blue-400/10',
  medical: 'text-green-400 bg-green-400/10',
  analyst: 'text-purple-400 bg-purple-400/10',
  player: 'text-slate-400 bg-slate-400/10',
}

// What each role CAN do
export const PERMISSIONS = {
  canViewAllPlayers:   (r: Role) => r !== 'player',
  canEditPlayers:      (r: Role) => ['admin', 'head_coach'].includes(r),
  canViewLoad:         (r: Role) => ['admin','head_coach','fitness_coach','analyst'].includes(r),
  canEditLoad:         (r: Role) => ['admin','fitness_coach'].includes(r),
  canInputOwnRpe:      (r: Role) => r === 'player',
  canViewAllRpe:       (r: Role) => ['admin','head_coach','fitness_coach','analyst'].includes(r),
  canViewMedical:      (r: Role) => ['admin','head_coach','medical'].includes(r),
  canEditMedical:      (r: Role) => ['admin','medical'].includes(r),
  canViewAnalytics:    (r: Role) => ['admin','head_coach','analyst'].includes(r),
  canManageUsers:      (r: Role) => r === 'admin',
  canViewCoachPanel:   (r: Role) => ['admin','head_coach','fitness_coach'].includes(r),
}

export const NAV_ITEMS = (role: Role) => {
  const all = [
    { href: '/dashboard',  label: 'Дашборд',    icon: 'LayoutDashboard', roles: ['admin','head_coach','fitness_coach','medical','analyst'] },
    { href: '/players',    label: 'Состав',     icon: 'Users',           roles: ['admin','head_coach','fitness_coach','medical','analyst'] },
    { href: '/load',       label: 'Нагрузка',   icon: 'Zap',             roles: ['admin','head_coach','fitness_coach','analyst'] },
    { href: '/rpe',        label: 'Моё RPE',    icon: 'Activity',        roles: ['player'] },
    { href: '/medical',    label: 'Медицина',   icon: 'Heart',           roles: ['admin','head_coach','medical'] },
    { href: '/analytics',  label: 'Аналитика',  icon: 'TrendingUp',      roles: ['admin','head_coach','analyst'] },
    { href: '/admin',      label: 'Управление', icon: 'Settings',        roles: ['admin'] },
  ]
  return all.filter(item => item.roles.includes(role))
}
