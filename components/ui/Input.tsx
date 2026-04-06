"use client";

import React from "react";

interface InputProps {
  label?: string;
  id: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = "",
}: InputProps) {
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
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
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
      />
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
