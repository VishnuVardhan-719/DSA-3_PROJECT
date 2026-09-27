import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'

const OverviewPage = lazy(() => import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const ContractsPage = lazy(() => import('./pages/ContractsPage').then((m) => ({ default: m.ContractsPage })))
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage').then((m) => ({ default: m.ContractDetailPage })))
const ClauseSearchPage = lazy(() => import('./pages/ClauseSearchPage').then((m) => ({ default: m.ClauseSearchPage })))
const VersionAnalysisPage = lazy(() => import('./pages/VersionAnalysisPage').then((m) => ({ default: m.VersionAnalysisPage })))
const SimilarityPage = lazy(() => import('./pages/SimilarityPage').then((m) => ({ default: m.SimilarityPage })))
const ComplianceCoveragePage = lazy(() => import('./pages/ComplianceCoveragePage').then((m) => ({ default: m.ComplianceCoveragePage })))
const PlaybooksPage = lazy(() => import('./pages/PlaybooksPage').then((m) => ({ default: m.PlaybooksPage })))
const ReviewerAssignmentPage = lazy(() => import('./pages/ReviewerAssignmentPage').then((m) => ({ default: m.ReviewerAssignmentPage })))
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage })))
const AuditTrailPage = lazy(() => import('./pages/AuditTrailPage').then((m) => ({ default: m.AuditTrailPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export default function App() {
  return <AppShell><Suspense fallback={<div className="route-loading" aria-label="Loading page"><span /></div>}><Routes>
    <Route path="/" element={<Navigate to="/overview" replace />} />
    <Route path="/overview" element={<OverviewPage />} />
    <Route path="/contracts" element={<ContractsPage />} />
    <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
    <Route path="/clause-search" element={<ClauseSearchPage />} />
    <Route path="/version-analysis" element={<VersionAnalysisPage />} />
    <Route path="/similarity-clustering" element={<SimilarityPage />} />
    <Route path="/compliance-coverage" element={<ComplianceCoveragePage />} />
    <Route path="/playbooks" element={<PlaybooksPage />} />
    <Route path="/reviewer-assignment" element={<ReviewerAssignmentPage />} />
    <Route path="/review-queue" element={<ReviewQueuePage />} />
    <Route path="/audit-trail" element={<AuditTrailPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></AppShell>
}
