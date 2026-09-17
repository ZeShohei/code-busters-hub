import { absences, substitutions } from "@/features/absences/mockData";
import { teamMembers } from "@/features/team/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import {
  getRotationAbsence,
  getRotationSubstitution,
} from "@/features/rotations/utils";

import styles from "./page.module.css";

const getTeamMemberName = (teamMemberId: string) => {
  const teamMember = teamMembers.find((member) => member.id === teamMemberId);

  return teamMember?.displayName ?? "Unbekannt";
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getCalendarWeek = (dateString: string) => {
  const date = new Date(dateString);

  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const dayNumber = target.getUTCDay() || 7;

  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
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
            const absence = getRotationAbsence(rotation, absences);

            const substitution = getRotationSubstitution(
              rotation,
              substitutions,
            );

            return (
              <article
                key={rotation.id}
                className={`${styles.rotationCard} ${
                  absence ? styles.rotationCardConflict : ""
                }`}
              >
                <div className={styles.week}>
                  <span>KW</span>

                  <strong>{getCalendarWeek(rotation.startDate)}</strong>
                </div>

                <div className={styles.person}>
                  <span>Verantwortlich</span>

                  <strong>{getTeamMemberName(rotation.teamMemberId)}</strong>

                  {absence ? (
                    <span className={styles.warning}>
                      In diesem Zeitraum abwesend
                    </span>
                  ) : null}
                </div>

                {absence ? (
                  <div className={styles.substitution}>
                    <span>Vertretung</span>

                    <strong>
                      {substitution
                        ? getTeamMemberName(substitution.substituteTeamMemberId)
                        : "Keine Vertretung eingetragen"}
                    </strong>
                  </div>
                ) : null}

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
            const absence = getRotationAbsence(rotation, absences);

            const substitution = getRotationSubstitution(
              rotation,
              substitutions,
            );

            return (
              <article
                key={rotation.id}
                className={`${styles.rotationCard} ${
                  absence ? styles.rotationCardConflict : ""
                }`}
              >
                <div className={styles.week}>
                  <span>KW</span>

                  <strong>{getCalendarWeek(rotation.startDate)}</strong>
                </div>

                <div className={styles.person}>
                  <span>Verantwortlich</span>

                  <strong>{getTeamMemberName(rotation.teamMemberId)}</strong>

                  {absence ? (
                    <span className={styles.warning}>
                      In diesem Zeitraum abwesend
                    </span>
                  ) : null}
                </div>

                {absence ? (
                  <div className={styles.substitution}>
                    <span>Vertretung</span>

                    <strong>
                      {substitution
                        ? getTeamMemberName(substitution.substituteTeamMemberId)
                        : "Keine Vertretung eingetragen"}
                    </strong>
                  </div>
                ) : null}

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
