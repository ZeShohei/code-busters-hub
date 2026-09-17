import { Suspense } from "react";

import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { RotationsOverview } from "@/features/rotations/RotationsOverview";
import { teamMembers } from "@/features/team/mockData";
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import styles from "./page.module.css";

export default function RotationsPage() {
  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Übersicht",
            href: "/",
          },
          {
            label: "Rotationen",
          },
        ]}
      />
      <PageHeader
        eyebrow="Teamorganisation"
        title="Rotationen"
        description="Übersicht über Dispatcher- und Deployment-Verantwortlichkeiten."
      />

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
