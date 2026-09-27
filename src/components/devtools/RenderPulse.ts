import { assertDom, el } from '../../core/dom'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `RenderPulse` factory. */
export interface RenderPulseOptions {
  /** The subtree to instrument. Defaults to `document.body` (the whole app). */
  target?: Element
  /** Rolling window (ms) used to score how "hot" a repeatedly-mutating element is. Defaults to `1000`. */
  windowMs?: number
  /** Shows the floating mutations/sec HUD badge. Defaults to `true`. */
  showHud?: boolean
  /** Caps concurrent flash overlays on screen at once, protecting perf during a churn storm. Defaults to `60`. */
  maxFlashes?: number
  /** Called once per second with the mutation count for that second. */
  onMutationBurst?: (mutationsPerSecond: number) => void
}

/** The runtime control surface returned by `RenderPulse`. It's a pure controller -- not an element -- since it instruments an existing subtree rather than rendering a widget into your layout, exactly like `HoverCard`/`DropdownMenu`. */
export interface RenderPulseApi {
  /** Starts observing and (if `showHud`) mounts the HUD. */
  enable: () => void
  /** Stops observing and removes the HUD. */
  disable: () => void
  /** Returns whether observation is currently active. */
  isEnabled: () => boolean
  /** Returns a live snapshot of churn stats. */
  getStats: () => { totalMutations: number, mutationsPerSecond: number, hotElements: number }
  /** Fully tears down the observer, HUD, timers, and pooled overlays. */
  destroy: () => void
}

/** This component's own CSS, colocated and self-injected on first use. */
export const renderPulseCss = `
.pendentive-render-pulse-overlay { position: fixed; z-index: 2147483000; pointer-events: none; border-radius: 3px; box-sizing: border-box; opacity: 0; border: 2px solid transparent }
.pendentive-render-pulse-overlay.pendentive-flash { opacity: 1; transition: opacity 0ms }
.pendentive-render-pulse-hud { position: fixed; bottom: 12px; left: 12px; z-index: 2147483001; background: rgba(15, 15, 20, 0.85); color: #fff; font: 11px ui-monospace, monospace; padding: 6px 10px; border-radius: 6px; pointer-events: none; display: flex; gap: 10px; align-items: center; backdrop-filter: blur(4px) }
.pendentive-render-pulse-hud-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; transition: background 150ms ease }
`

const HEAT_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

function colorForHeat(count: number): string | undefined {
  if (count <= 1) return HEAT_COLORS[0]
  if (count <= 3) return HEAT_COLORS[1]
  if (count <= 6) return HEAT_COLORS[2]
  return HEAT_COLORS[3]
}

/**
 * Instruments a subtree with a `MutationObserver` and flashes a colored outline over whatever
 * DOM node just changed -- the color escalates green -> yellow -> orange -> red the more often
 * that *same* element re-mutates within the rolling window. Point it at `document.body` while
 * developing and it turns invisible over-rendering (a `renderList()`/`renderCalendar()` firing
 * far more than the user's input justifies) into something you can literally see happening on
 * screen. This is a devtool shipped *as* a component -- nothing in shadcn/Radix/MUI/Chakra does this.
 */
export function RenderPulse(options: RenderPulseOptions = {}): RenderPulseApi {
  assertDom('RenderPulse')
  ensureComponentStyles('render-pulse', renderPulseCss)
  const target = options.target ?? document.body
  const windowMs = options.windowMs ?? 1000
  const showHud = options.showHud ?? true
  const maxFlashes = options.maxFlashes ?? 60
  const heat = new WeakMap<Element, number[]>()
  let totalMutations = 0
  let enabled = false
  let observer: MutationObserver | null = null
  const overlayPool: HTMLDivElement[] = []
  let poolIndex = 0
  const hud = el('div', px('render-pulse-hud'))
  const hudDot = el('div', px('render-pulse-hud-dot'))
  const hudText = document.createElement('span')
  hudText.textContent = 'RenderPulse: 0 mut/s'
  hud.append(hudDot, hudText)
  function getOverlay(): HTMLDivElement {
    if (poolIndex < overlayPool.length) return overlayPool[poolIndex++]!
    const overlay = el('div', px('render-pulse-overlay'))
    document.body.appendChild(overlay)
    overlayPool.push(overlay)
    poolIndex++
    return overlay
  }
  function flash(mutatedElement: Element): void {
    const now = Date.now()
    const timestamps = (heat.get(mutatedElement) ?? []).filter((t) => now - t < windowMs)
    timestamps.push(now)
    heat.set(mutatedElement, timestamps)
    if (poolIndex > maxFlashes) return
    const rect = mutatedElement.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    const overlay = getOverlay()
    overlay.style.transition = 'none'
    overlay.style.left = `${rect.left}px`
    overlay.style.top = `${rect.top}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
    overlay.style.borderColor = colorForHeat(timestamps.length) ?? HEAT_COLORS[HEAT_COLORS.length - 1]!
    overlay.classList.remove(px('flash'))
    void overlay.offsetWidth // force reflow so a re-triggered flash restarts its fade-out
    overlay.classList.add(px('flash'))
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 260ms ease, border-color 120ms ease'
      overlay.style.opacity = '0'
    })
  }
  let mutationsThisSecond = 0
  let mutationsPerSecond = 0
  const hudTimer = setInterval(() => {
    mutationsPerSecond = mutationsThisSecond
    mutationsThisSecond = 0
    hudText.textContent = `RenderPulse: ${mutationsPerSecond} mut/s`
    hudDot.style.background = colorForHeat(mutationsPerSecond > 8 ? 7 : mutationsPerSecond > 3 ? 4 : 1) ?? HEAT_COLORS[0]!
    options.onMutationBurst?.(mutationsPerSecond)
  }, 1000)
  function handleMutations(mutations: MutationRecord[]): void {
    poolIndex = 0
    const seen = new Set<Element>()
    for (const mutation of mutations) {
      const owner = mutation.target.nodeType === Node.ELEMENT_NODE ? (mutation.target as Element) : mutation.target.parentElement
      if (!owner || seen.has(owner)) continue
      seen.add(owner)
      totalMutations++
      mutationsThisSecond++
      flash(owner)
    }
  }
  function enable(): void {
    if (enabled) return
    enabled = true
    observer = new MutationObserver(handleMutations)
    observer.observe(target, { childList: true, attributes: true, characterData: true, subtree: true })
    if (showHud) document.body.appendChild(hud)
  }
  function disable(): void {
    if (!enabled) return
    enabled = false
    observer?.disconnect()
    observer = null
    hud.remove()
  }
  const api: RenderPulseApi = {
    enable,
    disable,
    isEnabled() {
      return enabled
    },
    getStats() {
      return { totalMutations, mutationsPerSecond, hotElements: overlayPool.length }
    },
    destroy() {
      disable()
      clearInterval(hudTimer)
      overlayPool.forEach((overlay) => overlay.remove())
    }
  }
  return api
}