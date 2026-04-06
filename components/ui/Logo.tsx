type LogoVariant = "default" | "inverted" | "dark" | "mono";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 180, height: 56 },
  md: { width: 260, height: 80 },
  lg: { width: 340, height: 105 },
};

export default function Logo({
  variant = "default",
  size = "md",
  className,
}: LogoProps) {
  const { width, height } = SIZE_MAP[size];

  // Text color
  const textColor =
    variant === "inverted" || variant === "dark"
      ? "#ffffff"
      : variant === "mono"
      ? "#1A1A1A"
      : "#E3001B";

  // Left dashes colors: [blue, yellow, red]
  let leftDashColors: [string, string, string];
  if (variant === "inverted") {
    leftDashColors = ["#ffffff", "#FFD100", "#ffffff"];
  } else if (variant === "mono") {
    leftDashColors = ["#6B6B6B", "#6B6B6B", "#6B6B6B"];
  } else {
    // default and dark both use the brand colors
    leftDashColors = ["#003C8F", "#FFD100", "#E3001B"];
  }

  // Underline dashes colors: 5 dashes alternating brand colors
  let underlineDashColors: string[];
  if (variant === "inverted") {
    underlineDashColors = [
      "#FFD100",
      "#ffffff",
      "#FFD100",
      "#ffffff",
      "#FFD100",
    ];
  } else if (variant === "mono") {
    underlineDashColors = [
      "#6B6B6B",
      "#6B6B6B",
      "#6B6B6B",
      "#6B6B6B",
      "#6B6B6B",
    ];
  } else {
    underlineDashColors = [
      "#E3001B",
      "#003C8F",
      "#FFD100",
      "#E3001B",
      "#003C8F",
    ];
  }

  // Scale factor relative to md (260x80)
  const scale = width / 260;

  // Layout constants (at md scale = 1)
  const dashW = 14 * scale;
  const dashH = 4 * scale;
  const dashGap = 3 * scale;
  const leftDashX = 8 * scale;
  const leftDash1Y = 14 * scale;
  const leftDash2Y = leftDash1Y + dashH + dashGap;
  const leftDash3Y = leftDash2Y + dashH + dashGap;

  const textX = leftDashX + dashW + 10 * scale;
  const textY = 42 * scale;
  const fontSize = 32 * scale;

  // Underline dashes below text
  const underlineY = textY + 8 * scale;
  const underlineDashW = 18 * scale;
  const underlineDashH = 3.5 * scale;
  const underlineDashGap = 4 * scale;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="L'Étudiant"
      className={className}
    >
      {/* Left accent dashes */}
      <rect
        x={leftDashX}
        y={leftDash1Y}
        width={dashW}
        height={dashH}
        rx={dashH / 2}
        fill={leftDashColors[0]}
      />
      <rect
        x={leftDashX}
        y={leftDash2Y}
        width={dashW}
        height={dashH}
        rx={dashH / 2}
        fill={leftDashColors[1]}
      />
      <rect
        x={leftDashX}
        y={leftDash3Y}
        width={dashW}
        height={dashH}
        rx={dashH / 2}
        fill={leftDashColors[2]}
      />

      {/* Brand name */}
      <text
        x={textX}
        y={textY}
        fill={textColor}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize={fontSize}
        dominantBaseline="auto"
      >
        l&apos;étudiant
      </text>

      {/* Underline dashes (5 dashes) */}
      {underlineDashColors.map((color, i) => (
        <rect
          key={i}
          x={textX + i * (underlineDashW + underlineDashGap)}
          y={underlineY}
          width={underlineDashW}
          height={underlineDashH}
          rx={underlineDashH / 2}
          fill={color}
        />
      ))}
    </svg>
  );
}
