import React from "react";

type TagVariant = "red" | "blue" | "yellow" | "gray";

interface TagProps {
  variant?: TagVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_CLASS: Record<TagVariant, string> = {
  red: "le-tag-red",
  blue: "le-tag-blue",
  yellow: "le-tag-yellow",
  gray: "le-tag-gray",
};

export default function Tag({
  variant = "gray",
  children,
  className = "",
  style,
}: TagProps) {
  const classes = ["le-tag", VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} style={style}>{children}</span>;
}
