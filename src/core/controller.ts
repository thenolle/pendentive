/** A listener function subscribed to a single event of type `T`. */
export type Listener<T> = (payload: T) => void

/** A minimal, fully-typed event emitter used internally by stateful components. */
export interface Emitter<TEvents extends Record<string, unknown>> {
  /** Subscribes to an event, returning an unsubscribe function. */
  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void
  /** Removes a previously-subscribed listener. */
  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void
  /** Synchronously notifies every listener subscribed to `event`. */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void
  /** Removes every listener for every event. */
  clear: () => void
}

/** Creates a standalone, strongly-typed event emitter. */
export function createEmitter<TEvents extends Record<string, unknown>>(): Emitter<TEvents> {
  const listeners = new Map<keyof TEvents, Set<Listener<any>>>()
  return {
    on(event, listener) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(listener)
      return () => listeners.get(event)?.delete(listener)
    },
    off(event, listener) {
      listeners.get(event)?.delete(listener)
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((listener) => listener(payload))
    },
    clear() {
      listeners.clear()
    }
  }
}

/**
 * Merges a strongly-typed controller API onto a real DOM element, producing
 * a single value that IS a valid Node (append it anywhere) AND a fully
 * controllable component instance (no wrapper object required).
 *
 * This is the pattern every Linteau component factory returns through.
 *
 * @typeParam TElement - The native element type being extended, e.g. `HTMLButtonElement`.
 * @typeParam TApi - The extra methods/properties to attach.
 * @param element - The native element instance created by the component.
 * @param api - The controller methods/properties to merge onto the element.
 * @returns The same element instance, typed as `TElement & TApi`.
 */
export function attachController<TElement extends HTMLElement, TApi extends object>(element: TElement, api: TApi): TElement & TApi {
  return Object.assign(element, api)
}

/** A small helper for collecting and running teardown callbacks in `destroy()` implementations. */
export function createCleanup(): { add: (fn: () => void) => void, run: () => void } {
  const fns: Array<() => void> = []
  return {
    add(fn) {
      fns.push(fn)
    },
    run() {
      while (fns.length > 0) fns.pop()?.()
    }
  }
}