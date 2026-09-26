/** Every design token Socle exposes as a `--socle-*` CSS custom property. */
export interface SocleThemeTokens {
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

/** Socle's built-in dark theme -- the same OKLCH palette used across every component. */
export const defaultTheme: SocleThemeTokens = {
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

/** Builds the `:root { --socle-*: ...; }` stylesheet text for a given set of theme tokens. */
export function buildTokensCss(tokens: SocleThemeTokens): string {
  return `:root {
  --socle-background: ${tokens.background};
  --socle-foreground: ${tokens.foreground};
  --socle-card: ${tokens.card};
  --socle-card-foreground: ${tokens.cardForeground};
  --socle-primary: ${tokens.primary};
  --socle-primary-foreground: ${tokens.primaryForeground};
  --socle-secondary: ${tokens.secondary};
  --socle-secondary-foreground: ${tokens.secondaryForeground};
  --socle-muted: ${tokens.muted};
  --socle-muted-foreground: ${tokens.mutedForeground};
  --socle-accent: ${tokens.accent};
  --socle-accent-foreground: ${tokens.accentForeground};
  --socle-destructive: ${tokens.destructive};
  --socle-destructive-foreground: ${tokens.destructiveForeground};
  --socle-success: ${tokens.success};
  --socle-success-foreground: ${tokens.successForeground};
  --socle-warning: ${tokens.warning};
  --socle-warning-foreground: ${tokens.warningForeground};
  --socle-border: ${tokens.border};
  --socle-input: ${tokens.input};
  --socle-ring: ${tokens.ring};
  --socle-radius: ${tokens.radius};
  --socle-radius-sm: ${tokens.radiusSm};
  --socle-radius-md: ${tokens.radiusMd};
  --socle-radius-lg: ${tokens.radiusLg};
  --socle-radius-xl: ${tokens.radiusXl};
}`
}