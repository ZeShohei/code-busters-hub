import {
  deploymentRotationConfig,
  dispatcherRotationConfig,
} from "@/features/rotations/config";
import { resolveRotation } from "@/features/rotations/utils";
import { TeamList } from "@/features/team/TeamList";
import { getCurrentRotation } from "@/utils/date";
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";

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

  const currentDeployment = getCurrentRotation(deploymentRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
    : undefined;

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
        deploymentResolution={deploymentResolution}
      />
    </section>
  );
}
