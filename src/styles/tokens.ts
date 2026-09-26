/** Every design token Linteau exposes as a `--linteau-*` CSS custom property. */
export interface LinteauThemeTokens {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  border: string
  input: string
  ring: string
  radius: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
}

/** Linteau's built-in dark theme -- the same OKLCH palette used across every component. */
export const defaultTheme: LinteauThemeTokens = {
  background: 'oklch(0.09 0 0)',
  foreground: 'oklch(0.94 0 0)',
  card: 'oklch(0.12 0 0)',
  cardForeground: 'oklch(0.94 0 0)',
  primary: 'oklch(0.92 0 0)',
  primaryForeground: 'oklch(0.1 0 0)',
  secondary: 'oklch(0.18 0 0)',
  secondaryForeground: 'oklch(0.9 0 0)',
  muted: 'oklch(0.16 0 0)',
  mutedForeground: 'oklch(0.6 0 0)',
  accent: 'oklch(0.2 0 0)',
  accentForeground: 'oklch(0.94 0 0)',
  destructive: 'oklch(0.58 0.22 27)',
  destructiveForeground: 'oklch(0.97 0 0)',
  success: 'oklch(0.62 0.16 145)',
  successForeground: 'oklch(0.97 0 0)',
  warning: 'oklch(0.75 0.15 85)',
  warningForeground: 'oklch(0.15 0 0)',
  border: 'oklch(0.22 0 0)',
  input: 'oklch(0.22 0 0)',
  ring: 'oklch(0.7 0 0)',
  radius: '0.625rem',
  radiusSm: 'calc(0.625rem - 4px)',
  radiusMd: 'calc(0.625rem - 2px)',
  radiusLg: '0.625rem',
  radiusXl: 'calc(0.625rem + 4px)'
}

/** Builds the `:root { --linteau-*: ...; }` stylesheet text for a given set of theme tokens. */
export function buildTokensCss(tokens: LinteauThemeTokens): string {
  return `:root {
  --linteau-background: ${tokens.background};
  --linteau-foreground: ${tokens.foreground};
  --linteau-card: ${tokens.card};
  --linteau-card-foreground: ${tokens.cardForeground};
  --linteau-primary: ${tokens.primary};
  --linteau-primary-foreground: ${tokens.primaryForeground};
  --linteau-secondary: ${tokens.secondary};
  --linteau-secondary-foreground: ${tokens.secondaryForeground};
  --linteau-muted: ${tokens.muted};
  --linteau-muted-foreground: ${tokens.mutedForeground};
  --linteau-accent: ${tokens.accent};
  --linteau-accent-foreground: ${tokens.accentForeground};
  --linteau-destructive: ${tokens.destructive};
  --linteau-destructive-foreground: ${tokens.destructiveForeground};
  --linteau-success: ${tokens.success};
  --linteau-success-foreground: ${tokens.successForeground};
  --linteau-warning: ${tokens.warning};
  --linteau-warning-foreground: ${tokens.warningForeground};
  --linteau-border: ${tokens.border};
  --linteau-input: ${tokens.input};
  --linteau-ring: ${tokens.ring};
  --linteau-radius: ${tokens.radius};
  --linteau-radius-sm: ${tokens.radiusSm};
  --linteau-radius-md: ${tokens.radiusMd};
  --linteau-radius-lg: ${tokens.radiusLg};
  --linteau-radius-xl: ${tokens.radiusXl};
}`
}