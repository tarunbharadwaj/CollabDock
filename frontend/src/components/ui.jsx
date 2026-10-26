import { Children, forwardRef, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { formatIndianNumberInput, normalizeMoneyInput } from '@/lib/format';

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', type = 'button', ...props }) {
  return <button type={type} className={`button button-${variant} button-${size} ${className}`} disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle size={16} className="spin" />}{children}</button>;
}
export function RequiredMark() {
  return <span className="required-mark" aria-hidden="true">*</span>;
}
function FieldLabel({ children, required }) {
  return <>{children}{required && <RequiredMark/>}</>;
}
export function Input({ label, error, hint, ...props }) {
  if (props.type === 'date') return <DateInput label={label} error={error} hint={hint} {...props} />;
  return <label className="field"><span><FieldLabel required={props.required}>{label}</FieldLabel></span><input {...props} />{error && <small className="field-error">{error}</small>}{hint && !error && <small>{hint}</small>}</label>;
}
export const MoneyInput = forwardRef(function MoneyInput({
  label,
  error,
  hint,
  value = '',
  onValueChange,
  onBlur,
  name,
  className = '',
  'aria-label': ariaLabel,
  ...props
}, forwardedRef) {
  const normalized = normalizeMoneyInput(value);
  const input = <input
    ref={forwardedRef}
    type="text"
    inputMode="decimal"
    className={`money-input ${className}`}
    value={formatIndianNumberInput(normalized)}
    onChange={(event) => onValueChange?.(normalizeMoneyInput(event.target.value))}
    onBlur={onBlur}
    aria-label={!label ? ariaLabel : undefined}
    aria-invalid={Boolean(error)}
    {...props}
  />;

  if (!label) return <>{input}{name && <input type="hidden" name={name} value={normalized} readOnly/>}</>;
  return <label className="field"><span><FieldLabel required={props.required}>{label}</FieldLabel></span>{input}{name && <input type="hidden" name={name} value={normalized} readOnly/>}{error && <small className="field-error">{error}</small>}{hint && !error && <small>{hint}</small>}</label>;
});
const displayDateFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function formatDisplayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return '';
  const [, year, month, day] = match;
  return displayDateFormatter.format(new Date(Number(year), Number(month) - 1, Number(day)));
}

export const DateInput = forwardRef(function DateInput({
  label,
  error,
  hint,
  className = '',
  id,
  value,
  defaultValue,
  onChange,
  onInput,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const inputRef = useRef(null);
  const [currentValue, setCurrentValue] = useState(() => String(value ?? defaultValue ?? ''));
  const inputId = id || `date-${generatedId}`;

  useEffect(() => {
    if (value !== undefined) setCurrentValue(String(value || ''));
  }, [value]);

  const setRef = useCallback((node) => {
    inputRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
    if (node) queueMicrotask(() => setCurrentValue(node.value || ''));
  }, [forwardedRef]);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form) return undefined;
    const syncAfterReset = () => requestAnimationFrame(() => setCurrentValue(input.value || ''));
    form.addEventListener('reset', syncAfterReset);
    return () => form.removeEventListener('reset', syncAfterReset);
  }, []);

  const handleChange = (event) => {
    setCurrentValue(event.target.value);
    onChange?.(event);
  };
  const handleInput = (event) => {
    setCurrentValue(event.target.value);
    onInput?.(event);
  };
  const openPicker = () => {
    if (props.disabled || props.readOnly) return;
    if (typeof inputRef.current?.showPicker === 'function') inputRef.current.showPicker();
    else inputRef.current?.focus();
  };

  const displayValue = formatDisplayDate(currentValue);

  return (
    <div className={`field date-field ${className}`}>
      <label htmlFor={inputId}><FieldLabel required={props.required}>{label}</FieldLabel></label>
      <div className="date-input-shell" data-empty={!displayValue}>
        <input
          id={inputId}
          ref={setRef}
          type="date"
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={handleChange}
          onInput={handleInput}
          {...props}
        />
        <span className="date-input-display" aria-hidden="true">{displayValue || 'Select date'}</span>
        <button type="button" onClick={openPicker} aria-label={`Choose ${label?.toLowerCase() || 'date'}`} disabled={props.disabled || props.readOnly}><CalendarDays size={17} strokeWidth={1.8}/></button>
      </div>
      {error && <small className="field-error">{error}</small>}
      {hint && !error && <small>{hint}</small>}
    </div>
  );
});
function selectOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === 'option') {
      return [{
        value: String(child.props.value ?? child.props.children ?? ''),
        label: child.props.children,
        description: child.props['data-description'],
        disabled: Boolean(child.props.disabled),
      }];
    }
    return selectOptions(child.props?.children);
  });
}

export const Select = forwardRef(function Select({
  label,
  error,
  hint,
  children,
  className = '',
  id,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  required,
  name,
  placeholder,
  'aria-label': ariaLabel,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const menuId = `${selectId}-menu`;
  const options = useMemo(() => selectOptions(children), [children]);
  const controlled = value !== undefined;
  const firstValue = placeholder ? '' : options.find((option) => !option.disabled)?.value ?? '';
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue ?? firstValue));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState(null);
  const nativeRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const currentValue = controlled ? String(value ?? '') : internalValue;
  const selected = options.find((option) => option.value === currentValue);

  const assignRef = (node) => {
    nativeRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
    if (node && !controlled) requestAnimationFrame(() => setInternalValue(node.value));
  };

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = Math.min(options.length * 58 + 10, 290);
    const opensUp = rect.bottom + estimatedHeight + 12 > window.innerHeight && rect.top > estimatedHeight;
    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    setMenuPosition({
      left,
      width,
      top: opensUp ? undefined : rect.bottom + 8,
      bottom: opensUp ? window.innerHeight - rect.top + 8 : undefined,
      opensUp,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const closeOutside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, updatePosition]);

  const openMenu = (direction = 1) => {
    if (disabled) return;
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === currentValue));
    setActiveIndex(direction < 0 ? Math.max(0, selectedIndex) : selectedIndex);
    setOpen(true);
  };

  const choose = (option) => {
    if (!option || option.disabled) return;
    const native = nativeRef.current;
    if (native) {
      native.value = option.value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      setInternalValue(option.value);
    }
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveActive = (step) => {
    if (!options.length) return;
    let next = activeIndex;
    do next = (next + step + options.length) % options.length;
    while (options[next]?.disabled && next !== activeIndex);
    setActiveIndex(next);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu(event.key === 'ArrowUp' ? -1 : 1);
      else moveActive(event.key === 'ArrowUp' ? -1 : 1);
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const menu = open && menuPosition && createPortal(
    <div
      ref={menuRef}
      id={menuId}
      role="listbox"
      aria-label={ariaLabel || label}
      className={`select-menu ${menuPosition.opensUp ? 'opens-up' : ''}`}
      style={{ left: menuPosition.left, width: menuPosition.width, top: menuPosition.top, bottom: menuPosition.bottom }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {options.map((option, index) => (
        <button
          id={`${menuId}-option-${index}`}
          type="button"
          role="option"
          aria-selected={option.value === currentValue}
          className={`select-option ${index === activeIndex ? 'active' : ''} ${option.value === currentValue ? 'selected' : ''}`}
          key={`${option.value}-${index}`}
          disabled={option.disabled}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option)}
        >
          <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
          {option.value === currentValue && <Check size={17} strokeWidth={2.3} />}
        </button>
      ))}
    </div>,
    document.body,
  );

  return <div className={`field custom-select-field ${className}`}>{label && <label id={`${selectId}-label`} htmlFor={selectId}><FieldLabel required={required}>{label}</FieldLabel></label>}<div className="custom-select"><select ref={assignRef} className="native-select-proxy" name={name} required={required} disabled={disabled} value={currentValue} onChange={(event) => { setInternalValue(event.target.value); onChange?.(event); }} onBlur={onBlur} tabIndex={-1} aria-hidden="true" {...props}>{placeholder && <option value="" disabled={required} hidden>{placeholder}</option>}{children}</select><button ref={triggerRef} id={selectId} type="button" className="select-trigger" data-placeholder={!selected || undefined} disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} aria-labelledby={label ? `${selectId}-label ${selectId}-value` : undefined} aria-label={!label ? ariaLabel : undefined} aria-activedescendant={open ? `${menuId}-option-${activeIndex}` : undefined} aria-invalid={Boolean(error)} onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={handleKeyDown}><span id={`${selectId}-value`}>{selected?.label ?? placeholder ?? 'Select an option'}</span><ChevronDown size={17} strokeWidth={2} aria-hidden="true"/></button>{menu}</div>{error && <small className="field-error">{error}</small>}{hint && !error && <small>{hint}</small>}</div>;
});
export function Textarea({ label, error, required, ...props }) {
  return <label className="field"><span><FieldLabel required={required}>{label}</FieldLabel></span><textarea required={required} {...props} />{error && <small className="field-error">{error}</small>}</label>;
}
export function Modal({ open, onClose, title, description, children, size = '' }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = requestAnimationFrame(() => {
      const preferredFocus = dialogRef.current?.querySelector('[autofocus]');
      if (preferredFocus) preferredFocus.focus();
      else dialogRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [])];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsOutside = !dialogRef.current?.contains(document.activeElement);
      if (focusIsOutside) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-scrim" role="presentation" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex="-1">
        <span className="modal-handle" aria-hidden="true"/>
        <header>
          <div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div>
          <button type="button" className="icon-button modal-close-button" onClick={onClose} aria-label="Close popup"><X size={18}/></button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
export function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }
export function EmptyState({ icon: Icon, title, description, action }) { return <div className="empty-state">{Icon && <span className="empty-icon"><Icon size={24} /></span>}<h3>{title}</h3><p>{description}</p>{action}</div>; }
export function PageHeader({ eyebrow, title, description, action }) { return <header className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>; }
