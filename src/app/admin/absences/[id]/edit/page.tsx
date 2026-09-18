import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { getAppData } from "@/data/appData";
import { AdminAbsenceForm } from "@/features/admin/absences/AdminAbsenceForm";

import styles from "./page.module.css";

interface EditAbsencePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAbsencePage({
  params,
}: EditAbsencePageProps) {
  const { id } = await params;

  const { teamMembers, absences, substitutions } = await getAppData();

  const absence = absences.find((item) => item.id === id);

  if (!absence) {
    notFound();
  }

  const substitution = substitutions.find(
    (item) =>
      item.teamMemberId === absence.teamMemberId &&
      item.startDate === absence.startDate &&
      item.endDate === absence.endDate,
  );

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
            label: "Bearbeiten",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Abwesenheit bearbeiten"
        description="Passe Zeitraum, Abwesenheitsart oder Vertretung an."
      />

      <AdminAbsenceForm
        absenceId={absence.id}
        teamMembers={teamMembers}
        initialValues={{
          teamMemberId: absence.teamMemberId,
          type: absence.type,
          startDate: absence.startDate,
          endDate: absence.endDate,
          substituteTeamMemberId: substitution?.substituteTeamMemberId ?? "",
        }}
      />
    </div>
  );
}
