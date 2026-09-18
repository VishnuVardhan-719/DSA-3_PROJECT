import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ObligationManager } from './ObligationManager'

describe('ObligationManager', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reveals archived obligations and restores one to the active catalogue', async () => {
    let restored = false
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST' && url.endsWith('/obligations/OBL-11/restore')) {
        restored = true
        return new Response(JSON.stringify({ id: 'OBL-11', name: 'Incident escalation', category: 'Security', description: 'Escalate incidents.', archivedAt: null, updatedAt: '2026-09-18T10:00:00' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      const items = url.includes('includeArchived=true') ? [{ id: 'OBL-11', name: 'Incident escalation', category: 'Security', description: 'Escalate incidents.', archivedAt: restored ? null : '2026-09-17T10:00:00', updatedAt: '2026-09-18T10:00:00' }] : []
      return new Response(JSON.stringify({ items, page: 1, pageSize: 100, total: items.length, totalPages: items.length ? 1 : 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }))
    const user = userEvent.setup()
    render(<ObligationManager />)

    await user.click(await screen.findByLabelText('Show archived obligations'))
    expect(await screen.findByText('Incident escalation')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Restore' }))

    expect(await screen.findByRole('button', { name: 'Archive' })).toBeVisible()
  })
})
