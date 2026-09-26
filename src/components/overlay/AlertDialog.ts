import { assertDom } from '../../core/dom'
import { Button } from '../button/Button'
import { Dialog } from './Dialog'
import type { Destroyable } from '../../core/types'

/** Options accepted by the `AlertDialog` factory. */
export interface AlertDialogOptions {
  /** Title shown in the header. */
  title: string
  /** Supporting description text shown in the body. */
  description?: string
  /** Label for the dismiss action. Defaults to `'Cancel'`. */
  cancelText?: string
  /** Label for the confirm action. Defaults to `'Continue'`. */
  confirmText?: string
  /** Renders the confirm button in the destructive color -- use for irreversible actions. Defaults to `false`. */
  destructive?: boolean
  /** Called when the user confirms. */
  onConfirm?: () => void
  /** Called when the user cancels (via the Cancel button or Escape). */
  onCancel?: () => void
}

/**
 * The runtime control surface returned by `AlertDialog`. A thin wrapper over `Dialog` that
 * enforces the confirm-or-cancel pattern: unlike `Dialog`, clicking the backdrop never
 * dismisses it -- the user must explicitly choose.
 */
export interface AlertDialogApi extends Destroyable {
  /** Opens the alert dialog. */
  open: () => void
  /** Closes the alert dialog (equivalent to cancelling). */
  close: () => void
  /** Returns whether the alert dialog is currently open. */
  isOpen: () => boolean
}

/**
 * Creates a modal confirmation dialog for actions that need explicit user consent (deleting
 * a resource, discarding changes) -- built entirely on top of `Dialog` and `Button`, so it
 * ships no CSS of its own.
 */
export function AlertDialog(options: AlertDialogOptions): AlertDialogApi {
  assertDom('AlertDialog')
  let resolved = false
  const cancelButton = Button(options.cancelText ?? 'Cancel', {
    variant: 'outline',
    onClick: () => {
      resolved = true
      options.onCancel?.()
      dialog.close()
    }
  })
  const confirmButton = Button(options.confirmText ?? 'Continue', {
    variant: options.destructive ? 'destructive' : 'default',
    onClick: () => {
      resolved = true
      options.onConfirm?.()
      dialog.close()
    }
  })
  const dialog = Dialog({
    title: options.title,
    ...(options.description !== undefined ? { content: options.description } : {}),
    actions: [cancelButton, confirmButton],
    closeOnBackdrop: false,
    closeOnEscape: true,
    onOpenChange: (open) => {
      if (!open && !resolved) options.onCancel?.()
      resolved = false
    }
  })
  document.body.appendChild(dialog)
  return {
    open() {
      dialog.open()
    },
    close() {
      dialog.close()
    },
    isOpen() {
      return dialog.isOpen()
    },
    destroy() {
      dialog.destroy()
    }
  }
}