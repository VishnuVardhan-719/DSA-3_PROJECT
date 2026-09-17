import { AlertCircle, Inbox, LoaderCircle, RotateCcw, Search } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description: string; actions?: ReactNode; eyebrow?: string }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</header>
}

export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || action) && <div className="panel-heading"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</div>}{children}</section>
}

export function MetricCard({ label, value, detail, tone = 'navy' }: { label: string; value: string | number; detail: string; tone?: 'navy' | 'red' | 'green' | 'amber' }) {
  return <article className={`metric-card tone-${tone}`}><div><p>{label}</p><small>{detail}</small></div><strong>{value}</strong></article>
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const normalized = tone ?? String(children).toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')
  return <span className={`badge badge-${normalized}`}>{children}</span>
}

export function Button({ children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' }) {
  return <button className={`button button-${variant}`} {...props}>{children}</button>
}

export function SearchInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`search-input ${className}`}><Search size={16} aria-hidden="true" /><input {...props} /></label>
}

export function Select({ label, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className={`select-field ${className}`}><span>{label}</span><select {...props} /></label>
}

export function Progress({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const percent = Math.min(100, Math.round((value / max) * 100))
  return <div className="progress-wrap" aria-label={label ?? `${percent}%`}><div className="progress-track"><span style={{ width: `${percent}%` }} /></div>{label && <small>{label}</small>}</div>
}

export function AsyncState({ loading, error, empty = false, onRetry, children }: { loading: boolean; error?: Error; empty?: boolean; onRetry: () => void; children: ReactNode }) {
  if (loading) return <div className="state-view state-loading" role="status"><div className="state-icon"><LoaderCircle className="spin" /></div><h2>Loading workspace data</h2><p>Fetching current contract and compliance records.</p></div>
  if (error) return <div className="state-view state-error" role="alert"><div className="state-icon"><AlertCircle /></div><h2>This view could not be displayed</h2><p>{error.message}</p><Button variant="secondary" onClick={onRetry}><RotateCcw size={15} /> Try again</Button></div>
  if (empty) return <div className="state-view state-empty"><div className="state-icon"><Inbox /></div><h2>Nothing to review here</h2><p>No records are available for this view yet.</p><Button variant="secondary" onClick={onRetry}><RotateCcw size={15} /> Refresh</Button></div>
  return children
}

export function EmptyResults({ onReset }: { onReset: () => void }) {
  return <div className="empty-inline"><Search size={22} /><strong>No matching records</strong><span>Try a broader search or clear the filters.</span><Button variant="quiet" onClick={onReset}>Clear filters</Button></div>
}
