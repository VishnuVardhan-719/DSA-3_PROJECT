import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractDatasetImporter } from './ContractDatasetImporter'

describe('ContractDatasetImporter', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uploads a selected JSON dataset through the typed API client', async () => {
    const onImported = vi.fn()
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ imported: 1, contractIds: ['CTR-013'], filename: 'cuad.json' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<ContractDatasetImporter onImported={onImported} onCancel={() => undefined} />)

    await user.upload(screen.getByLabelText('Dataset file'), new File(['[{"name":"CUAD sample"}]'], 'cuad.json', { type: 'application/json' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Import dataset' }).closest('form')!)

    await vi.waitFor(() => expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ imported: 1, contractIds: ['CTR-013'] })))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/contracts/import-dataset'), expect.objectContaining({ method: 'POST', body: expect.any(FormData) }))
  })
})