import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { AdminTeamMemberForm } from "@/features/admin/team/AdminTeamMemberForm";

export default function NewTeamMemberPage() {
  return (
    <>
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
        description="Lege ein neues Teammitglied an und bestimme dessen Rolle."
      />

      <AdminTeamMemberForm />
    </>
  );
}
