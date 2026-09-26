/**
 * CSS shared by every plain text-style input (TextField, TextArea, NumberField, and the
 * text inputs inside Combobox/DatePicker). Registered under the `text-input` key.
 */
export const textInputCss = `
.pendentive-text-input, .pendentive-textarea {
  width: 100%;
  background: var(--pendentive-secondary);
  color: var(--pendentive-foreground);
  border: 1px solid var(--pendentive-border);
  border-radius: var(--pendentive-radius-sm);
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.pendentive-text-input:focus, .pendentive-textarea:focus {
  outline: none;
  border-color: var(--pendentive-ring);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--pendentive-ring) 20%, transparent);
}
.pendentive-text-input:disabled, .pendentive-textarea:disabled { opacity: 0.5; cursor: not-allowed }
.pendentive-textarea { resize: vertical; min-height: 72px }
`