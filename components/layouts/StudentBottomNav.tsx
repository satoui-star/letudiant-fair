"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconHome() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9.5L11 2.5L19 9.5V19.5C19 20.052 18.552 20.5 18 20.5H14V15.5H8V20.5H4C3.448 20.5 3 20.052 3 19.5V9.5Z" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9" />
      <path d="M14.5 7.5L12.5 12.5L7.5 14.5L9.5 9.5L14.5 7.5Z" />
    </svg>
  );
}

function IconQR() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="13" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="13" width="7" height="7" rx="1" />
      <path d="M13 13H16M16 13V16M16 13H19V16H16M13 16V19H16V19M19 16V19" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6C2 4.895 2.895 4 4 4H9L11 6H18C19.105 6 20 6.895 20 8V17C20 18.105 19.105 19 18 19H4C2.895 19 2 18.105 2 17V6Z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="7" r="4" />
      <path d="M2 20C2 16.134 6.029 13 11 13C15.971 13 20 16.134 20 20" />
    </svg>
  );
}

export default function StudentBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const qrActive = isActive("/qr");

  return (
    <nav
      className="bottom-nav"
      aria-label="Navigation principale"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      {/* Accueil */}
      <Link
        href="/home"
        className={`bottom-nav-item${isActive("/home") ? " active" : ""}`}
        aria-current={isActive("/home") ? "page" : undefined}
      >
        <IconHome />
        <span>Accueil</span>
      </Link>

      {/* Découvrir */}
      <Link
        href="/discover"
        className={`bottom-nav-item${isActive("/discover") ? " active" : ""}`}
        aria-current={isActive("/discover") ? "page" : undefined}
      >
        <IconCompass />
        <span>Découvrir</span>
      </Link>

      {/* Mon QR — center action */}
      <Link
        href="/qr"
        aria-label="Mon QR code"
        aria-current={qrActive ? "page" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
          marginTop: -16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#E3001B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(227, 0, 27, 0.35)",
            flexShrink: 0,
          }}
        >
          <IconQR />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: qrActive ? "#E3001B" : "#6B6B6B",
            letterSpacing: "0.02em",
          }}
        >
          Mon QR
        </span>
      </Link>

      {/* Dossier */}
      <Link
        href="/saved"
        className={`bottom-nav-item${isActive("/saved") ? " active" : ""}`}
        aria-current={isActive("/saved") ? "page" : undefined}
      >
        <IconFolder />
        <span>Dossier</span>
      </Link>

      {/* Profil */}
      <Link
        href="/profile"
        className={`bottom-nav-item${isActive("/profile") ? " active" : ""}`}
        aria-current={isActive("/profile") ? "page" : undefined}
      >
        <IconProfile />
        <span>Profil</span>
      </Link>
    </nav>
  );
}
