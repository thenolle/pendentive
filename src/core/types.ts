/** A no-op unsubscribe function returned by any subscription-style API. */
export type Unsubscribe = () => void

/**
 * Shared shape for any component instance that owns listeners, subscriptions,
 * or DOM nodes it must clean up. Every Linteau component implements this.
 */
export interface Destroyable {
  /** Removes the element from the DOM and detaches every listener/subscription it created. */
  destroy: () => void
}