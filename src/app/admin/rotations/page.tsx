import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminRotationForm } from "@/features/admin/rotations/AdminRotationForm";

import styles from "./page.module.css";

export default async function AdminRotationsPage() {
  const { teamMembers, dispatcherConfig, deploymentConfig } =
    await getAppData();

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
        description="Konfiguriere Teilnehmer, Reihenfolge und Startpunkt der Dispatcher- und Deployment-Rotation."
      />

      <div className={styles.rotations}>
        <AdminRotationForm
          title="Dispatcher"
          config={dispatcherConfig}
          teamMembers={teamMembers}
        />

        <AdminRotationForm
          title="Deployment"
          config={deploymentConfig}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
