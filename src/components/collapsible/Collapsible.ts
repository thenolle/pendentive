import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { fillContent } from '../../core/content'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/**
 * Options accepted by the `Collapsible` factory.
 *
 * This is the atomic single trigger/content expand-collapse primitive shadcn/ui ships
 * alongside its multi-item `Accordion` -- useful standalone for things like a lone
 * "Show more" toggle, where a full accordion group would be overkill.
 */
export interface CollapsibleOptions {
  /** Trigger content -- usually short text, but can hold any markup. */
  trigger: string | HTMLElement
  /** Panel content, shown/hidden as the trigger is toggled. */
  content: string | HTMLElement
  /** Whether the panel starts open. Defaults to `false`. */
  defaultOpen?: boolean
  /** Disables the trigger. Defaults to `false`. */
  disabled?: boolean
  /** Called whenever the open state changes via user interaction. */
  onOpenChange?: (open: boolean) => void
}

/** The runtime control surface attached to every `Collapsible` element. */
export interface CollapsibleApi {
  /** Returns whether the panel is currently open. */
  isOpen: () => boolean
  /** Opens the panel. */
  open: () => void
  /** Closes the panel. */
  close: () => void
  /** Toggles between open and closed. */
  toggle: () => void
  /** Replaces the panel content. */
  setContent: (content: string | HTMLElement) => void
  /** Enables/disables the trigger. */
  setDisabled: (disabled: boolean) => void
  /** Detaches the collapsible from the DOM and its internal listener. */
  destroy: () => void
}

/** A `Collapsible` is a real `HTMLDivElement` extended with `CollapsibleApi`. */
export type CollapsibleElement = HTMLDivElement & CollapsibleApi

/** This component's own CSS, colocated and self-injected on first use. */
export const collapsibleCss = `
.pendentive-collapsible { display: flex; flex-direction: column }
.pendentive-collapsible-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; background: transparent; border: none; padding: 8px 0; font-size: 13px; font-weight: 500; color: var(--pendentive-foreground); cursor: pointer; font-family: inherit; text-align: left }
.pendentive-collapsible-trigger:disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-collapsible-trigger-label { flex: 1 }
.pendentive-collapsible-chevron { transition: transform 150ms ease; color: var(--pendentive-muted-foreground); flex-shrink: 0 }
.pendentive-collapsible-chevron.pendentive-open { transform: rotate(180deg) }
.pendentive-collapsible-content { overflow: hidden; height: 0; transition: height 200ms ease }
.pendentive-collapsible-content-inner { padding: 4px 0 8px }
`

/** Creates a single expand/collapse trigger+panel pair, animating height on toggle. */
export function Collapsible(options: CollapsibleOptions): CollapsibleElement {
  assertDom('Collapsible')
  ensureComponentStyles('collapsible', collapsibleCss)
  let isOpen = options.defaultOpen ?? false
  let disabled = options.disabled ?? false
  const onOpenChange = options.onOpenChange
  const root = el('div', px('collapsible'))
  const trigger = el('button', px('collapsible-trigger'))
  trigger.type = 'button'
  trigger.disabled = disabled
  const triggerLabel = el('span', px('collapsible-trigger-label'))
  fillContent(triggerLabel, options.trigger)
  const chevron = Icon(icons.chevronDown, 14, { className: px('collapsible-chevron') })!
  trigger.append(triggerLabel, chevron)
  const contentWrap = el('div', px('collapsible-content'))
  const contentInner = el('div', px('collapsible-content-inner'))
  fillContent(contentInner, options.content)
  contentWrap.appendChild(contentInner)
  function syncHeight(): void {
    contentWrap.style.height = isOpen ? `${contentInner.scrollHeight}px` : '0px'
    chevron.classList.toggle(px('open'), isOpen)
    trigger.setAttribute('aria-expanded', String(isOpen))
  }
  syncHeight()
  function open(): void {
    if (isOpen || disabled) return
    isOpen = true
    syncHeight()
    onOpenChange?.(true)
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    syncHeight()
    onOpenChange?.(false)
  }
  function toggle(): void {
    if (isOpen) close()
    else open()
  }
  const listener = (): void => toggle()
  trigger.addEventListener('click', listener)
  root.append(trigger, contentWrap)

  const api: CollapsibleApi = {
    isOpen() {
      return isOpen
    },
    open,
    close,
    toggle,
    setContent(content) {
      fillContent(contentInner, content)
      if (isOpen) syncHeight()
    },
    setDisabled(value) {
      disabled = value
      trigger.disabled = value
    },
    destroy() {
      trigger.removeEventListener('click', listener)
      root.remove()
    }
  }
  return attachController(root, api)
}