"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MILESTONES = [
  {
    date: "5 avril 2026",
    label: "Compte créé",
    icon: "🎉",
    done: true,
  },
  {
    date: null,
    label: "5 établissements sauvegardés",
    icon: "🏫",
    done: true,
  },
  {
    date: "15 avril 2026",
    label: "Inscrite au Salon de Paris",
    icon: "📍",
    done: true,
  },
  {
    date: null,
    label: "2 filières de prédilection identifiées",
    icon: "🎯",
    done: true,
  },
];

const SAVED_SCHOOLS = [
  { name: "HEC Paris", type: "Grande école", city: "Jouy-en-Josas", tagVariant: "blue" as const },
  { name: "Sciences Po Paris", type: "Institut d'études politiques", city: "Paris", tagVariant: "blue" as const },
  { name: "INSA Lyon", type: "École d'ingénieurs", city: "Lyon", tagVariant: "red" as const },
  { name: "Kedge Business School", type: "École de commerce", city: "Bordeaux", tagVariant: "yellow" as const },
  { name: "Université Paris-Saclay", type: "Université publique", city: "Saclay", tagVariant: "gray" as const },
];

const FILIERES_INFO = [
  {
    name: "Économie-Gestion",
    icon: "💼",
    description:
      "Formations en commerce, management, finance et gestion d'entreprise. Inclut les BTS, bachelor et grandes écoles de commerce comme HEC, ESSEC, ESCP.",
  },
  {
    name: "Ingénierie-Industrie",
    icon: "⚙️",
    description:
      "Écoles d'ingénieurs (INSA, Centrale, Mines), BTS industriels et licences professionnelles. Accès par concours ou sur dossier post-bac.",
  },
  {
    name: "Santé-Social",
    icon: "🏥",
    description:
      "Médecine, pharmacie, infirmier, travail social. Nombreux concours d'entrée (PASS, LAS) et formations paramedicales en IFSi.",
  },
  {
    name: "Droit-Sciences politiques",
    icon: "⚖️",
    description:
      "Facultés de droit, Sciences Po, IEP. Prépare aux métiers du droit, de la justice, de la diplomatie et des institutions publiques.",
  },
  {
    name: "Arts-Culture",
    icon: "🎨",
    description:
      "Écoles d'art, de design, de cinéma et de musique. Conservatoires, DNSEP, master design et formations en arts du spectacle.",
  },
  {
    name: "Sciences-Nature",
    icon: "🔬",
    description:
      "Licences sciences, classes prépa BCPST, masters en biologie, environnement, physique et chimie. Accès à la recherche et aux métiers scientifiques.",
  },
];

const RESOURCES = [
  {
    title: "Comprendre Parcoursup",
    description: "Guide complet pour accompagner votre enfant dans ses vœux et comprendre l'algorithme.",
    icon: "📋",
  },
  {
    title: "Financement des études supérieures",
    description: "Bourses sur critères sociaux, prêts étudiants, aides régionales et logement Crous.",
    icon: "💰",
  },
  {
    title: "Comment choisir une école ?",
    description: "Les critères à prendre en compte : accréditation, réseau, débouchés, coût, localisation.",
    icon: "🎓",
  },
  {
    title: "Les aides et bourses disponibles",
    description: "Tour d'horizon des bourses publiques et privées accessibles aux étudiants en France.",
    icon: "🏆",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParentOrientationPage() {
  const [openFiliere, setOpenFiliere] = useState<string | null>(null);

  function toggleFiliere(name: string) {
    setOpenFiliere((prev) => (prev === name ? null : name));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Page title */}
      <div>
        <h1 className="le-h1" style={{ marginBottom: "4px" }}>
          Parcours d&apos;orientation d&apos;Emma
        </h1>
        <p className="le-body" style={{ color: "#6B6B6B" }}>
          Suivez l&apos;avancement et les choix de votre enfant.
        </p>
      </div>

      {/* Timeline */}
      <section>
        <span className="le-section-label">Étapes clés</span>
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            position: "relative",
          }}
        >
          {MILESTONES.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                position: "relative",
                paddingBottom: i < MILESTONES.length - 1 ? "20px" : "0",
              }}
            >
              {/* Timeline line */}
              {i < MILESTONES.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "19px",
                    top: "40px",
                    width: "2px",
                    height: "calc(100% - 24px)",
                    background: "#E8E8E8",
                  }}
                />
              )}

              {/* Icon circle */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: m.done ? "#FDEAEA" : "#F4F4F4",
                  border: m.done ? "2px solid #E3001B" : "2px solid #E8E8E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "1.125rem",
                  zIndex: 1,
                  position: "relative",
                }}
              >
                {m.icon}
              </div>

              {/* Content */}
              <div style={{ paddingTop: "8px" }}>
                <p style={{ fontWeight: 600, color: "#1A1A1A", margin: "0 0 2px", fontSize: "0.9375rem" }}>
                  {m.label}
                </p>
                {m.date && (
                  <p style={{ fontSize: "0.8125rem", color: "#6B6B6B", margin: 0 }}>{m.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Saved schools (read-only) */}
      <section>
        <span className="le-section-label">Établissements sauvegardés</span>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {SAVED_SCHOOLS.map((school) => (
            <div
              key={school.name}
              className="le-card le-card-padded"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#1A1A1A", margin: "0 0 4px", fontSize: "0.9375rem" }}>
                  {school.name}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#6B6B6B", margin: 0 }}>{school.city}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                <Tag variant={school.tagVariant} style={{ fontSize: "0.75rem" }}>{school.type}</Tag>
                <span style={{ fontSize: "0.8rem", color: "#E3001B" }}>❤️ Sauvegardé</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filieres accordion */}
      <section>
        <span className="le-section-label">Comprendre les filières</span>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {FILIERES_INFO.map((f) => {
            const isOpen = openFiliere === f.name;
            return (
              <div
                key={f.name}
                style={{
                  background: "#ffffff",
                  border: isOpen ? "2px solid #E3001B" : "1.5px solid #E8E8E8",
                  borderRadius: "10px",
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFiliere(f.name)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.25rem" }}>{f.icon}</span>
                    <span style={{ fontWeight: 600, color: "#1A1A1A", fontSize: "0.9375rem", textAlign: "left" }}>
                      {f.name}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                      color: "#6B6B6B",
                    }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "0 16px 16px 16px",
                      fontSize: "0.875rem",
                      color: "#3D3D3D",
                      lineHeight: 1.6,
                      borderTop: "1px solid #F4F4F4",
                      paddingTop: "12px",
                    }}
                  >
                    {f.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Resources for parents */}
      <section style={{ marginBottom: "8px" }}>
        <span className="le-section-label">Ressources pour les parents</span>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {RESOURCES.map((res) => (
            <a
              key={res.title}
              href="#"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                background: "#ffffff",
                borderRadius: "10px",
                padding: "16px",
                borderLeft: "4px solid #E3001B",
                textDecoration: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(227,0,27,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
              }}
            >
              <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{res.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px", fontSize: "0.9375rem" }}>
                  {res.title}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#6B6B6B", margin: 0, lineHeight: 1.5 }}>
                  {res.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
