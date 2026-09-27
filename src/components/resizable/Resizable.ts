import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { fillContent } from '../../core/content'

/** A single pane within a `Resizable` group. */
export interface ResizablePanel {
  /** The pane's content. */
  content: string | HTMLElement
  /** Initial size as a percentage of the group. Defaults to an even split across all panels. */
  defaultSize?: number
  /** Minimum size as a percentage. Defaults to `10`. */
  minSize?: number
  /** Maximum size as a percentage. Defaults to `90`. */
  maxSize?: number
}

/** Options accepted by the `Resizable` factory. */
export interface ResizableOptions {
  /** The panes, in display order, separated by draggable handles. */
  panels: ResizablePanel[]
  /** Split axis. Defaults to `'horizontal'` (side-by-side panes, vertical handles). */
  direction?: 'horizontal' | 'vertical'
  /** Called with the full size array on every drag/keyboard resize. */
  onResize?: (sizes: number[]) => void
}

/** The runtime control surface attached to every `Resizable` element. */
export interface ResizableApi {
  /** Returns the current size (percentages) of every panel. */
  getSizes: () => number[]
  /** Programmatically sets every panel's size. */
  setSizes: (sizes: number[]) => void
  /** Detaches the group from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Resizable` is a real `HTMLDivElement` extended with `ResizableApi`. */
export type ResizableElement = HTMLDivElement & ResizableApi

/** This component's own CSS, colocated and self-injected on first use. */
export const resizableCss = `
.pendentive-resizable-group { display: flex; width: 100%; height: 100%; overflow: hidden }
.pendentive-resizable-group-vertical { flex-direction: column }
.pendentive-resizable-panel { overflow: auto; min-width: 0; min-height: 0 }
.pendentive-resizable-handle { flex-shrink: 0; background: var(--pendentive-border); position: relative; transition: background 120ms ease }
.pendentive-resizable-handle:hover, .pendentive-resizable-handle.pendentive-dragging { background: var(--pendentive-ring) }
.pendentive-resizable-group:not(.pendentive-resizable-group-vertical) .pendentive-resizable-handle { width: 4px; cursor: col-resize }
.pendentive-resizable-group-vertical .pendentive-resizable-handle { height: 4px; cursor: row-resize }
`

/** Creates a group of resizable panes separated by draggable (and arrow-key-operable) split handles. */
export function Resizable(options: ResizableOptions): ResizableElement {
  assertDom('Resizable')
  ensureComponentStyles('resizable', resizableCss)
  const isRow = (options.direction ?? 'horizontal') === 'horizontal'
  const onResize = options.onResize
  const root = el('div', cx(px('resizable-group'), !isRow && px('resizable-group-vertical')))
  const evenSize = 100 / options.panels.length
  let sizes = options.panels.map((panel) => panel.defaultSize ?? evenSize)
  const total = sizes.reduce((sum, size) => sum + size, 0)
  sizes = sizes.map((size) => (size / total) * 100)
  const panelEls: HTMLDivElement[] = []
  const cleanupFns: Array<() => void> = []
  function applySizes(): void {
    panelEls.forEach((panelEl, index) => { panelEl.style.flexBasis = `${sizes[index]}%` })
  }
  options.panels.forEach((panelDef, index) => {
    const panelEl = el('div', px('resizable-panel'))
    fillContent(panelEl, panelDef.content)
    panelEls.push(panelEl)
    root.appendChild(panelEl)
    if (index === options.panels.length - 1) return
    const handle = el('div', px('resizable-handle'))
    handle.setAttribute('role', 'separator')
    handle.setAttribute('aria-orientation', isRow ? 'vertical' : 'horizontal')
    handle.tabIndex = 0
    root.appendChild(handle)
    const minA = options.panels[index]!.minSize ?? 10
    const maxA = options.panels[index]!.maxSize ?? 90
    const minB = options.panels[index + 1]!.minSize ?? 10
    const maxB = options.panels[index + 1]!.maxSize ?? 90
    let dragging = false
    let startPos = 0
    let startSizeA = 0
    let startSizeB = 0
    function applyPair(newA: number, newB: number): void {
      sizes[index] = newA
      sizes[index + 1] = newB
      applySizes()
      onResize?.([...sizes])
    }
    const onPointerDown = (event: PointerEvent): void => {
      dragging = true
      handle.classList.add(px('dragging'))
      startPos = isRow ? event.clientX : event.clientY
      startSizeA = sizes[index]!
      startSizeB = sizes[index + 1]!
      handle.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) return
      const containerSize = isRow ? root.clientWidth : root.clientHeight
      const deltaPercent = (((isRow ? event.clientX : event.clientY) - startPos) / containerSize) * 100
      const combined = startSizeA + startSizeB
      let newA = Math.max(minA, Math.min(maxA, startSizeA + deltaPercent))
      let newB = combined - newA
      if (newB < minB || newB > maxB) {
        newB = Math.max(minB, Math.min(maxB, newB))
        newA = combined - newB
      }
      applyPair(newA, newB)
    }
    const onPointerUp = (): void => {
      dragging = false
      handle.classList.remove(px('dragging'))
    }
    handle.addEventListener('pointerdown', onPointerDown)
    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
    const onKeydown = (event: KeyboardEvent): void => {
      const forwardKey = isRow ? 'ArrowRight' : 'ArrowDown'
      const backwardKey = isRow ? 'ArrowLeft' : 'ArrowUp'
      if (event.key !== forwardKey && event.key !== backwardKey) return
      event.preventDefault()
      const step = event.key === forwardKey ? 2 : -2
      const combined = sizes[index]! + sizes[index + 1]!
      let newA = Math.max(minA, Math.min(maxA, sizes[index]! + step))
      let newB = combined - newA
      if (newB < minB || newB > maxB) {
        newB = Math.max(minB, Math.min(maxB, newB))
        newA = combined - newB
      }
      applyPair(newA, newB)
    }
    handle.addEventListener('keydown', onKeydown)
    cleanupFns.push(() => {
      handle.removeEventListener('pointerdown', onPointerDown)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
      handle.removeEventListener('keydown', onKeydown)
    })
  })
  applySizes()
  const api: ResizableApi = {
    getSizes() {
      return [...sizes]
    },
    setSizes(newSizes) {
      sizes = [...newSizes]
      applySizes()
    },
    destroy() {
      cleanupFns.forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}