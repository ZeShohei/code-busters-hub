import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { AbsenceList } from "@/features/absences/AbsenceList";

import styles from "./page.module.css";

export default async function AbsencesPage() {
  const { teamMembers, absences, substitutions } = await getAppData();

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

      <div className={styles.header}>
        <PageHeader
          eyebrow="Teamorganisation"
          title="Abwesenheiten"
          description="Übersicht über aktuelle, kommende und vergangene Abwesenheiten inklusive Vertretungen."
        />

        <Link href="/absences/new" className={styles.createButton}>
          + Eigene Abwesenheit eintragen
        </Link>
      </div>

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
