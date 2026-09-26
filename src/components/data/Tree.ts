import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'

/** A single node in a `Tree`, optionally containing children. */
export interface TreeNode {
  /** Visible label. */
  label: string
  /** Unique value identifying this node. */
  value: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** Nested child nodes. */
  children?: TreeNode[]
}

/** Options accepted by the `Tree` factory. */
export interface TreeOptions {
  /** The root-level nodes to render. */
  nodes: TreeNode[]
  /** Values expanded by default. */
  defaultExpanded?: string[]
  /** Called when a leaf or branch node is clicked. */
  onSelect?: (value: string) => void
}

/** The runtime control surface attached to every `Tree` element. */
export interface TreeApi {
  /** Expands every branch node. */
  expandAll: () => void
  /** Collapses every branch node. */
  collapseAll: () => void
  /** Detaches the tree from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `Tree` is a real `HTMLDivElement` extended with `TreeApi`. */
export type TreeElement = HTMLDivElement & TreeApi

/** This component's own CSS, colocated and self-injected on first use. */
export const treeCss = `
.pendentive-tree { display: flex; flex-direction: column; gap: 2px }
.pendentive-tree-row { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: var(--pendentive-radius-sm); cursor: pointer; font-size: 12px }
.pendentive-tree-row:hover { background: var(--pendentive-accent) }
.pendentive-tree-chevron { transition: transform 150ms ease }
.pendentive-tree-chevron.pendentive-open { transform: rotate(90deg) }
.pendentive-tree-children { margin-left: 18px; display: flex; flex-direction: column; gap: 2px }
.pendentive-tree-children.pendentive-collapsed { display: none }
`

/** Creates a recursively nested, expandable tree of nodes. */
export function Tree(options: TreeOptions): TreeElement {
  assertDom('Tree')
  ensureComponentStyles('tree', treeCss)
  const expanded = new Set(options.defaultExpanded ?? [])
  const cleanupListeners: Array<() => void> = []
  const allValues: string[] = []
  const root = el('div', px('tree'))
  function collectValues(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.children?.length) {
        allValues.push(node.value)
        collectValues(node.children)
      }
    }
  }
  collectValues(options.nodes)
  function renderNode(node: TreeNode, container: HTMLElement): void {
    const hasChildren = Boolean(node.children?.length)
    const isOpen = expanded.has(node.value)
    const row = el('div', px('tree-row'))
    if (hasChildren) {
      const chevron = Icon(icons.chevronRight, 12, { className: cx(px('tree-chevron'), isOpen && px('open')) })
      if (chevron) row.appendChild(chevron)
    }
    if (node.icon) row.appendChild(Icon(node.icon, 14, { className: px('icon') })!)
    const label = document.createElement('span')
    label.textContent = node.label
    row.appendChild(label)
    const childrenContainer = hasChildren ? el('div', cx(px('tree-children'), !isOpen && px('collapsed'))) : null
    const listener = (): void => {
      if (hasChildren) {
        if (expanded.has(node.value)) expanded.delete(node.value)
        else expanded.add(node.value)
        render()
      }
      options.onSelect?.(node.value)
    }
    row.addEventListener('click', listener)
    cleanupListeners.push(() => row.removeEventListener('click', listener))
    container.appendChild(row)
    if (childrenContainer) {
      for (const child of node.children ?? []) renderNode(child, childrenContainer)
      container.appendChild(childrenContainer)
    }
  }
  function render(): void {
    root.replaceChildren()
    cleanupListeners.splice(0).forEach((fn) => fn())
    for (const node of options.nodes) renderNode(node, root)
  }
  render()
  const api: TreeApi = {
    expandAll() {
      allValues.forEach((value) => expanded.add(value))
      render()
    },
    collapseAll() {
      expanded.clear()
      render()
    },
    destroy() {
      cleanupListeners.splice(0).forEach((fn) => fn())
      root.remove()
    }
  }
  return attachController(root, api)
}