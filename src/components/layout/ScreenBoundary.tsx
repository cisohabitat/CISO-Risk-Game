/**
 * A screen that fails to draw takes only itself down (docs/ROADMAP.md,
 * Phase 5). Without this, an exception anywhere in a screen blanked the whole
 * page, rail and all, and the only way on was a reload the player had to
 * think of. The campaign is untouched — the store holds it, and its last save
 * is on the device — so the way out is another screen.
 */
import { Component, type ReactNode } from 'react'
import { Button, Card, CardBody } from '@/components/ui/primitives'
import { reportProblem } from '@/store/problems'

interface Props {
  children: ReactNode
  /** Where the player can go instead, and what the button calls it. */
  onLeave: () => void
  leaveLabel: string
}

export class ScreenBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: unknown): void {
    reportProblem({ kind: 'screen-failed', detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error) })
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <Card role="alert" data-testid="screen-failed">
        <CardBody className="space-y-3">
          <h1 className="font-display text-2xl leading-tight">This screen could not be shown</h1>
          <p className="text-sm text-ink-muted text-pretty">
            Something went wrong while drawing it. Your campaign is still open, and its last save is on this device.
            Another screen will usually work; if this one keeps failing, reload the page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={this.props.onLeave}>
              {this.props.leaveLabel}
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }
}
