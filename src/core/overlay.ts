import { isBrowser } from './dom'

/** Placement of a floating element relative to its anchor. */
export type FloatingPlacement = 'top' | 'bottom' | 'left' | 'right'

/**
 * Calls `callback` when a mouse press lands outside every element in `targets`.
 * Accepts one or more elements so a floating panel and its anchor can both be excluded.
 * @returns An unsubscribe function.
 */
export function onClickOutside(targets: HTMLElement | HTMLElement[], callback: () => void): () => void {
  if (!isBrowser()) return () => { }
  const list = Array.isArray(targets) ? targets : [targets]
  const listener = (event: MouseEvent): void => {
    const node = event.target as Node
    if (list.some((target) => target.contains(node))) return
    callback()
  }
  document.addEventListener('mousedown', listener, true)
  return () => document.removeEventListener('mousedown', listener, true)
}

/** Calls `callback` whenever the Escape key is pressed. @returns An unsubscribe function. */
export function onEscapeKey(callback: () => void): () => void {
  if (!isBrowser()) return () => { }
  const listener = (event: KeyboardEvent): void => { if (event.key === 'Escape') callback() }
  document.addEventListener('keydown', listener)
  return () => document.removeEventListener('keydown', listener)
}

/** Locks page scroll (used by modal-like overlays). @returns A function that restores the previous overflow value. */
export function lockBodyScroll(): () => void {
  if (!isBrowser()) return () => { }
  const previous = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = previous }
}

/** Positions `floating` next to `anchor`, clamped to stay inside the viewport. */
export function positionFloating(anchor: HTMLElement, floating: HTMLElement, placement: FloatingPlacement = 'bottom', gap = 6): void {
  if (!isBrowser()) return
  const anchorRect = anchor.getBoundingClientRect()
  const floatingRect = floating.getBoundingClientRect()
  let top = 0
  let left = 0
  if (placement === 'bottom') {
    top = anchorRect.bottom + gap
    left = anchorRect.left
  } else if (placement === 'top') {
    top = anchorRect.top - floatingRect.height - gap
    left = anchorRect.left
  } else if (placement === 'left') {
    top = anchorRect.top
    left = anchorRect.left - floatingRect.width - gap
  } else {
    top = anchorRect.top
    left = anchorRect.right + gap
  }
  const maxLeft = window.innerWidth - floatingRect.width - 8
  const maxTop = window.innerHeight - floatingRect.height - 8
  floating.style.position = 'fixed'
  floating.style.top = `${Math.max(8, Math.min(top, maxTop))}px`
  floating.style.left = `${Math.max(8, Math.min(left, maxLeft))}px`
}