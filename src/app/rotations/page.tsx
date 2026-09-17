import { Suspense } from "react";

import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { RotationsOverview } from "@/features/rotations/RotationsOverview";
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

      <Suspense fallback={<p>Rotationen werden geladen …</p>}>
        <RotationsOverview
          dispatcherRotations={dispatcherRotations}
          deploymentRotations={deploymentRotations}
          absences={absences}
          substitutions={substitutions}
          teamMembers={teamMembers}
        />
      </Suspense>
    </section>
  );
}
