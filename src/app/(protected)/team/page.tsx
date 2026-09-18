import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { resolveRotation } from "@/features/rotations/utils";
import { TeamList } from "@/features/team/TeamList";

import { getCurrentRotation, isDateInCurrentWeek } from "@/utils/date";

import styles from "./page.module.css";

export default async function TeamPage() {
  const {
    teamMembers,
    absences,
    substitutions,
    dispatcherConfig,
    deploymentConfig,
    dispatcherRotations,
    deploymentRotations,
  } = await getAppData();

  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  /*
   * Die Teamübersicht zeigt ausdrücklich
   * "Diese Woche".
   *
   * Deshalb berücksichtigen wir hier alle
   * Deployments der aktuellen Woche:
   *
   * - bereits vergangene Termine
   * - heutige Termine
   * - kommende Termine
   *
   * Ein Deployment vom Donnerstag bleibt
   * dadurch auch am Freitag noch als
   * Wochenverantwortung sichtbar.
   */
  const deploymentsThisWeek = deploymentRotations.filter((rotation) =>
    isDateInCurrentWeek(rotation.startDate),
  );

  const deploymentResolutionsThisWeek = deploymentsThisWeek.map((rotation) => ({
    rotation,

    resolution: resolveRotation(rotation, absences, substitutions),
  }));

  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Übersicht",
            href: "/",
          },
          {
            label: "Team",
          },
        ]}
      />

      <PageHeader
        eyebrow="Teamorganisation"
        title="Team"
        description="Übersicht über Teammitglieder, Abwesenheiten und Rotationsverantwortlichkeiten."
      />

      <TeamList
        teamMembers={teamMembers}
        absences={absences}
        dispatcherParticipantIds={dispatcherConfig.participantTeamMemberIds}
        deploymentParticipantIds={deploymentConfig.participantTeamMemberIds}
        dispatcherResolution={dispatcherResolution}
        deploymentResolutionsThisWeek={deploymentResolutionsThisWeek}
      />
    </section>
  );
}
