import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `Skeleton` factory. */
export interface SkeletonOptions {
  /** CSS width value or pixel number. Defaults to `'100%'`. */
  width?: string | number
  /** CSS height value or pixel number. Defaults to `'1em'`. */
  height?: string | number
  /** CSS border-radius value. Defaults to the theme's small radius. */
  radius?: string
}

/** The runtime control surface attached to every `Skeleton` element. */
export interface SkeletonApi {
  /** Detaches the placeholder from the DOM. */
  destroy: () => void
}

/** A `Skeleton` is a real `HTMLDivElement` extended with `SkeletonApi`. */
export type SkeletonElement = HTMLDivElement & SkeletonApi

/** This component's own CSS, colocated and self-injected on first use. */
export const skeletonCss = `
.linteau-skeleton { background: linear-gradient(90deg, var(--linteau-secondary) 25%, var(--linteau-accent) 37%, var(--linteau-secondary) 63%); background-size: 400% 100%; animation: linteau-skeleton-shine 1.4s ease infinite; border-radius: var(--linteau-radius-sm) }
@keyframes linteau-skeleton-shine { 0% { background-position: 100% 50% } 100% { background-position: 0 50% } }
`

/** Creates an animated shimmering placeholder for content that's still loading. */
export function Skeleton(options: SkeletonOptions = {}): SkeletonElement {
  assertDom('Skeleton')
  ensureComponentStyles('skeleton', skeletonCss)
  const root = el('div', px('skeleton'))
  root.style.width = typeof options.width === 'number' ? `${options.width}px` : options.width ?? '100%'
  root.style.height = typeof options.height === 'number' ? `${options.height}px` : options.height ?? '1em'
  if (options.radius) root.style.borderRadius = options.radius
  const api: SkeletonApi = {
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}