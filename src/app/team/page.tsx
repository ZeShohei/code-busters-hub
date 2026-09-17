import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import {
  deploymentRotationConfig,
  dispatcherRotationConfig,
} from "@/features/rotations/config";
import { resolveRotation } from "@/features/rotations/utils";
import { TeamList } from "@/features/team/TeamList";
import { teamMembers } from "@/features/team/mockData";
import { getCurrentRotation } from "@/utils/date";

import styles from "./page.module.css";

export default function TeamPage() {
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
      <header className={styles.header}>
        <p className={styles.eyebrow}>Teamorganisation</p>

        <h1>Team</h1>

        <p className={styles.description}>
          Übersicht über Teammitglieder, Abwesenheiten und
          Rotationsverantwortlichkeiten.
        </p>
      </header>

      <TeamList
        teamMembers={teamMembers}
        absences={absences}
        dispatcherParticipantIds={
          dispatcherRotationConfig.participantTeamMemberIds
        }
        deploymentParticipantIds={
          deploymentRotationConfig.participantTeamMemberIds
        }
        dispatcherResolution={dispatcherResolution}
        deploymentResolution={deploymentResolution}
      />
    </section>
  );
}
