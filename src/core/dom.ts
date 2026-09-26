/**
 * True when running in an environment with a real `document`/`window`
 * (browser, or Node/Bun with a DOM shim like `happy-dom`/`linkedom`).
 */
export function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined'
}

/**
 * Guards a component factory against being called without a DOM, throwing
 * one clear, actionable error instead of a cryptic `ReferenceError`.
 *
 * @param componentName - Name shown in the thrown error, e.g. `'Button'`.
 */
export function assertDom(componentName: string): void {
  if (!isBrowser()) throw new Error(`[pendentive] "${componentName}" requires a DOM environment (a browser, or Node/Bun with a DOM shim such as 'happy-dom' or 'linkedom'). No 'document' was found.`)
}

/** Tiny `document.createElement` wrapper that also applies an initial class name. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}