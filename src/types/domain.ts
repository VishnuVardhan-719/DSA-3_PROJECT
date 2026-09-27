export type ComplianceStatus = 'Compliant' | 'Needs Review' | 'Exception'
export type ReviewStatus = 'Approved' | 'Reviewing' | 'Action Required' | 'Pending'
export interface PageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
export interface Contract {
  id: string
  name: string
  type: string
  currentVersion: string
  lastModified: string
  owner: string
  department: string
  compliance: ComplianceStatus
  reviewStatus: ReviewStatus
  effectiveDate: string
  expiryDate: string
  risk: 'Low' | 'Medium' | 'High'
  counterparty: string
  jurisdiction: string
  description: string
  archivedAt?: string | null
  updatedAt: string
}

export interface DatasetImportResult {
  imported: number
  contractIds: string[]
  filename: string
}

export interface Clause {
  id: string
  contractId: string
  title: string
  text: string
  version: string
  status: ComplianceStatus
  tags: string[]
  pageNumber: number
  tier: 'Preferred' | 'Acceptable' | 'Fallback' | 'Restricted'
  guidance: string
  sourceSection: string
  previousVersion?: string
  matchedText?: string
  match?: string
  matchedTerms?: string[]
  termFrequency?: Record<string, number>
  updatedAt?: string
  archivedAt?: string
}

export interface ContractVersion {
  id: string
  contractId: string
  label: string
  date: string
  author: string
  note: string
}

export interface PlaybookRule {
  id: string
  clauseCategory: string
  requiredPhrases: string[]
  prohibitedPhrases: string[]
  risk: 'Low' | 'Medium' | 'High'
  remediation: string
}

export interface Playbook {
  id: string
  name: string
  version: string
  contractType: string
  jurisdiction: string
  status: 'Draft' | 'Active' | 'Archived'
  rules: PlaybookRule[]
}

export interface Finding {
  id: string
  contractId: string
  versionId: string
  clauseId?: string | null
  ruleId: string
  status: ComplianceStatus
  risk: 'Low' | 'Medium' | 'High'
  evidence: string
  remediation: string
  overrideNotes?: string | null
  overriddenAt?: string | null
}

export type ClauseChangeKind = 'Added' | 'Removed' | 'Modified' | 'Unchanged'
export type DiffOperation = 'equal' | 'insert' | 'delete'

export interface DiffSpan {
  op: DiffOperation
  words: string[]
}

export interface ClauseChange {
  id: string
  clauseId: string
  title: string
  kind: ClauseChangeKind
  before?: string
  after?: string
  commonWords?: string[]
  spans?: DiffSpan[]
}

export interface ComparisonSummary {
  added: number
  removed: number
  modified: number
  unchanged: number
  total: number
}

export interface ComplianceObligation {
  id: string
  name: string
  category: string
  description?: string
  clauses: string[]
}

export interface CoverageStep {
  step: number
  clauseId: string
  newlyCovered: string[]
  coveredCount: number
  uncoveredCount: number
  uncoveredAfter: string[]
}

export interface CoverageResult {
  selectedClauses: string[]
  covered: number
  total: number
  status: 'Complete Coverage' | 'Partial Coverage'
  uncoveredObligationIds?: string[]
  steps?: CoverageStep[]
  clauseCoverage?: Record<string, string[]>
  method?: string
}

export interface Reviewer {
  id: string
  name: string
  role: string
  assigned: number
  capacity: number
  expertise: string[]
  currentWorkload?: number
  maxCapacity?: number
  active?: boolean
  archivedAt?: string
  updatedAt?: string
}

export interface ObligationRecord {
  id: string
  name: string
  category: string
  description: string
  archivedAt?: string
  updatedAt: string
}

export interface Assignment {
  contractId: string
  reviewerId: string
  confidence: 'Strong fit' | 'Good fit'
  contractName?: string
  reviewerName?: string
  cost?: number
  explanation?: string
}

export interface ReviewerLoad {
  reviewerId: string
  capacity: number
  existingWorkload: number
  proposedCount: number
  projectedLoad: number
  remainingCapacity: number
}

export interface UnassignedContract {
  contractId: string
  reason: string
}

export interface AssignmentProposal {
  assignments: Assignment[]
  assignedCount: number
  totalCost: number
  unassignedContractIds: string[]
  unassigned: UnassignedContract[]
  reviewerLoads: ReviewerLoad[]
  eligiblePairs: number
  objective: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  user: string
  actorId?: string
  actorRole?: string
  action: string
  entity: string
  version?: string
  detail?: string
  status: 'Completed' | 'Approved' | 'Flagged'
}

export interface Cluster {
  id: string
  name: string
  count: number
  color: string
}

export interface ReviewItem {
  id: string
  priority: 'Urgent' | 'High' | 'Normal'
  contract: string
  issue: string
  reviewer: string
  due: string
  status: 'Pending' | 'In Review' | 'Needs Clarification' | 'Completed'
  contractId?: string
  contractName?: string
  reviewerName?: string
  dueDate?: string
  decision?: string
}

export interface DashboardSummary {
  portfolio: {
    totalContracts: number
    openReviews: number
    complianceExceptions: number
    needsReview: number
  }
  recentContracts: Contract[]
  reviewQueue: ReviewItem[]
}

export interface SimilarityNode { id: string; label?: string; name?: string; cluster?: string | number }
export interface SimilarityEdge { source: string; target: string; score: number }
export interface SimilarityGraph {
  nodes: SimilarityNode[]
  edges: SimilarityEdge[]
  components?: string[][]
  threshold?: number
  isolatedContractIds?: string[]
  comparedPairs?: number
}

export interface VersionComparison {
  contractId: string
  baseVersion: string
  comparedVersion: string
  changes: ClauseChange[]
  summary?: ComparisonSummary
  added?: number
  removed?: number
  modified?: number
  unchanged?: number
}

export interface Settings {
  displayName: string
  role: string
  email: string
  defaultQueueSort: string
  versionComparison: 'Side-by-side' | 'Unified diff'
  showClauseComplianceTags: boolean
  confirmStatusChanges: boolean
  newAssignments: boolean
  dueDateReminders: boolean
  complianceExceptions: boolean
  weeklySummary: boolean
}
