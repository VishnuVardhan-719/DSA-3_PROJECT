import { ArrowDown, Check, CircleHelp, Layers3, Settings2, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api, isMissingRoute, listFrom, valueFrom } from '../api/client'
import { useResource } from '../api/useResource'
import { AsyncState, Badge, Button, PageHeader, Panel, Select } from '../components/ui'
import type { ComplianceObligation, Contract, CoverageResult } from '../types/domain'
import { Dialog } from '../components/Dialog'
import { ObligationManager } from '../features/obligations/ObligationManager'

interface CoverageData extends CoverageResult { obligations: ComplianceObligation[]; candidateClauses?: string[]; selectedClauseIds?: string[] }
const EMPTY_OBLIGATIONS: ComplianceObligation[] = []

export function ComplianceCoveragePage() {
  const contractsResource = useResource((signal) => api.get<unknown>('/contracts?page=1&pageSize=100', signal).then(p => listFrom<Contract>(p, 'contracts')), [])
  const [contractId, setContractId] = useState('')
  const [managerOpen, setManagerOpen] = useState(false)
  const effectiveContractId = contractId || contractsResource.data?.[0]?.id || ''
  const coverageResource = useResource(async (signal) => { if (!effectiveContractId) return undefined; let payload: unknown; try { payload = await api.post<unknown>('/compliance/coverage', { contractId: effectiveContractId }, signal) } catch (error) { if (!isMissingRoute(error)) throw error; payload = await api.get<unknown>(`/compliance/coverage?contractId=${encodeURIComponent(effectiveContractId)}`, signal) } const result = valueFrom<CoverageData>(payload, 'coverage'); return { ...result, obligations: result.obligations ?? listFrom<ComplianceObligation>(payload, 'obligations') } }, [effectiveContractId])
  const result = coverageResource.data; const obligations = result?.obligations ?? EMPTY_OBLIGATIONS; const selected = result?.selectedClauseIds ?? result?.selectedClauses ?? []
  const candidates = useMemo(() => result?.candidateClauses ?? [...new Set(obligations.flatMap(obligation => obligation.clauses ?? []))], [obligations, result?.candidateClauses]); const covered = result?.covered ?? obligations.filter(o => o.clauses.some(c => selected.includes(c))).length; const total = result?.total ?? obligations.length; const steps = result?.steps ?? []; const uncovered = result?.uncoveredObligationIds ?? []
  return <><PageHeader title="Compliance Coverage" description="Compute a deterministic greedy set cover for regulatory obligations." actions={<><Button variant="quiet" onClick={() => setManagerOpen(true)}><Settings2 size={15} /> Manage obligations</Button><Select label="Contract" value={effectiveContractId} onChange={e => setContractId(e.target.value)}>{contractsResource.data?.map(c => <option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}</Select></>} />
    <AsyncState loading={contractsResource.loading || coverageResource.loading} error={contractsResource.error ?? coverageResource.error} empty={!contractsResource.data?.length || !result} onRetry={() => { contractsResource.retry(); coverageResource.retry() }}><div className="coverage-flow" aria-label="Coverage process"><div><span>01</span><strong>Regulatory Obligations</strong><small>{total} required controls</small></div><ArrowDown /><div><span>02</span><strong>Candidate Clauses</strong><small>{candidates.length} clauses evaluated</small></div><ArrowDown /><div className="active"><span>03</span><strong>Selected Clause Set</strong><small>{selected.join(', ') || 'No selection'}</small></div><ArrowDown /><div><span>04</span><strong>Coverage</strong><small>{covered} of {total} obligations</small></div></div>
      <div className="coverage-layout"><Panel title="Obligation coverage matrix" description="Rows are obligations; columns are candidate clauses" className="matrix-panel"><div className="matrix-scroll"><table className="coverage-matrix"><thead><tr><th>Regulatory obligation</th>{candidates.map(clause => <th key={clause}><span className={selected.includes(clause) ? 'selected' : ''}>{clause}</span></th>)}</tr></thead><tbody>{obligations.map(obligation => <tr key={obligation.id}><td><strong>{obligation.name}</strong><span>{obligation.category}</span></td>{candidates.map(clause => <td key={clause} className={selected.includes(clause) ? 'selected-column' : ''}>{obligation.clauses.includes(clause) ? <Check size={17} /> : <span>Not mapped</span>}</td>)}</tr>)}</tbody></table></div><div className="matrix-note"><CircleHelp size={16} /> The selected columns are the backend's deterministic greedy set-cover result.</div></Panel>
        <aside><Panel className="coverage-result"><div className="coverage-seal"><ShieldCheck /><span>Computed result</span></div><p>Obligation coverage</p><strong>{covered} / {total}</strong><div className="coverage-bar"><span style={{ width: `${total ? covered / total * 100 : 0}%` }} /></div><Badge tone={covered === total ? 'compliant' : 'needs-review'}>{result?.status ?? (covered === total ? 'Complete Coverage' : 'Partial Coverage')}</Badge><hr /><h3>Selected clause set</h3><div className="selected-clauses">{selected.length ? selected.map(clause => <span key={clause}>{clause}</span>) : <p>No clauses selected</p>}</div></Panel><Panel className="method-card"><Layers3 /><div><span>Optimization method</span><h3>Greedy Set Cover</h3><p>Deterministic clause-ID tie-breaking.</p></div><Badge tone="compliant">Live</Badge></Panel></aside></div>
      <Panel title="Greedy selection sequence" description="Every decision recorded by the backend algorithm" className="coverage-steps-panel">
        {steps.length ? <ol className="step-list">{steps.map(step => (
          <li key={step.step}>
            <span className="step-index">{step.step}</span>
            <div className="step-body">
              <strong>{step.clauseId}</strong>
              <p>Newly covered: {step.newlyCovered.join(', ')}</p>
              <small>{step.uncoveredCount} of {total} obligations still uncovered after this step</small>
            </div>
          </li>
        ))}</ol> : <p className="muted">No selection steps were produced for this contract.</p>}
        <div className="matrix-note">
          <CircleHelp size={16} />
          <span>
            {result?.method ?? 'Greedy Set Cover approximation (not guaranteed optimal)'}
            {uncovered.length ? ` Uncovered obligations: ${uncovered.join(', ')}.` : ' All obligations are covered.'}
          </span>
        </div>
      </Panel>
    </AsyncState><Dialog open={managerOpen} title="Compliance obligations" description="Maintain the controls used by coverage analysis." onClose={() => setManagerOpen(false)}><div className="dialog-content"><ObligationManager onChanged={coverageResource.retry} /></div></Dialog></>
}
