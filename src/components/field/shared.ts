/**
 * CSS shared by every labeled field-style component (TextField, TextArea, NumberField,
 * ColorField, ChipInput, DatePicker, Select, Combobox, Slider, RangeSlider, Switch).
 *
 * Every one of those calls `ensureComponentStyles('field-base', fieldBaseCss)` before its
 * own specific CSS -- the key dedupes, so this is injected once no matter how many
 * field-style components an app uses.
 */
export const fieldBaseCss = `
.socle-field { display: flex; flex-direction: column; gap: 6px; width: 100% }
.socle-field-row { display: flex; align-items: center; justify-content: space-between }
.socle-field-label { display: flex; align-items: center; gap: 6px; color: var(--socle-foreground) }
.socle-field-value { color: var(--socle-muted-foreground); font-variant-numeric: tabular-nums }
.socle-field-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px }
`