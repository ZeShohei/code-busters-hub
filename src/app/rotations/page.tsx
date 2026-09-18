import { Suspense } from "react";
import { RotationsOverview } from "@/features/rotations/RotationsOverview";
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";

import styles from "./page.module.css";

export default async function RotationsPage() {
  const {
    teamMembers,
    absences,
    substitutions,
    dispatcherRotations,
    deploymentRotations,
  } = await getAppData();

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
