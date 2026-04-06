"use client";

import { use, useState } from "react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Tag from "@/components/ui/Tag";

// Mock group data
const MOCK_GROUP = {
  school: "Lycée Victor Hugo",
  class: "Classe de Terminale S",
  teacher: "M. Martin",
  fairName: "Salon de Paris — 15 avril 2026",
};

export default function GroupInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!gdprAccepted || !firstName.trim() || !lastName.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F4F4F4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#FDEAEA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            fontSize: "32px",
          }}
        >
          ✅
        </div>
        <h1 className="le-h2" style={{ marginBottom: "12px" }}>
          Inscription confirmée !
        </h1>
        <p className="le-body" style={{ maxWidth: "360px", marginBottom: "28px" }}>
          Vous êtes bien inscrit(e) au {MOCK_GROUP.fairName}. Retrouvez votre
          groupe — {MOCK_GROUP.school}, {MOCK_GROUP.class}.
        </p>
        <a href="/student/home" className="le-btn-base le-btn-primary">
          Accéder au salon →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F4F4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #E8E8E8",
          boxShadow: "0 4px 24px rgba(26,26,26,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: "linear-gradient(135deg, #E3001B, #003C8F)",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Logo variant="inverted" size="sm" />
          <Tag variant="yellow" className="self-start">
            Invitation de groupe
          </Tag>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          {/* Group info */}
          <div
            style={{
              background: "#F4F4F4",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "#6B6B6B",
                marginBottom: "6px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Invitation reçue de
            </p>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#1A1A1A",
                marginBottom: "4px",
              }}
            >
              {MOCK_GROUP.teacher}
            </p>
            <p style={{ fontSize: "14px", color: "#3D3D3D" }}>
              {MOCK_GROUP.school} &mdash; {MOCK_GROUP.class}
            </p>
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "#E6ECF8",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 14 14"
                fill="none"
                stroke="#003C8F"
                strokeWidth={1.8}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="1" y="2" width="12" height="11" rx="2" />
                <path d="M4 2V1M10 2V1M1 6h12" />
              </svg>
              <span style={{ fontSize: "13px", color: "#003C8F", fontWeight: 600 }}>
                {MOCK_GROUP.fairName}
              </span>
            </div>
          </div>

          {/* Invitation note */}
          <div
            style={{
              borderLeft: "3px solid #FFD100",
              paddingLeft: "12px",
              marginBottom: "24px",
            }}
          >
            <p style={{ fontSize: "14px", color: "#3D3D3D", lineHeight: 1.55 }}>
              <strong>{MOCK_GROUP.teacher}</strong> vous a invité(e) à vous
              inscrire au salon via ce lien. Remplissez vos informations
              ci-dessous pour rejoindre le groupe.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
              >
                <Input
                  id="firstName"
                  label="Prénom"
                  placeholder="Marie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  id="lastName"
                  label="Nom"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <Input
                id="email"
                type="email"
                label="Email (optionnel)"
                placeholder="marie@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="phone"
                type="tel"
                label="Téléphone (optionnel)"
                placeholder="+33 6 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {/* GDPR checkbox */}
              <label
                htmlFor="gdpr"
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  padding: "12px",
                  background: "#F4F4F4",
                  borderRadius: "8px",
                  border: gdprAccepted
                    ? "1.5px solid #E3001B"
                    : "1.5px solid #E8E8E8",
                }}
              >
                <input
                  id="gdpr"
                  type="checkbox"
                  checked={gdprAccepted}
                  onChange={(e) => setGdprAccepted(e.target.checked)}
                  style={{
                    marginTop: "2px",
                    accentColor: "#E3001B",
                    width: "16px",
                    height: "16px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "13px", color: "#3D3D3D", lineHeight: 1.5 }}>
                  J&apos;accepte de partager mes données avec L&apos;Étudiant
                  pour cet événement, conformément à la{" "}
                  <a
                    href="#"
                    style={{ color: "#E3001B", textDecoration: "underline" }}
                  >
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                disabled={
                  loading ||
                  !gdprAccepted ||
                  !firstName.trim() ||
                  !lastName.trim()
                }
              >
                {loading ? "Inscription…" : "Rejoindre le salon →"}
              </Button>
            </div>
          </form>

          <p
            style={{
              marginTop: "16px",
              fontSize: "11px",
              color: "#6B6B6B",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Lien d&apos;invitation unique — token : {token}
          </p>
        </div>
      </div>
    </div>
  );
}
