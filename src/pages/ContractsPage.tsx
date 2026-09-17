import { ContractRegister } from '../features/contracts/ContractRegister'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '../components/Dialog'
import { Button, PageHeader } from '../components/ui'
import { ContractEditor } from '../features/contracts/ContractEditor'

export function ContractsPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  return <>
    <PageHeader title="Contracts" description="Browse the contract corpus and track current versions, ownership, and review status." actions={<Button onClick={() => setEditorOpen(true)}><Plus size={16} /> Add contract</Button>} />
    <ContractRegister refreshToken={refreshToken} />
    <Dialog open={editorOpen} title="Create contract" description="Add the core record now; versions and clauses can be attached from its detail page." onClose={() => setEditorOpen(false)}>
      <ContractEditor onCancel={() => setEditorOpen(false)} onSaved={() => { setEditorOpen(false); setRefreshToken((value) => value + 1) }} />
    </Dialog>
  </>
}
