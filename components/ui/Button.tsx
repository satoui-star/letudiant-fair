"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

interface ButtonAsAnchorProps extends ButtonBaseProps {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  type?: undefined;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "le-btn-primary",
  secondary: "le-btn-secondary",
  ghost: "le-btn-ghost",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  className = "",
  style,
  ...rest
}: ButtonProps) {
  const classes = [
    "le-btn-base",
    VARIANT_CLASS[variant],
    size === "sm" ? "le-btn-sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in rest && rest.href !== undefined) {
    const { href, onClick } = rest as ButtonAsAnchorProps;
    const anchorStyle = disabled
      ? { pointerEvents: "none" as const, opacity: 0.45, ...style }
      : style;
    return (
      <a
        href={href}
        onClick={onClick}
        className={classes}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        style={anchorStyle}
      >
        {children}
      </a>
    );
  }

  const { onClick, type = "button" } = rest as ButtonAsButtonProps;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
    >
      {children}
    </button>
  );
}
