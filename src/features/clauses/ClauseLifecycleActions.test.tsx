import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClauseLifecycleActions } from './ClauseLifecycleActions'

describe('ClauseLifecycleActions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('archives an active clause only after confirmation', async () => {
    const changed = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'CTR-001-C01', archivedAt: '2026-09-18T10:00:00' }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    const user = userEvent.setup()
    render(<ClauseLifecycleActions clauseId="CTR-001-C01" clauseTitle="Scope" archived={false} onChanged={changed} />)

    await user.click(screen.getByRole('button', { name: 'Archive clause' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('can be restored')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archive clause' }))

    expect(await screen.findByText('Clause archived.')).toBeVisible()
    expect(changed).toHaveBeenCalledOnce()
  })
})
