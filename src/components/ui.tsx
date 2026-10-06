'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function NumberInput({
  value,
  onChange,
  step,
  min,
  className = '',
  id,
  ariaLabel,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  className?: string;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(String(value ?? ''));
  useEffect(() => {
    const parsed = parseFloat(text);
    if (!(parsed === value || (text === '' && value === 0))) setText(String(value ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      className={`input ${className}`}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      data-step={step}
      data-min={min}
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/[^0-9.\-]/g, '');
        setText(t);
        const n = parseFloat(t);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function NumField({
  label,
  value,
  onChange,
  hint,
  className,
  testId,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  className?: string;
  testId?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <span data-testid={testId} className="block">
        <NumberInput value={value} onChange={onChange} ariaLabel={label} />
      </span>
    </Field>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  className,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  hint?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input className="input" type={type} value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'amber' | 'teal' | 'red' | 'blue' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    teal: 'bg-teal-100 text-teal-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-800',
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
