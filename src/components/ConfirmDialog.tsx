import { Dialog } from './Dialog'
import { Button } from './ui'

export function ConfirmDialog({ open, title, message, confirmLabel, busy = false, onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Dialog open={open} title={title} onClose={() => { if (!busy) onClose() }}><div className="confirm-content"><p>{message}</p><footer className="dialog-actions"><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</Button></footer></div></Dialog>
}
