"use client";

import React from "react";

interface SelectProps {
  label?: string;
  id: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  label,
  id,
  value,
  onChange,
  options,
  required = false,
  error,
  disabled = false,
  className = "",
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="le-label">
          {label}
          {required && (
            <span className="text-le-red ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="le-input"
        style={
          error
            ? {
                borderColor: "var(--le-red)",
                boxShadow: "0 0 0 3px rgba(227, 0, 27, 0.12)",
              }
            : undefined
        }
      >
        <option value="">Sélectionner...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          style={{
            fontSize: "12px",
            color: "var(--le-red)",
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
