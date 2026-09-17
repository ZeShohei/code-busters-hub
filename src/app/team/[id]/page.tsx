import { notFound } from "next/navigation";

import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { teamMembers } from "@/features/team/mockData";
import { getTeamMemberName } from "@/features/team/utils";
import type { RotationAssignment } from "@/types/team";
import {
  formatDate,
  getCalendarWeek,
  isDateInRange,
  parseDate,
} from "@/utils/date";

import styles from "./page.module.css";

interface TeamMemberPageProps {
  params: Promise<{
    id: string;
  }>;
}

type RotationStatus = "current" | "upcoming" | "past";

const getRotationStatus = (rotation: RotationAssignment): RotationStatus => {
  const today = new Date();

  if (isDateInRange(rotation.startDate, rotation.endDate, today)) {
    return "current";
  }

  if (parseDate(rotation.startDate) > today) {
    return "upcoming";
  }

  return "past";
};

const getRotationStatusLabel = (status: RotationStatus) => {
  switch (status) {
    case "current":
      return "Aktuell";

    case "upcoming":
      return "Kommend";

    case "past":
      return "Vergangen";
  }
};

const sortRotationsByStartDate = (rotations: RotationAssignment[]) => {
  return [...rotations].sort(
    (first, second) =>
      parseDate(first.startDate).getTime() -
      parseDate(second.startDate).getTime(),
  );
};

const getRelevantRotations = (rotations: RotationAssignment[]) => {
  const sorted = sortRotationsByStartDate(rotations);

  const current = sorted.filter(
    (rotation) => getRotationStatus(rotation) === "current",
  );

  const upcoming = sorted
    .filter((rotation) => getRotationStatus(rotation) === "upcoming")
    .slice(0, 3);

  const past = sorted
    .filter((rotation) => getRotationStatus(rotation) === "past")
    .slice(-3)
    .reverse();

  return [...current, ...upcoming, ...past];
};

const renderRotationList = (
  rotations: RotationAssignment[],
  emptyText: string,
) => {
  if (rotations.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className={styles.list}>
      {rotations.map((rotation) => {
        const status = getRotationStatus(rotation);

        return (
          <article key={rotation.id} className={styles.card}>
            <div>
              <span>KW</span>

              <strong>{getCalendarWeek(rotation.startDate)}</strong>
            </div>

            <div>
              <span>Zeitraum</span>

              <strong>
                {formatDate(rotation.startDate)} –{" "}
                {formatDate(rotation.endDate)}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong
                className={`${styles.rotationStatus} ${
                  status === "current"
                    ? styles.rotationStatusCurrent
                    : status === "upcoming"
                      ? styles.rotationStatusUpcoming
                      : styles.rotationStatusPast
                }`}
              >
                {getRotationStatusLabel(status)}
              </strong>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { id } = await params;

  const teamMember = teamMembers.find((member) => member.id === id);

  if (!teamMember) {
    notFound();
  }

  const memberAbsences = absences.filter(
    (absence) => absence.teamMemberId === teamMember.id,
  );

  const currentAbsence = memberAbsences.find((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const memberDispatcherRotations = getRelevantRotations(
    dispatcherRotations.filter(
      (rotation) => rotation.teamMemberId === teamMember.id,
    ),
  );

  const memberDeploymentRotations = getRelevantRotations(
    deploymentRotations.filter(
      (rotation) => rotation.teamMemberId === teamMember.id,
    ),
  );

  const substitutionsForMember = substitutions.filter(
    (substitution) => substitution.teamMemberId === teamMember.id,
  );

  const substitutionsByMember = substitutions.filter(
    (substitution) => substitution.substituteTeamMemberId === teamMember.id,
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Teammitglied</p>

        <div className={styles.personHeader}>
          <div className={styles.avatar} aria-hidden="true">
            {teamMember.firstName.charAt(0).toUpperCase()}

            {teamMember.lastName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1>{teamMember.displayName}</h1>

            <a href={`mailto:${teamMember.email}`}>{teamMember.email}</a>
          </div>
        </div>

        <div className={styles.currentStatus}>
          <span>Status</span>

          {currentAbsence ? (
            <strong className={styles.statusAbsent}>
              {currentAbsence.type === "vacation"
                ? "Urlaub"
                : currentAbsence.type === "sickLeave"
                  ? "Krankenstand"
                  : "Abwesend"}
            </strong>
          ) : (
            <strong className={styles.statusAvailable}>Verfügbar</strong>
          )}
        </div>
      </header>

      <section className={styles.section}>
        <h2>Abwesenheiten</h2>

        {memberAbsences.length === 0 ? (
          <p className={styles.empty}>Keine Abwesenheiten eingetragen.</p>
        ) : (
          <div className={styles.list}>
            {memberAbsences.map((absence) => (
              <article key={absence.id} className={styles.card}>
                <div>
                  <span>Typ</span>

                  <strong>
                    {absence.type === "vacation"
                      ? "Urlaub"
                      : absence.type === "sickLeave"
                        ? "Krankenstand"
                        : "Abwesend"}
                  </strong>
                </div>

                <div>
                  <span>Von</span>

                  <strong>{formatDate(absence.startDate)}</strong>
                </div>

                <div>
                  <span>Bis</span>

                  <strong>{formatDate(absence.endDate)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Dispatcher-Rotationen</h2>

            <p>Aktuelle sowie die nächsten und letzten Rotationen.</p>
          </div>
        </div>

        {renderRotationList(
          memberDispatcherRotations,
          "Keine Dispatcher-Rotationen.",
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Deployment-Rotationen</h2>

            <p>Aktuelle sowie die nächsten und letzten Rotationen.</p>
          </div>
        </div>

        {renderRotationList(
          memberDeploymentRotations,
          "Keine Deployment-Rotationen.",
        )}
      </section>

      <section className={styles.section}>
        <h2>Vertretungen</h2>

        <div className={styles.substitutionGrid}>
          <div>
            <h3>Wird vertreten von</h3>

            {substitutionsForMember.length === 0 ? (
              <p className={styles.empty}>Keine Vertretungen eingetragen.</p>
            ) : (
              <div className={styles.list}>
                {substitutionsForMember.map((substitution) => (
                  <article key={substitution.id} className={styles.card}>
                    <div>
                      <span>Vertretung</span>

                      <strong>
                        {getTeamMemberName(
                          substitution.substituteTeamMemberId,
                          teamMembers,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Zeitraum</span>

                      <strong>
                        {formatDate(substitution.startDate)} –{" "}
                        {formatDate(substitution.endDate)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3>Vertritt</h3>

            {substitutionsByMember.length === 0 ? (
              <p className={styles.empty}>Keine Vertretungen übernommen.</p>
            ) : (
              <div className={styles.list}>
                {substitutionsByMember.map((substitution) => (
                  <article key={substitution.id} className={styles.card}>
                    <div>
                      <span>Teammitglied</span>

                      <strong>
                        {getTeamMemberName(
                          substitution.teamMemberId,
                          teamMembers,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Zeitraum</span>

                      <strong>
                        {formatDate(substitution.startDate)} –{" "}
                        {formatDate(substitution.endDate)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
