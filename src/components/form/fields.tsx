"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
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
