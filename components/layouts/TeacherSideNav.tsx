"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { getSupabase } from "@/lib/supabase/client";

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

function IconGroup() {
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
      <circle cx="6" cy="6" r="3" />
      <path d="M1 17C1 13.686 3.686 11 6 11s5 2.686 5 6" />
      <circle cx="13.5" cy="7" r="2" />
      <path d="M11.5 17c0-2.209 0.895-4 2-4s2 1.791 2 4" />
    </svg>
  );
}

function IconInsights() {
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
      <path d="M2 14l4-4 3 3 4-5 3 2" />
      <rect x="1" y="1" width="16" height="16" rx="2" />
    </svg>
  );
}

function IconStudents() {
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
      <circle cx="9" cy="5" r="3" />
      <path d="M3 17C3 13.134 5.686 10 9 10s6 3.134 6 7" />
      <path d="M13 7l2.5 2-2.5 2" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/teacher/dashboard",
    label: "Dashboard",
    icon: <IconDashboard />,
  },
  {
    href: "/teacher/group",
    label: "Mon Groupe",
    icon: <IconGroup />,
  },
  {
    href: "/teacher/insights",
    label: "Intérêts de la Classe",
    icon: <IconInsights />,
  },
  {
    href: "/teacher/students",
    label: "Suivi Individuel",
    icon: <IconStudents />,
  },
];

export default function TeacherSideNav() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <aside className="admin-sidebar" aria-label="Navigation enseignant">
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
          Espace Enseignant
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
          gap: "8px",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
            <path d="M10 10l3-3-3-3" />
            <path d="M13 7H5" />
          </svg>
          Se déconnecter
        </button>
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
