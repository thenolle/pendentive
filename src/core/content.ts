/** Replaces `target`'s children with either an appended element or plain text. Shared by every component with a "content" slot. */
export function fillContent(target: HTMLElement, content: HTMLElement | string): void {
  target.replaceChildren()
  if (content instanceof HTMLElement) target.appendChild(content)
  else target.textContent = content
}