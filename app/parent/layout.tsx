import React from "react";
import Logo from "@/components/ui/Logo";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <div
        style={{
          background: "#EC1F27",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo variant="inverted" size="sm" />
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Espace Parent</span>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
