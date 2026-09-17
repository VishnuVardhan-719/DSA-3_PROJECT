import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { Button } from '../../components/ui'
import type { Reviewer } from '../../types/domain'

export function ReviewerEditor({ reviewer, onSaved, onCancel }: { reviewer?: Reviewer; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(reviewer?.name ?? ''); const [role, setRole] = useState(reviewer?.role ?? ''); const [capacity, setCapacity] = useState(reviewer?.capacity ?? 5); const [expertise, setExpertise] = useState(reviewer?.expertise.join(', ') ?? '')
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); const payload = { name, role, capacity, expertise: expertise.split(',').map((item) => item.trim()).filter(Boolean) }; try { if (reviewer) await api.patch(`/reviewers/${reviewer.id}`, { ...payload, updatedAt: reviewer.updatedAt }); else await api.post('/reviewers', payload); onSaved() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save reviewer') } finally { setSaving(false) } }
  return <form className="dialog-form" onSubmit={submit}><div className="form-grid">
    <label><span>Full name</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label>
    <label><span>Role</span><input required minLength={2} value={role} onChange={(e) => setRole(e.target.value)} /></label>
    <label><span>Review capacity</span><input required type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></label>
    <label className="full"><span>Expertise (comma separated)</span><input required value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Data Protection, SaaS, Procurement" /></label>
  </div>{error && <p className="form-error" role="alert">{error}</p>}<footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : reviewer ? 'Save reviewer' : 'Add reviewer'}</Button></footer></form>
}
