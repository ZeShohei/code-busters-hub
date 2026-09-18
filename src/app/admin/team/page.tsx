import Link from "next/link";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { AdminTeamList } from "@/features/admin/team/AdminTeamList";

export default async function AdminTeamPage() {
  const { teamMembers } = await getAppData();

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
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Team verwalten"
        description="Teammitglieder, Benutzerstatus und Berechtigungen verwalten."
      />

      <div>
        <Link href="/admin/team/new">Teammitglied hinzufügen</Link>
      </div>

      <AdminTeamList teamMembers={teamMembers} />
    </>
  );
}
