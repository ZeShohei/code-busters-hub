import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getOwnAbsenceForEdit } from "@/features/absences/actions";

import { OwnAbsenceForm } from "@/features/absences/OwnAbsenceForm";

import styles from "../../page.module.css";

interface EditOwnAbsencePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOwnAbsencePage({
  params,
}: EditOwnAbsencePageProps) {
  const { id } = await params;

  const absence = await getOwnAbsenceForEdit(id);

  if (!absence) {
    notFound();
  }

  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Übersicht",
            href: "/",
          },
          {
            label: "Abwesenheiten",
            href: "/absences",
          },
          {
            label: "Bearbeiten",
          },
        ]}
      />

      <PageHeader
        eyebrow="Meine Abwesenheit"
        title="Abwesenheit bearbeiten"
        description="Zeitraum, Abwesenheitsart und Vertretung anpassen oder die geplante Abwesenheit stornieren."
      />

      <OwnAbsenceForm absence={absence} />
    </section>
  );
}
