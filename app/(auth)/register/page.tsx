"use client";
export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/ui/Logo";

const C = {
  tomate: "#EC1F27",
  tomateDark: "#C41520",
  tomateLight: "#FFF0F1",
  piscine: "#0066CC",
  piscineLight: "#E6F0FF",
  citron: "#FCD716",
  citronLight: "#FFF9E6",
  spirit: "#FF6B35",
  menthe: "#4DB8A8",
  mentheLight: "#E0F2EF",
  pourpre: "#932D99",
  nuit: "#191829",
  blanc: "#F8F7F2",
  gray700: "#3D3D3D",
  gray500: "#6B6B6B",
  gray300: "#D4D4D4",
  gray200: "#E8E8E8",
  gray100: "#F4F4F4",
};

type Step = 1 | "1b" | 2 | 3;

const DOMAINS = ["Business", "Ingénierie", "Design", "Santé", "Droit", "Sciences", "Arts", "Communication"];
const LEVELS = ["Seconde", "Première", "Terminale", "Post-bac"];

function decodePrefill(raw: string | null): {
  email?: string; firstName?: string; lastName?: string;
  education_level?: string; btoc_id?: string
} | null {
  if (!raw) return null;
  try {
    return JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
      {[1, 2, 3].map((n) => {
        const active = n === current;
        const done = n < current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 0,
                background: active ? C.tomate : done ? C.nuit : "transparent",
                color: active || done ? "#fff" : C.gray500,
                border: active || done ? "none" : `1.5px solid ${C.gray300}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.05em",
                fontFamily: "monospace",
              }}
            >
              {done ? "✓" : `0${n}`}
            </div>
            {n < 3 && <div style={{ width: 24, height: 2, background: n < current ? C.nuit : C.gray200 }} />}
          </div>
        );
      })}
    </div>
  );
}

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRole = searchParams.get("role");
  type Role = "student" | "teacher" | "exhibitor" | "parent";
  const validRoles: Role[] = ["student", "teacher", "exhibitor", "parent"];
  const role: Role = validRoles.includes(rawRole as Role) ? (rawRole as Role) : "student";
  const ROLE_HOME: Record<Role, string> = {
    student:   "/home",
    teacher:   "/teacher/dashboard",
    exhibitor: "/exhibitor/dashboard",
    parent:    "/parent/home",
  };
  const ROLE_COPY: Record<Role, { label: string; headline: string; subtitle: string; }> = {
    student:   { label: "Créer mon compte",     headline: "aventure", subtitle: "Trois étapes pour construire votre espace et explorer les 130 salons d'orientation." },
    teacher:   { label: "Espace enseignant",    headline: "mission",  subtitle: "Gérez vos groupes d'élèves et suivez leur engagement dans les salons L'Étudiant." },
    exhibitor: { label: "Espace exposant",      headline: "stand",    subtitle: "Créez votre fiche école et suivez vos leads en temps réel pendant les salons." },
    parent:    { label: "Espace parent",        headline: "rôle",     subtitle: "Suivez l'orientation de votre enfant et validez son inscription aux salons." },
  };

  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [btocId, setBtocId] = useState<string | null>(null);

  useEffect(() => {
    const prefill = decodePrefill(searchParams.get("prefill"));
    if (!prefill) return;
    if (prefill.email) setEmail(prefill.email);
    if (prefill.firstName) setFirstName(prefill.firstName);
    if (prefill.lastName) setLastName(prefill.lastName);
    if (prefill.btoc_id) setBtocId(prefill.btoc_id);
    if (prefill.education_level) setLevel(prefill.education_level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const adjustedAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
    return adjustedAge < 16;
  }

  function handleStep1Continue() {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Prénom requis";
    if (!lastName.trim()) errs.lastName = "Nom requis";
    if (!email.includes("@")) errs.email = "Email invalide";
    if (password.length < 8) errs.password = "8 caractères minimum";
    if (role === "student" && !dob) errs.dob = "Date de naissance requise";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    // Students go through interests/level; other roles skip straight to submit.
    if (role !== "student") { handleFinalSubmit(); return; }
    if (isUnder16()) { setStep("1b"); } else { setStep(2); }
  }

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) => prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]);
  }

  async function handleFinalSubmit() {
    setLoading(true);
    if (role === "student") {
      const errs: Record<string, string> = {};
      if (!level) errs.level = "Choisissez votre niveau";
      if (selectedDomains.length === 0) errs.domains = "Sélectionnez au moins un domaine";
      setErrors(errs);
      if (Object.keys(errs).length > 0) { setLoading(false); return; }
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, password, firstName, lastName,
          dob: dob || undefined, role,
          level: level || undefined,
          domains: selectedDomains,
          parentEmail: parentEmail || undefined,
          btocId: btocId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErrors({ submit: json.error ?? "Erreur lors de la création du compte" }); setLoading(false); return; }

      const { getSupabase } = await import("@/lib/supabase/client");
      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setErrors({ submit: signInError.message }); setLoading(false); return; }
      router.push(ROLE_HOME[role]);
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : "Erreur lors de la création du compte" });
      setLoading(false);
    }
  }

  const ROLE_COLOR: Record<Role, string> = {
    student:   C.tomate,
    teacher:   C.piscine,
    exhibitor: C.spirit,
    parent:    C.pourpre,
  };
  const leftColor  = ROLE_COLOR[role];
  const leftAccent = C.citron;

  return (
    <div style={{ minHeight: "100vh", background: C.blanc, display: "grid", gridTemplateColumns: "1fr 1.1fr" }}>
      {/* Left panel */}
      <div
        style={{
          background: leftColor,
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: leftAccent }} />
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: role === "student" ? C.piscine : C.tomate }} />
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: leftAccent,
              marginBottom: 16,
            }}
          >
            {ROLE_COPY[role].label}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
            }}
          >
            Votre
            <br />
            <span style={{ fontStyle: "italic", color: leftAccent }}>
              {ROLE_COPY[role].headline}
            </span>
            <br />
            commence
            <br />
            ici.
          </h1>
          <p style={{ margin: "24px 0 0", fontSize: 16, lineHeight: 1.6, maxWidth: 380, opacity: 0.9 }}>
            {ROLE_COPY[role].subtitle}
          </p>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
          L'Étudiant 2026 · Saguez & Partners
        </div>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -60,
            right: -40,
            fontSize: 260,
            fontWeight: 900,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.08)",
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            pointerEvents: "none",
          }}
        >
          go.
        </div>
      </div>

      {/* Right panel */}
      <div style={{ padding: "48px", display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo variant="default" size="sm" />
          <a href="/" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.gray500, textDecoration: "none" }}>
            ← Accueil
          </a>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ width: "100%", maxWidth: 480 }}>
            {role === "student" && <StepIndicator current={getStepDot()} />}

            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                <div style={{ display: "inline-block", position: "relative", paddingBottom: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: C.tomate }}>
                    Étape 01 / {role === "student" ? "03" : "01"}
                  </span>
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: 28, height: 3, background: C.tomate }} />
                </div>
                <h2 style={sectionTitleStyle}>Vos infos</h2>
                <p style={{ margin: "10px 0 28px", fontSize: 14, color: C.gray500 }}>
                  Toutes les informations de base pour créer votre compte.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Prénom" value={firstName} onChange={setFirstName} error={errors.firstName} placeholder="Marie" />
                    <Field label="Nom" value={lastName} onChange={setLastName} error={errors.lastName} placeholder="Dupont" />
                  </div>
                  <Field label="Adresse email" type="email" value={email} onChange={setEmail} error={errors.email} placeholder="marie@exemple.fr" />
                  <Field label="Mot de passe" type="password" value={password} onChange={setPassword} error={errors.password} placeholder="8 caractères minimum" />
                  {role === "student" && (
                    <Field label="Date de naissance" type="date" value={dob} onChange={setDob} error={errors.dob} />
                  )}

                  {errors.submit && <ErrorBox>{errors.submit}</ErrorBox>}

                  <PrimaryButton onClick={handleStep1Continue} disabled={loading}>
                    {loading ? "Création du compte…" : role === "student" ? "Continuer →" : "Créer mon espace →"}
                  </PrimaryButton>
                </div>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: C.gray500 }}>
                  Déjà un compte ?{" "}
                  <a href="/login" style={{ color: C.tomate, fontWeight: 800, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>
                    Se connecter →
                  </a>
                </p>
              </>
            )}

            {/* ── Step 1b: Age gate ── */}
            {step === "1b" && (
              <>
                <div style={{ display: "inline-block", position: "relative", paddingBottom: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: C.citron }}>
                    Consentement parental
                  </span>
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: 28, height: 3, background: C.citron }} />
                </div>
                <h2 style={sectionTitleStyle}>Validation requise</h2>

                <div
                  style={{
                    marginTop: 20,
                    background: C.citronLight,
                    border: `1.5px solid ${C.citron}`,
                    borderLeft: `6px solid ${C.citron}`,
                    borderRadius: 2,
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontWeight: 800, color: C.nuit, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Un parent doit valider votre inscription
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: C.gray700, lineHeight: 1.55 }}>
                    Conformément à la réglementation CNIL/RGPD, les mineurs de moins de 16 ans doivent obtenir le consentement d'un parent ou tuteur légal.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Email parent / tuteur" type="email" value={parentEmail} onChange={setParentEmail} placeholder="parent@exemple.fr" />

                  <div
                    style={{
                      background: C.gray100,
                      borderRadius: 2,
                      padding: 14,
                      fontSize: 11,
                      color: C.gray700,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: C.nuit, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: 10 }}>
                      Protection des données (CNIL / RGPD)
                    </strong>
                    <br />
                    Les données collectées sont traitées par L'Étudiant conformément à sa politique de confidentialité. Vous disposez d'un droit d'accès, de rectification et de suppression.
                  </div>

                  <PrimaryButton onClick={() => setStep(2)} disabled={!parentEmail.includes("@")}>
                    Envoyer la demande →
                  </PrimaryButton>
                  <BackButton onClick={() => setStep(1)}>← Retour</BackButton>
                </div>
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <>
                <div style={{ display: "inline-block", position: "relative", paddingBottom: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: C.piscine }}>
                    Étape 02 / 03
                  </span>
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: 28, height: 3, background: C.piscine }} />
                </div>
                <h2 style={sectionTitleStyle}>Vos centres d'intérêt</h2>
                <p style={{ margin: "10px 0 28px", fontSize: 14, color: C.gray500 }}>
                  Personnalisez votre expérience — sélectionnez tous les domaines qui vous correspondent.
                </p>

                <div style={{ marginBottom: 28 }}>
                  <div style={fieldLabelStyle}>Domaines</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {DOMAINS.map((domain, i) => {
                      const selected = selectedDomains.includes(domain);
                      const colors = [C.tomate, C.piscine, C.citron, C.spirit, C.menthe, C.pourpre, C.tropical, C.framboise];
                      const colorMap = { tomate: C.tomate, piscine: C.piscine, citron: C.citron, spirit: C.spirit, menthe: C.menthe, pourpre: C.pourpre, tropical: "#00BFB3", framboise: "#E91E63" } as any;
                      const color = colors[i % colors.length];
                      return (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => toggleDomain(domain)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 2,
                            border: `1.5px solid ${selected ? color : C.gray200}`,
                            background: selected ? color : "#fff",
                            color: selected ? "#fff" : C.nuit,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={fieldLabelStyle}>Niveau scolaire</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {LEVELS.map((l) => {
                      const selected = level === l;
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLevel(l)}
                          style={{
                            padding: "12px",
                            borderRadius: 2,
                            border: `1.5px solid ${selected ? C.piscine : C.gray200}`,
                            background: selected ? C.piscineLight : "#fff",
                            color: selected ? C.piscine : C.nuit,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            textAlign: "center",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {errors.submit && <ErrorBox>{errors.submit}</ErrorBox>}
                  {errors.level && <ErrorBox>{errors.level}</ErrorBox>}
                  {errors.domains && <ErrorBox>{errors.domains}</ErrorBox>}
                  <PrimaryButton onClick={handleFinalSubmit} disabled={loading || selectedDomains.length === 0 || !level}>
                    {loading ? "Création du compte…" : "Créer mon compte →"}
                  </PrimaryButton>
                  <BackButton onClick={() => setStep(1)}>← Retour</BackButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
  fontWeight: 900,
  color: C.nuit,
  textTransform: "uppercase",
  letterSpacing: "-0.03em",
  lineHeight: 1,
};

const fieldLabelStyle: React.CSSProperties = {
  marginBottom: 10,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: C.nuit,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: `1.5px solid ${C.gray200}`,
  borderRadius: 2,
  fontSize: 14,
  color: C.nuit,
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s",
};

function Field({ label, type = "text", value, onChange, placeholder, error }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, borderColor: error ? C.tomate : C.gray200 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = C.tomate)}
        onBlur={(e) => (e.currentTarget.style.borderColor = error ? C.tomate : C.gray200)}
      />
      {error && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.tomate, fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 20px",
        background: disabled ? C.gray300 : C.nuit,
        color: "#fff",
        border: "none",
        borderRadius: 2,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = C.tomate }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = C.nuit }}
    >
      {children}
    </button>
  );
}

function BackButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: C.gray500,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        padding: "8px",
      }}
    >
      {children}
    </button>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: C.tomateLight,
        color: C.tomate,
        border: `1.5px solid ${C.tomate}`,
        borderLeft: `6px solid ${C.tomate}`,
        borderRadius: 2,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.blanc }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.tomate}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <RegisterInner />
    </Suspense>
  );
}
