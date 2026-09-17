import { Archive, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { useResource } from '../../api/useResource'
import { AsyncState, Button } from '../../components/ui'
import type { ObligationRecord, PageResponse } from '../../types/domain'

export function ObligationManager() {
  const resource = useResource((signal) => api.get<PageResponse<ObligationRecord>>('/obligations?page=1&pageSize=100', signal), [])
  const [editing, setEditing] = useState<ObligationRecord | 'new'>()
  const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const begin = (item?: ObligationRecord) => { setEditing(item ?? 'new'); setName(item?.name ?? ''); setCategory(item?.category ?? ''); setDescription(item?.description ?? ''); setError('') }
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { if (editing === 'new') await api.post('/obligations', { name, category, description }); else if (editing) await api.patch(`/obligations/${editing.id}`, { name, category, description, updatedAt: editing.updatedAt }); setEditing(undefined); await resource.reload() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save obligation') } finally { setSaving(false) } }
  const archive = async (item: ObligationRecord) => { if (!window.confirm(`Archive ${item.name}?`)) return; try { await api.post(`/obligations/${item.id}/archive`, {}); await resource.reload() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to archive obligation') } }
  return <AsyncState loading={resource.loading} error={resource.error} onRetry={resource.retry}><div className="manager-toolbar"><div><strong>Obligation catalogue</strong><span>{resource.data?.total ?? 0} active controls</span></div><Button variant="secondary" onClick={() => begin()}><Plus size={14} /> New obligation</Button></div>
    {editing && <form className="inline-editor" onSubmit={save}><label><span>Name</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label><label><span>Category</span><input required minLength={2} value={category} onChange={(e) => setCategory(e.target.value)} /></label><label className="wide"><span>Description</span><input required value={description} onChange={(e) => setDescription(e.target.value)} /></label><div><Button type="button" variant="quiet" onClick={() => setEditing(undefined)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div></form>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="manager-list">{resource.data?.items.map((item) => <article key={item.id}><div><span>{item.id}</span><strong>{item.name}</strong><small>{item.category} · {item.description}</small></div><div><Button variant="quiet" onClick={() => begin(item)}><Pencil size={13} /> Edit</Button><Button variant="quiet" onClick={() => archive(item)}><Archive size={13} /> Archive</Button></div></article>)}</div>
  </AsyncState>
}
