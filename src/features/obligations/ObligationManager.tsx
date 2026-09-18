import { Archive, Pencil, Plus, RotateCcw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { useResource } from '../../api/useResource'
import { AsyncState, Button } from '../../components/ui'
import type { ObligationRecord, PageResponse } from '../../types/domain'

export function ObligationManager({ onChanged }: { onChanged?: () => void }) {
  const [showArchived, setShowArchived] = useState(false)
  const resource = useResource((signal) => api.get<PageResponse<ObligationRecord>>(`/obligations?page=1&pageSize=100${showArchived ? '&includeArchived=true' : ''}`, signal), [showArchived])
  const [editing, setEditing] = useState<ObligationRecord | 'new'>()
  const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const begin = (item?: ObligationRecord) => { setEditing(item ?? 'new'); setName(item?.name ?? ''); setCategory(item?.category ?? ''); setDescription(item?.description ?? ''); setError('') }
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { if (editing === 'new') await api.post('/obligations', { name, category, description }); else if (editing) await api.patch(`/obligations/${editing.id}`, { name, category, description, updatedAt: editing.updatedAt }); setEditing(undefined); await resource.reload(); onChanged?.() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save obligation') } finally { setSaving(false) } }
  const archive = async (item: ObligationRecord) => { if (!window.confirm(`Archive ${item.name}?`)) return; try { await api.post(`/obligations/${item.id}/archive`, {}); await resource.reload(); onChanged?.() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to archive obligation') } }
  const restore = async (item: ObligationRecord) => { try { await api.post(`/obligations/${item.id}/restore`, {}); await resource.reload(); onChanged?.() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restore obligation') } }
  const items = resource.data?.items ?? []
  return <AsyncState loading={resource.loading} error={resource.error} onRetry={resource.retry}><div className="manager-toolbar"><div><strong>Obligation catalogue</strong><span>{items.filter((item) => !item.archivedAt).length} active controls</span></div><label className="archive-toggle"><input type="checkbox" aria-label="Show archived obligations" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived</label><Button variant="secondary" onClick={() => begin()}><Plus size={14} /> New obligation</Button></div>
    {editing && <form className="inline-editor" onSubmit={save}><label><span>Name</span><input aria-label="Obligation name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label><label><span>Category</span><input required minLength={2} value={category} onChange={(e) => setCategory(e.target.value)} /></label><label className="wide"><span>Description</span><input required value={description} onChange={(e) => setDescription(e.target.value)} /></label><div><Button type="button" variant="quiet" onClick={() => setEditing(undefined)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save obligation'}</Button></div></form>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="manager-list">{items.map((item) => <article key={item.id} className={item.archivedAt ? 'is-inactive' : ''}><div><span>{item.id}</span><strong>{item.name}</strong><small>{item.category} · {item.description}{item.archivedAt ? ' · Archived' : ''}</small></div><div>{item.archivedAt ? <Button variant="quiet" onClick={() => restore(item)}><RotateCcw size={13} /> Restore</Button> : <><Button variant="quiet" onClick={() => begin(item)}><Pencil size={13} /> Edit</Button><Button variant="quiet" onClick={() => archive(item)}><Archive size={13} /> Archive</Button></>}</div></article>)}</div>
  </AsyncState>
}
