import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { resolveRotation } from "@/features/rotations/utils";
import { getTeamMemberName } from "@/features/team/utils";

import type {
  Absence,
  RotationAssignment,
  RotationResolution,
} from "@/types/team";

import {
  formatDate,
  getCalendarWeek,
  getDateRangeStatus,
  getDateRangeStatusLabel,
  isDateInRange,
  parseDate,
} from "@/utils/date";

import styles from "./page.module.css";

interface TeamMemberPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ResolvedRotationItem {
  rotation: RotationAssignment;
  resolution: RotationResolution;
}

const sortRotationsByStartDate = (rotations: ResolvedRotationItem[]) => {
  return [...rotations].sort(
    (first, second) =>
      parseDate(first.rotation.startDate).getTime() -
      parseDate(second.rotation.startDate).getTime(),
  );
};

const getRelevantRotations = (rotations: ResolvedRotationItem[]) => {
  const sorted = sortRotationsByStartDate(rotations);

  const current = sorted.filter(
    ({ rotation }) =>
      getDateRangeStatus(rotation.startDate, rotation.endDate) === "current",
  );

  const upcoming = sorted
    .filter(
      ({ rotation }) =>
        getDateRangeStatus(rotation.startDate, rotation.endDate) === "upcoming",
    )
    .slice(0, 3);

  const past = sorted
    .filter(
      ({ rotation }) =>
        getDateRangeStatus(rotation.startDate, rotation.endDate) === "past",
    )
    .slice(-3)
    .reverse();

  return [...current, ...upcoming, ...past];
};

const sortAbsencesByStartDate = (absences: Absence[]) => {
  return [...absences].sort(
    (first, second) =>
      parseDate(first.startDate).getTime() -
      parseDate(second.startDate).getTime(),
  );
};

const getAbsenceTypeLabel = (absence: Absence) => {
  switch (absence.type) {
    case "vacation":
      return "Urlaub";

    case "sickLeave":
      return "Krankenstand";

    default:
      return "Abwesend";
  }
};

const getDeploymentKindLabel = (rotation: RotationAssignment) => {
  switch (rotation.deploymentKind) {
    case "special":
      return "Sonderdeployment";

    case "rescheduled":
      return "Verschobenes Deployment";

    default:
      return "Reguläres Deployment";
  }
};

const renderRotationList = (
  rotations: ResolvedRotationItem[],
  emptyText: string,
  teamMemberId: string,
  teamMembers: Parameters<typeof getTeamMemberName>[1],
) => {
  if (rotations.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className={styles.list}>
      {rotations.map(({ rotation, resolution }) => {
        const status = getDateRangeStatus(rotation.startDate, rotation.endDate);

        const isDeployment = rotation.type === "deployment";

        const isSubstitute =
          resolution.status === "substitution" &&
          resolution.effectiveTeamMemberId === teamMemberId &&
          resolution.assignedTeamMemberId !== teamMemberId;

        const isBeingSubstituted =
          resolution.status === "substitution" &&
          resolution.assignedTeamMemberId === teamMemberId &&
          resolution.effectiveTeamMemberId !== teamMemberId;

        return (
          <article key={rotation.id} className={styles.card}>
            <div>
              <span>KW</span>

              <strong>{getCalendarWeek(rotation.startDate)}</strong>
            </div>

            <div>
              <span>{isDeployment ? "Termin" : "Zeitraum"}</span>

              <strong>
                {isDeployment
                  ? formatDate(rotation.startDate)
                  : `${formatDate(rotation.startDate)} – ${formatDate(
                      rotation.endDate,
                    )}`}
              </strong>

              {isDeployment &&
              rotation.deploymentKind === "rescheduled" &&
              rotation.originalDate ? (
                <small>Ursprünglich: {formatDate(rotation.originalDate)}</small>
              ) : null}
            </div>

            {isDeployment ? (
              <div>
                <span>Art</span>

                <strong>{getDeploymentKindLabel(rotation)}</strong>

                {rotation.reason ? <small>{rotation.reason}</small> : null}
              </div>
            ) : null}

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
                {getDateRangeStatusLabel(status)}
              </strong>
            </div>

            {isSubstitute ? (
              <div>
                <span>Vertretung</span>

                <strong>
                  Vertritt{" "}
                  {getTeamMemberName(
                    resolution.assignedTeamMemberId,
                    teamMembers,
                  )}
                </strong>
              </div>
            ) : null}

            {isBeingSubstituted ? (
              <div>
                <span>Vertreten durch</span>

                <strong>
                  {getTeamMemberName(
                    resolution.effectiveTeamMemberId,
                    teamMembers,
                  )}
                </strong>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { id } = await params;

  const {
    teamMembers,
    absences,
    substitutions,
    dispatcherRotations,
    deploymentRotations,
  } = await getAppData();

  const teamMember = teamMembers.find((member) => member.id === id);

  if (!teamMember) {
    notFound();
  }

  const memberAbsences = sortAbsencesByStartDate(
    absences.filter((absence) => absence.teamMemberId === teamMember.id),
  );

  const currentAbsence = memberAbsences.find((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const nextAbsence = memberAbsences.find(
    (absence) =>
      getDateRangeStatus(absence.startDate, absence.endDate) === "upcoming",
  );

  /*
   * Rotationen werden nicht nur anhand
   * der ursprünglich eingeteilten Person
   * ermittelt.
   *
   * Dadurch erscheinen auch Rotationen,
   * bei denen dieses Teammitglied als
   * Vertretung einspringt.
   */
  const resolvedDispatcherRotations = dispatcherRotations.map((rotation) => ({
    rotation,

    resolution: resolveRotation(rotation, absences, substitutions),
  }));

  const resolvedDeploymentRotations = deploymentRotations.map((rotation) => ({
    rotation,

    resolution: resolveRotation(rotation, absences, substitutions),
  }));

  const memberDispatcherRotations = getRelevantRotations(
    resolvedDispatcherRotations.filter(
      ({ resolution }) =>
        resolution.assignedTeamMemberId === teamMember.id ||
        resolution.effectiveTeamMemberId === teamMember.id,
    ),
  );

  const memberDeploymentRotations = getRelevantRotations(
    resolvedDeploymentRotations.filter(
      ({ resolution }) =>
        resolution.assignedTeamMemberId === teamMember.id ||
        resolution.effectiveTeamMemberId === teamMember.id,
    ),
  );

  const nextDispatcher = sortRotationsByStartDate(
    resolvedDispatcherRotations.filter(
      ({ rotation, resolution }) =>
        (resolution.assignedTeamMemberId === teamMember.id ||
          resolution.effectiveTeamMemberId === teamMember.id) &&
        getDateRangeStatus(rotation.startDate, rotation.endDate) !== "past",
    ),
  )[0];

  const nextDeployment = sortRotationsByStartDate(
    resolvedDeploymentRotations.filter(
      ({ rotation, resolution }) =>
        (resolution.assignedTeamMemberId === teamMember.id ||
          resolution.effectiveTeamMemberId === teamMember.id) &&
        getDateRangeStatus(rotation.startDate, rotation.endDate) !== "past",
    ),
  )[0];

  const substitutionsForMember = substitutions.filter(
    (substitution) => substitution.teamMemberId === teamMember.id,
  );

  const substitutionsByMember = substitutions.filter(
    (substitution) => substitution.substituteTeamMemberId === teamMember.id,
  );

  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Team",
            href: "/team",
          },
          {
            label: teamMember.displayName,
          },
        ]}
      />

      <PageHeader
        eyebrow="Teammitglied"
        title={teamMember.displayName}
        description={teamMember.email}
      >
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden="true">
            {teamMember.firstName.charAt(0).toUpperCase()}

            {teamMember.lastName.charAt(0).toUpperCase()}
          </div>

          <div className={styles.status}>
            <span>Status</span>

            {currentAbsence ? (
              <strong className={styles.statusAbsent}>
                {getAbsenceTypeLabel(currentAbsence)}
              </strong>
            ) : (
              <strong className={styles.statusAvailable}>Verfügbar</strong>
            )}
          </div>
        </div>
      </PageHeader>

      <section className={styles.summaryGrid} aria-label="Übersicht">
        <article className={styles.summaryCard}>
          <span>Nächste Abwesenheit</span>

          {nextAbsence ? (
            <>
              <strong>{getAbsenceTypeLabel(nextAbsence)}</strong>

              <small>
                {formatDate(nextAbsence.startDate)} –{" "}
                {formatDate(nextAbsence.endDate)}
              </small>
            </>
          ) : (
            <strong>Keine geplant</strong>
          )}
        </article>

        <article className={styles.summaryCard}>
          <span>Nächster Dispatcher</span>

          {nextDispatcher ? (
            <>
              <strong>
                KW {getCalendarWeek(nextDispatcher.rotation.startDate)}
              </strong>

              <small>
                {formatDate(nextDispatcher.rotation.startDate)} –{" "}
                {formatDate(nextDispatcher.rotation.endDate)}
              </small>
            </>
          ) : (
            <strong>Nicht geplant</strong>
          )}
        </article>

        <article className={styles.summaryCard}>
          <span>Nächstes Deployment</span>

          {nextDeployment ? (
            <>
              <strong>{formatDate(nextDeployment.rotation.startDate)}</strong>

              <small>{getDeploymentKindLabel(nextDeployment.rotation)}</small>
            </>
          ) : (
            <strong>Nicht geplant</strong>
          )}
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Abwesenheiten</h2>

            <p>
              Aktuelle, kommende und vergangene Abwesenheiten inklusive
              Vertretung.
            </p>
          </div>
        </div>

        {memberAbsences.length === 0 ? (
          <p className={styles.empty}>Keine Abwesenheiten eingetragen.</p>
        ) : (
          <div className={styles.list}>
            {memberAbsences.map((absence) => {
              const status = getDateRangeStatus(
                absence.startDate,
                absence.endDate,
              );

              const substitution = substitutions.find(
                (item) => item.absenceId === absence.id,
              );

              return (
                <article key={absence.id} className={styles.card}>
                  <div>
                    <span>Typ</span>

                    <strong>{getAbsenceTypeLabel(absence)}</strong>
                  </div>

                  <div>
                    <span>Zeitraum</span>

                    <strong>
                      {formatDate(absence.startDate)} –{" "}
                      {formatDate(absence.endDate)}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong
                      className={`${styles.absenceStatus} ${
                        status === "current"
                          ? styles.absenceStatusCurrent
                          : status === "upcoming"
                            ? styles.absenceStatusUpcoming
                            : styles.absenceStatusPast
                      }`}
                    >
                      {getDateRangeStatusLabel(status)}
                    </strong>
                  </div>

                  <div>
                    <span>Vertretung</span>

                    <strong>
                      {substitution
                        ? getTeamMemberName(
                            substitution.substituteTeamMemberId,
                            teamMembers,
                          )
                        : "Keine Vertretung"}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Dispatcher-Rotationen</h2>

            <p>
              Eigene Einsätze und Rotationen, bei denen die Person als
              Vertretung übernimmt.
            </p>
          </div>
        </div>

        {renderRotationList(
          memberDispatcherRotations,
          "Keine Dispatcher-Rotationen.",
          teamMember.id,
          teamMembers,
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Deployment-Rotationen</h2>

            <p>
              Reguläre, verschobene und Sonderdeployments inklusive
              Vertretungen.
            </p>
          </div>
        </div>

        {renderRotationList(
          memberDeploymentRotations,
          "Keine Deployment-Rotationen.",
          teamMember.id,
          teamMembers,
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
