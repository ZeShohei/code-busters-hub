import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { OwnAbsenceForm } from "@/features/absences/OwnAbsenceForm";

export default function NewAbsencePage() {
  return (
    <>
      <Breadcrumbs
        items={[
          {
            label: "Abwesenheiten",
            href: "/absences",
          },
          {
            label: "Abwesenheit eintragen",
          },
        ]}
      />

      <PageHeader
        eyebrow="Abwesenheiten"
        title="Eigene Abwesenheit eintragen"
        description="Trage deine Abwesenheit ein und wähle bei Bedarf eine verfügbare Vertretung."
      />

      <OwnAbsenceForm />
    </>
  );
}
