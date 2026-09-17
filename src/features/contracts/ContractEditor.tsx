import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { Button } from '../../components/ui'
import type { Contract } from '../../types/domain'

interface ContractForm {
  name: string; type: string; owner: string; department: string; compliance: Contract['compliance']; reviewStatus: Contract['reviewStatus']; effectiveDate: string; expiryDate: string; risk: Contract['risk']; counterparty: string; jurisdiction: string; description: string
}

const emptyForm: ContractForm = {
  name: '', type: 'Services', owner: '', department: 'Legal', compliance: 'Needs Review', reviewStatus: 'Pending', effectiveDate: '', expiryDate: '', risk: 'Medium', counterparty: '', jurisdiction: '', description: '',
}

export function ContractEditor({ contract, onSaved, onCancel }: { contract?: Contract; onSaved: (contract: Contract) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ContractForm>(contract ? { ...emptyForm, ...contract } : emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key: keyof ContractForm, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const payload = contract ? { ...form, updatedAt: contract.updatedAt } : form
      const saved = contract
        ? await api.patch<Contract>(`/contracts/${encodeURIComponent(contract.id)}`, payload)
        : await api.post<Contract>('/contracts', payload)
      onSaved(saved)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save contract') }
    finally { setSaving(false) }
  }
  return <form className="dialog-form" onSubmit={submit}>
    <div className="form-grid">
      <label className="full"><span>Contract name</span><input required minLength={2} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
      <label><span>Contract type</span><input required value={form.type} onChange={(e) => update('type', e.target.value)} /></label>
      <label><span>Counterparty</span><input value={form.counterparty} onChange={(e) => update('counterparty', e.target.value)} /></label>
      <label><span>Owner</span><input required value={form.owner} onChange={(e) => update('owner', e.target.value)} /></label>
      <label><span>Department</span><input required value={form.department} onChange={(e) => update('department', e.target.value)} /></label>
      <label><span>Effective date</span><input required type="date" value={form.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} /></label>
      <label><span>Expiry date</span><input required type="date" min={form.effectiveDate} value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} /></label>
      <label><span>Compliance</span><select value={form.compliance} onChange={(e) => update('compliance', e.target.value)}><option>Compliant</option><option>Needs Review</option><option>Exception</option></select></label>
      <label><span>Review status</span><select value={form.reviewStatus} onChange={(e) => update('reviewStatus', e.target.value)}><option>Pending</option><option>Reviewing</option><option>Action Required</option><option>Approved</option></select></label>
      <label><span>Risk</span><select value={form.risk} onChange={(e) => update('risk', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
      <label><span>Jurisdiction</span><input value={form.jurisdiction} onChange={(e) => update('jurisdiction', e.target.value)} /></label>
      <label className="full"><span>Description</span><textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : contract ? 'Save changes' : 'Create contract'}</Button></footer>
  </form>
}
