import { useState, type FormEvent } from 'react'
import { Dialog } from '../../components/Dialog'
import { Button } from '../../components/ui'

export type ReviewDecisionPayload = { decision: 'Approved' | 'Rejected' | 'Needs Clarification'; notes: string; decidedBy: string }

export function ReviewDecisionDialog({ open, decision, reviewLabel, busy = false, error = '', onClose, onSubmit }: { open: boolean; decision: ReviewDecisionPayload['decision']; reviewLabel: string; busy?: boolean; error?: string; onClose: () => void; onSubmit: (payload: ReviewDecisionPayload) => void }) {
  const [notes, setNotes] = useState('')
  const [decidedBy, setDecidedBy] = useState('Compliance Reviewer')
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ decision, notes: notes.trim(), decidedBy: decidedBy.trim() }) }
  return <Dialog open={open} title={`Record ${decision.toLowerCase()} decision`} description={reviewLabel} onClose={() => { if (!busy) onClose() }}><form className="dialog-form" onSubmit={submit}><div className="form-grid"><label className="full"><span>Decision notes</span><textarea required minLength={3} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><label className="full"><span>Decided by</span><input required value={decidedBy} onChange={(event) => setDecidedBy(event.target.value)} /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Recording…' : 'Record decision'}</Button></footer></form></Dialog>
}
