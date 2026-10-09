/**
 * Source-owned UI primitives.
 *
 * The plan calls for shadcn-style source-owned components; these are written in
 * the same spirit (no black-box UI library, accessibility handled here) but with
 * this game's own visual language rather than a stock admin-dashboard look.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils/cn'

/* ---------------------------------------------------------------- Button -- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Primary is for the one thing waiting on the player: Decide, prepare the
 * paper, commit in a dialog. Six "Start this" buttons and an empty state's
 * suggestion drawn at the same weight as Decide made the Briefing and the
 * Programmes screen a field of equal blue, so nothing stood out.
 */
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink-inverse hover:brightness-110 border border-transparent',
  secondary: 'bg-surface-2 text-ink border border-line-strong hover:bg-surface-3',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-surface-2',
  danger: 'bg-danger text-ink-inverse border border-transparent hover:brightness-110',
  quiet: 'bg-transparent text-ink-muted border border-line hover:text-ink hover:border-line-strong',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-2 min-h-11',
  md: 'text-[0.95rem] px-4 py-2.5 min-h-11',
  lg: 'text-base px-5 py-3 min-h-12',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
}

/** A button's look, for a link that should sit beside buttons as one of them. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', block?: boolean, className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,filter,transform] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    block && 'w-full',
    className,
  )
}

export function Button({ variant = 'secondary', size = 'md', block, className, ...props }: ButtonProps) {
  return <button type="button" {...props} className={buttonClass(variant, size, block, className)} />
}

/* ------------------------------------------------------------------ Card -- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[--radius-card] border border-line bg-surface card-grain shadow-[var(--shadow-soft)]',
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex flex-wrap items-start justify-between gap-3 p-4 pb-0', className)} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn('text-base font-semibold leading-tight text-balance', className)} />
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('p-4', className)} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex flex-wrap items-center gap-2 border-t border-line p-4', className)} />
}

/* ----------------------------------------------------------------- Badge -- */

export type BandTone =
  | 'low' | 'moderate' | 'elevated' | 'high' | 'severe'
  | 'neutral' | 'positive' | 'warning' | 'accent'

const BADGE_TONES: Record<BandTone, string> = {
  low: 'bg-band-low-soft text-band-low border-band-low/40',
  moderate: 'bg-band-moderate-soft text-band-moderate border-band-moderate/40',
  elevated: 'bg-band-elevated-soft text-band-elevated border-band-elevated/40',
  high: 'bg-band-high-soft text-band-high border-band-high/40',
  severe: 'bg-band-severe-soft text-band-severe border-band-severe/50',
  neutral: 'bg-surface-2 text-ink-muted border-line',
  positive: 'bg-band-low-soft text-positive border-positive/40',
  warning: 'bg-band-elevated-soft text-warning border-warning/40',
  accent: 'bg-accent-soft text-accent-ink border-accent/40',
}

/**
 * Risk state is never carried by colour alone: every badge renders a text label
 * and, for risk bands, a shape glyph as well (plan §30, §31).
 */
const BAND_GLYPH: Partial<Record<BandTone, string>> = {
  low: '▁',
  moderate: '▃',
  elevated: '▅',
  high: '▆',
  severe: '█',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  glyph = true,
}: {
  tone?: BandTone
  children: ReactNode
  className?: string
  glyph?: boolean
}) {
  const shape = glyph ? BAND_GLYPH[tone] : undefined
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        BADGE_TONES[tone],
        className,
      )}
    >
      {shape && <span aria-hidden="true" className="font-mono text-[0.7rem] leading-none">{shape}</span>}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------- Meter ----- */

export function Meter({
  label,
  value,
  max = 100,
  valueLabel,
  tone = 'accent',
}: {
  label: string
  value: number
  max?: number
  valueLabel: string
  tone?: BandTone
}) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  const barColour: Record<BandTone, string> = {
    low: 'bg-band-low',
    moderate: 'bg-band-moderate',
    elevated: 'bg-band-elevated',
    high: 'bg-band-high',
    severe: 'bg-band-severe',
    neutral: 'bg-ink-faint',
    positive: 'bg-positive',
    warning: 'bg-warning',
    accent: 'bg-accent',
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-faint">{label}</span>
        <span className="text-sm font-medium tabular-nums">{valueLabel}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="meter"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${valueLabel}`}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-300', barColour[tone])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Dialog -- */

/**
 * Open dialogs, innermost last. A glossary opened from a word inside a decision
 * sits on top of it, and both listened on the document: Escape closed the
 * decision underneath before the glossary, and Tab was pulled back into
 * whichever panel's trap ran first. Only the topmost dialog handles keys, and
 * the page stays locked until the last one closes.
 */
const openDialogStack: number[] = []
let dialogSerial = 0

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Every caller passes an inline onClose, so it changes on every render. As
  // an effect dependency it re-ran the effect on each tick of a running clock,
  // and each run put focus back on the panel: an option chosen with the arrow
  // keys, or a reason being typed, lost focus within a second.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const me = (dialogSerial += 1)
    openDialogStack.push(me)
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogStack[openDialogStack.length - 1] !== me) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      // Keep focus inside the dialog for keyboard and screen-reader users.
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const at = openDialogStack.indexOf(me)
      if (at >= 0) openDialogStack.splice(at, 1)
      if (openDialogStack.length === 0) document.body.style.overflow = ''
      // Back to whatever opened it. A decision's "Decide" button is gone once
      // the decision is taken, and focus fell to the page body, so a keyboard
      // player started again from the top; the main region is the next best.
      if (previous && previous.isConnected) previous.focus()
      else document.getElementById('main')?.focus()
    }
  }, [open])

  if (!open) return null

  // The overlay scrolls and the panel is capped at most of the viewport, so a
  // dialog taller than a phone screen scrolls inside its body, and on a
  // browser that ignores the cap (no `dvh`) the overlay itself scrolls to the
  // footer rather than leaving the buttons below the bottom edge.
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-overlay animate-fade"
      data-backdrop
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).dataset.backdrop !== undefined) onClose()
      }}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6" data-backdrop>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'dialog-panel flex w-full flex-col rounded-t-2xl border border-line bg-surface shadow-[var(--shadow-lift)] outline-none animate-rise',
          'sm:rounded-2xl',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div>
            <h2 id={titleId} className="font-display text-xl leading-tight text-balance">{title}</h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted text-pretty">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" className="shrink-0 px-3">
            <span aria-hidden="true">✕</span>
          </Button>
        </div>
        <div className="scroll-area min-h-0 flex-1 p-4 sm:p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4 sm:p-5">{footer}</div>}
      </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Tabs -- */

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  baseId: string
}
const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onChange,
  children,
  className,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, setValue: onChange, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, label }: { children: ReactNode; label: string }) {
  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'))
    const current = tabs.indexOf(document.activeElement as HTMLElement)
    if (current < 0) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : event.key === 'ArrowRight'
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length
    tabs[next]?.focus()
    tabs[next]?.click()
  }, [])

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      // Wrapped rather than scrolled on a phone: scrolled, the last tabs sat
      // off the right edge with nothing to say they were there, and a
      // playtester looking for the enquiries tried three other screens first.
      className="-mx-1 flex flex-wrap gap-1 px-1 pb-1"
    >
      {children}
    </div>
  )
}

export function Tab({ value, children, count }: { value: string; children: ReactNode; count?: number }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used inside Tabs')
  const selected = context.value === value
  return (
    <button
      type="button"
      role="tab"
      id={`${context.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${context.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => context.setValue(value)}
      className={cn(
        'shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        selected
          ? 'border-line-strong bg-surface-3 text-ink'
          : 'border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink',
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        // A pause before the number, for a screen reader: it read "Evidence2".
        <span className="sr-only">, </span>
      )}
      {count !== undefined && count > 0 && (
        <span className="ml-2 rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-ink tabular-nums">
          {count}
        </span>
      )}
    </button>
  )
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used inside Tabs')
  if (context.value !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${context.baseId}-panel-${value}`}
      aria-labelledby={`${context.baseId}-tab-${value}`}
      tabIndex={0}
      className="mt-4 outline-none"
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------- Disclosure */

export function Disclosure({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-medium"
      >
        {summary}
        <span aria-hidden="true" className={cn('text-ink-faint transition-transform', open && 'rotate-180')}>▾</span>
      </button>
      {open && <div className="border-t border-line px-3 py-3 text-sm text-ink-muted">{children}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Empty -- */

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-[--radius-card] border border-dashed border-line-strong bg-surface-2 px-5 py-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted text-pretty">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">{children}</h2>
      {action}
    </div>
  )
}

/** Small key/value pair used throughout the detail panels. */
export function Fact({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-ink-faint text-pretty">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------- SegmentedControl -- */

/**
 * A filter row. Deliberately not the tab pattern: tabs promise a panel each,
 * and these switch the contents of one list.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string; count?: number }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="scroll-area -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-line-strong bg-surface-3 text-ink'
                : 'border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined && option.count > 0 && (
              <span className="ml-2 rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-ink tabular-nums">
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
