import Link from "next/link";

import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import {
  getEffectiveRotationTeamMemberId,
  getRotationAbsence,
  getRotationSubstitution,
} from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";
import { getTeamMemberName } from "@/features/team/utils";
import type { RotationAssignment } from "@/types/team";

import styles from "./page.module.css";

const isDateInRange = (
  startDate: string,
  endDate: string,
  date = new Date(),
) => {
  const currentDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  currentDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return currentDate >= start && currentDate <= end;
};

const getCurrentRotation = (
  rotations: RotationAssignment[],
): RotationAssignment | undefined => {
  return rotations.find((rotation) =>
    isDateInRange(rotation.startDate, rotation.endDate),
  );
};

export default function Home() {
  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const currentDeployment = getCurrentRotation(deploymentRotations);

  const dispatcherAbsence = currentDispatcher
    ? getRotationAbsence(currentDispatcher, absences)
    : undefined;

  const dispatcherSubstitution = currentDispatcher
    ? getRotationSubstitution(currentDispatcher, substitutions)
    : undefined;

  const deploymentAbsence = currentDeployment
    ? getRotationAbsence(currentDeployment, absences)
    : undefined;

  const deploymentSubstitution = currentDeployment
    ? getRotationSubstitution(currentDeployment, substitutions)
    : undefined;

  const effectiveDispatcherTeamMemberId = currentDispatcher
    ? getEffectiveRotationTeamMemberId(
        currentDispatcher,
        absences,
        substitutions,
      )
    : undefined;

  const effectiveDeploymentTeamMemberId = currentDeployment
    ? getEffectiveRotationTeamMemberId(
        currentDeployment,
        absences,
        substitutions,
      )
    : undefined;

  const currentAbsences = absences.filter((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const upcomingAbsences = absences
    .filter((absence) => new Date(absence.startDate) > new Date())
    .slice(0, 3);

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Code Busters Hub</p>

        <h1>Teamübersicht</h1>

        <p>
          Alles Wichtige zu Abwesenheiten, Vertretungen und Rotationen auf einen
          Blick.
        </p>
      </header>

      <div className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.label}>Dispatcher diese Woche</span>

          <strong className={styles.value}>
            {effectiveDispatcherTeamMemberId
              ? getTeamMemberName(effectiveDispatcherTeamMemberId, teamMembers)
              : "Nicht eingeteilt"}
          </strong>

          {dispatcherAbsence ? (
            <p className={styles.warning}>
              {dispatcherSubstitution
                ? `Vertretung für ${getTeamMemberName(
                    currentDispatcher!.teamMemberId,
                    teamMembers,
                  )}`
                : `${getTeamMemberName(
                    currentDispatcher!.teamMemberId,
                    teamMembers,
                  )} ist abwesend – keine Vertretung eingetragen`}
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
            {effectiveDeploymentTeamMemberId
              ? getTeamMemberName(effectiveDeploymentTeamMemberId, teamMembers)
              : "Nicht eingeteilt"}
          </strong>

          {deploymentAbsence ? (
            <p className={styles.warning}>
              {deploymentSubstitution
                ? `Vertretung für ${getTeamMemberName(
                    currentDeployment!.teamMemberId,
                    teamMembers,
                  )}`
                : `${getTeamMemberName(
                    currentDeployment!.teamMemberId,
                    teamMembers,
                  )} ist abwesend – keine Vertretung eingetragen`}
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
                  {absence.type === "vacation" ? "Urlaub" : "Abwesend"}
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
