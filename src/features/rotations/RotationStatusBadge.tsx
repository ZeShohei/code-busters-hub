import type { RotationResolution } from "@/types/team";

import styles from "./RotationStatusBadge.module.css";

interface RotationStatusBadgeProps {
  resolution: RotationResolution;
  effectiveTeamMemberName?: string;
}

export const RotationStatusBadge = ({
  resolution,
  effectiveTeamMemberName,
}: RotationStatusBadgeProps) => {
  if (resolution.status === "regular") {
    return <span className={styles.regular}>Regulär</span>;
  }

  if (resolution.status === "substitution") {
    return (
      <div className={styles.substitutionWrapper}>
        <span className={styles.substitution}>Vertretung</span>

        {effectiveTeamMemberName ? (
          <span className={styles.name}>{effectiveTeamMemberName}</span>
        ) : null}
      </div>
    );
  }

  return <span className={styles.uncovered}>Nicht besetzt</span>;
};
