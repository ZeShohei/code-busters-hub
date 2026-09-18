import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminAbsenceForm } from "@/features/admin/absences/AdminAbsenceForm";

import styles from "./page.module.css";

export default async function NewAbsencePage() {
  const { teamMembers } = await getAppData();

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Admin",
            href: "/admin",
          },
          {
            label: "Abwesenheiten",
            href: "/admin/absences",
          },
          {
            label: "Neue Abwesenheit",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Abwesenheit hinzufügen"
        description="Erfasse eine neue Abwesenheit und optional die zuständige Vertretung."
      />

      <AdminAbsenceForm
        teamMembers={teamMembers.filter((member) => member.active)}
      />
    </div>
  );
}
