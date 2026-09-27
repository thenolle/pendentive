import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { fillContent } from '../../core/content'

/**
 * Options accepted by the `ScrollArea` factory.
 *
 * Wraps scrollable content with hidden native scrollbars and a lightweight custom overlay
 * thumb (draggable, auto-hiding track), matching the visual language of shadcn/ui's Radix-based
 * `ScrollArea` without needing a native `::-webkit-scrollbar` hack that Firefox/Safari ignore differently.
 */
export interface ScrollAreaOptions {
  /** The scrollable content. */
  content: string | HTMLElement
  /** Fixed height (px number or any CSS length) for the viewport. Required for vertical scrolling to ever kick in. */
  maxHeight?: string | number
  /** Which axis gets a custom scrollbar. Defaults to `'vertical'`. */
  orientation?: 'vertical' | 'horizontal' | 'both'
}

/** The runtime control surface attached to every `ScrollArea` element. */
export interface ScrollAreaApi {
  /** Replaces the scrollable content. */
  setContent: (content: string | HTMLElement) => void
  /** Smoothly scrolls to the top. */
  scrollToTop: () => void
  /** Smoothly scrolls to the bottom. */
  scrollToBottom: () => void
  /** Detaches the scroll area from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `ScrollArea` is a real `HTMLDivElement` extended with `ScrollAreaApi`. */
export type ScrollAreaElement = HTMLDivElement & ScrollAreaApi

/** This component's own CSS, colocated and self-injected on first use. */
export const scrollAreaCss = `
.pendentive-scroll-area { position: relative; overflow: hidden }
.pendentive-scroll-viewport { width: 100%; height: 100%; overflow: auto; scrollbar-width: none; -ms-overflow-style: none }
.pendentive-scroll-viewport::-webkit-scrollbar { display: none }
.pendentive-scroll-track-vertical { position: absolute; top: 2px; bottom: 2px; right: 2px; width: 8px; border-radius: 999px; background: transparent; transition: background 150ms ease }
.pendentive-scroll-area:hover .pendentive-scroll-track-vertical { background: color-mix(in oklch, var(--pendentive-foreground) 4%, transparent) }
.pendentive-scroll-thumb-vertical { position: absolute; right: 0; width: 8px; border-radius: 999px; background: var(--pendentive-border); cursor: pointer; transition: background 120ms ease }
.pendentive-scroll-thumb-vertical:hover, .pendentive-scroll-thumb-vertical.pendentive-dragging { background: var(--pendentive-muted-foreground) }
.pendentive-scroll-track-horizontal { position: absolute; left: 2px; right: 2px; bottom: 2px; height: 8px; border-radius: 999px; background: transparent; transition: background 150ms ease }
.pendentive-scroll-area:hover .pendentive-scroll-track-horizontal { background: color-mix(in oklch, var(--pendentive-foreground) 4%, transparent) }
.pendentive-scroll-thumb-horizontal { position: absolute; bottom: 0; height: 8px; border-radius: 999px; background: var(--pendentive-border); cursor: pointer; transition: background 120ms ease }
.pendentive-scroll-thumb-horizontal:hover, .pendentive-scroll-thumb-horizontal.pendentive-dragging { background: var(--pendentive-muted-foreground) }
`

/** Creates a scrollable container with hidden native scrollbars and a custom draggable overlay thumb. */
export function ScrollArea(options: ScrollAreaOptions): ScrollAreaElement {
  assertDom('ScrollArea')
  ensureComponentStyles('scroll-area', scrollAreaCss)
  const orientation = options.orientation ?? 'vertical'
  const root = el('div', px('scroll-area'))
  if (options.maxHeight !== undefined) root.style.height = typeof options.maxHeight === 'number' ? `${options.maxHeight}px` : options.maxHeight
  const viewport = el('div', px('scroll-viewport'))
  fillContent(viewport, options.content)
  root.appendChild(viewport)
  const showVertical = orientation === 'vertical' || orientation === 'both'
  const showHorizontal = orientation === 'horizontal' || orientation === 'both'
  let trackV: HTMLDivElement | null = null
  let thumbV: HTMLDivElement | null = null
  let trackH: HTMLDivElement | null = null
  let thumbH: HTMLDivElement | null = null
  if (showVertical) {
    trackV = el('div', px('scroll-track-vertical'))
    thumbV = el('div', px('scroll-thumb-vertical'))
    trackV.appendChild(thumbV)
    root.appendChild(trackV)
  }
  if (showHorizontal) {
    trackH = el('div', px('scroll-track-horizontal'))
    thumbH = el('div', px('scroll-thumb-horizontal'))
    trackH.appendChild(thumbH)
    root.appendChild(trackH)
  }
  function syncThumbs(): void {
    if (thumbV && trackV) {
      const ratio = viewport.clientHeight / viewport.scrollHeight
      const trackHeight = trackV.clientHeight
      const thumbHeight = Math.max(24, ratio * trackHeight)
      const maxScroll = viewport.scrollHeight - viewport.clientHeight
      const scrollRatio = maxScroll > 0 ? viewport.scrollTop / maxScroll : 0
      thumbV.style.height = `${thumbHeight}px`
      thumbV.style.top = `${scrollRatio * (trackHeight - thumbHeight)}px`
      trackV.style.display = ratio >= 1 ? 'none' : 'block'
    }
    if (thumbH && trackH) {
      const ratio = viewport.clientWidth / viewport.scrollWidth
      const trackWidth = trackH.clientWidth
      const thumbWidth = Math.max(24, ratio * trackWidth)
      const maxScroll = viewport.scrollWidth - viewport.clientWidth
      const scrollRatio = maxScroll > 0 ? viewport.scrollLeft / maxScroll : 0
      thumbH.style.width = `${thumbWidth}px`
      thumbH.style.left = `${scrollRatio * (trackWidth - thumbWidth)}px`
      trackH.style.display = ratio >= 1 ? 'none' : 'block'
    }
  }
  function makeDraggable(thumb: HTMLDivElement, axis: 'x' | 'y'): () => void {
    let dragging = false
    let startPos = 0
    let startScroll = 0
    const onPointerDown = (event: PointerEvent): void => {
      dragging = true
      thumb.classList.add(px('dragging'))
      startPos = axis === 'y' ? event.clientY : event.clientX
      startScroll = axis === 'y' ? viewport.scrollTop : viewport.scrollLeft
      thumb.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) return
      const delta = (axis === 'y' ? event.clientY : event.clientX) - startPos
      if (axis === 'y' && trackV) {
        const ratio = (viewport.scrollHeight - viewport.clientHeight) / (trackV.clientHeight - thumb.clientHeight || 1)
        viewport.scrollTop = startScroll + delta * ratio
      } else if (axis === 'x' && trackH) {
        const ratio = (viewport.scrollWidth - viewport.clientWidth) / (trackH.clientWidth - thumb.clientWidth || 1)
        viewport.scrollLeft = startScroll + delta * ratio
      }
    }
    const onPointerUp = (): void => {
      dragging = false
      thumb.classList.remove(px('dragging'))
    }
    thumb.addEventListener('pointerdown', onPointerDown)
    thumb.addEventListener('pointermove', onPointerMove)
    thumb.addEventListener('pointerup', onPointerUp)
    thumb.addEventListener('pointercancel', onPointerUp)
    return () => {
      thumb.removeEventListener('pointerdown', onPointerDown)
      thumb.removeEventListener('pointermove', onPointerMove)
      thumb.removeEventListener('pointerup', onPointerUp)
      thumb.removeEventListener('pointercancel', onPointerUp)
    }
  }
  const cleanupFns: Array<() => void> = []
  if (thumbV) cleanupFns.push(makeDraggable(thumbV, 'y'))
  if (thumbH) cleanupFns.push(makeDraggable(thumbH, 'x'))
  const scrollListener = (): void => syncThumbs()
  viewport.addEventListener('scroll', scrollListener)
  const resizeObserver = new ResizeObserver(() => syncThumbs())
  resizeObserver.observe(viewport)
  syncThumbs()
  const api: ScrollAreaApi = {
    setContent(content) {
      fillContent(viewport, content)
      syncThumbs()
    },
    scrollToTop() {
      viewport.scrollTo({ top: 0, behavior: 'smooth' })
    },
    scrollToBottom() {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    },
    destroy() {
      viewport.removeEventListener('scroll', scrollListener)
      resizeObserver.disconnect()
      cleanupFns.forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}