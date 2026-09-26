import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'

/** Options accepted by the `Avatar` factory. */
export interface AvatarOptions {
  /** Image URL. Falls back to `initials` if omitted or if the image fails to load. */
  src?: string
  /** Accessible alt text for the image. */
  alt?: string
  /** Fallback text (typically 1-2 letters) shown when there's no image. */
  initials?: string
  /** Pixel diameter/side length. Defaults to `36`. */
  size?: number
  /** Outline shape. Defaults to `'circle'`. */
  shape?: 'circle' | 'square'
}

/** The runtime control surface attached to every `Avatar` element. */
export interface AvatarApi {
  /** Replaces the image source, or falls back to initials if `undefined`. */
  setSrc: (src: string | undefined) => void
  /** Detaches the avatar from the DOM. */
  destroy: () => void
}

/** An `Avatar` is a real `HTMLDivElement` extended with `AvatarApi`. */
export type AvatarElement = HTMLDivElement & AvatarApi

/** This component's own CSS, colocated and self-injected on first use. */
export const avatarCss = `
.socle-avatar { display: inline-flex; align-items: center; justify-content: center; background: var(--socle-secondary); color: var(--socle-secondary-foreground); font-size: 12px; font-weight: 600; overflow: hidden; flex-shrink: 0 }
.socle-avatar-circle { border-radius: 50% }
.socle-avatar-square { border-radius: var(--socle-radius-sm) }
.socle-avatar img { width: 100%; height: 100%; object-fit: cover }
`

/** Creates a circular or square avatar with an automatic initials fallback. */
export function Avatar(options: AvatarOptions = {}): AvatarElement {
  assertDom('Avatar')
  ensureComponentStyles('avatar', avatarCss)
  const size = options.size ?? 36
  const shape = options.shape ?? 'circle'
  const root = el('div', cx(px('avatar'), px(`avatar-${shape}`)))
  root.style.width = `${size}px`
  root.style.height = `${size}px`
  function render(src: string | undefined): void {
    root.replaceChildren()
    if (src) {
      const img = document.createElement('img')
      img.src = src
      img.alt = options.alt ?? ''
      img.addEventListener('error', () => render(undefined), { once: true })
      root.appendChild(img)
    } else {
      const fallback = document.createElement('span')
      fallback.textContent = options.initials ?? ''
      root.appendChild(fallback)
    }
  }
  render(options.src)
  const api: AvatarApi = {
    setSrc(src) {
      render(src)
    },
    destroy() {
      root.remove()
    }
  }
  return attachController(root, api)
}