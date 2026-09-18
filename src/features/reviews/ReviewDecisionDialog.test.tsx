import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewDecisionDialog } from './ReviewDecisionDialog'

describe('ReviewDecisionDialog', () => {
  it('submits the reviewer identity and meaningful notes', async () => {
    const submit = vi.fn()
    const user = userEvent.setup()
    render(<ReviewDecisionDialog open decision="Approved" reviewLabel="Data Processing Agreement" onClose={() => undefined} onSubmit={submit} />)

    await user.type(screen.getByLabelText('Decision notes'), 'Approved after verifying the revised retention clause.')
    await user.clear(screen.getByLabelText('Decided by'))
    await user.type(screen.getByLabelText('Decided by'), 'Anita Rao')
    await user.click(screen.getByRole('button', { name: 'Record decision' }))

    expect(submit).toHaveBeenCalledWith({
      decision: 'Approved',
      notes: 'Approved after verifying the revised retention clause.',
      decidedBy: 'Anita Rao',
    })
  })
})
