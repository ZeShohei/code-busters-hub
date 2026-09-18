import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";
import { formatDate, getCalendarWeek } from "@/utils/date";
import { resolveRotation } from "@/features/rotations/utils";

import styles from "./RotationHistory.module.css";

interface RotationHistoryProps {
  title: string;
  rotations: RotationAssignment[];
  teamMembers: TeamMember[];
  absences: Absence[];
  substitutions: Substitution[];
}

export const RotationHistory = ({
  title,
  rotations,
  teamMembers,
  absences,
  substitutions,
}: RotationHistoryProps) => {
  const getTeamMemberName = (teamMemberId: string) => {
    return (
      teamMembers.find((member) => member.id === teamMemberId)?.displayName ??
      "Unbekannt"
    );
  };

  const sortedRotations = [...rotations].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <h2>{title}</h2>

        <p>Vollständiger Verlauf aller generierten Rotationsschritte.</p>
      </div>

      {sortedRotations.length === 0 ? (
        <p>Noch keine Rotationen vorhanden.</p>
      ) : (
        <div className={styles.list}>
          {sortedRotations.map((rotation) => {
            const resolution = resolveRotation(
              rotation,
              absences,
              substitutions,
            );

            const assignedName = getTeamMemberName(
              resolution.assignedTeamMemberId,
            );

            const effectiveName = getTeamMemberName(
              resolution.effectiveTeamMemberId,
            );

            return (
              <article key={rotation.id} className={styles.item}>
                <div className={styles.period}>
                  <strong>KW {getCalendarWeek(rotation.startDate)}</strong>

                  <span>
                    {formatDate(rotation.startDate)}
                    {" – "}
                    {formatDate(rotation.endDate)}
                  </span>
                </div>

                <div className={styles.assignment}>
                  <span className={styles.label}>Eingeteilt</span>

                  <strong>{assignedName}</strong>
                </div>

                <div className={styles.result}>
                  {resolution.status === "regular" ? (
                    <span className={styles.regular}>Regulär</span>
                  ) : null}

                  {resolution.status === "substitution" ? (
                    <>
                      <span className={styles.substitution}>Vertretung</span>

                      <span>{effectiveName}</span>
                    </>
                  ) : null}

                  {resolution.status === "uncovered" ? (
                    <span className={styles.uncovered}>Nicht besetzt</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
