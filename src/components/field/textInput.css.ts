/**
 * CSS shared by every plain text-style input (TextField, TextArea, NumberField, and the
 * text inputs inside Combobox/DatePicker). Registered under the `text-input` key.
 */
export const textInputCss = `
.socle-text-input, .socle-textarea {
  width: 100%;
  background: var(--socle-secondary);
  color: var(--socle-foreground);
  border: 1px solid var(--socle-border);
  border-radius: var(--socle-radius-sm);
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.socle-text-input:focus, .socle-textarea:focus {
  outline: none;
  border-color: var(--socle-ring);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--socle-ring) 20%, transparent);
}
.socle-text-input:disabled, .socle-textarea:disabled { opacity: 0.5; cursor: not-allowed }
.socle-textarea { resize: vertical; min-height: 72px }
`