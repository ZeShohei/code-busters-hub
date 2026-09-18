import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { AdminRotationForm } from "@/features/admin/rotations/AdminRotationForm";
import { DeploymentExceptionForm } from "@/features/admin/rotations/DeploymentExceptionForm";
import { RotationHistory } from "@/features/admin/rotations/RotationHistory";
import { RotationPlanningStatus } from "@/features/admin/rotations/RotationPlanningStatus";

import styles from "./page.module.css";

export default async function AdminRotationsPage() {
  const {
    teamMembers,
    absences,
    substitutions,

    dispatcherConfig,
    deploymentConfig,

    dispatcherRotations,
    deploymentRotations,

    deploymentExceptions,
  } = await getAppData();

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Admin",
            href: "/admin",
          },
          {
            label: "Rotationen",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Rotationen verwalten"
        description="Konfiguriere Dispatcher- und Deployment-Rotationen und prüfe den vollständigen Rotationsverlauf."
      />

      <section className={styles.rotationSection}>
        <RotationPlanningStatus title="Dispatcher" config={dispatcherConfig} />

        <AdminRotationForm
          title="Dispatcher"
          config={dispatcherConfig}
          teamMembers={teamMembers}
        />

        <RotationHistory
          title="Dispatcher History"
          rotations={dispatcherRotations}
          teamMembers={teamMembers}
          absences={absences}
          substitutions={substitutions}
        />
      </section>

      <section className={styles.rotationSection}>
        <RotationPlanningStatus title="Deployment" config={deploymentConfig} />

        <AdminRotationForm
          title="Deployment"
          config={deploymentConfig}
          teamMembers={teamMembers}
        />

        <DeploymentExceptionForm
          teamMembers={teamMembers}
          exceptions={deploymentExceptions}
          deploymentRotations={deploymentRotations}
        />

        <RotationHistory
          title="Deployment History"
          rotations={deploymentRotations}
          teamMembers={teamMembers}
          absences={absences}
          substitutions={substitutions}
        />
      </section>
    </div>
  );
}
