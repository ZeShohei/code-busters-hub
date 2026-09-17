import Link from "next/link";

import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { resolveRotation } from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";
import { getTeamMemberName } from "@/features/team/utils";
import { WeekOverview } from "@/features/weekOverview/WeekOverview";
import { getCurrentRotation, isDateAfter, isDateInRange } from "@/utils/date";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import styles from "./page.module.css";

export default function Home() {
  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const currentDeployment = getCurrentRotation(deploymentRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
    : undefined;

  const currentAbsences = absences.filter((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const upcomingAbsences = absences
    .filter((absence) => isDateAfter(absence.startDate))
    .slice(0, 3);

  return (
    <section className={styles.dashboard}>
      <PageHeader
        eyebrow="Code Busters Hub"
        title="Teamübersicht"
        description="Alles Wichtige zu Abwesenheiten, Vertretungen und Rotationen auf einen Blick."
      />

      <div className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.label}>Dispatcher diese Woche</span>

          <strong className={styles.value}>
            {dispatcherResolution
              ? getTeamMemberName(
                  dispatcherResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"}
          </strong>

          {dispatcherResolution?.status === "substitution" ? (
            <p className={styles.warning}>
              Vertretung für{" "}
              {getTeamMemberName(
                dispatcherResolution.assignedTeamMemberId,
                teamMembers,
              )}
            </p>
          ) : dispatcherResolution?.status === "uncovered" ? (
            <p className={styles.warning}>
              Abwesend – keine Vertretung eingetragen
            </p>
          ) : (
            <p className={styles.description}>
              Verantwortlich für Monitoring und New Relic.
            </p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.label}>Deployment diese Woche</span>

          <strong className={styles.value}>
            {deploymentResolution
              ? getTeamMemberName(
                  deploymentResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"}
          </strong>

          {deploymentResolution?.status === "substitution" ? (
            <p className={styles.warning}>
              Vertretung für{" "}
              {getTeamMemberName(
                deploymentResolution.assignedTeamMemberId,
                teamMembers,
              )}
            </p>
          ) : deploymentResolution?.status === "uncovered" ? (
            <p className={styles.warning}>
              Abwesend – keine Vertretung eingetragen
            </p>
          ) : (
            <p className={styles.description}>
              Zuständig für die aktuelle Deployment-Rotation.
            </p>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.label}>Heute abwesend</span>

          <strong className={styles.value}>{currentAbsences.length}</strong>

          <p className={styles.description}>
            {currentAbsences.length === 0
              ? "Heute sind keine Abwesenheiten eingetragen."
              : currentAbsences
                  .map((absence) =>
                    getTeamMemberName(absence.teamMemberId, teamMembers),
                  )
                  .join(", ")}
          </p>
        </article>
      </div>

      <WeekOverview
        absences={absences}
        substitutions={substitutions}
        teamMembers={teamMembers}
        dispatcherRotations={dispatcherRotations}
        deploymentRotations={deploymentRotations}
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Kommende Abwesenheiten</h2>

            <p>Die nächsten geplanten Abwesenheiten im Team.</p>
          </div>

          <Link href="/absences">Alle anzeigen</Link>
        </div>

        <div className={styles.absenceList}>
          {upcomingAbsences.map((absence) => (
            <article key={absence.id} className={styles.absence}>
              <div>
                <strong>
                  {getTeamMemberName(absence.teamMemberId, teamMembers)}
                </strong>

                <span>
                  {absence.type === "vacation"
                    ? "Urlaub"
                    : absence.type === "sickLeave"
                      ? "Krankenstand"
                      : "Abwesend"}
                </span>
              </div>

              <span>
                {absence.startDate} – {absence.endDate}
              </span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
