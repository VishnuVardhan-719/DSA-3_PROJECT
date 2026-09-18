import { Archive, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Button } from '../../components/ui'

export function ClauseLifecycleActions({ clauseId, clauseTitle, archived, onChanged }: { clauseId: string; clauseTitle: string; archived: boolean; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const action = archived ? 'restore' : 'archive'
  const apply = async () => { setBusy(true); setError(''); try { await api.post(`/clauses/${encodeURIComponent(clauseId)}/${action}`, {}); setMessage(archived ? 'Clause restored.' : 'Clause archived.'); setConfirming(false); onChanged() } catch (reason) { setError(reason instanceof Error ? reason.message : `Unable to ${action} clause`); setConfirming(false) } finally { setBusy(false) } }
  return <><Button variant="quiet" onClick={() => { setMessage(''); setConfirming(true) }}>{archived ? <RotateCcw size={13} /> : <Archive size={13} />}{archived ? 'Restore clause' : 'Archive clause'}</Button>{message && <span className="sr-status" role="status">{message}</span>}{error && <span className="inline-error" role="alert">{error}</span>}<ConfirmDialog open={confirming} title={`${archived ? 'Restore' : 'Archive'} clause`} message={archived ? `Restore ${clauseTitle} to active analysis views?` : `Archive ${clauseTitle}? It will leave analysis views but can be restored from this contract.`} confirmLabel={archived ? 'Restore clause' : 'Archive clause'} busy={busy} onClose={() => setConfirming(false)} onConfirm={apply} /></>
}
