import { Download } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { Button } from '../../components/ui'
import type { DatasetImportResult } from '../../types/domain'

export function ContractDatasetImporter({ onImported, onCancel }: { onImported: (result: DatasetImportResult) => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const downloadSample = () => {
    const file = new Blob(['name,type,effectiveDate,expiryDate,counterparty,jurisdiction,description\nSample Services Agreement,Services,2025-01-01,2026-01-01,Example Vendor,Delaware,Replace this row with your dataset.\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(file); const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'contract-import-template.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) { setError('Choose a .json or .csv dataset file first.'); return }
    setImporting(true); setError('')
    try {
      const form = new FormData(); form.append('file', file)
      onImported(await api.upload<DatasetImportResult>('/contracts/import-dataset', form))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to import dataset') }
    finally { setImporting(false) }
  }

  return <form className="dialog-form" onSubmit={submit}>
    <div className="form-grid">
      <label className="full"><span>Dataset file</span><input required aria-describedby="dataset-format" type="file" accept=".json,.csv,application/json,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError('') }} />{file && <small className="upload-selection">Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</small>}</label>
      <p id="dataset-format" className="full">Upload a normalized UTF-8 JSON or CSV file, up to 5 MB and 200 records. JSON may be an array or <code>{'{"contracts": [...]}'}</code>; CSV needs a <code>name</code> or <code>title</code> column. Optional fields include <code>type</code>, <code>effectiveDate</code>, <code>expiryDate</code>, and (JSON only) <code>clauses</code> with <code>title</code> and <code>text</code>.</p>
      <p className="full">Use the sample CSV to prepare SEC/EDGAR metadata or a normalized CUAD export. Raw CUAD and raw SEC API downloads are not imported directly. Missing owner, department, status, or dates receive import defaults and must be reviewed before approval.</p>
      <div className="full"><Button type="button" variant="quiet" onClick={downloadSample}><Download size={15} /> Download sample CSV</Button></div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <footer className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!file || importing}>{importing ? 'Importing…' : 'Import dataset'}</Button></footer>
  </form>
}