import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import { toast } from '../feedback/Toast'

/** Options accepted by the `CopyButton` factory. */
export interface CopyButtonOptions {
  /** The text to copy, or a function returning it lazily -- evaluated on click, so the source can change between clicks. */
  getText: string | (() => string)
  /** Milliseconds the success checkmark stays visible before reverting to the copy icon. Defaults to `1500`. */
  resetAfterMs?: number
  /** Shows a confirmation toast (via the shared `toast` manager) on successful copy. Defaults to `false`. */
  showToast?: boolean
  /** Toast description. Defaults to `'Copied to clipboard'`. */
  toastMessage?: string
  /** Pixel size of the icon. Defaults to `14`. */
  size?: number
  /** Called with the copied text after a successful `navigator.clipboard.writeText`. */
  onCopy?: (text: string) => void
  /** Called if the clipboard write rejects (e.g. permissions, insecure context). */
  onError?: (error: unknown) => void
}

/** The runtime control surface attached to every `CopyButton` element. */
export interface CopyButtonApi {
  /** Programmatically triggers a copy, exactly as a click would. */
  copy: () => Promise<void>
  /** Detaches the button from the DOM and its internal listener. */
  destroy: () => void
}

/** A `CopyButton` is a real `HTMLButtonElement` extended with `CopyButtonApi`. */
export type CopyButtonElement = HTMLButtonElement & CopyButtonApi

/** This component's own CSS, colocated and self-injected on first use. */
export const copyButtonCss = `
.pendentive-copy-button { display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--pendentive-muted-foreground); cursor: pointer; padding: 4px; border-radius: var(--pendentive-radius-sm); transition: color 120ms ease, background 120ms ease }
.pendentive-copy-button:hover { background: var(--pendentive-accent); color: var(--pendentive-foreground) }
.pendentive-copy-button-copied { color: var(--pendentive-success) }
.pendentive-copy-icon-enter { animation: pendentive-copy-pop 220ms ease }
@keyframes pendentive-copy-pop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.15) } 100% { transform: scale(1); opacity: 1 } }
`

/** Creates a small icon button that copies text to the clipboard, morphing to a checkmark on success. */
export function CopyButton(options: CopyButtonOptions): CopyButtonElement {
  assertDom('CopyButton')
  ensureComponentStyles('copy-button', copyButtonCss)
  const size = options.size ?? 14
  const resetAfterMs = options.resetAfterMs ?? 1500
  let resetTimer: ReturnType<typeof setTimeout> | null = null
  const root = el('button', px('copy-button'))
  root.type = 'button'
  root.setAttribute('aria-label', 'Copy to clipboard')
  function renderIcon(copied: boolean): void {
    root.replaceChildren()
    const icon = Icon(copied ? icons.check : icons.copy, size, { className: cx(px('icon'), px('copy-icon-enter')) })
    if (icon) root.appendChild(icon)
    root.classList.toggle(px('copy-button-copied'), copied)
  }
  renderIcon(false)
  async function copy(): Promise<void> {
    const text = typeof options.getText === 'function' ? options.getText() : options.getText
    try {
      await navigator.clipboard.writeText(text)
      renderIcon(true)
      root.setAttribute('aria-label', 'Copied')
      options.onCopy?.(text)
      if (options.showToast) toast.show({ description: options.toastMessage ?? 'Copied to clipboard', variant: 'success' })
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        renderIcon(false)
        root.setAttribute('aria-label', 'Copy to clipboard')
      }, resetAfterMs)
    } catch (error) {
      options.onError?.(error)
    }
  }
  const listener = (): void => {
    void copy()
  }
  root.addEventListener('click', listener)
  const api: CopyButtonApi = {
    copy,
    destroy() {
      if (resetTimer) clearTimeout(resetTimer)
      root.removeEventListener('click', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}