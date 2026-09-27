import { assertDom, el } from '../../core/dom'
import { attachController } from '../../core/controller'
import { cx, px } from '../../core/classNames'
import { ensureComponentStyles } from '../../core/styleInjector'
import { onClickOutside, onEscapeKey, positionFloating } from '../../core/overlay'
import { Icon } from '../../svg/Icon'
import { icons } from '../../svg/icons/index'
import type { IconInput } from '../../svg/types'
import { fieldBaseCss } from '../field/shared'
import { textInputCss } from '../field/textInput.css'
import { comboboxCss } from '../select/Combobox'

/** Which single day of the week a calendar week starts on. `0` = Sunday, `1` = Monday. */
export type WeekStartsOn = 0 | 1

/** A `from`/`to` date pair used when `mode` is `'range'`. `to` is `undefined` while the second endpoint hasn't been picked yet. */
export interface DateRange {
  /** The earlier bound of the range. */
  from: Date
  /** The later bound of the range, or `undefined` mid-selection. */
  to?: Date
}

/** Options accepted by the `DatePicker` factory. */
export interface DatePickerOptions {
  /** Label rendered above the field. */
  label?: string
  /** Optional icon rendered before the label. */
  icon?: IconInput
  /** `'single'` picks one date; `'range'` picks a `from`/`to` pair. Defaults to `'single'`. */
  mode?: 'single' | 'range'
  /** Controlled selected value -- a `Date` in `'single'` mode, a `DateRange` in `'range'` mode. */
  value?: Date | DateRange
  /** Uncontrolled initial value, used only if `value` is omitted. */
  defaultValue?: Date | DateRange
  /** Earliest selectable date, inclusive. */
  min?: Date
  /** Latest selectable date, inclusive. */
  max?: Date
  /** Which day starts each calendar week. Defaults to `0` (Sunday). */
  weekStartsOn?: WeekStartsOn
  /** Formats a single date for display. Defaults to `Date.prototype.toLocaleDateString`. */
  format?: (date: Date) => string
  /** Placeholder shown when nothing is selected. Defaults to `'Select a date'` (or `'Select a date range'` in range mode). */
  placeholder?: string
  /** Disables the whole field. Defaults to `false`. */
  disabled?: boolean
  /** Shows a "Today" quick-jump button in the footer. Defaults to `true`. */
  showTodayButton?: boolean
  /** Shows a "Clear" button in the footer once a value is selected. Defaults to `true`. */
  showClearButton?: boolean
  /** Called whenever the selection changes (including clears, which pass `undefined`). */
  onChange?: (value: Date | DateRange | undefined) => void
}

/** The runtime control surface attached to every `DatePicker` element. */
export interface DatePickerApi {
  /** Returns the currently selected value, if any. */
  getValue: () => Date | DateRange | undefined
  /** Programmatically sets the value (does not trigger `onChange`). */
  setValue: (value: Date | DateRange | undefined) => void
  /** Opens the calendar popover. */
  open: () => void
  /** Closes the calendar popover. */
  close: () => void
  /** Returns whether the calendar popover is currently open. */
  isOpen: () => boolean
  /** Detaches the field from the DOM and its internal listeners. */
  destroy: () => void
}

/** A `DatePicker` is a real `HTMLDivElement` (the field wrapper) extended with `DatePickerApi`. */
export type DatePickerElement = HTMLDivElement & DatePickerApi

/** This component's own CSS -- the calendar popover, weekday header, range highlighting, and footer actions. Depends on `.pendentive-combobox` (registered via the imported `comboboxCss`). */
export const calendarCss = `
.pendentive-calendar { position: fixed; z-index: 1200; width: 280px; background: var(--pendentive-card); border: 1px solid var(--pendentive-border); border-radius: var(--pendentive-radius-lg); padding: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) }
.pendentive-calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px }
.pendentive-calendar-nav { background: transparent; border: none; color: var(--pendentive-foreground); cursor: pointer; display: flex; padding: 4px; border-radius: var(--pendentive-radius-sm) }
.pendentive-calendar-nav:hover:not(:disabled) { background: var(--pendentive-accent) }
.pendentive-calendar-nav:disabled { opacity: 0.35; cursor: not-allowed }
.pendentive-calendar-month { font-size: 12px; font-weight: 600 }
.pendentive-calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 2px }
.pendentive-calendar-weekday { height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: var(--pendentive-muted-foreground); text-transform: uppercase }
.pendentive-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px }
.pendentive-calendar-day { height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; border-radius: var(--pendentive-radius-sm); background: transparent; border: none; color: var(--pendentive-foreground); cursor: pointer; font-family: inherit }
.pendentive-calendar-day:hover:not(:disabled) { background: var(--pendentive-accent) }
.pendentive-calendar-day:disabled { opacity: 0.35; cursor: not-allowed }
.pendentive-calendar-day:focus-visible { outline: 2px solid var(--pendentive-ring); outline-offset: 1px }
.pendentive-calendar-day-outside { opacity: 0.35 }
.pendentive-calendar-day-selected { background: var(--pendentive-primary); color: var(--pendentive-primary-foreground) }
.pendentive-calendar-day-today:not(.pendentive-calendar-day-selected) { box-shadow: inset 0 0 0 1px var(--pendentive-ring) }
.pendentive-calendar-day-in-range { background: var(--pendentive-accent); border-radius: 0 }
.pendentive-calendar-day-range-start { background: var(--pendentive-primary); color: var(--pendentive-primary-foreground); border-radius: var(--pendentive-radius-sm) 0 0 var(--pendentive-radius-sm) }
.pendentive-calendar-day-range-end { background: var(--pendentive-primary); color: var(--pendentive-primary-foreground); border-radius: 0 var(--pendentive-radius-sm) var(--pendentive-radius-sm) 0 }
.pendentive-calendar-footer { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--pendentive-border) }
.pendentive-calendar-footer-button { flex: 1; padding: 6px 8px; font-size: 11px; border-radius: var(--pendentive-radius-sm); border: 1px solid var(--pendentive-border); background: transparent; color: var(--pendentive-foreground); cursor: pointer; font-family: inherit }
.pendentive-calendar-footer-button:hover { background: var(--pendentive-accent) }
.pendentive-combobox-input-clearable { padding-right: 46px }
.pendentive-combobox-clear { position: absolute; right: 26px; color: var(--pendentive-muted-foreground); background: transparent; border: none; cursor: pointer; display: flex; padding: 2px }
.pendentive-combobox-clear:hover { color: var(--pendentive-foreground) }
`

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function addDays(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count)
}

function isRange(value: Date | DateRange | undefined): value is DateRange {
  return Boolean(value) && typeof value === 'object' && 'from' in (value as object)
}

function clampDate(date: Date, min: Date | undefined, max: Date | undefined): Date {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

function buildWeekdayLabels(weekStartsOn: WeekStartsOn): string[] {
  const base = new Date(2021, 0, 3) // a Sunday
  const labels: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i + weekStartsOn)
    labels.push(day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2))
  }
  return labels
}

function getCalendarDays(viewDate: Date, weekStartsOn: WeekStartsOn): Array<{ date: Date, inCurrentMonth: boolean }> {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const leadingOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7
  const trailingOffset = (weekStartsOn + 6 - lastOfMonth.getDay() + 7) % 7
  const days: Array<{ date: Date, inCurrentMonth: boolean }> = []
  for (let i = leadingOffset; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), inCurrentMonth: false })
  for (let day = 1; day <= lastOfMonth.getDate(); day++) days.push({ date: new Date(year, month, day), inCurrentMonth: true })
  for (let i = 1; i <= trailingOffset; i++) days.push({ date: new Date(year, month + 1, i), inCurrentMonth: false })
  return days
}

/**
 * Creates a labeled date (or date-range) field backed by a floating month-grid calendar
 * popover with weekday headers, outside-month days, range selection with hover preview,
 * full keyboard navigation, and Today/Clear quick actions.
 */
export function DatePicker(options: DatePickerOptions = {}): DatePickerElement {
  assertDom('DatePicker')
  ensureComponentStyles('field-base', fieldBaseCss)
  ensureComponentStyles('text-input', textInputCss)
  ensureComponentStyles('combobox', comboboxCss)
  ensureComponentStyles('calendar', calendarCss)
  const mode = options.mode ?? 'single'
  const weekStartsOn = options.weekStartsOn ?? 0
  const min = options.min
  const max = options.max
  const format = options.format ?? ((date: Date) => date.toLocaleDateString())
  const onChange = options.onChange
  const showTodayButton = options.showTodayButton ?? true
  const showClearButton = options.showClearButton ?? true
  let value = options.value ?? options.defaultValue
  let rangeAnchor: Date | null = null
  let viewDate = (isRange(value) ? value.from : value) ?? new Date()
  let focusedDate = viewDate
  let isOpen = false
  let unbindOutside: (() => void) | null = null
  let unbindEscape: (() => void) | null = null
  const dayButtonsByTime = new Map<number, HTMLButtonElement>()

  function formatValue(v: Date | DateRange | undefined): string {
    if (!v) return ''
    if (isRange(v)) return v.to ? `${format(v.from)} - ${format(v.to)}` : format(v.from)
    return format(v)
  }

  function isDisabledDate(date: Date): boolean {
    return Boolean((min && date < min) || (max && date > max))
  }

  const root = el('div', px('field'))
  if (options.label) {
    const header = el('div', px('field-header'))
    const labelWrap = el('div', px('field-label'))
    if (options.icon) labelWrap.appendChild(Icon(options.icon, 14, { className: px('icon') })!)
    const labelText = document.createElement('span')
    labelText.textContent = options.label
    labelWrap.appendChild(labelText)
    header.appendChild(labelWrap)
    root.appendChild(header)
  }
  const wrap = el('div', px('combobox'))
  const input = el('input', cx(px('text-input'), px('combobox-input')))
  input.type = 'text'
  input.readOnly = true
  input.value = formatValue(value)
  input.placeholder = options.placeholder ?? (mode === 'range' ? 'Select a date range' : 'Select a date')
  input.disabled = options.disabled ?? false
  const clearButton = el('button', px('combobox-clear'))
  clearButton.type = 'button'
  const clearIcon = Icon(icons.x, 12)
  if (clearIcon) clearButton.appendChild(clearIcon)
  const calendarIcon = Icon(icons.calendar, 14, { className: px('combobox-chevron') })!
  wrap.append(input, clearButton, calendarIcon)
  root.appendChild(wrap)

  function syncClearButton(): void {
    const hasValue = Boolean(value)
    clearButton.style.display = hasValue && showClearButton ? 'flex' : 'none'
    input.classList.toggle(px('combobox-input-clearable'), hasValue && showClearButton)
  }
  syncClearButton()

  const calendar = el('div', cx(px('calendar'), px('hidden')))
  calendar.setAttribute('role', 'application')

  function focusDayButton(date: Date): void {
    dayButtonsByTime.get(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime())?.focus()
  }

  function updateHoverPreview(hovered: Date | null): void {
    if (mode !== 'range' || !rangeAnchor) return
    for (const [time, button] of dayButtonsByTime) {
      const date = new Date(time)
      const inPreview = hovered ? (date >= rangeAnchor && date <= hovered) || (date <= rangeAnchor && date >= hovered) : false
      button.classList.toggle(px('calendar-day-in-range'), inPreview && !isSameDay(date, rangeAnchor))
    }
  }

  function clearValue(): void {
    value = undefined
    rangeAnchor = null
    input.value = ''
    syncClearButton()
    onChange?.(undefined)
  }

  function handleDayClick(date: Date): void {
    if (isDisabledDate(date)) return
    if (mode === 'range') {
      if (!rangeAnchor) {
        rangeAnchor = date
        value = { from: date }
        input.value = formatValue(value)
        syncClearButton()
        renderCalendar()
      } else {
        const from = rangeAnchor <= date ? rangeAnchor : date
        const to = rangeAnchor <= date ? date : rangeAnchor
        value = { from, to }
        rangeAnchor = null
        input.value = formatValue(value)
        syncClearButton()
        onChange?.(value)
        close()
      }
    } else {
      value = date
      input.value = formatValue(value)
      syncClearButton()
      onChange?.(value)
      close()
    }
  }

  function renderCalendar(): void {
    calendar.replaceChildren()
    dayButtonsByTime.clear()
    const header = el('div', px('calendar-header'))
    const prevButton = el('button', px('calendar-nav'))
    prevButton.type = 'button'
    prevButton.setAttribute('aria-label', 'Previous month')
    const prevIcon = Icon(icons.chevronLeft, 14)
    if (prevIcon) prevButton.appendChild(prevIcon)
    prevButton.disabled = Boolean(min && addMonths(viewDate, -1) < startOfMonth(min))
    const nextButton = el('button', px('calendar-nav'))
    nextButton.type = 'button'
    nextButton.setAttribute('aria-label', 'Next month')
    const nextIcon = Icon(icons.chevronRight, 14)
    if (nextIcon) nextButton.appendChild(nextIcon)
    nextButton.disabled = Boolean(max && addMonths(viewDate, 1) > startOfMonth(max))
    const monthLabel = el('div', px('calendar-month'))
    monthLabel.textContent = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    prevButton.addEventListener('click', () => {
      viewDate = addMonths(viewDate, -1)
      renderCalendar()
    })
    nextButton.addEventListener('click', () => {
      viewDate = addMonths(viewDate, 1)
      renderCalendar()
    })
    header.append(prevButton, monthLabel, nextButton)
    const weekdaysRow = el('div', px('calendar-weekdays'))
    for (const label of buildWeekdayLabels(weekStartsOn)) {
      const cell = el('div', px('calendar-weekday'))
      cell.textContent = label
      weekdaysRow.appendChild(cell)
    }
    const grid = el('div', px('calendar-grid'))
    const today = new Date()
    for (const { date, inCurrentMonth } of getCalendarDays(viewDate, weekStartsOn)) {
      const dayButton = el('button', px('calendar-day'))
      dayButton.type = 'button'
      dayButton.textContent = String(date.getDate())
      dayButton.disabled = isDisabledDate(date)
      dayButton.tabIndex = isSameDay(date, focusedDate) ? 0 : -1
      if (!inCurrentMonth) dayButton.classList.add(px('calendar-day-outside'))
      if (isSameDay(date, today)) dayButton.classList.add(px('calendar-day-today'))
      const currentValue = value
      if (currentValue && !isRange(currentValue) && isSameDay(date, currentValue)) {
        dayButton.classList.add(px('calendar-day-selected'))
        dayButton.setAttribute('aria-selected', 'true')
      }
      if (currentValue && isRange(currentValue)) {
        if (isSameDay(date, currentValue.from)) dayButton.classList.add(px('calendar-day-range-start'), px('calendar-day-selected'))
        if (currentValue.to && isSameDay(date, currentValue.to)) dayButton.classList.add(px('calendar-day-range-end'), px('calendar-day-selected'))
        if (currentValue.to && date > currentValue.from && date < currentValue.to) dayButton.classList.add(px('calendar-day-in-range'))
      }
      dayButton.addEventListener('click', () => {
        focusedDate = date
        handleDayClick(date)
      })
      dayButton.addEventListener('mouseenter', () => updateHoverPreview(date))
      dayButtonsByTime.set(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(), dayButton)
      grid.appendChild(dayButton)
    }
    grid.addEventListener('mouseleave', () => updateHoverPreview(null))
    calendar.append(header, weekdaysRow, grid)
    if (showTodayButton || showClearButton) {
      const footer = el('div', px('calendar-footer'))
      if (showTodayButton) {
        const todayButton = el('button', px('calendar-footer-button'))
        todayButton.type = 'button'
        todayButton.textContent = 'Today'
        todayButton.addEventListener('click', () => {
          viewDate = startOfMonth(new Date())
          focusedDate = new Date()
          renderCalendar()
          focusDayButton(focusedDate)
        })
        footer.appendChild(todayButton)
      }
      if (showClearButton) {
        const clearFooterButton = el('button', px('calendar-footer-button'))
        clearFooterButton.type = 'button'
        clearFooterButton.textContent = 'Clear'
        clearFooterButton.addEventListener('click', () => {
          clearValue()
          renderCalendar()
        })
        footer.appendChild(clearFooterButton)
      }
      calendar.appendChild(footer)
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (event.key in deltas) {
      event.preventDefault()
      focusedDate = clampDate(addDays(focusedDate, deltas[event.key] as number), min, max)
      if (focusedDate.getMonth() !== viewDate.getMonth() || focusedDate.getFullYear() !== viewDate.getFullYear()) viewDate = startOfMonth(focusedDate)
      renderCalendar()
      focusDayButton(focusedDate)
    } else if (event.key === 'PageUp') {
      event.preventDefault()
      viewDate = addMonths(viewDate, -1)
      renderCalendar()
    } else if (event.key === 'PageDown') {
      event.preventDefault()
      viewDate = addMonths(viewDate, 1)
      renderCalendar()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleDayClick(focusedDate)
    }
  }

  function open(): void {
    if (isOpen || input.disabled) return
    isOpen = true
    viewDate = (isRange(value) ? value.from : value) ?? viewDate
    focusedDate = viewDate
    document.body.appendChild(calendar)
    calendar.classList.remove(px('hidden'))
    renderCalendar()
    positionFloating(wrap, calendar, 'bottom')
    calendar.addEventListener('keydown', handleKeydown)
    unbindOutside = onClickOutside([wrap, calendar], close)
    unbindEscape = onEscapeKey(close)
  }
  function close(): void {
    if (!isOpen) return
    isOpen = false
    rangeAnchor = null
    calendar.classList.add(px('hidden'))
    calendar.removeEventListener('keydown', handleKeydown)
    calendar.remove()
    unbindOutside?.()
    unbindOutside = null
    unbindEscape?.()
    unbindEscape = null
  }
  const toggleListener = (): void => (isOpen ? close() : open())
  input.addEventListener('click', toggleListener)
  calendarIcon.addEventListener('click', toggleListener)
  clearButton.addEventListener('click', (event) => {
    event.stopPropagation()
    clearValue()
    if (isOpen) renderCalendar()
  })
  const api: DatePickerApi = {
    getValue() {
      return value
    },
    setValue(newValue) {
      value = newValue
      input.value = formatValue(newValue)
      syncClearButton()
    },
    open,
    close,
    isOpen() {
      return isOpen
    },
    destroy() {
      input.removeEventListener('click', toggleListener)
      calendarIcon.removeEventListener('click', toggleListener)
      unbindOutside?.()
      unbindEscape?.()
      calendar.removeEventListener('keydown', handleKeydown)
      calendar.remove()
      root.remove()
    }
  }
  return attachController(root, api)
}