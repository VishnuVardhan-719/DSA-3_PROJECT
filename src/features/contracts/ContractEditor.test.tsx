import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractEditor } from './ContractEditor'

describe('ContractEditor', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a contract using the typed API payload', async () => {
    const onSaved = vi.fn()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({ id: 'CTR-013', ...JSON.parse(String(init?.body)) }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<ContractEditor onSaved={onSaved} onCancel={() => undefined} />)

    await user.type(screen.getByLabelText('Contract name'), 'Infrastructure Services Agreement')
    await user.type(screen.getByLabelText('Counterparty'), 'Northwind Infrastructure')
    await user.type(screen.getByLabelText('Owner'), 'Anita Rao')
    await user.type(screen.getByLabelText('Effective date'), '2026-10-01')
    await user.type(screen.getByLabelText('Expiry date'), '2027-10-01')
    await user.click(screen.getByRole('button', { name: 'Create contract' }))

    expect(onSaved).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/contracts'), expect.objectContaining({ method: 'POST' }))
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain('Infrastructure Services Agreement')
  })
})
