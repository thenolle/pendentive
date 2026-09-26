/**
 * CSS shared by every plain text-style input (TextField, TextArea, NumberField, and the
 * text inputs inside Combobox/DatePicker). Registered under the `text-input` key.
 */
export const textInputCss = `
.linteau-text-input, .linteau-textarea {
  width: 100%;
  background: var(--linteau-secondary);
  color: var(--linteau-foreground);
  border: 1px solid var(--linteau-border);
  border-radius: var(--linteau-radius-sm);
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.linteau-text-input:focus, .linteau-textarea:focus {
  outline: none;
  border-color: var(--linteau-ring);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--linteau-ring) 20%, transparent);
}
.linteau-text-input:disabled, .linteau-textarea:disabled { opacity: 0.5; cursor: not-allowed }
.linteau-textarea { resize: vertical; min-height: 72px }
`