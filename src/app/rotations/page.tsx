import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { resolveRotation } from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";
import { getTeamMemberName } from "@/features/team/utils";
import type { RotationAssignment } from "@/types/team";

import styles from "./page.module.css";

const formatDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const getCalendarWeek = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getRotationCardClassName = (rotation: RotationAssignment) => {
  const resolution = resolveRotation(rotation, absences, substitutions);

  if (resolution.status === "substitution") {
    return `${styles.rotationCard} ${styles.rotationCardSubstitution}`;
  }

  if (resolution.status === "uncovered") {
    return `${styles.rotationCard} ${styles.rotationCardWarning}`;
  }

  return styles.rotationCard;
};

export default function RotationsPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Teamorganisation</p>

        <h1>Rotationen</h1>

        <p className={styles.description}>
          Übersicht über Dispatcher- und Deployment-Verantwortlichkeiten.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Dispatcher</h2>

            <p>Wöchentliche Verantwortung für Monitoring und New Relic.</p>
          </div>
        </div>

        <div className={styles.rotationList}>
          {dispatcherRotations.map((rotation) => {
            const resolution = resolveRotation(
              rotation,
              absences,
              substitutions,
            );

            return (
              <article
                key={rotation.id}
                className={getRotationCardClassName(rotation)}
              >
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

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Deployment</h2>

            <p>Wöchentliche Verantwortung für Deployments.</p>
          </div>
        </div>

        <div className={styles.rotationList}>
          {deploymentRotations.map((rotation) => {
            const resolution = resolveRotation(
              rotation,
              absences,
              substitutions,
            );

            return (
              <article
                key={rotation.id}
                className={getRotationCardClassName(rotation)}
              >
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
    </section>
  );
}
