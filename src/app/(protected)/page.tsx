import { redirect } from "next/navigation";

import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { UpcomingAbsences } from "@/features/absences/UpcomingAbsences";

import {
  ActionRequired,
  type ActionRequiredItem,
} from "@/features/dashboard/ActionRequired";

import {
  VacationHandovers,
  type VacationHandoverDashboardItem,
} from "@/features/dashboard/VacationHandovers";

import { resolveRotation } from "@/features/rotations/utils";
import { getTeamMemberName } from "@/features/team/utils";
import { WeekOverview } from "@/features/weekOverview/WeekOverview";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  formatDate,
  getCalendarWeek,
  getCurrentRotation,
  getDateRangeStatus,
  getNextRotation,
  getUpcomingRotationsInCurrentWeek,
  isDateAfter,
  isDateInCurrentWeek,
  isDateInRange,
  isDateToday,
} from "@/utils/date";

import type { RotationAssignment, RotationResolution } from "@/types/team";

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

const toDateString = (date: Date) => {
  return date.toISOString().slice(0, 10);
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

const getDeploymentCardLabel = (rotation?: RotationAssignment) => {
  if (!rotation) {
    return "Nächstes Deployment";
  }

  if (isDateToday(rotation.startDate)) {
    return "Deployment heute";
  }

  if (isDateInCurrentWeek(rotation.startDate)) {
    return "Deployment diese Woche";
  }

  return "Nächstes Deployment";
};

const getDeploymentDescription = (
  rotation: RotationAssignment,
  resolution: RotationResolution,
  teamMembers: Parameters<typeof getTeamMemberName>[1],
) => {
  const dateLabel = formatDate(rotation.startDate);

  const kindLabel = getDeploymentKindLabel(rotation);

  if (resolution.status === "substitution") {
    return `${dateLabel} · ${kindLabel} · Vertretung für ${getTeamMemberName(
      resolution.assignedTeamMemberId,
      teamMembers,
    )}`;
  }

  if (resolution.status === "uncovered") {
    return `${dateLabel} · ${kindLabel} · Abwesend – keine Vertretung eingetragen`;
  }

  if (rotation.deploymentKind === "rescheduled" && rotation.originalDate) {
    return `${dateLabel} · Verschoben von ${formatDate(rotation.originalDate)}`;
  }

  if (rotation.deploymentKind === "special") {
    return `${dateLabel} · Sonderdeployment${
      rotation.reason ? ` · ${rotation.reason}` : ""
    }`;
  }

  return `${dateLabel} · Reguläres Deployment`;
};

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const [
    {
      teamMembers,
      absences,
      substitutions,
      dispatcherRotations,
      deploymentRotations,
    },
    vacationRows,
  ] = await Promise.all([
    getAppData(),

    prisma.absence.findMany({
      where: {
        type: "vacation",
      },

      include: {
        teamMember: true,

        substitution: {
          include: {
            substituteTeamMember: true,
          },
        },

        vacationHandover: {
          include: {
            tasks: {
              orderBy: {
                position: "asc",
              },
            },
          },
        },
      },

      orderBy: {
        startDate: "asc",
      },
    }),
  ]);

  /*
   * Dispatcher bleibt weiterhin
   * eine Wochenrotation.
   */
  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  /*
   * Deployment ist jetzt ein konkreter
   * Termin.
   *
   * Für die Teamkarte suchen wir deshalb
   * das nächste Deployment ab heute.
   */
  const nextDeployment = getNextRotation(deploymentRotations);

  const nextDeploymentResolution = nextDeployment
    ? resolveRotation(nextDeployment, absences, substitutions)
    : undefined;

  /*
   * Für "Meine Rotation diese Woche"
   * berücksichtigen wir Deployments,
   * die heute oder später innerhalb
   * dieser Woche stattfinden.
   *
   * Dadurch kann es auch mehrere
   * Deployments geben, z. B. regulär
   * plus Sonderdeployment.
   */
  const deploymentsThisWeek =
    getUpcomingRotationsInCurrentWeek(deploymentRotations);

  const resolvedDeploymentsThisWeek = deploymentsThisWeek.map((rotation) => ({
    rotation,

    resolution: resolveRotation(rotation, absences, substitutions),
  }));

  const myDeploymentsThisWeek = resolvedDeploymentsThisWeek.filter(
    ({ resolution }) => resolution.effectiveTeamMemberId === currentUser.id,
  );

  /*
   * Persönliche Rotation
   */

  const personalRotations: string[] = [];

  if (dispatcherResolution?.effectiveTeamMemberId === currentUser.id) {
    personalRotations.push("Dispatcher");
  }

  if (myDeploymentsThisWeek.length > 0) {
    personalRotations.push(
      myDeploymentsThisWeek.length > 1
        ? `Deployment (${myDeploymentsThisWeek.length})`
        : "Deployment",
    );
  }

  const personalRotationDescription = (() => {
    const substitutionForDispatcher =
      dispatcherResolution?.status === "substitution" &&
      dispatcherResolution.effectiveTeamMemberId === currentUser.id;

    const deploymentSubstitutions = myDeploymentsThisWeek.filter(
      ({ resolution }) => resolution.status === "substitution",
    );

    const deploymentDates = myDeploymentsThisWeek
      .map(({ rotation }) => formatDate(rotation.startDate))
      .join(", ");

    if (substitutionForDispatcher && deploymentSubstitutions.length > 0) {
      return `Du vertrittst diese Woche beim Dispatcher und hast zusätzlich Deployment am ${deploymentDates}.`;
    }

    if (substitutionForDispatcher) {
      return `Du vertrittst ${getTeamMemberName(
        dispatcherResolution.assignedTeamMemberId,
        teamMembers,
      )} diese Woche als Dispatcher.`;
    }

    if (deploymentSubstitutions.length > 0) {
      const firstSubstitution = deploymentSubstitutions[0];

      return `Du vertrittst ${getTeamMemberName(
        firstSubstitution.resolution.assignedTeamMemberId,
        teamMembers,
      )} beim Deployment am ${formatDate(
        firstSubstitution.rotation.startDate,
      )}.`;
    }

    if (
      dispatcherResolution?.effectiveTeamMemberId === currentUser.id &&
      myDeploymentsThisWeek.length > 0
    ) {
      return `Du bist diese Woche als Dispatcher eingeteilt und hast Deployment am ${deploymentDates}.`;
    }

    if (myDeploymentsThisWeek.length > 0) {
      return `Du bist für Deployment am ${deploymentDates} eingeteilt.`;
    }

    if (dispatcherResolution?.effectiveTeamMemberId === currentUser.id) {
      return "Du bist diese Woche regulär als Dispatcher eingeteilt.";
    }

    return "Du bist diese Woche in keiner Rotation eingeteilt.";
  })();

  /*
   * Eigene Abwesenheit
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
   * Eigene Vertretungen
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
   * Allgemeiner Teamstatus
   */

  const currentAbsences = absences.filter((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const upcomingAbsences = absences
    .filter((absence) => isDateAfter(absence.startDate))
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
    .slice(0, 3);

  /*
   * Handlungsbedarf:
   * unbesetzte aktuelle oder kommende
   * Rotationen.
   *
   * Dispatcher = Zeitraum
   * Deployment = einzelner Termin
   */

  const uncoveredRotationItems: ActionRequiredItem[] = [
    ...dispatcherRotations,
    ...deploymentRotations,
  ]
    .filter(
      (rotation) =>
        getDateRangeStatus(rotation.startDate, rotation.endDate) !== "past",
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
    .map((rotation) => {
      const resolution = resolveRotation(rotation, absences, substitutions);

      return {
        rotation,
        resolution,
      };
    })
    .filter(({ resolution }) => resolution.status === "uncovered")
    .slice(0, 5)
    .map(({ rotation, resolution }) => {
      const assignedName = getTeamMemberName(
        resolution.assignedTeamMemberId,
        teamMembers,
      );

      const isDeployment = rotation.type === "deployment";

      const rotationLabel = isDeployment
        ? getDeploymentKindLabel(rotation)
        : "Dispatcher";

      return {
        id: `rotation-${rotation.type}-${rotation.id}`,

        title: `${rotationLabel} in KW ${getCalendarWeek(
          rotation.startDate,
        )} unbesetzt`,

        description: isDeployment
          ? `${assignedName} ist am Deployment-Termin abwesend und es ist keine Vertretung eingetragen.`
          : `${assignedName} ist in diesem Zeitraum abwesend und es ist keine Vertretung eingetragen.`,

        meta: isDeployment
          ? formatDate(rotation.startDate)
          : `${formatDate(rotation.startDate)} – ${formatDate(
              rotation.endDate,
            )}`,

        href: "/absences?status=upcoming",

        actionLabel: "Abwesenheiten ansehen",
      };
    });

  /*
   * Urlaubsübergaben für den
   * aktuellen User.
   */

  const relevantVacationRows = vacationRows.filter((absence) => {
    const startDate = toDateString(absence.startDate);

    const endDate = toDateString(absence.endDate);

    const status = getDateRangeStatus(startDate, endDate);

    if (status === "past") {
      return false;
    }

    return (
      absence.teamMemberId === currentUser.id ||
      absence.substitution?.substituteTeamMemberId === currentUser.id
    );
  });

  const ownVacationActionItems: ActionRequiredItem[] = relevantVacationRows
    .filter((absence) => absence.teamMemberId === currentUser.id)
    .flatMap((absence) => {
      const startDate = toDateString(absence.startDate);

      const endDate = toDateString(absence.endDate);

      const status = getDateRangeStatus(startDate, endDate);

      const items: ActionRequiredItem[] = [];

      if (!absence.substitution && status === "upcoming") {
        items.push({
          id: `vacation-substitute-${absence.id}`,

          title: "Vertretung für deinen Urlaub fehlt",

          description:
            "Für deinen kommenden Urlaub ist noch keine Vertretung eingetragen.",

          meta: `${formatDate(startDate)} – ${formatDate(endDate)}`,

          href: `/absences/${absence.id}/edit`,

          actionLabel: "Vertretung eintragen",
        });
      }

      if (absence.substitution && !absence.vacationHandover) {
        items.push({
          id: `vacation-handover-${absence.id}`,

          title: "Urlaubsübergabe fehlt",

          description: `${absence.substitution.substituteTeamMember.displayName} ist als Vertretung eingetragen, aber es wurde noch keine Übergabe erstellt.`,

          meta: `${formatDate(startDate)} – ${formatDate(endDate)}`,

          href: `/absences/${absence.id}/handover`,

          actionLabel: "Übergabe erstellen",
        });
      }

      return items;
    });

  const actionRequiredItems = [
    ...ownVacationActionItems,
    ...uncoveredRotationItems,
  ];

  /*
   * Übergaben, bei denen der aktuelle
   * User als Vertretung eingetragen ist.
   */

  const vacationHandovers: VacationHandoverDashboardItem[] =
    relevantVacationRows
      .filter(
        (absence) =>
          absence.substitution?.substituteTeamMemberId === currentUser.id,
      )
      .map((absence) => {
        const handover = absence.vacationHandover;

        /*
         * Für den nächsten Schritt auf dem
         * Dashboard verwenden wir nur
         * unerledigte Aufgaben.
         */
        const openTasks =
          handover?.tasks.filter((task) => !task.completed) ?? [];

        const firstTaskWithNextStep = openTasks.find((task) =>
          task.nextSteps?.trim(),
        );

        return {
          absenceId: absence.id,

          vacationerName: absence.teamMember.displayName,

          startDate: toDateString(absence.startDate),

          endDate: toDateString(absence.endDate),

          hasHandover: Boolean(handover),

          taskCount: openTasks.length,

          emergencyContact: handover?.emergencyContact ?? undefined,

          nextStep: firstTaskWithNextStep?.nextSteps ?? undefined,

          knownRisks: handover?.knownRisks ?? undefined,

          deploymentPlan: handover?.deploymentPlan ?? undefined,
        };
      })
      .sort((first, second) => first.startDate.localeCompare(second.startDate));

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
                myDeploymentsThisWeek.some(
                  ({ resolution }) => resolution.status === "substitution",
                ))
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

      <ActionRequired items={actionRequiredItems} />

      <VacationHandovers items={vacationHandovers} />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Teamstatus</h2>

            <p>Die wichtigsten Informationen für das Team.</p>
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
            label={getDeploymentCardLabel(nextDeployment)}
            value={
              nextDeploymentResolution
                ? getTeamMemberName(
                    nextDeploymentResolution.effectiveTeamMemberId,
                    teamMembers,
                  )
                : "Kein Deployment geplant"
            }
            status={
              nextDeploymentResolution?.status === "substitution" ||
              nextDeploymentResolution?.status === "uncovered"
                ? "warning"
                : "default"
            }
            description={
              nextDeployment && nextDeploymentResolution
                ? getDeploymentDescription(
                    nextDeployment,
                    nextDeploymentResolution,
                    teamMembers,
                  )
                : "Im aktuellen Planungszeitraum ist kein weiteres Deployment eingetragen."
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
