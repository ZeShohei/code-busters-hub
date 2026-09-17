import { absences, substitutions } from "@/features/absences/mockData";
import { teamMembers } from "@/features/team/mockData";

import styles from "./page.module.css";

const getTeamMemberName = (teamMemberId: string) => {
  const teamMember = teamMembers.find((member) => member.id === teamMemberId);

  return teamMember?.displayName ?? "Unbekannt";
};

const getSubstituteName = (teamMemberId: string) => {
  const substitution = substitutions.find(
    (item) => item.teamMemberId === teamMemberId,
  );

  if (!substitution) {
    return null;
  }

  return getTeamMemberName(substitution.substituteTeamMemberId);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

type AbsenceStatus = "today" | "upcoming" | "past";

const getAbsenceStatus = (
  startDate: string,
  endDate: string,
): AbsenceStatus => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today >= start && today <= end) {
    return "today";
  }

  if (today < start) {
    return "upcoming";
  }

  return "past";
};

const getAbsenceStatusLabel = (status: AbsenceStatus) => {
  switch (status) {
    case "today":
      return "Heute";
    case "upcoming":
      return "Demnächst";
    case "past":
      return "Vergangen";
  }
};

export default function AbsencesPage() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Teamübersicht</p>

          <h1>Abwesenheiten</h1>

          <p className={styles.description}>
            Übersicht über geplante Abwesenheiten im Team.
          </p>
        </div>
      </header>

      <div className={styles.list}>
        {absences.map((absence) => {
          const status = getAbsenceStatus(absence.startDate, absence.endDate);

          return (
            <article key={absence.id} className={styles.card}>
              <div>
                <div className={styles.personHeader}>
                  <h2 className={styles.name}>
                    {getTeamMemberName(absence.teamMemberId)}
                  </h2>

                  <span
                    className={`${styles.status} ${styles[`status_${status}`]}`}
                  >
                    {getAbsenceStatusLabel(status)}
                  </span>
                </div>

                <p className={styles.type}>
                  {absence.type === "vacation"
                    ? "Urlaub"
                    : absence.type === "sickLeave"
                      ? "Krankenstand"
                      : "Sonstige Abwesenheit"}
                </p>
              </div>

              <div className={styles.date}>
                <span>Von</span>
                <strong>{formatDate(absence.startDate)}</strong>
              </div>

              <div className={styles.date}>
                <span>Bis</span>
                <strong>{formatDate(absence.endDate)}</strong>
              </div>

              <div className={styles.substitution}>
                <span>Vertretung</span>
                <strong>
                  {getSubstituteName(absence.teamMemberId) ??
                    "Keine Vertretung"}
                </strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
