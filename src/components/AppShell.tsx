import { Bell, BookOpenCheck, ChevronLeft, ChevronRight, CircleUserRound, ClipboardCheck, FileClock, FileSearch, Files, Gavel, LayoutDashboard, Menu, Network, Search, Settings, ShieldCheck, UsersRound, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { api } from '../api/client'
import { useResource } from '../api/useResource'

const primaryNav = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard }, { to: '/contracts', label: 'Contracts', icon: Files },
  { to: '/clause-search', label: 'Clause Search', icon: FileSearch }, { to: '/version-analysis', label: 'Version Analysis', icon: FileClock },
  { to: '/similarity-clustering', label: 'Similarity & Clustering', icon: Network }, { to: '/compliance-coverage', label: 'Compliance Coverage', icon: ShieldCheck },
  { to: '/reviewer-assignment', label: 'Reviewer Assignment', icon: UsersRound },
]
const secondaryNav = [
  { to: '/review-queue', label: 'Review Queue', icon: ClipboardCheck }, { to: '/audit-trail', label: 'Audit Trail', icon: BookOpenCheck }, { to: '/settings', label: 'Settings', icon: Settings },
]
const pageTitles: Record<string, string> = { overview: 'Overview', contracts: 'Contracts', 'clause-search': 'Clause Search', 'version-analysis': 'Version Analysis', 'similarity-clustering': 'Similarity & Clustering', 'compliance-coverage': 'Compliance Coverage', 'reviewer-assignment': 'Reviewer Assignment', 'review-queue': 'Review Queue', 'audit-trail': 'Audit Trail', settings: 'Settings' }

function Navigation({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const render = (items: typeof primaryNav) => items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></NavLink>)
  return <nav aria-label="Primary navigation">{render(primaryNav)}<div className="nav-divider" />{render(secondaryNav)}</nav>
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const health = useResource((signal) => api.get<{ status?: string }>('/health', signal), [])
  const segment = location.pathname.split('/')[1] || 'overview'
  const title = pageTitles[segment] ?? 'Contract detail'
  useEffect(() => { localStorage.setItem('sidebar-collapsed', String(collapsed)) }, [collapsed])
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Gavel size={19} /></div><div><strong>Contract & Compliance</strong><span>Version intelligence</span></div></div><div className="workspace-label"><span>Legal operations</span></div><Navigation collapsed={collapsed} /><button className="collapse-button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button><div className="profile-card"><div className="avatar">CR</div><div><strong>Compliance Reviewer</strong><span>Review Team</span></div></div></aside>
    {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
    <aside className={`mobile-sidebar ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}><div className="mobile-nav-head"><div className="brand"><div className="brand-mark"><Gavel size={19} /></div><div><strong>Contract & Compliance</strong><span>Version intelligence</span></div></div><button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button></div><Navigation collapsed={false} onNavigate={() => setMobileOpen(false)} /></aside>
    <div className="app-main"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><span>Review workspace</span><ChevronRight size={14} /><strong>{title}</strong></div></div><div className="topbar-tools"><button type="button" onClick={health.retry} className="environment-badge" title={health.error?.message}>{health.loading ? 'Connecting…' : health.error ? 'API offline' : health.data?.status === 'ok' || health.data?.status === 'healthy' ? 'Local API' : 'Connected'}</button><Link to="/clause-search" className="top-search"><Search size={16} /><span>Search clauses</span><kbd>/</kbd></Link><Link to="/review-queue" className="icon-button" aria-label="Open review queue"><Bell size={18} /></Link><Link to="/settings" className="user-button" aria-label="Open settings"><CircleUserRound size={23} /></Link></div></header><main className="content">{children}</main></div>
  </div>
}
