"use client";

import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "../icons";

const base =
  "w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800";
const normal = "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800";
const invalid = "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500";

export function Label({ htmlFor, children, required, className }: { htmlFor?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300", className)}>
      {children}
      {required && <span className="ml-0.5 text-error-500" aria-hidden>*</span>}
    </label>
  );
}

export function FieldMessage({ error, hint, id }: { error?: string; hint?: ReactNode; id?: string }) {
  if (error) return <p id={id} className="mt-1.5 text-xs text-error-600 dark:text-error-400" role="alert">{error}</p>;
  if (hint) return <p id={id} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>;
  return null;
}

interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ label, required, error, hint, className, id, ...props }, ref) {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <div className={className}>
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${inputId}-msg` : undefined}
          className={cn(base, "h-11 py-2.5", error ? invalid : normal)}
          {...props}
        />
        <FieldMessage id={`${inputId}-msg`} error={error} hint={hint} />
      </div>
    );
  },
);

export function Select({
  label,
  required,
  error,
  hint,
  className,
  id,
  placeholder,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> &
  FieldProps & { placeholder?: string; options: { value: string; label: string }[] }) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={className}>
      {label && <Label htmlFor={selectId} required={required}>{label}</Label>}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={cn(base, "h-11 appearance-none py-2.5 pr-10", error ? invalid : normal, !props.value && "text-gray-400 dark:text-white/40")}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

export function TextArea({
  label,
  required,
  error,
  hint,
  className,
  id,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <div className={className}>
      {label && <Label htmlFor={areaId} required={required}>{label}</Label>}
      <textarea id={areaId} rows={rows} aria-invalid={!!error} className={cn(base, "resize-y py-2.5", error ? invalid : normal)} {...props} />
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 select-none", disabled && "cursor-not-allowed opacity-60", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20",
          checked ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900",
        )}
      >
        {checked && <CheckIcon size={14} strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-sm text-gray-700 dark:text-gray-300">{label}</span>
        {description && <span className="block text-xs text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
    </label>
  );
}

/** Grupo de opções padronizadas em "pílulas" (escolha única). */
export function ChoiceGroup<T extends string>({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  options,
  className,
}: FieldProps & {
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  const groupId = useId();
  return (
    <div className={className} role="radiogroup" aria-labelledby={label ? groupId : undefined}>
      {label && (
        <span id={groupId} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.hint}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                  : error
                    ? "border-error-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-error-500/50 dark:bg-gray-900 dark:text-gray-300"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(base, normal, "h-11 py-2.5 pl-10")}
      />
    </div>
  );
}

/**
 * Campo de texto com sugestões (substitui o <datalist> nativo, cuja lista é
 * desenhada pelo browser e não segue o tema da aplicação). Aceita texto livre.
 */
export function AutocompleteInput({
  label,
  required,
  error,
  hint,
  className,
  id,
  value,
  onValueChange,
  suggestions,
  placeholder,
  disabled,
}: FieldProps & {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const query = value.trim().toLowerCase();
  const exact = suggestions.some((s) => s.toLowerCase() === query);
  // Com um valor já escolhido mostra a lista toda, para ser fácil trocar.
  const items = !query || exact ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(query));
  const show = open && !disabled && items.length > 0;

  useEffect(() => {
    if (!show || active < 0) return;
    (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [active, show]);

  const pick = (s: string) => {
    onValueChange(s);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (items.length ? (i + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (items.length ? (i <= 0 ? items.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter" && show && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape" && show) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className={className}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${inputId}-msg` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(base, "h-11 py-2.5 pr-10", error ? invalid : normal)}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Mostrar sugestões"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            document.getElementById(inputId)?.focus();
            setOpen((o) => !o);
          }}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none dark:hover:bg-white/5"
        >
          <ChevronDownIcon size={18} className={cn("transition-transform", show && "rotate-180")} />
        </button>
        {show && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="custom-scrollbar absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            {items.map((s, i) => {
              const selected = s.toLowerCase() === query;
              return (
                <li
                  key={s}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300",
                    i === active && "bg-gray-100 dark:bg-white/5",
                    selected && "font-medium text-brand-600 dark:text-brand-400",
                  )}
                >
                  {s}
                  {selected && <CheckIcon size={16} strokeWidth={2.2} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <FieldMessage id={`${inputId}-msg`} error={error} hint={hint} />
    </div>
  );
}
