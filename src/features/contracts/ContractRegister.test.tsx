import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractRegister } from './ContractRegister'
import type { Contract, PageResponse } from '../../types/domain'


function contract(id: string, name: string): Contract {
  return {
    id,
    name,
    type: 'Services',
    currentVersion: 'v1.0',
    lastModified: '2026-09-17',
    owner: 'Legal Operations',
    department: 'Legal',
    compliance: 'Needs Review',
    reviewStatus: 'Pending',
    effectiveDate: '2026-10-01',
    expiryDate: '2027-10-01',
    risk: 'Medium',
    counterparty: 'Supplier',
    jurisdiction: 'India',
    description: '',
    updatedAt: '2026-09-17T10:00:00',
  }
}


function response(page: number, items: Contract[]): PageResponse<Contract> {
  return { items, page, pageSize: 5, total: 12, totalPages: 3 }
}


describe('ContractRegister', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests the next server page and renders its records', async () => {
    const firstPage = [contract('CTR-001', 'First Agreement')]
    const secondPage = [contract('CTR-006', 'Second Page Agreement')]
    const requests: string[] = []
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      requests.push(String(input))
      const payload = requests.length === 1 ? response(1, firstPage) : response(2, secondPage)
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<MemoryRouter><ContractRegister /></MemoryRouter>)
    expect(await screen.findByText('First Agreement')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Second Page Agreement')).toBeVisible()
    expect(requests[1]).toContain('page=2&pageSize=5')
  })
})
