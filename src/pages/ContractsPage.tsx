import { ContractRegister } from '../features/contracts/ContractRegister'
import { PageHeader } from '../components/ui'

export function ContractsPage() {
  return <><PageHeader title="Contracts" description="Browse the contract corpus and track current versions, ownership, and review status." /><ContractRegister /></>
}
