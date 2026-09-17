import Link from "next/link";

import type { Absence, TeamMember } from "@/types/team";

import { getTeamMemberName } from "@/features/team/utils";
import { formatDate } from "@/utils/date";

import styles from "./UpcomingAbsences.module.css";

interface UpcomingAbsencesProps {
  absences: Absence[];
  teamMembers: TeamMember[];
}

const getAbsenceTypeLabel = (type: Absence["type"]) => {
  switch (type) {
    case "vacation":
      return "Urlaub";

    case "sickLeave":
      return "Krankenstand";

    case "other":
      return "Abwesend";
  }
};

export const UpcomingAbsences = ({
  absences,
  teamMembers,
}: UpcomingAbsencesProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Kommende Abwesenheiten</h2>

          <p>Die nächsten geplanten Abwesenheiten im Team.</p>
        </div>

        <Link href="/absences?status=upcoming" className={styles.link}>
          Alle anzeigen
        </Link>
      </div>

      {absences.length === 0 ? (
        <p className={styles.empty}>
          Keine kommenden Abwesenheiten eingetragen.
        </p>
      ) : (
        <div className={styles.list}>
          {absences.map((absence) => (
            <article key={absence.id} className={styles.card}>
              <div className={styles.person}>
                <strong>
                  {getTeamMemberName(absence.teamMemberId, teamMembers)}
                </strong>

                <span>{getAbsenceTypeLabel(absence.type)}</span>
              </div>

              <div className={styles.period}>
                <span>Zeitraum</span>

                <strong>
                  {formatDate(absence.startDate)} –{" "}
                  {formatDate(absence.endDate)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

UpcomingAbsences.displayName = "UpcomingAbsences";
