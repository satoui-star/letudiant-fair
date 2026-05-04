"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function IconDashboard() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="6" height="7" rx="1" />
      <rect x="11" y="1" width="6" height="4" rx="1" />
      <rect x="1" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="8" width="6" height="9" rx="1" />
    </svg>
  );
}

function IconLeads() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2H6C4.895 2 4 2.895 4 4V14C4 15.105 4.895 16 6 16H12C13.105 16 14 15.105 14 14V4C14 2.895 13.105 2 12 2Z" />
      <path d="M7 6H11M7 9H11M7 12H9" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="15" height="14" rx="1.5" />
      <path d="M1.5 7h15M6 1v3M12 1v3M5 11h2M8.5 11h2M12 11h2M5 14h2M8.5 14h2" />
    </svg>
  )
}

function IconProfile() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="3.5" />
      <path d="M1.5 17C1.5 13.41 4.91 10.5 9 10.5C13.09 10.5 16.5 13.41 16.5 17" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/exhibitor/dashboard",
    label: "Tableau de bord",
    icon: <IconDashboard />,
  },
  { href: "/exhibitor/appointments", label: "Rendez-vous", icon: <IconLeads /> },
  { href: "/exhibitor/salons", label: "Mes salons", icon: <IconCalendar /> },
  { href: "/exhibitor/profile", label: "Profil", icon: <IconProfile /> },
];

function IconLogout() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 16H3C1.895 16 1 15.105 1 14V4C1 2.895 1.895 2 3 2H11" />
      <polyline points="14 7 17 10 14 13" />
      <line x1="17" y1="10" x2="6" y2="10" />
    </svg>
  );
}

export default function ExhibitorSideNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <aside className="admin-sidebar" aria-label="Navigation exposant">
      {/* Logo area */}
      <div
        style={{
          padding: "24px 16px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Logo variant="dark" size="sm" />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`admin-nav-item${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer branding */}
      <div
        style={{
          padding: "12px 8px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={handleLogout}
          className="admin-nav-item"
          style={{
            background: "rgba(236, 31, 39, 0.15)",
            color: "#ffffff",
            border: "none",
            width: "100%",
          }}
          aria-label="Déconnexion"
        >
          <IconLogout />
          <span>Déconnexion</span>
        </button>
        <p
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
            paddingLeft: "8px",
          }}
        >
          Espace Exposant
        </p>
      </div>
    </aside>
  );
}
