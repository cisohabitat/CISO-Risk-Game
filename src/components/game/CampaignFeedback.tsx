import { lazy, Suspense } from 'react'
import { useGameStore } from '@/store/game-store'

// Optional confirmations must never prevent the canonical screens from opening.
// Keep these occasional papers out of the first-visit download.
const Feedback = lazy(() => import('./CampaignFeedbackView').then((module) => ({ default: module.CampaignFeedbackView })).catch(() => ({ default: () => null })))

export function CampaignFeedback({ kind }: { kind: 'decision' | 'quarter' }) {
  const state = useGameStore((store) => store.state)
  const record = useGameStore((store) => kind === 'decision' ? store.ui.decisionReceipt : store.ui.quarterTransition)
  if (!state || state.finished || !record || record.gameId !== state.gameId || record.year !== (state.year ?? 1)) return null
  return <Suspense fallback={null}><Feedback kind={kind} /></Suspense>
}
