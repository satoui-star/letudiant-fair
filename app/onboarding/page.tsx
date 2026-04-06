"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Tag from "@/components/ui/Tag";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "student" | "teacher" | "parent";

interface CommonData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface StudentData {
  level: string;
  series: string;
  filieres: string[];
  studyLevel: string;
}

interface TeacherData {
  schoolName: string;
  city: string;
  groupName: string;
  studentCount: string;
  selectedFair: string;
  eventCode: string;
}

interface ParentData {
  childHasAccount: boolean | null;
  childEmail: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  student: "Étudiant(e)",
  teacher: "Enseignant(e)",
  parent: "Parent",
};

const ROLE_STEPS: Record<Role, number> = {
  student: 4, // 0 (common) + 3
  teacher: 3, // 0 (common) + 2
  parent: 3,  // 0 (common) + 2
};

const STUDENT_LEVELS = ["Seconde", "Première", "Terminale", "Bac+1", "Bac+2", "Bac+3 et +"];
const STUDENT_SERIES = ["Bac général", "Bac techno", "Bac pro"];
const STUDY_LEVELS = ["Bac+2", "Bac+3", "Bac+5", "Bac+8 / Doctorat"];

const FILIERES = [
  "Économie-Gestion",
  "Ingénierie-Industrie",
  "Santé-Social",
  "Droit-Sciences politiques",
  "Arts-Culture",
  "Sciences-Nature",
  "Communication-Information",
  "Éducation-Formation",
];

const MOCK_FAIRS = [
  { id: "paris-2026", label: "Salon de Paris — 15 avril 2026" },
  { id: "lyon-2026", label: "Salon de Lyon — 22 avril 2026" },
  { id: "bordeaux-2026", label: "Salon de Bordeaux — 30 avril 2026" },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          fontSize: "12px",
          color: "#6B6B6B",
        }}
      >
        <span>Étape {current + 1} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: "4px",
          background: "#E8E8E8",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#E3001B",
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Step 0: Common quick info ────────────────────────────────────────────────

function StepCommon({
  role,
  data,
  onChange,
  onNext,
}: {
  role: Role;
  data: CommonData;
  onChange: (d: Partial<CommonData>) => void;
  onNext: () => void;
}) {
  return (
    <div>
      {/* Role badge */}
      <div style={{ marginBottom: "24px" }}>
        <Tag variant="red">
          Vous vous inscrivez en tant que {ROLE_LABELS[role]}
        </Tag>
      </div>

      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Créez votre compte
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Quelques informations pour démarrer.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Input
            id="firstName"
            label="Prénom"
            required
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Camille"
          />
          <Input
            id="lastName"
            label="Nom"
            required
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Martin"
          />
        </div>
        <Input
          id="email"
          label="Adresse e-mail"
          type="email"
          required
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="camille.martin@exemple.fr"
        />
        <Input
          id="password"
          label="Mot de passe"
          type="password"
          required
          value={data.password}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="Au moins 8 caractères"
        />
      </div>

      <div style={{ marginTop: "28px" }}>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!data.firstName || !data.lastName || !data.email || !data.password}
          style={{ width: "100%" }}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}

// ─── Student Step 1: Academic profile ─────────────────────────────────────────

function StudentStep1({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: StudentData;
  onChange: (d: Partial<StudentData>) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const showSeries = ["Seconde", "Première", "Terminale"].includes(data.level);

  return (
    <div>
      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Votre profil académique
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Ces informations nous permettent de personnaliser vos recommandations.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Level selector */}
        <div>
          <label className="le-label" style={{ display: "block", marginBottom: "8px" }}>
            Votre niveau actuel
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {STUDENT_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ level: lvl, series: "" })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: data.level === lvl ? "2px solid #E3001B" : "2px solid #E8E8E8",
                  background: data.level === lvl ? "#FDEAEA" : "#ffffff",
                  color: data.level === lvl ? "#E3001B" : "#3D3D3D",
                  fontWeight: data.level === lvl ? 600 : 400,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Series selector */}
        {showSeries && (
          <div>
            <label className="le-label" style={{ display: "block", marginBottom: "8px" }}>
              Votre série de bac
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {STUDENT_SERIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ series: s })}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: data.series === s ? "2px solid #E3001B" : "2px solid #E8E8E8",
                    background: data.series === s ? "#FDEAEA" : "#ffffff",
                    color: data.series === s ? "#E3001B" : "#3D3D3D",
                    fontWeight: data.series === s ? 600 : 400,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Button variant="primary" onClick={onNext} style={{ width: "100%" }}>
          Continuer
        </Button>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: "none", border: "none", color: "#6B6B6B", fontSize: "0.9rem", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}

// ─── Student Step 2: Interests ─────────────────────────────────────────────────

function StudentStep2({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: StudentData;
  onChange: (d: Partial<StudentData>) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  function toggleFiliere(f: string) {
    const current = data.filieres;
    if (current.includes(f)) {
      onChange({ filieres: current.filter((x) => x !== f) });
    } else {
      onChange({ filieres: [...current, f] });
    }
  }

  return (
    <div>
      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Vos centres d&apos;intérêt
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Pour des recommandations encore plus pertinentes — vous pouvez passer cette étape.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Filieres chips */}
        <div>
          <label className="le-label" style={{ display: "block", marginBottom: "10px" }}>
            Quelles filières vous intéressent ?
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {FILIERES.map((f) => {
              const active = data.filieres.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFiliere(f)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: active ? "2px solid #E3001B" : "2px solid #E8E8E8",
                    background: active ? "#E3001B" : "#ffffff",
                    color: active ? "#ffffff" : "#3D3D3D",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Study level */}
        <div>
          <label className="le-label" style={{ display: "block", marginBottom: "10px" }}>
            Quel niveau d&apos;études visez-vous ?
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {STUDY_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ studyLevel: lvl })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: data.studyLevel === lvl ? "2px solid #E3001B" : "2px solid #E8E8E8",
                  background: data.studyLevel === lvl ? "#FDEAEA" : "#ffffff",
                  color: data.studyLevel === lvl ? "#E3001B" : "#3D3D3D",
                  fontWeight: data.studyLevel === lvl ? 600 : 400,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Button variant="primary" onClick={onNext} style={{ width: "100%" }}>
          Continuer
        </Button>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: "none", border: "none", color: "#6B6B6B", fontSize: "0.9rem", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}

// ─── Student Step 3: Confirmation ─────────────────────────────────────────────

function StudentStep3({
  common,
  student,
}: {
  common: CommonData;
  student: StudentData;
}) {
  const router = useRouter();
  const hasLevel = !!student.level;
  const hasFilieres = student.filieres.length > 0;
  const hasStudyLevel = !!student.studyLevel;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "#FDEAEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "2rem",
        }}
      >
        ✓
      </div>

      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Votre profil de base est créé !
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Bienvenue, {common.firstName}. Voici ce que nous savons de vous.
      </p>

      {/* Summary */}
      <div
        style={{
          textAlign: "left",
          background: "#F4F4F4",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "#6B6B6B" }}>Niveau actuel</span>
          {hasLevel ? (
            <Tag variant="blue">{student.level}{student.series ? ` — ${student.series}` : ""}</Tag>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#6B6B6B", fontStyle: "italic" }}>Non renseigné</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "0.9rem", color: "#6B6B6B", flexShrink: 0 }}>Filières</span>
          {hasFilieres ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "flex-end" }}>
              {student.filieres.map((f) => (
                <Tag key={f} variant="red" style={{ fontSize: "0.75rem" }}>{f}</Tag>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#6B6B6B", fontStyle: "italic" }}>Non renseigné</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "#6B6B6B" }}>Niveau visé</span>
          {hasStudyLevel ? (
            <Tag variant="yellow">{student.studyLevel}</Tag>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#6B6B6B", fontStyle: "italic" }}>Non renseigné</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Button variant="primary" href="/home" style={{ width: "100%" }}>
          Accéder au salon
        </Button>
        <Button variant="secondary" href="/profile" style={{ width: "100%" }}>
          Enrichir mon profil
        </Button>
      </div>
    </div>
  );
}

// ─── Teacher Step 1: School info ───────────────────────────────────────────────

function TeacherStep1({
  data,
  onChange,
  onNext,
}: {
  data: TeacherData;
  onChange: (d: Partial<TeacherData>) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Votre établissement
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Informations sur votre école et votre groupe.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input
          id="schoolName"
          label="Nom de l'établissement"
          required
          value={data.schoolName}
          onChange={(e) => onChange({ schoolName: e.target.value })}
          placeholder="Lycée Victor Hugo"
        />
        <Input
          id="city"
          label="Ville"
          required
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="Paris"
        />
        <Input
          id="groupName"
          label="Nom de classe / groupe"
          value={data.groupName}
          onChange={(e) => onChange({ groupName: e.target.value })}
          placeholder="Terminale S — Groupe 2"
        />
        <Input
          id="studentCount"
          label="Nombre d'élèves (approx.)"
          type="number"
          value={data.studentCount}
          onChange={(e) => onChange({ studentCount: e.target.value })}
          placeholder="28"
        />
      </div>

      <div style={{ marginTop: "28px" }}>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!data.schoolName || !data.city}
          style={{ width: "100%" }}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}

// ─── Teacher Step 2: Fair selection ───────────────────────────────────────────

function TeacherStep2({
  data,
  onChange,
  onFinish,
}: {
  data: TeacherData;
  onChange: (d: Partial<TeacherData>) => void;
  onFinish: () => void;
}) {
  const [useCode, setUseCode] = useState(false);

  return (
    <div>
      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Choisissez votre salon
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Sélectionnez le salon auquel votre groupe participera.
      </p>

      {!useCode ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {MOCK_FAIRS.map((fair) => (
              <button
                key={fair.id}
                type="button"
                onClick={() => onChange({ selectedFair: fair.id })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "10px",
                  border: data.selectedFair === fair.id ? "2px solid #E3001B" : "2px solid #E8E8E8",
                  background: data.selectedFair === fair.id ? "#FDEAEA" : "#ffffff",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: data.selectedFair === fair.id ? "6px solid #E3001B" : "2px solid #E8E8E8",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.9375rem", color: "#1A1A1A", fontWeight: data.selectedFair === fair.id ? 600 : 400 }}>
                  {fair.label}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setUseCode(true)}
            style={{ background: "none", border: "none", color: "#003C8F", fontSize: "0.9rem", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Je rejoins un salon existant avec un code →
          </button>
        </>
      ) : (
        <>
          <Input
            id="eventCode"
            label="Code événement"
            value={data.eventCode}
            onChange={(e) => onChange({ eventCode: e.target.value })}
            placeholder="EX2026PARIS"
          />
          <button
            type="button"
            onClick={() => setUseCode(false)}
            style={{ background: "none", border: "none", color: "#6B6B6B", fontSize: "0.875rem", cursor: "pointer", marginTop: "8px", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            ← Choisir dans la liste
          </button>
        </>
      )}

      <div style={{ marginTop: "28px" }}>
        <Button
          variant="primary"
          onClick={onFinish}
          disabled={!data.selectedFair && !data.eventCode}
          style={{ width: "100%" }}
        >
          Accéder au tableau de bord
        </Button>
      </div>
    </div>
  );
}

// ─── Parent Step 1: Parent / child link ───────────────────────────────────────

function ParentStep1({
  data,
  onChange,
  onNext,
}: {
  data: ParentData;
  onChange: (d: Partial<ParentData>) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        Votre enfant a-t-il déjà un compte ?
      </h2>
      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        Connectez vos comptes pour suivre le parcours d&apos;orientation ensemble.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        {[
          { value: true, label: "Oui, mon enfant a déjà un compte L'Étudiant" },
          { value: false, label: "Non, mon enfant n'a pas encore de compte" },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange({ childHasAccount: opt.value })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              borderRadius: "10px",
              border: data.childHasAccount === opt.value ? "2px solid #E3001B" : "2px solid #E8E8E8",
              background: data.childHasAccount === opt.value ? "#FDEAEA" : "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: data.childHasAccount === opt.value ? "6px solid #E3001B" : "2px solid #E8E8E8",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.9375rem", color: "#1A1A1A" }}>{opt.label}</span>
          </button>
        ))}
      </div>

      {data.childHasAccount === true && (
        <div style={{ marginBottom: "20px" }}>
          <Input
            id="childEmail"
            label="Adresse e-mail de votre enfant"
            type="email"
            value={data.childEmail}
            onChange={(e) => onChange({ childEmail: e.target.value })}
            placeholder="emma.dupont@exemple.fr"
          />
          <p style={{ fontSize: "0.8125rem", color: "#6B6B6B", marginTop: "6px" }}>
            Un lien de connexion sera envoyé à votre enfant pour accepter la relation.
          </p>
        </div>
      )}

      {data.childHasAccount === false && (
        <div
          style={{
            background: "#E6ECF8",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "0.9rem", color: "#003C8F", margin: 0 }}>
            Votre enfant peut créer un compte L&apos;Étudiant. Une fois son compte créé, vous pourrez accepter la connexion depuis votre espace parent.
          </p>
        </div>
      )}

      <Button
        variant="primary"
        onClick={onNext}
        disabled={data.childHasAccount === null}
        style={{ width: "100%" }}
      >
        Continuer
      </Button>
    </div>
  );
}

// ─── Parent Step 2: Confirmation ──────────────────────────────────────────────

function ParentStep2({
  common,
  parent,
}: {
  common: CommonData;
  parent: ParentData;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "#E6ECF8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "2rem",
        }}
      >
        📬
      </div>

      <h2 className="le-h2" style={{ marginBottom: "8px" }}>
        {parent.childHasAccount && parent.childEmail
          ? "Lien envoyé à votre enfant"
          : "Compte parent créé !"}
      </h2>

      <p className="le-body" style={{ color: "#6B6B6B", marginBottom: "28px" }}>
        {parent.childHasAccount && parent.childEmail
          ? `Un e-mail de connexion a été envoyé à ${parent.childEmail}. Votre enfant devra accepter pour finaliser le lien.`
          : `Bienvenue, ${common.firstName}. Votre espace parent est prêt. Invitez votre enfant à créer son compte pour suivre son parcours.`}
      </p>

      <Button variant="primary" href="/parent/home" style={{ width: "100%" }}>
        Accéder à l&apos;espace parent
      </Button>
    </div>
  );
}

// ─── Main onboarding component ────────────────────────────────────────────────

function OnboardingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role: Role = (searchParams.get("role") as Role) || "student";

  const [step, setStep] = useState(0);
  const [common, setCommon] = useState<CommonData>({ firstName: "", lastName: "", email: "", password: "" });
  const [student, setStudent] = useState<StudentData>({ level: "", series: "", filieres: [], studyLevel: "" });
  const [teacher, setTeacher] = useState<TeacherData>({ schoolName: "", city: "", groupName: "", studentCount: "", selectedFair: "", eventCode: "" });
  const [parent, setParent] = useState<ParentData>({ childHasAccount: null, childEmail: "" });

  const totalSteps = ROLE_STEPS[role];

  function next() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function renderStep() {
    // Step 0 is always common
    if (step === 0) {
      return (
        <StepCommon
          role={role}
          data={common}
          onChange={(d) => setCommon((prev) => ({ ...prev, ...d }))}
          onNext={next}
        />
      );
    }

    if (role === "student") {
      if (step === 1)
        return (
          <StudentStep1
            data={student}
            onChange={(d) => setStudent((prev) => ({ ...prev, ...d }))}
            onNext={next}
            onSkip={next}
          />
        );
      if (step === 2)
        return (
          <StudentStep2
            data={student}
            onChange={(d) => setStudent((prev) => ({ ...prev, ...d }))}
            onNext={next}
            onSkip={next}
          />
        );
      if (step === 3) return <StudentStep3 common={common} student={student} />;
    }

    if (role === "teacher") {
      if (step === 1)
        return (
          <TeacherStep1
            data={teacher}
            onChange={(d) => setTeacher((prev) => ({ ...prev, ...d }))}
            onNext={next}
          />
        );
      if (step === 2)
        return (
          <TeacherStep2
            data={teacher}
            onChange={(d) => setTeacher((prev) => ({ ...prev, ...d }))}
            onFinish={() => router.push("/teacher/dashboard")}
          />
        );
    }

    if (role === "parent") {
      if (step === 1)
        return (
          <ParentStep1
            data={parent}
            onChange={(d) => setParent((prev) => ({ ...prev, ...d }))}
            onNext={next}
          />
        );
      if (step === 2) return <ParentStep2 common={common} parent={parent} />;
    }

    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F4F4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 24px 80px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
        <a href="/">
          <Logo variant="default" size="md" />
        </a>
      </div>

      {/* Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        }}
      >
        <ProgressBar current={step} total={totalSteps} />

        {/* Back button */}
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "#6B6B6B",
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: "20px",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </button>
        )}

        {renderStep()}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F4' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E3001B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
