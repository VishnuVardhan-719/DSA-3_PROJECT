import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { Button } from '../../components/ui'

export function VersionUpload({ contractId, onSaved, onCancel }: { contractId: string; onSaved: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File>()
  const [label, setLabel] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [author, setAuthor] = useState('')
  const [note, setNote] = useState('Imported local document')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) { setError('Choose a PDF, DOCX, or TXT document.'); return }
    setSaving(true); setError('')
    const body = new FormData()
    body.set('label', label); body.set('effectiveDate', effectiveDate); body.set('author', author); body.set('note', note); body.set('file', file)
    try { await api.upload(`/contracts/${encodeURIComponent(contractId)}/versions/upload`, body); onSaved() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to import document') }
    finally { setSaving(false) }
  }
  return <form className="dialog-form" onSubmit={submit}>
    <div className="upload-notice"><strong>Local ingestion only</strong><span>The backend validates and stores this file locally. Maximum size: 10 MiB.</span></div>
    <div className="form-grid">
      <label><span>Version label</span><input required maxLength={20} placeholder="v2.0" value={label} onChange={(e) => setLabel(e.target.value)} /></label>
      <label><span>Effective date</span><input required type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></label>
      <label className="full"><span>Author</span><input required minLength={2} value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
      <label className="full"><span>Source document</span><input required type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => setFile(e.target.files?.[0])} /></label>
      <label className="full"><span>Version note</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Importing…' : 'Import version'}</Button></footer>
  </form>
}
