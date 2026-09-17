import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { RotationList } from "@/features/rotations/RotationList";
import { teamMembers } from "@/features/team/mockData";

import styles from "./page.module.css";

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

      <RotationList
        title="Dispatcher"
        description="Wöchentliche Verantwortung für Monitoring und New Relic."
        rotations={dispatcherRotations}
        absences={absences}
        substitutions={substitutions}
        teamMembers={teamMembers}
      />

      <RotationList
        title="Deployment"
        description="Wöchentliche Verantwortung für Deployments."
        rotations={deploymentRotations}
        absences={absences}
        substitutions={substitutions}
        teamMembers={teamMembers}
      />
    </section>
  );
}
