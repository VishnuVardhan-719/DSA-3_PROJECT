import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { useResource } from '../../api/useResource'
import { Button } from '../../components/ui'
import type { Clause, ObligationRecord, PageResponse } from '../../types/domain'

export function ClauseEditor({ clause, onSaved, onCancel }: { clause: Clause; onSaved: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(clause.title); const [text, setText] = useState(clause.text); const [status, setStatus] = useState(clause.status); const [tier, setTier] = useState(clause.tier); const [guidance, setGuidance] = useState(clause.guidance ?? '')
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const mappings = useResource(async (signal) => { const [catalogue, current] = await Promise.all([api.get<PageResponse<ObligationRecord>>('/obligations?page=1&pageSize=100', signal), api.get<{ obligationIds: string[] }>(`/clauses/${encodeURIComponent(clause.id)}/obligations`, signal)]); return { catalogue: catalogue.items, selected: current.obligationIds } }, [clause.id])
  const [selection, setSelection] = useState<Set<string>>()
  const selected = selection ?? new Set(mappings.data?.selected ?? [])
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await api.patch(`/clauses/${encodeURIComponent(clause.id)}`, { updatedAt: clause.updatedAt, title, text, status, tier, guidance }); await api.put(`/clauses/${encodeURIComponent(clause.id)}/obligations`, { obligationIds: [...selected] }); onSaved() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update clause') } finally { setSaving(false) } }
  return <form className="dialog-form" onSubmit={submit}><div className="form-grid">
    <label className="full"><span>Clause title</span><input required minLength={2} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
    <label><span>Compliance</span><select value={status} onChange={(e) => setStatus(e.target.value as Clause['status'])}><option>Compliant</option><option>Needs Review</option><option>Exception</option></select></label>
    <label><span>Fallback tier</span><select value={tier} onChange={(e) => setTier(e.target.value as Clause['tier'])}><option>Preferred</option><option>Acceptable</option><option>Fallback</option><option>Restricted</option></select></label>
    <label className="full"><span>Clause text</span><textarea required rows={8} value={text} onChange={(e) => setText(e.target.value)} /></label>
    <label className="full"><span>Reviewer guidance</span><textarea rows={3} value={guidance} onChange={(e) => setGuidance(e.target.value)} /></label>
  </div><fieldset className="obligation-picker"><legend>Mapped obligations</legend>{mappings.loading ? <span>Loading obligations…</span> : mappings.error ? <span role="alert">{mappings.error.message}</span> : mappings.data?.catalogue.map((item) => <label key={item.id}><input type="checkbox" checked={selected.has(item.id)} onChange={(event) => setSelection((current) => { const next = new Set(current ?? mappings.data?.selected ?? []); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} /><span><strong>{item.name}</strong><small>{item.id} · {item.category}</small></span></label>)}</fieldset>{error && <p className="form-error" role="alert">{error}</p>}<footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving || mappings.loading}>{saving ? 'Saving…' : 'Save clause'}</Button></footer></form>
}
