import Image from 'next/image';

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

const FILTER_MAP: Record<LogoVariant, string> = {
  default: 'none',
  dark:    'brightness(0) invert(1)',   // white logo on dark bg
  inverted:'brightness(0) invert(1)',   // white logo on coloured bg
  mono:    'grayscale(1)',
};

export default function Logo({
  variant = "default",
  size = "md",
  className,
}: LogoProps) {
  const { width, height } = SIZE_MAP[size];
  const filter = FILTER_MAP[variant];

  return (
    <Image
      src="/logo.png"
      alt="L'Étudiant"
      width={width}
      height={height}
      style={{ filter, objectFit: 'contain', display: 'block' }}
      className={className}
      priority
    />
  );
}
