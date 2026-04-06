type OrientationTier = "exploring" | "comparing" | "deciding";

interface OrientationBadgeProps {
  score: number;
}

function getTier(score: number): OrientationTier {
  if (score <= 40) return "exploring";
  if (score <= 65) return "comparing";
  return "deciding";
}

const TIER_LABELS: Record<OrientationTier, string> = {
  exploring: "Exploration",
  comparing: "Comparaison",
  deciding: "Décision",
};

export default function OrientationBadge({ score }: OrientationBadgeProps) {
  const tier = getTier(score);
  const label = TIER_LABELS[tier];

  return (
    <div className={`orientation-badge badge-${tier}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </div>
  );
}
