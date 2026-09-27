import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/overview']}>
      <AppShell>
        <div>Workspace content</div>
      </AppShell>
    </MemoryRouter>,
  )
}

function stubHealth(payload: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })))
}

describe('AppShell API identity badge', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('accepts this platform as the answering service', async () => {
    stubHealth({ status: 'ok', database: 'ok', service: 'contract-compliance-platform' })
    renderShell()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Local API' })).toBeInTheDocument())
  })

  it('flags an unrelated service answering on the configured port', async () => {
    // Any FastAPI service answers /health, so a bare `{ status: 'ok' }` means the
    // configured address belongs to something else and its data must not be trusted.
    stubHealth({ status: 'ok' })
    renderShell()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Wrong API' })).toBeInTheDocument())
  })
})
