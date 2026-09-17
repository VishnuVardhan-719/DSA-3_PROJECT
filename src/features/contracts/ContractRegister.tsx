import { ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import { useResource } from '../../api/useResource'
import { AsyncState, Badge, Button, EmptyResults, Panel, SearchInput, Select } from '../../components/ui'
import type { Contract, PageResponse } from '../../types/domain'

const SORT_OPTIONS = {
  'Recently modified': { sort: 'lastModified', direction: 'desc' },
  Name: { sort: 'name', direction: 'asc' },
  Risk: { sort: 'risk', direction: 'desc' },
} as const
const EMPTY_CONTRACTS: Contract[] = []

export function ContractRegister({ refreshToken = 0 }: { refreshToken?: number }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [department, setDepartment] = useState('All')
  const [sortLabel, setSortLabel] = useState<keyof typeof SORT_OPTIONS>('Recently modified')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('archive')
  const [mutationError, setMutationError] = useState('')
  const [mutating, setMutating] = useState(false)

  const resource = useResource((signal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const sort = SORT_OPTIONS[sortLabel]
    params.set('sort', sort.sort)
    params.set('direction', sort.direction)
    if (query.trim()) params.set('query', query.trim())
    if (status !== 'All') params.set('compliance', status)
    if (department !== 'All') params.set('department', department)
    if (includeArchived) params.set('includeArchived', 'true')
    return api.get<PageResponse<Contract>>(`/contracts?${params}`, signal)
  }, [page, pageSize, query, status, department, sortLabel, includeArchived, refreshToken])

  const data = resource.data
  const contracts = data?.items ?? EMPTY_CONTRACTS
  const departments = useMemo(
    () => [...new Set(contracts.map((contract) => contract.department))].sort(),
    [contracts],
  )
  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }
  const reset = () => {
    setQuery('')
    setStatus('All')
    setDepartment('All')
    setSortLabel('Recently modified')
    setPage(1)
  }
  const firstRecord = data?.total ? (page - 1) * pageSize + 1 : 0
  const lastRecord = data ? Math.min(page * pageSize, data.total) : 0
  const runBulkAction = async () => {
    if (!selected.size) return
    setMutating(true); setMutationError('')
    try {
      const [action, value] = bulkAction.startsWith('status:') ? ['set_compliance', bulkAction.slice(7)] : [bulkAction, undefined]
      await api.post('/contracts/bulk-actions', { contractIds: [...selected], action, ...(value ? { value } : {}) })
      setSelected(new Set()); await resource.reload()
    } catch (reason) { setMutationError(reason instanceof Error ? reason.message : 'Bulk action failed') }
    finally { setMutating(false) }
  }

  return (
    <AsyncState loading={resource.loading} error={resource.error} onRetry={resource.retry}>
      <Panel className="table-panel">
        <div className="filter-bar">
          <SearchInput
            value={query}
            onChange={(event) => changeFilter(setQuery, event.target.value)}
            placeholder="Search contracts or IDs..."
            aria-label="Search contracts"
          />
          <Select label="Compliance" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>
            <option>All</option><option>Compliant</option><option>Needs Review</option><option>Exception</option>
          </Select>
          <Select label="Department" value={department} onChange={(event) => changeFilter(setDepartment, event.target.value)}>
            <option>All</option>{departments.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select label="Sort by" value={sortLabel} onChange={(event) => { setSortLabel(event.target.value as keyof typeof SORT_OPTIONS); setPage(1) }}>
            {Object.keys(SORT_OPTIONS).map((item) => <option key={item}>{item}</option>)}
          </Select>
          <label className="archive-toggle"><input type="checkbox" checked={includeArchived} onChange={(event) => { setIncludeArchived(event.target.checked); setSelected(new Set()); setPage(1) }} /> Show archived</label>
          <span className="filter-summary"><ListFilter size={16} />{data?.total ?? 0} records</span>
        </div>
        {selected.size > 0 && <div className="bulk-toolbar"><strong>{selected.size} selected</strong><select aria-label="Bulk action" value={bulkAction} onChange={(event) => setBulkAction(event.target.value)}><option value="archive">Archive</option><option value="restore">Restore</option><option value="status:Compliant">Mark compliant</option><option value="status:Needs Review">Mark needs review</option><option value="status:Exception">Mark exception</option></select><Button variant="secondary" onClick={runBulkAction} disabled={mutating}>{mutating ? 'Applying…' : 'Apply'}</Button><Button variant="quiet" onClick={() => setSelected(new Set())}>Clear</Button></div>}
        {mutationError && <p className="form-error" role="alert">{mutationError}</p>}

        {contracts.length ? (
          <div className="table-scroll">
            <table className="contracts-table">
              <thead><tr><th className="selection-cell"><input type="checkbox" aria-label="Select current page" checked={contracts.length > 0 && contracts.every((item) => selected.has(item.id))} onChange={(event) => setSelected((current) => { const next = new Set(current); contracts.forEach((item) => event.target.checked ? next.add(item.id) : next.delete(item.id)); return next })} /></th><th>Contract</th><th>Type</th><th>Current version</th><th>Last modified</th><th>Owner</th><th>Compliance</th><th>Review status</th></tr></thead>
              <tbody>{contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="selection-cell"><input type="checkbox" aria-label={`Select ${contract.name}`} checked={selected.has(contract.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(contract.id); else next.delete(contract.id); return next })} /></td>
                  <td><Link className="contract-link" to={`/contracts/${contract.id}`}><strong>{contract.name}</strong><span>{contract.id}</span></Link></td>
                  <td>{contract.type}</td>
                  <td><span className="version-pill">{contract.currentVersion}</span></td>
                  <td>{contract.lastModified}</td>
                  <td><div className="owner-cell"><span>{contract.owner.split(' ').map((part) => part[0]).join('').slice(0, 3)}</span>{contract.owner}</div></td>
                  <td><Badge>{contract.compliance}</Badge></td>
                  <td><Badge tone={contract.archivedAt ? 'archived' : undefined}>{contract.archivedAt ? 'Archived' : contract.reviewStatus}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyResults onReset={reset} />}

        <div className="table-footer">
          <span>{data?.total ? `Showing ${firstRecord}–${lastRecord} of ${data.total}` : 'No contracts found'}</span>
          <div>
            <Select label="Rows" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
              <option value="5">5</option><option value="10">10</option><option value="20">20</option>
            </Select>
            <button type="button" aria-label="Previous page" disabled={page <= 1 || resource.loading} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <button type="button" className="current" aria-current="page">{page}</button>
            <button type="button" aria-label="Next page" disabled={!data || page >= data.totalPages || resource.loading} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      </Panel>
    </AsyncState>
  )
}
