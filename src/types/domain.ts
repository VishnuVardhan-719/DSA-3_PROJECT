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
  archivedAt?: string
  updatedAt: string
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

export interface ClauseChange {
  id: string
  clauseId: string
  title: string
  kind: 'Added' | 'Removed' | 'Modified'
  before?: string
  after?: string
}

export interface ComplianceObligation {
  id: string
  name: string
  category: string
  clauses: string[]
}

export interface CoverageResult {
  selectedClauses: string[]
  covered: number
  total: number
  status: 'Complete Coverage' | 'Partial Coverage'
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
}

export interface AuditEvent {
  id: string
  timestamp: string
  user: string
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
export interface SimilarityGraph { nodes: SimilarityNode[]; edges: SimilarityEdge[]; components?: string[][] }

export interface VersionComparison {
  contractId: string
  baseVersion: string
  comparedVersion: string
  changes: ClauseChange[]
  added?: number
  removed?: number
  modified?: number
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
