import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminRotationForm } from "@/features/admin/rotations/AdminRotationForm";
import { RotationConfigHistory } from "@/features/admin/rotations/RotationConfigHistory";

import styles from "./page.module.css";

export default async function AdminRotationsPage() {
  const {
    teamMembers,
    dispatcherConfig,
    deploymentConfig,
    dispatcherConfigs,
    deploymentConfigs,
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
        description="Konfiguriere Dispatcher- und Deployment-Rotationen. Änderungen werden als neue zeitliche Version gespeichert."
      />

      <section className={styles.rotationSection}>
        <AdminRotationForm
          title="Dispatcher"
          config={dispatcherConfig}
          teamMembers={teamMembers}
        />

        <RotationConfigHistory
          configs={dispatcherConfigs}
          teamMembers={teamMembers}
        />
      </section>

      <section className={styles.rotationSection}>
        <AdminRotationForm
          title="Deployment"
          config={deploymentConfig}
          teamMembers={teamMembers}
        />

        <RotationConfigHistory
          configs={deploymentConfigs}
          teamMembers={teamMembers}
        />
      </section>
    </div>
  );
}
