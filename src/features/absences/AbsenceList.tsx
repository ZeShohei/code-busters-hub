"use client";

import { useMemo, useState } from "react";

import type { Absence, Substitution, TeamMember } from "@/types/team";

import { getTeamMemberName } from "@/features/team/utils";
import { formatDate, isDateInRange, parseDate } from "@/utils/date";

import styles from "./AbsenceList.module.css";

type AbsenceFilter = "all" | "current" | "upcoming" | "past";

interface AbsenceListProps {
  absences: Absence[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
}

const getAbsenceStatus = (absence: Absence) => {
  const today = new Date();

  if (isDateInRange(absence.startDate, absence.endDate, today)) {
    return "current";
  }

  if (parseDate(absence.startDate) > today) {
    return "upcoming";
  }

  return "past";
};

const getAbsenceStatusLabel = (status: "current" | "upcoming" | "past") => {
  switch (status) {
    case "current":
      return "Aktuell";

    case "upcoming":
      return "Kommend";

    case "past":
      return "Vergangen";
  }
};

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

export const AbsenceList = ({
  absences,
  substitutions,
  teamMembers,
}: AbsenceListProps) => {
  const [filter, setFilter] = useState<AbsenceFilter>("all");

  const filteredAbsences = useMemo(() => {
    if (filter === "all") {
      return absences;
    }

    return absences.filter((absence) => getAbsenceStatus(absence) === filter);
  }, [absences, filter]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters} aria-label="Abwesenheiten filtern">
        <button
          type="button"
          className={filter === "all" ? styles.activeFilter : styles.filter}
          onClick={() => setFilter("all")}
        >
          Alle
        </button>

        <button
          type="button"
          className={filter === "current" ? styles.activeFilter : styles.filter}
          onClick={() => setFilter("current")}
        >
          Aktuell
        </button>

        <button
          type="button"
          className={
            filter === "upcoming" ? styles.activeFilter : styles.filter
          }
          onClick={() => setFilter("upcoming")}
        >
          Kommend
        </button>

        <button
          type="button"
          className={filter === "past" ? styles.activeFilter : styles.filter}
          onClick={() => setFilter("past")}
        >
          Vergangen
        </button>
      </div>

      <span className={styles.resultCount}>
        {filteredAbsences.length} von {absences.length} Abwesenheiten
      </span>

      {filteredAbsences.length === 0 ? (
        <p className={styles.empty}>
          Keine Abwesenheiten für diesen Filter vorhanden.
        </p>
      ) : (
        <div className={styles.list}>
          {filteredAbsences.map((absence) => {
            const status = getAbsenceStatus(absence);

            const substitution = substitutions.find(
              (item) =>
                item.teamMemberId === absence.teamMemberId &&
                item.startDate <= absence.endDate &&
                item.endDate >= absence.startDate,
            );

            return (
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

                <div className={styles.substitution}>
                  <span>Vertretung</span>

                  <strong>
                    {substitution
                      ? getTeamMemberName(
                          substitution.substituteTeamMemberId,
                          teamMembers,
                        )
                      : "Keine Vertretung"}
                  </strong>
                </div>

                <div className={styles.status}>
                  <span>Status</span>

                  <strong
                    className={`${styles.statusBadge} ${
                      status === "current"
                        ? styles.statusCurrent
                        : status === "upcoming"
                          ? styles.statusUpcoming
                          : styles.statusPast
                    }`}
                  >
                    {getAbsenceStatusLabel(status)}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

AbsenceList.displayName = "AbsenceList";
