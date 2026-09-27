import { ContractRegister } from '../features/contracts/ContractRegister'
import { Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '../components/Dialog'
import { Button, PageHeader } from '../components/ui'
import { ContractEditor } from '../features/contracts/ContractEditor'
import { ContractDatasetImporter } from '../features/contracts/ContractDatasetImporter'

export function ContractsPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [importerOpen, setImporterOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const navigate = useNavigate()
  return <>
    <PageHeader title="Contracts" description="Browse the contract corpus and track current versions, ownership, and review status." actions={<><Button variant="secondary" onClick={() => setImporterOpen(true)}><Upload size={16} /> Import dataset</Button><Button onClick={() => setEditorOpen(true)}><Plus size={16} /> Add contract manually</Button></>} />
    <ContractRegister refreshToken={refreshToken} />
    <Dialog open={editorOpen} title="Create contract" description="Add the core record now; versions and clauses can be attached from its detail page." onClose={() => setEditorOpen(false)}>
      <ContractEditor onCancel={() => setEditorOpen(false)} onSaved={(contract) => { setEditorOpen(false); setRefreshToken((value) => value + 1); navigate(`/contracts/${contract.id}`) }} />
    </Dialog>
    <Dialog open={importerOpen} title="Import contract dataset" description="Load normalized CUAD or SEC/EDGAR exports before creating contracts manually." onClose={() => setImporterOpen(false)}>
      <ContractDatasetImporter onCancel={() => setImporterOpen(false)} onImported={() => { setImporterOpen(false); setRefreshToken((value) => value + 1) }} />
    </Dialog>
  </>
}
