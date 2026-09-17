import { absences } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import {
  deploymentRotationConfig,
  dispatcherRotationConfig,
} from "@/features/rotations/config";
import { teamMembers } from "@/features/team/mockData";
import { getCurrentRotation, isDateInRange } from "@/utils/date";

import styles from "./page.module.css";

export default function TeamPage() {
  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const currentDeployment = getCurrentRotation(deploymentRotations);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Teamorganisation</p>

        <h1>Team</h1>

        <p className={styles.description}>
          Übersicht über Teammitglieder, Abwesenheiten und Rotations-
          verantwortlichkeiten.
        </p>
      </header>

      <div className={styles.teamList}>
        {teamMembers.map((teamMember) => {
          const currentAbsence = absences.find(
            (absence) =>
              absence.teamMemberId === teamMember.id &&
              isDateInRange(absence.startDate, absence.endDate),
          );

          const participatesInDispatcher =
            dispatcherRotationConfig.participantTeamMemberIds.includes(
              teamMember.id,
            );

          const participatesInDeployment =
            deploymentRotationConfig.participantTeamMemberIds.includes(
              teamMember.id,
            );

          const isCurrentDispatcher =
            currentDispatcher?.teamMemberId === teamMember.id;

          const isCurrentDeployment =
            currentDeployment?.teamMemberId === teamMember.id;

          return (
            <article key={teamMember.id} className={styles.teamMember}>
              <div className={styles.person}>
                <div className={styles.avatar} aria-hidden="true">
                  {teamMember.firstName.charAt(0).toUpperCase()}

                  {teamMember.lastName.charAt(0).toUpperCase()}
                </div>

                <div className={styles.personDetails}>
                  <strong>{teamMember.displayName}</strong>

                  <a href={`mailto:${teamMember.email}`}>{teamMember.email}</a>
                </div>
              </div>

              <div className={styles.statusSection}>
                <span className={styles.label}>Status</span>

                {currentAbsence ? (
                  <span className={`${styles.badge} ${styles.badgeAbsent}`}>
                    {currentAbsence.type === "vacation"
                      ? "Urlaub"
                      : currentAbsence.type === "sickLeave"
                        ? "Krankenstand"
                        : "Abwesend"}
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeAvailable}`}>
                    Verfügbar
                  </span>
                )}
              </div>

              <div className={styles.rotationSection}>
                <span className={styles.label}>Rotationen</span>

                <div className={styles.badges}>
                  {participatesInDispatcher && (
                    <span className={styles.badge}>Dispatcher</span>
                  )}

                  {participatesInDeployment && (
                    <span className={styles.badge}>Deployment</span>
                  )}

                  {!participatesInDispatcher && !participatesInDeployment && (
                    <span className={styles.muted}>Keine Rotation</span>
                  )}
                </div>
              </div>

              <div className={styles.currentSection}>
                <span className={styles.label}>Diese Woche</span>

                <div className={styles.badges}>
                  {isCurrentDispatcher && (
                    <span className={`${styles.badge} ${styles.badgeCurrent}`}>
                      Dispatcher
                    </span>
                  )}

                  {isCurrentDeployment && (
                    <span className={`${styles.badge} ${styles.badgeCurrent}`}>
                      Deployment
                    </span>
                  )}

                  {!isCurrentDispatcher && !isCurrentDeployment && (
                    <span className={styles.muted}>Keine Verantwortung</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
