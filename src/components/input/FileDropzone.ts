import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'

/** Options accepted by the `FileDropzone` factory. */
export interface FileDropzoneOptions {
  /** Label text shown inside the drop area. Defaults to `'Drop files here or click to browse'`. */
  label?: string
  /** Comma-separated MIME types/extensions passed to the underlying file input. */
  accept?: string
  /** Allows selecting multiple files. Defaults to `false`. */
  multiple?: boolean
  /** Disables interaction. Defaults to `false`. */
  disabled?: boolean
  /** Called with the selected/dropped files. */
  onFiles: (files: File[]) => void
}

/** The runtime control surface attached to every `FileDropzone` element. */
export interface FileDropzoneApi {
  /** Clears the underlying file input's selection. */
  reset: () => void
  /** Detaches the dropzone from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `FileDropzone` is a real `HTMLDivElement` extended with `FileDropzoneApi`. */
export type FileDropzoneElement = HTMLDivElement & FileDropzoneApi

/** This component's own CSS, colocated and self-injected on first use. */
export const dropzoneCss = `
.socle-dropzone { border: 1px dashed var(--socle-border); border-radius: var(--socle-radius-lg); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; cursor: pointer; color: var(--socle-muted-foreground); transition: border-color 120ms ease, background 120ms ease }
.socle-dropzone:hover, .socle-dropzone-active { border-color: var(--socle-ring); background: var(--socle-accent) }
.socle-dropzone-disabled { opacity: 0.5; cursor: not-allowed }
.socle-dropzone-label { font-size: 12px }
`

/** Creates a drag-and-drop file upload zone with a click-to-browse fallback. */
export function FileDropzone(options: FileDropzoneOptions): FileDropzoneElement {
  assertDom('FileDropzone')
  ensureComponentStyles('dropzone', dropzoneCss)
  const disabled = options.disabled ?? false
  const root = el('div', cx(px('dropzone'), disabled && px('dropzone-disabled')))
  const icon = Icon(icons.upload, 22, { className: px('icon') })
  if (icon) root.appendChild(icon)
  const label = el('div', px('dropzone-label'))
  label.textContent = options.label ?? 'Drop files here or click to browse'
  root.appendChild(label)
  const input = document.createElement('input')
  input.type = 'file'
  input.style.display = 'none'
  input.multiple = options.multiple ?? false
  if (options.accept) input.accept = options.accept
  input.disabled = disabled
  function emit(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return
    options.onFiles(Array.from(fileList))
  }
  const clickListener = (): void => { if (!disabled) input.click() }
  const changeListener = (): void => emit(input.files)
  const dragOverListener = (event: DragEvent): void => {
    event.preventDefault()
    if (!disabled) root.classList.add(px('dropzone-active'))
  }
  const dragLeaveListener = (): void => root.classList.remove(px('dropzone-active'))
  const dropListener = (event: DragEvent): void => {
    event.preventDefault()
    root.classList.remove(px('dropzone-active'))
    if (!disabled) emit(event.dataTransfer?.files ?? null)
  }
  root.addEventListener('click', clickListener)
  root.addEventListener('dragover', dragOverListener)
  root.addEventListener('dragleave', dragLeaveListener)
  root.addEventListener('drop', dropListener)
  input.addEventListener('change', changeListener)
  root.appendChild(input)
  const api: FileDropzoneApi = {
    reset() {
      input.value = ''
    },
    destroy() {
      root.removeEventListener('click', clickListener)
      root.removeEventListener('dragover', dragOverListener)
      root.removeEventListener('dragleave', dragLeaveListener)
      root.removeEventListener('drop', dropListener)
      input.removeEventListener('change', changeListener)
      root.remove()
    }
  }
  return attachController(root, api)
}