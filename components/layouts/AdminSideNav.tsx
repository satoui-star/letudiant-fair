"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

function IconSalons() {
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
      <path d="M2 3H16V13H2Z" />
      <path d="M5 13V15M13 13V15M3 15H15" />
    </svg>
  );
}

function IconUsers() {
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
      <circle cx="7" cy="6" r="3" />
      <path d="M1 17C1 13.686 3.686 11 7 11" />
      <circle cx="13" cy="7" r="2.5" />
      <path d="M10 17C10 14.239 11.343 12 13 12C14.657 12 16 14.239 16 17" />
    </svg>
  );
}

function IconSettings() {
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
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 1V3M9 15V17M1 9H3M15 9H17M3.05 3.05L4.46 4.46M13.54 13.54L14.95 14.95M14.95 3.05L13.54 4.46M4.46 13.54L3.05 14.95" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Tableau de bord",
    icon: <IconDashboard />,
  },
  {
    href: "/admin/salons",
    label: "Salons",
    icon: <IconSalons />,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: <IconUsers />,
  },
  {
    href: "/admin/settings",
    label: "Paramètres",
    icon: <IconSettings />,
  },
];

export default function AdminSideNav() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar" aria-label="Navigation administration">
      {/* Logo area */}
      <div
        style={{
          padding: "24px 16px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Logo variant="dark" size="sm" />
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            margin: "8px 0 0",
          }}
        >
          Administration
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
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

      {/* Footer */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
          }}
        >
          Espace Administration
        </p>
        <p
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.2)",
            margin: 0,
          }}
        >
          L&apos;Étudiant Salons
        </p>
      </div>
    </aside>
  );
}
