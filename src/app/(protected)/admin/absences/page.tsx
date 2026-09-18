import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminAbsenceList } from "@/features/admin/absences/AdminAbsenceList";

import styles from "./page.module.css";

export default async function AdminAbsencesPage() {
  const { teamMembers, absences, substitutions } = await getAppData();

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
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Abwesenheiten verwalten"
        description="Abwesenheiten und Vertretungen anlegen, bearbeiten oder löschen."
      />

      <AdminAbsenceList
        teamMembers={teamMembers}
        absences={absences}
        substitutions={substitutions}
      />
    </div>
  );
}
