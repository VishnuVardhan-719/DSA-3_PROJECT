import { Archive, ArrowLeft, CalendarDays, Download, FilePlus2, FileUp, Pencil, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api, listFrom, valueFrom } from '../api/client'
import { useResource } from '../api/useResource'
import { AsyncState, Badge, Button, PageHeader, Panel } from '../components/ui'
import { Dialog } from '../components/Dialog'
import { ContractEditor } from '../features/contracts/ContractEditor'
import { VersionUpload } from '../features/contracts/VersionUpload'
import { ClauseEditor } from '../features/clauses/ClauseEditor'
import { VersionEditor } from '../features/contracts/VersionEditor'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Clause, Contract, ContractVersion, ReviewItem } from '../types/domain'

const tabs = ['Overview', 'Clauses', 'Versions', 'Compliance', 'Review History']
interface DetailData { contract: Contract; clauses: Clause[]; versions: ContractVersion[]; reviews: ReviewItem[] }

export function ContractDetailPage() {
  const { contractId = '' } = useParams(); const [tab, setTab] = useState('Overview'); const [downloaded, setDownloaded] = useState(false); const [dialog, setDialog] = useState<'edit' | 'upload' | 'version' | 'clause' | 'archive' | null>(null); const [selectedClause, setSelectedClause] = useState<Clause>(); const [archiving, setArchiving] = useState(false); const [actionError, setActionError] = useState('')
  const resource = useResource<DetailData>(async (signal) => {
    const [contractPayload, reviewsPayload] = await Promise.all([
      api.get<unknown>(`/contracts/${encodeURIComponent(contractId)}`, signal),
      api.get<unknown>('/reviews?page=1&pageSize=100', signal),
    ])
    const contract = valueFrom<Contract & { clauses?: Clause[]; versions?: ContractVersion[] }>(contractPayload, 'contract')
    const reviews = listFrom<ReviewItem>(reviewsPayload, 'reviews').filter(item => item.contractId === contractId)
    return { contract, clauses: contract.clauses ?? listFrom<Clause>(contractPayload, 'clauses'), versions: contract.versions ?? listFrom<ContractVersion>(contractPayload, 'versions'), reviews }
  }, [contractId])
  const download = () => {
    if (!resource.data) return
    const blob = new Blob([JSON.stringify(resource.data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${resource.data.contract.id}-summary.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setDownloaded(true); window.setTimeout(() => { URL.revokeObjectURL(url); setDownloaded(false) }, 2000)
  }
  const archive = async () => { if (!contract) return; setArchiving(true); setActionError(''); try { await api.post(`/contracts/${encodeURIComponent(contract.id)}/archive`, {}); window.location.assign('/contracts') } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to archive contract'); setDialog(null) } finally { setArchiving(false) } }
  const refreshed = async () => { setDialog(null); setSelectedClause(undefined); await resource.reload() }
  const contract = resource.data?.contract; const clauses = resource.data?.clauses ?? []; const versions = resource.data?.versions ?? []; const reviews = resource.data?.reviews ?? []
  return <><Link to="/contracts" className="back-link"><ArrowLeft size={15} /> Contract register</Link><PageHeader eyebrow={contract?.id ?? contractId} title={contract?.name ?? 'Contract detail'} description={contract?.type ?? 'Loading contract record'} actions={<><Button variant="quiet" onClick={() => setDialog('edit')} disabled={!contract}><Pencil size={15} /> Edit record</Button><Button variant="secondary" onClick={() => setDialog('version')} disabled={!contract}><FilePlus2 size={16} /> Create version</Button><Button variant="secondary" onClick={() => setDialog('upload')} disabled={!contract}><FileUp size={16} /> Import document</Button><Button variant="secondary" onClick={download} disabled={!contract}><Download size={16} /> Download summary</Button><Button variant="quiet" onClick={() => setDialog('archive')} disabled={!contract}><Archive size={15} /> Archive</Button></>} />
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {downloaded && <div className="toast" role="status"><span className="toast-check">✓</span>Fetched-data summary generated in this browser</div>}
    <AsyncState loading={resource.loading} error={resource.error} empty={!contract} onRetry={resource.retry}>{contract && <><div className="detail-status"><div><span>Compliance</span><Badge>{contract.compliance}</Badge></div><div><span>Review</span><Badge>{contract.reviewStatus}</Badge></div><div><span>Current version</span><strong>{contract.currentVersion}</strong></div><div><span>Owner</span><strong>{contract.owner}</strong></div></div><div className="tabs" role="tablist">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Overview' && <div className="detail-grid"><Panel title="Record details" description="Ownership and lifecycle"><dl className="metadata-grid"><div><dt>Owner</dt><dd><UserRound size={15} />{contract.owner}</dd></div><div><dt>Department</dt><dd>{contract.department}</dd></div><div><dt>Effective date</dt><dd><CalendarDays size={15} />{contract.effectiveDate}</dd></div><div><dt>Expiry date</dt><dd><CalendarDays size={15} />{contract.expiryDate}</dd></div><div><dt>Current version</dt><dd>{contract.currentVersion}</dd></div><div><dt>Risk classification</dt><dd><Badge>{contract.risk}</Badge></dd></div></dl></Panel><Panel title="Review position" description="Current persisted assessment"><div className="review-position"><div className="score-ring"><strong>{clauses.filter(c => c.status === 'Compliant').length}/{clauses.length}</strong><span>clauses clear</span></div><div><h3>{contract.reviewStatus}</h3><p>{clauses.filter(c => c.status !== 'Compliant').length} clause items need attention.</p><Button variant="secondary" onClick={() => setTab('Compliance')}>View compliance</Button></div></div></Panel><Panel title="Key clauses" description="Provisions from the current version" className="span-2 clause-dossier"><ClauseCards clauses={clauses.slice(0, 4)} /></Panel></div>}
      {tab === 'Clauses' && <Panel title="Contract clauses" description={`${clauses.length} clauses in ${contract.currentVersion}`}><div className="clause-list">{clauses.map((clause) => <article key={clause.id}><div><strong>{clause.id} / {clause.title}</strong><span className="inline-actions"><Badge>{clause.status}</Badge><Button variant="quiet" onClick={() => { setSelectedClause(clause); setDialog('clause') }}><Pencil size={13} /> Edit</Button></span></div><p>{clause.text}</p><footer>{clause.tags?.map((tag) => <span key={tag}>{tag}</span>)}</footer></article>)}</div></Panel>}
      {tab === 'Versions' && <Panel title="Version history" description="Persisted contract versions"><div className="timeline">{versions.map((version) => <div key={version.id}><i /><div><strong>{version.label}</strong><span>{version.date} · {version.author}</span><p>{version.note}</p></div></div>)}</div></Panel>}
      {tab === 'Compliance' && <Panel title="Compliance position" description="Clause-level compliance results"><div className="check-list">{clauses.map(clause => <div key={clause.id}><span>{clause.id} · {clause.title}</span><Badge>{clause.status}</Badge></div>)}</div></Panel>}
      {tab === 'Review History' && <Panel title="Review history" description="Persistent review activity for this contract">{reviews.length ? <div className="activity-list">{reviews.map(review => <div key={review.id}><span className="avatar small">{review.reviewer.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><p><strong>{review.reviewer}</strong> {review.issue} <span>{review.due} · {review.status}</span></p></div>)}</div> : <p className="muted">No review activity is recorded for this contract.</p>}</Panel>}
    </>}</AsyncState>
    <Dialog open={dialog === 'edit'} title="Edit contract record" description="Concurrency checks prevent overwriting a newer server copy." onClose={() => setDialog(null)}>{contract && <ContractEditor contract={contract} onCancel={() => setDialog(null)} onSaved={refreshed} />}</Dialog>
    <Dialog open={dialog === 'upload'} title="Import contract version" description={`Create a new version for ${contract?.id ?? contractId} from a local document.`} onClose={() => setDialog(null)}><VersionUpload contractId={contractId} onCancel={() => setDialog(null)} onSaved={refreshed} /></Dialog>
    <Dialog open={dialog === 'version'} title="Create structured version" description="Enter clause wording directly when no source document is available." onClose={() => setDialog(null)}><VersionEditor contractId={contractId} onCancel={() => setDialog(null)} onSaved={refreshed} /></Dialog>
    <Dialog open={dialog === 'clause'} title="Edit clause" description={selectedClause?.id} onClose={() => setDialog(null)}>{selectedClause && <ClauseEditor clause={selectedClause} onCancel={() => setDialog(null)} onSaved={refreshed} />}</Dialog>
    <ConfirmDialog open={dialog === 'archive'} title="Archive contract" message={`Archive ${contract?.name ?? contractId}? It will leave active views, but can be restored from the contract register by enabling Show archived.`} confirmLabel="Archive contract" busy={archiving} onClose={() => setDialog(null)} onConfirm={archive} />
  </>
}

function ClauseCards({ clauses }: { clauses: Clause[] }) { return clauses.length ? <div className="clause-grid">{clauses.map((clause) => <article className="clause-card" key={clause.id}><div><span>{clause.id}</span><Badge>{clause.status}</Badge></div><h3>{clause.title}</h3><p>“{clause.text}”</p><footer>{clause.tags?.map((tag) => <span key={tag}>{tag}</span>)}</footer></article>)}</div> : <p className="muted">No clauses are attached to this contract.</p> }
