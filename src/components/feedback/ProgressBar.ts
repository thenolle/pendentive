import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `ProgressBar` factory. */
export interface ProgressBarOptions {
  /** Title shown at the top of the overlay card. */
  title?: string
  /** Initial progress percentage (0-100). Defaults to `0`. */
  value?: number
  /** Whether the bar starts in indeterminate ("Working...") mode. Defaults to `false`. */
  indeterminate?: boolean
  /** Whether the overlay is visible immediately. Defaults to `false`. */
  visible?: boolean
}

/** The runtime control surface attached to every `ProgressBar` element. */
export interface ProgressBarApi {
  /** Sets the progress percentage (clamped 0-100) and optional custom label text. */
  setValue: (percent: number, label?: string) => void
  /** Toggles indeterminate ("Working...") mode on or off. */
  setIndeterminate: (indeterminate: boolean) => void
  /** Updates the overlay title text. */
  setTitle: (title: string) => void
  /** Reveals the full-screen overlay. */
  show: () => void
  /** Hides the full-screen overlay. */
  hide: () => void
  /** Detaches the overlay from the DOM. */
  destroy: () => void
}

/** A `ProgressBar` is a real `HTMLDivElement` extended with `ProgressBarApi`. */
export type ProgressBarElement = HTMLDivElement & ProgressBarApi

/** This component's own CSS, colocated and self-injected on first use. */
export const progressBarCss = `
.linteau-progress-overlay { position: fixed; inset: 0; background: color-mix(in oklch, black 55%, transparent); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px) }
.linteau-progress-card { width: 280px; background: var(--linteau-card); border: 1px solid var(--linteau-border); border-radius: var(--linteau-radius-lg); padding: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) }
.linteau-progress-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--linteau-foreground) }
.linteau-progress-track { width: 100%; height: 8px; border-radius: 999px; background: var(--linteau-secondary); overflow: hidden; position: relative }
.linteau-progress-fill { height: 100%; width: 0%; background: var(--linteau-primary); border-radius: 999px; transition: width 180ms ease }
.linteau-progress-fill.linteau-indeterminate { width: 40% !important; animation: linteau-progress-slide 1.1s ease-in-out infinite }
@keyframes linteau-progress-slide { 0% { transform: translateX(-100%) } 100% { transform: translateX(250%) } }
.linteau-progress-percent { margin-top: 8px; font-size: 12px; color: var(--linteau-muted-foreground); text-align: right; font-variant-numeric: tabular-nums }
`

/** Creates a full-screen progress overlay, ideal for long-running async operations. */
export function ProgressBar(options: ProgressBarOptions = {}): ProgressBarElement {
  assertDom('ProgressBar')
  ensureComponentStyles('progress-bar', progressBarCss)
  const { title = '', value = 0, indeterminate = false, visible = false } = options
  const root = el('div', cx(px('progress-overlay'), !visible && px('hidden')))
  const card = el('div', px('progress-card'))
  const titleEl = el('div', px('progress-title'))
  titleEl.textContent = title
  const track = el('div', px('progress-track'))
  const fill = el('div', cx(px('progress-fill'), indeterminate && px('indeterminate')))
  track.appendChild(fill)
  const percentLabel = el('div', px('progress-percent'))
  percentLabel.textContent = indeterminate ? 'Working...' : `${Math.round(value)}%`
  card.append(titleEl, track, percentLabel)
  root.appendChild(card)
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`
  const api: ProgressBarApi = {
    setValue(percent, label) {
      const clamped = Math.max(0, Math.min(100, percent))
      fill.classList.remove(px('indeterminate'))
      fill.style.width = `${clamped}%`
      percentLabel.textContent = label ?? `${Math.round(clamped)}%`
    },
    setIndeterminate(value) {
      fill.classList.toggle(px('indeterminate'), value)
      if (value) percentLabel.textContent = 'Working...'
    },
    setTitle(newTitle) {
      titleEl.textContent = newTitle
    },
    show() {
      root.classList.remove(px('hidden'))
    },
    hide() {
      root.classList.add(px('hidden'))
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}