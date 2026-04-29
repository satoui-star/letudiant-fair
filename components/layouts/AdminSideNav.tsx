"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import { getSupabase } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
}

function IconDashboard() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="7" rx="1" /><rect x="11" y="1" width="6" height="4" rx="1" /><rect x="1" y="11" width="6" height="6" rx="1" /><rect x="11" y="8" width="6" height="9" rx="1" /></svg>);
}
function IconSalons() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3H16V13H2Z" /><path d="M5 13V15M13 13V15M3 15H15" /></svg>);
}
function IconUsers() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 17C1 13.686 3.686 11 7 11" /><circle cx="13" cy="7" r="2.5" /><path d="M10 17C10 14.239 11.343 12 13 12C14.657 12 16 14.239 16 17" /></svg>);
}
function IconStudents() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L1 6L9 10L17 6L9 2Z" /><path d="M4 8V13C4 13 6 15.5 9 15.5C12 15.5 14 13 14 13V8" /><path d="M17 6V12" /></svg>);
}
function IconSegments() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7" /><path d="M9 2V9L14.5 13" /><path d="M9 9L4 13.5" /></svg>);
}
function IconSettings() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /><path d="M9 1V3M9 15V17M1 9H3M15 9H17M3.05 3.05L4.46 4.46M13.54 13.54L14.95 14.95M14.95 3.05L13.54 4.46M4.46 13.54L3.05 14.95" /></svg>);
}
function IconLogout() {
  return (<svg width={18} height={18} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 15H3a1 1 0 01-1-1V4a1 1 0 011-1h3" /><polyline points="11 13 16 9 11 5" /><line x1="16" y1="9" x2="6" y2="9" /></svg>);
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: <IconDashboard />, activeColor: "#EC1F27" },
  { href: "/admin/salons", label: "Salons", icon: <IconSalons />, activeColor: "#FF6B35" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: <IconUsers />, activeColor: "#0066CC" },
  { href: "/admin/students", label: "Étudiants", icon: <IconStudents />, activeColor: "#4DB8A8" },
  { href: "/admin/segments", label: "Segments", icon: <IconSegments />, activeColor: "#932D99" },
  { href: "/admin/parametres", label: "Paramètres", icon: <IconSettings />, activeColor: "#6B6B6B" },
];

export default function AdminSideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nextSalon, setNextSalon] = useState<{ name: string; city: string; date: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
          const { data: profile } = await sb.from("users").select("name").eq("id", user.id).maybeSingle();
          if (profile) setUserName(profile.name);
        }
        const { data: events } = await sb
          .from("events")
          .select("name, city, event_date")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(1);
        if (events && events.length > 0) {
          setNextSalon({
            name: events[0].name,
            city: events[0].city,
            date: new Date(events[0].event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          });
        }
      } catch (e) {
        console.error("[SideNav]", e);
      }
    })();
  }, []);

  async function handleLogout() {
    try {
      const sb = getSupabase();
      await sb.auth.signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  const initials = userName
    ? userName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : userEmail
      ? userEmail[0].toUpperCase()
      : "?";

  return (
    <aside className="admin-sidebar" aria-label="Navigation administration">
      {/* Logo */}
      <div style={{ padding: "24px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Logo variant="dark" size="sm" />
        <p style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "8px 0 0",
        }}>
          Administration
        </p>
      </div>

      {/* Salon status */}
      {nextSalon && (
        <div style={{
          margin: "10px 8px", padding: "10px 12px",
          background: "rgba(255,255,255,0.06)", borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#4DB8A8",
              boxShadow: "0 0 0 2px rgba(77,184,168,0.3)",
            }} />
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
              Prochain salon
            </span>
          </div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.3 }}>
            {nextSalon.city}
          </p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
            {nextSalon.date}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`admin-nav-item${isActive ? " active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  style={isActive ? {
                    borderLeft: `3px solid ${item.activeColor}`,
                    paddingLeft: "9px",
                  } : undefined}
                >
                  <span style={isActive ? { color: item.activeColor } : undefined}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 12px", marginBottom: "8px",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.05em", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)",
              margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userName ?? "Administrateur"}
            </p>
            <p style={{
              fontSize: "10px", color: "rgba(255,255,255,0.35)",
              margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userEmail ?? ""}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
            color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(236,31,39,0.12)";
            e.currentTarget.style.borderColor = "rgba(236,31,39,0.25)";
            e.currentTarget.style.color = "#EC1F27";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <IconLogout />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}