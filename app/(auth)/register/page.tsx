"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

type Step = 1 | "1b" | 2 | 3;

const DOMAINS = [
  "Business",
  "Ingénierie",
  "Design",
  "Santé",
  "Droit",
  "Sciences",
  "Arts",
  "Communication",
];

const LEVELS = [
  "Seconde",
  "Première",
  "Terminale",
  "Post-bac",
];

function StepDots({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        marginBottom: "32px",
      }}
      aria-label={`Étape ${current} sur 3`}
    >
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            width: n === current ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: n === current ? "#E3001B" : "#E8E8E8",
            transition: "all 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");

  // Step 1b
  const [parentEmail, setParentEmail] = useState("");

  // Step 2
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getStepDot(): number {
    if (step === 1 || step === "1b") return 1;
    if (step === 2) return 2;
    return 3;
  }

  function isUnder16(): boolean {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    const adjustedAge =
      m < 0 || (m === 0 && today.getDate() < birth.getDate())
        ? age - 1
        : age;
    return adjustedAge < 16;
  }

  function handleStep1Continue() {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Prénom requis";
    if (!lastName.trim()) errs.lastName = "Nom requis";
    if (!email.includes("@")) errs.email = "Email invalide";
    if (password.length < 8) errs.password = "8 caractères minimum";
    if (!dob) errs.dob = "Date de naissance requise";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (isUnder16()) {
      setStep("1b");
    } else {
      setStep(2);
    }
  }

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  }

  async function handleFinalSubmit() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    router.push("/student/home");
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
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(26,26,26,0.07)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <Logo variant="default" size="md" />
        </div>

        {/* Progress dots */}
        <StepDots current={getStepDot()} />

        {/* ── Step 1: Basic info ── */}
        {step === 1 && (
          <>
            <h1 className="le-h2" style={{ textAlign: "center", marginBottom: "6px" }}>
              Créer un compte
            </h1>
            <p className="le-body" style={{ textAlign: "center", marginBottom: "28px" }}>
              Étape 1 — Vos informations
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Input
                  id="firstName"
                  label="Prénom"
                  placeholder="Marie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  error={errors.firstName}
                />
                <Input
                  id="lastName"
                  label="Nom"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  error={errors.lastName}
                />
              </div>
              <Input
                id="email"
                type="email"
                label="Adresse email"
                placeholder="marie@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={errors.email}
              />
              <Input
                id="password"
                type="password"
                label="Mot de passe"
                placeholder="8 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={errors.password}
              />
              <Input
                id="dob"
                type="date"
                label="Date de naissance"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                error={errors.dob}
              />

              <Button type="button" variant="primary" onClick={handleStep1Continue}>
                Continuer
              </Button>
            </div>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6B6B6B" }}>
              Déjà un compte ?{" "}
              <a href="/login" style={{ color: "#E3001B", fontWeight: 600, textDecoration: "none" }}>
                Se connecter
              </a>
            </p>
          </>
        )}

        {/* ── Step 1b: Age gate ── */}
        {step === "1b" && (
          <>
            <div
              style={{
                background: "#FFFBE6",
                border: "1px solid #FFD100",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "20px" }} aria-hidden="true">
                👨‍👩‍👧
              </span>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#1A1A1A",
                    marginBottom: "4px",
                    fontSize: "0.9375rem",
                  }}
                >
                  Un parent doit valider votre inscription
                </p>
                <p style={{ fontSize: "13px", color: "#3D3D3D", lineHeight: 1.5 }}>
                  Conformément à la réglementation CNIL/RGPD, les mineurs de
                  moins de 16 ans doivent obtenir le consentement d&apos;un
                  parent ou tuteur légal pour créer un compte.
                </p>
              </div>
            </div>

            <h2 className="le-h3" style={{ marginBottom: "6px" }}>
              Email du parent ou tuteur
            </h2>
            <p className="le-body" style={{ marginBottom: "20px" }}>
              Un email de validation sera envoyé à cette adresse. Votre compte
              sera activé après confirmation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Input
                id="parentEmail"
                type="email"
                label="Email parent / tuteur"
                placeholder="parent@exemple.fr"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
              />

              <div
                style={{
                  background: "#F4F4F4",
                  borderRadius: "6px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  color: "#6B6B6B",
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: "#3D3D3D" }}>
                  Protection des données (CNIL / RGPD)
                </strong>
                <br />
                Les données collectées sont traitées par L&apos;Étudiant
                conformément à sa politique de confidentialité. Elles ne seront
                pas cédées à des tiers sans votre consentement explicite. Vous
                disposez d&apos;un droit d&apos;accès, de rectification et de
                suppression.
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!parentEmail.includes("@")}
              >
                Envoyer la demande
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B6B6B",
                  fontSize: "13px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ← Retour
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Interests ── */}
        {step === 2 && (
          <>
            <h1 className="le-h2" style={{ textAlign: "center", marginBottom: "6px" }}>
              Vos centres d&apos;intérêt
            </h1>
            <p className="le-body" style={{ textAlign: "center", marginBottom: "28px" }}>
              Étape 2 — Personnalisez votre expérience
            </p>

            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3D3D3D",
                  marginBottom: "12px",
                }}
              >
                Quels domaines vous intéressent ?{" "}
                <span style={{ color: "#6B6B6B", fontWeight: 400 }}>
                  (Sélectionnez tout ce qui vous correspond)
                </span>
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {DOMAINS.map((domain) => {
                  const selected = selectedDomains.includes(domain);
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleDomain(domain)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: selected
                          ? "1.5px solid #E3001B"
                          : "1.5px solid #E8E8E8",
                        background: selected ? "#FDEAEA" : "#ffffff",
                        color: selected ? "#B0001A" : "#3D3D3D",
                        fontSize: "13px",
                        fontWeight: selected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {domain}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level selector */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3D3D3D",
                  marginBottom: "12px",
                }}
              >
                Votre niveau scolaire actuel
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {LEVELS.map((l) => {
                  const selected = level === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: selected
                          ? "1.5px solid #003C8F"
                          : "1.5px solid #E8E8E8",
                        background: selected ? "#E6ECF8" : "#ffffff",
                        color: selected ? "#003C8F" : "#3D3D3D",
                        fontSize: "13px",
                        fontWeight: selected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "center",
                      }}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Button
                type="button"
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={loading || selectedDomains.length === 0 || !level}
              >
                {loading ? "Création du compte…" : "Créer mon compte"}
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B6B6B",
                  fontSize: "13px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ← Retour
              </button>
            </div>

            {selectedDomains.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                {selectedDomains.map((d) => (
                  <Tag key={d} variant="red">
                    {d}
                  </Tag>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
