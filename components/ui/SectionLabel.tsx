import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return <span className="le-section-label">{children}</span>;
}
