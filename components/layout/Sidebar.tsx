'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Zap, Heart, TrendingUp,
  Settings, Activity, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import clsx from 'clsx'
import { NAV_ITEMS, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'
import type { UserProfile } from '@/types'
import { useState } from 'react'

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Zap, Heart, TrendingUp, Settings, Activity
}

interface Props { profile: UserProfile }

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = NAV_ITEMS(profile.role)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 p-4 border-b border-white/[0.07]', collapsed && 'justify-center')}>
        <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏀</div>
        {!collapsed && (
          <div>
            <div className="text-sm font-extrabold tracking-tight">Manager 360</div>
            <div className="text-[10px] text-muted">ПБК МБА-МАИ</div>
          </div>
        )}
      </div>

      {/* Team tag */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="text-xs font-bold text-accent">МБА-МАИ</div>
          <div className="text-[10px] text-muted mt-0.5">Единая Лига ВТБ · 25/26</div>
          <span className="text-[9px] font-bold bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
            Плей-офф
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = ICONS[item.icon]
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-150 group',
                collapsed && 'justify-center',
                active
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-white hover:bg-white/[0.04]'
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon size={16} className={clsx('flex-shrink-0', !active && 'opacity-60 group-hover:opacity-100')} />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className={clsx('p-3 border-t border-white/[0.07]', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
              {profile.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{profile.full_name || 'Пользователь'}</div>
              <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full', ROLE_COLORS[profile.role])}>
                {ROLE_LABELS[profile.role]}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center p-2 border-t border-white/[0.07]
                   text-muted hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden md:flex flex-col bg-bg2 border-r border-white/[0.07]',
        'transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg2 border-t border-white/[0.07] z-40 flex">
        {navItems.slice(0, 5).map(item => {
          const Icon = ICONS[item.icon]
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold',
                active ? 'text-accent' : 'text-muted'
              )}
            >
              {Icon && <Icon size={18} />}
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
