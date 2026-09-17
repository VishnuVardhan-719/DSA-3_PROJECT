import { Download, FileClock, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api, listFrom } from '../api/client'
import { useResource } from '../api/useResource'
import { AsyncState, Badge, Button, EmptyResults, PageHeader, Panel, SearchInput, Select } from '../components/ui'
import type { AuditEvent } from '../types/domain'

const EMPTY_EVENTS: AuditEvent[] = []

export function AuditTrailPage() {
  const resource = useResource((signal) => api.get<unknown>('/audit-events?page=1&pageSize=100', signal).then(p => listFrom<AuditEvent>(p, 'events', 'auditEvents')), [])
  const events = resource.data ?? EMPTY_EVENTS; const [query, setQuery] = useState(''); const [status, setStatus] = useState('All')
  const visible = useMemo(() => events.filter(event => Object.values(event).join(' ').toLowerCase().includes(query.toLowerCase()) && (status === 'All' || event.status === status)), [events, query, status])
  const download = () => { const blob = new Blob([JSON.stringify(visible, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'audit-events.json'; anchor.click(); URL.revokeObjectURL(url) }
  return <><PageHeader title="Audit Trail" description="Review append-only version, clause, assignment, and compliance activity." actions={<Button variant="secondary" onClick={download} disabled={!visible.length}><Download size={16} /> Download visible log</Button>} /><AsyncState loading={resource.loading} error={resource.error} empty={!events.length} onRetry={resource.retry}><div className="audit-assurance"><ShieldCheck /><div><strong>Append-only activity log</strong><span>Events are written by backend mutations and cannot be edited here.</span></div><Badge tone="compliant">Persisted</Badge></div><Panel className="table-panel"><div className="filter-bar"><SearchInput value={query} onChange={e => setQuery(e.target.value)} placeholder="Search user, action, or entity..." aria-label="Search audit events" /><Select label="Status" value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Completed</option><option>Approved</option><option>Flagged</option></Select></div>{visible.length ? <div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Version / Clause</th><th>Status</th></tr></thead><tbody>{visible.map(event => <tr key={event.id}><td><span className="timestamp"><FileClock size={15} />{event.timestamp}</span></td><td><strong>{event.user}</strong></td><td>{event.action}</td><td><span className="entity-id">{event.entity}</span></td><td>{event.detail ?? event.version ?? '—'}</td><td><Badge>{event.status}</Badge></td></tr>)}</tbody></table></div> : <EmptyResults onReset={() => { setQuery(''); setStatus('All') }} />}<div className="table-footer"><span>{visible.length} audit events</span><span>Times shown in workspace timezone</span></div></Panel></AsyncState></>
}
