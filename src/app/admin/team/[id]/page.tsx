import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminTeamMemberForm } from "@/features/admin/team/AdminTeamMemberForm";

import styles from "./page.module.css";

interface EditTeamMemberPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTeamMemberPage({
  params,
}: EditTeamMemberPageProps) {
  const { id } = await params;

  const { teamMembers } = await getAppData();

  const teamMember = teamMembers.find((member) => member.id === id);

  if (!teamMember) {
    notFound();
  }

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
            label: teamMember.displayName,
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Teammitglied bearbeiten"
        description="Persönliche Daten und Status des Teammitglieds verwalten."
      />

      <AdminTeamMemberForm teamMember={teamMember} />
    </div>
  );
}
