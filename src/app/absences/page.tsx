import { Suspense } from "react";

import { absences, substitutions } from "@/features/absences/mockData";
import { AbsenceList } from "@/features/absences/AbsenceList";
import { teamMembers } from "@/features/team/mockData";

import styles from "./page.module.css";

export default function AbsencesPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Teamorganisation</p>

        <h1>Abwesenheiten</h1>

        <p className={styles.description}>
          Übersicht über aktuelle, kommende und vergangene Abwesenheiten
          inklusive Vertretungen.
        </p>
      </header>

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
