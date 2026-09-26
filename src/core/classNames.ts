/** Every class name Socle generates starts with this prefix, so it can never collide with a consumer's own CSS. */
export const PREFIX = 'socle-' as const

/** Prefixes a class-name fragment with the library namespace, e.g. `px('button')` -> `'socle-button'`. */
export function px(part: string): string {
  return `${PREFIX}${part}`
}

/** Joins class-name fragments, dropping any falsy value. Handy for conditional classes. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}