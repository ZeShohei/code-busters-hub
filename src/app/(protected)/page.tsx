import { redirect } from "next/navigation";

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { UpcomingAbsences } from "@/features/absences/UpcomingAbsences";
import { resolveRotation } from "@/features/rotations/utils";
import { getTeamMemberName } from "@/features/team/utils";
import { WeekOverview } from "@/features/weekOverview/WeekOverview";

import { getCurrentUser } from "@/lib/auth";

import {
  formatDate,
  getCurrentRotation,
  getDateRangeStatus,
  isDateAfter,
  isDateInRange,
} from "@/utils/date";

import styles from "./page.module.css";

const getAbsenceTypeLabel = (type: "vacation" | "sickLeave" | "other") => {
  switch (type) {
    case "vacation":
      return "Urlaub";

    case "sickLeave":
      return "Krankenstand";

    case "other":
      return "Sonstige Abwesenheit";
  }
};

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const {
    teamMembers,
    absences,
    substitutions,
    dispatcherRotations,
    deploymentRotations,
  } = await getAppData();

  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const currentDeployment = getCurrentRotation(deploymentRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
    : undefined;

  /*
   * Persönliche Rotation
   */

  const personalRotations: string[] = [];

  if (dispatcherResolution?.effectiveTeamMemberId === currentUser.id) {
    personalRotations.push("Dispatcher");
  }

  if (deploymentResolution?.effectiveTeamMemberId === currentUser.id) {
    personalRotations.push("Deployment");
  }

  const personalRotationDescription = (() => {
    const substitutionForDispatcher =
      dispatcherResolution?.status === "substitution" &&
      dispatcherResolution.effectiveTeamMemberId === currentUser.id;

    const substitutionForDeployment =
      deploymentResolution?.status === "substitution" &&
      deploymentResolution.effectiveTeamMemberId === currentUser.id;

    if (substitutionForDispatcher && substitutionForDeployment) {
      return "Du übernimmst diese Woche beide Rotationen als Vertretung.";
    }

    if (substitutionForDispatcher) {
      return `Du vertrittst ${getTeamMemberName(
        dispatcherResolution.assignedTeamMemberId,
        teamMembers,
      )} als Dispatcher.`;
    }

    if (substitutionForDeployment) {
      return `Du vertrittst ${getTeamMemberName(
        deploymentResolution.assignedTeamMemberId,
        teamMembers,
      )} im Deployment.`;
    }

    if (personalRotations.length > 0) {
      return "Du bist diese Woche regulär eingeteilt.";
    }

    return "Du bist diese Woche in keiner Rotation eingeteilt.";
  })();

  /*
   * Eigene nächste bzw. aktuelle Abwesenheit
   */

  const ownRelevantAbsences = absences
    .filter(
      (absence) =>
        absence.teamMemberId === currentUser.id &&
        getDateRangeStatus(absence.startDate, absence.endDate) !== "past",
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));

  const ownNextAbsence = ownRelevantAbsences[0];

  const ownAbsenceStatus = ownNextAbsence
    ? getDateRangeStatus(ownNextAbsence.startDate, ownNextAbsence.endDate)
    : undefined;

  /*
   * Vertretungen, die der aktuelle User übernimmt
   */

  const ownSubstitutions = substitutions
    .filter(
      (substitution) =>
        substitution.substituteTeamMemberId === currentUser.id &&
        getDateRangeStatus(substitution.startDate, substitution.endDate) !==
          "past",
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));

  const nextSubstitution = ownSubstitutions[0];

  const substitutionStatus = nextSubstitution
    ? getDateRangeStatus(nextSubstitution.startDate, nextSubstitution.endDate)
    : undefined;

  /*
   * Teamübersicht
   */

  const currentAbsences = absences.filter((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const upcomingAbsences = absences
    .filter((absence) => isDateAfter(absence.startDate))
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
    .slice(0, 3);

  return (
    <section className={styles.dashboard}>
      <PageHeader
        eyebrow="Code Busters Hub"
        title={`Hallo ${currentUser.displayName}`}
        description="Deine persönliche Übersicht und alles Wichtige für das Team auf einen Blick."
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Meine Übersicht</h2>

            <p>Deine aktuellen Rotationen, Abwesenheiten und Vertretungen.</p>
          </div>
        </div>

        <div className={styles.grid}>
          <DashboardCard
            label="Meine Rotation diese Woche"
            value={
              personalRotations.length > 0
                ? personalRotations.join(" & ")
                : "Keine Rotation"
            }
            status={
              personalRotations.length > 0 &&
              (dispatcherResolution?.status === "substitution" ||
                deploymentResolution?.status === "substitution")
                ? "warning"
                : "default"
            }
            description={personalRotationDescription}
          />

          <DashboardCard
            label={
              ownAbsenceStatus === "current"
                ? "Meine aktuelle Abwesenheit"
                : "Meine nächste Abwesenheit"
            }
            value={
              ownNextAbsence
                ? getAbsenceTypeLabel(ownNextAbsence.type)
                : "Keine geplant"
            }
            description={
              ownNextAbsence ? (
                <>
                  {formatDate(ownNextAbsence.startDate)} –{" "}
                  {formatDate(ownNextAbsence.endDate)}
                </>
              ) : (
                "Aktuell ist keine Abwesenheit eingetragen."
              )
            }
          />

          <DashboardCard
            label={
              substitutionStatus === "current"
                ? "Meine aktuelle Vertretung"
                : "Meine nächste Vertretung"
            }
            value={
              nextSubstitution
                ? getTeamMemberName(nextSubstitution.teamMemberId, teamMembers)
                : "Keine Vertretung"
            }
            description={
              nextSubstitution ? (
                <>
                  {formatDate(nextSubstitution.startDate)} –{" "}
                  {formatDate(nextSubstitution.endDate)}
                </>
              ) : (
                "Du bist aktuell für keine Vertretung eingetragen."
              )
            }
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Teamstatus</h2>

            <p>Die wichtigsten Informationen für diese Woche.</p>
          </div>
        </div>

        <div className={styles.grid}>
          <DashboardCard
            label="Dispatcher diese Woche"
            value={
              dispatcherResolution
                ? getTeamMemberName(
                    dispatcherResolution.effectiveTeamMemberId,
                    teamMembers,
                  )
                : "Nicht eingeteilt"
            }
            status={
              dispatcherResolution?.status === "substitution" ||
              dispatcherResolution?.status === "uncovered"
                ? "warning"
                : "default"
            }
            description={
              dispatcherResolution?.status === "substitution" ? (
                <>
                  Vertretung für{" "}
                  {getTeamMemberName(
                    dispatcherResolution.assignedTeamMemberId,
                    teamMembers,
                  )}
                </>
              ) : dispatcherResolution?.status === "uncovered" ? (
                <>Abwesend – keine Vertretung eingetragen</>
              ) : (
                <>Verantwortlich für Monitoring und New Relic.</>
              )
            }
          />

          <DashboardCard
            label="Deployment diese Woche"
            value={
              deploymentResolution
                ? getTeamMemberName(
                    deploymentResolution.effectiveTeamMemberId,
                    teamMembers,
                  )
                : "Nicht eingeteilt"
            }
            status={
              deploymentResolution?.status === "substitution" ||
              deploymentResolution?.status === "uncovered"
                ? "warning"
                : "default"
            }
            description={
              deploymentResolution?.status === "substitution" ? (
                <>
                  Vertretung für{" "}
                  {getTeamMemberName(
                    deploymentResolution.assignedTeamMemberId,
                    teamMembers,
                  )}
                </>
              ) : deploymentResolution?.status === "uncovered" ? (
                <>Abwesend – keine Vertretung eingetragen</>
              ) : (
                <>Zuständig für die aktuelle Deployment-Rotation.</>
              )
            }
          />

          <DashboardCard
            label="Heute abwesend"
            value={currentAbsences.length}
            description={
              currentAbsences.length === 0
                ? "Heute sind keine Abwesenheiten eingetragen."
                : currentAbsences
                    .map((absence) =>
                      getTeamMemberName(absence.teamMemberId, teamMembers),
                    )
                    .join(", ")
            }
          />
        </div>
      </section>

      <WeekOverview
        absences={absences}
        substitutions={substitutions}
        teamMembers={teamMembers}
        dispatcherRotations={dispatcherRotations}
        deploymentRotations={deploymentRotations}
      />

      <UpcomingAbsences absences={upcomingAbsences} teamMembers={teamMembers} />
    </section>
  );
}
