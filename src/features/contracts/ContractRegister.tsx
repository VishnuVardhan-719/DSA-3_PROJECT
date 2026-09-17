import { ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import { useResource } from '../../api/useResource'
import { AsyncState, Badge, EmptyResults, Panel, SearchInput, Select } from '../../components/ui'
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

  const resource = useResource((signal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const sort = SORT_OPTIONS[sortLabel]
    params.set('sort', sort.sort)
    params.set('direction', sort.direction)
    if (query.trim()) params.set('query', query.trim())
    if (status !== 'All') params.set('compliance', status)
    if (department !== 'All') params.set('department', department)
    return api.get<PageResponse<Contract>>(`/contracts?${params}`, signal)
  }, [page, pageSize, query, status, department, sortLabel, refreshToken])

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
          <span className="filter-summary"><ListFilter size={16} />{data?.total ?? 0} records</span>
        </div>

        {contracts.length ? (
          <div className="table-scroll">
            <table className="contracts-table">
              <thead><tr><th>Contract</th><th>Type</th><th>Current version</th><th>Last modified</th><th>Owner</th><th>Compliance</th><th>Review status</th></tr></thead>
              <tbody>{contracts.map((contract) => (
                <tr key={contract.id}>
                  <td><Link className="contract-link" to={`/contracts/${contract.id}`}><strong>{contract.name}</strong><span>{contract.id}</span></Link></td>
                  <td>{contract.type}</td>
                  <td><span className="version-pill">{contract.currentVersion}</span></td>
                  <td>{contract.lastModified}</td>
                  <td><div className="owner-cell"><span>{contract.owner.split(' ').map((part) => part[0]).join('').slice(0, 3)}</span>{contract.owner}</div></td>
                  <td><Badge>{contract.compliance}</Badge></td>
                  <td><Badge>{contract.reviewStatus}</Badge></td>
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
