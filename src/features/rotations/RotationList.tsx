import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { formatDate, getCalendarWeek } from "@/utils/date";

import { getTeamMemberName } from "@/features/team/utils";

import { resolveRotation } from "./utils";

import styles from "./RotationList.module.css";

interface RotationListProps {
  title: string;
  description: string;
  rotations: RotationAssignment[];
  absences: Absence[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
}

export const RotationList = ({
  title,
  description,
  rotations,
  absences,
  substitutions,
  teamMembers,
}: RotationListProps) => {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>{title}</h2>

        <p>{description}</p>
      </header>

      <div className={styles.list}>
        {rotations.map((rotation) => {
          const resolution = resolveRotation(rotation, absences, substitutions);

          const cardClassName = [
            styles.card,
            resolution.status === "substitution" ? styles.cardSubstitution : "",
            resolution.status === "uncovered" ? styles.cardWarning : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={rotation.id} className={cardClassName}>
              <div className={styles.week}>
                <span>KW</span>

                <strong>{getCalendarWeek(rotation.startDate)}</strong>
              </div>

              <div className={styles.person}>
                <span>Verantwortlich</span>

                <strong>
                  {getTeamMemberName(
                    resolution.effectiveTeamMemberId,
                    teamMembers,
                  )}
                </strong>

                {resolution.status === "regular" && (
                  <span className={styles.statusRegular}>
                    Regulär eingeteilt
                  </span>
                )}

                {resolution.status === "substitution" && (
                  <span className={styles.statusSubstitution}>
                    Vertretung für{" "}
                    {getTeamMemberName(
                      resolution.assignedTeamMemberId,
                      teamMembers,
                    )}
                  </span>
                )}

                {resolution.status === "uncovered" && (
                  <span className={styles.statusWarning}>
                    Abwesend – keine Vertretung
                  </span>
                )}
              </div>

              <div className={styles.period}>
                <span>Zeitraum</span>

                <strong>
                  {formatDate(rotation.startDate)} –{" "}
                  {formatDate(rotation.endDate)}
                </strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

RotationList.displayName = "RotationList";
