/**
 * CSS shared by every labeled field-style component (TextField, TextArea, NumberField,
 * ColorField, ChipInput, DatePicker, Select, Combobox, Slider, RangeSlider, Switch).
 *
 * Every one of those calls `ensureComponentStyles('field-base', fieldBaseCss)` before its
 * own specific CSS -- the key dedupes, so this is injected once no matter how many
 * field-style components an app uses.
 */
export const fieldBaseCss = `
.pendentive-field { display: flex; flex-direction: column; gap: 6px; width: 100% }
.pendentive-field-row { display: flex; align-items: center; justify-content: space-between }
.pendentive-field-label { display: flex; align-items: center; gap: 6px; color: var(--pendentive-foreground) }
.pendentive-field-value { color: var(--pendentive-muted-foreground); font-variant-numeric: tabular-nums }
.pendentive-field-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px }
`