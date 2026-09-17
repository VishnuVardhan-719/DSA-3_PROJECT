import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

export function Dialog({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const cardRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const timer = window.setTimeout(() => cardRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus(), 0)
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', close); previous?.focus() }
  }, [open, onClose])
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={cardRef} className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header><div><h2 id="dialog-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
      {children}
    </section>
  </div>
}
