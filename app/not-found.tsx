import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "40px" }}>
        <Logo variant="default" size="md" />
      </div>

      {/* 404 illustration */}
      <div
        style={{
          position: "relative",
          marginBottom: "36px",
        }}
      >
        <div
          style={{
            fontSize: "7rem",
            fontWeight: 900,
            color: "#F4F4F4",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            userSelect: "none",
          }}
          aria-hidden="true"
        >
          404
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
          }}
          aria-hidden="true"
        >
          🧭
        </div>
      </div>

      {/* Text */}
      <h1
        className="le-h1"
        style={{ marginBottom: "12px" }}
      >
        404 — Page introuvable
      </h1>
      <p
        className="le-body"
        style={{
          maxWidth: "380px",
          marginBottom: "36px",
          margin: "0 auto 36px",
        }}
      >
        La page que vous recherchez n&apos;existe pas ou a été déplacée. Ne
        vous perdez pas — retournez à l&apos;accueil.
      </p>

      {/* Stripe accent */}
      <div
        style={{
          width: "80px",
          height: "4px",
          background: "linear-gradient(90deg, #EC1F27 0%, #0066CC 50%, #FCD716 100%)",
          borderRadius: "2px",
          marginBottom: "32px",
        }}
        aria-hidden="true"
      />

      {/* CTA */}
      <Button href="/" variant="primary">
        ← Retour à l&apos;accueil
      </Button>

      <p
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "#6B6B6B",
        }}
      >
        Vous êtes perdu(e) ?{" "}
        <a
          href="/login"
          style={{ color: "#EC1F27", fontWeight: 600, textDecoration: "none" }}
        >
          Connectez-vous
        </a>
      </p>
    </div>
  );
}
