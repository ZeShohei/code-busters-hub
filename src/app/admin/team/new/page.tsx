import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { AdminTeamMemberForm } from "@/features/admin/team/AdminTeamMemberForm";

import styles from "./page.module.css";

export default function NewTeamMemberPage() {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Admin",
            href: "/admin",
          },
          {
            label: "Team",
            href: "/admin/team",
          },
          {
            label: "Teammitglied hinzufügen",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Teammitglied hinzufügen"
        description="Füge ein neues Teammitglied hinzu."
      />

      <AdminTeamMemberForm />
    </div>
  );
}
