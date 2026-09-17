import { Suspense } from "react";

import { absences, substitutions } from "@/features/absences/mockData";
import { AbsenceList } from "@/features/absences/AbsenceList";
import { teamMembers } from "@/features/team/mockData";
import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import styles from "./page.module.css";

export default function AbsencesPage() {
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
          },
        ]}
      />
      <PageHeader
        eyebrow="Teamorganisation"
        title="Abwesenheiten"
        description="Übersicht über aktuelle, kommende und vergangene Abwesenheiten inklusive Vertretungen."
      />

      <Suspense fallback={<p>Abwesenheiten werden geladen …</p>}>
        <AbsenceList
          absences={absences}
          substitutions={substitutions}
          teamMembers={teamMembers}
        />
      </Suspense>
    </section>
  );
}
