"use client";

import { useMemo, useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";
import { formatDate, getCalendarWeek, getDateRangeStatus } from "@/utils/date";
import { resolveRotation } from "@/features/rotations/utils";

import styles from "./RotationHistory.module.css";

interface RotationHistoryProps {
  title: string;
  rotations: RotationAssignment[];
  teamMembers: TeamMember[];
  absences: Absence[];
  substitutions: Substitution[];
}

type HistoryFilter = "all" | "past" | "current" | "upcoming";

export const RotationHistory = ({
  title,
  rotations,
  teamMembers,
  absences,
  substitutions,
}: RotationHistoryProps) => {
  const [filter, setFilter] = useState<HistoryFilter>("upcoming");

  const getTeamMemberName = (teamMemberId: string) => {
    return (
      teamMembers.find((member) => member.id === teamMemberId)?.displayName ??
      "Unbekannt"
    );
  };

  const filteredRotations = useMemo(() => {
    const sorted = [...rotations].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );

    if (filter === "all") {
      return sorted;
    }

    return sorted.filter(
      (rotation) =>
        getDateRangeStatus(rotation.startDate, rotation.endDate) === filter,
    );
  }, [filter, rotations]);

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <div>
          <h2>{title}</h2>

          <p>Verlauf aller generierten Rotationsschritte.</p>
        </div>

        <div className={styles.filters} aria-label="History filtern">
          <button
            type="button"
            className={filter === "all" ? styles.activeFilter : styles.filter}
            onClick={() => setFilter("all")}
          >
            Alle
          </button>

          <button
            type="button"
            className={filter === "past" ? styles.activeFilter : styles.filter}
            onClick={() => setFilter("past")}
          >
            Vergangenheit
          </button>

          <button
            type="button"
            className={
              filter === "current" ? styles.activeFilter : styles.filter
            }
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
            Zukunft
          </button>
        </div>
      </div>

      {filteredRotations.length === 0 ? (
        <p>Für diesen Filter sind keine Rotationen vorhanden.</p>
      ) : (
        <div className={styles.list}>
          {filteredRotations.map((rotation) => {
            const resolution = resolveRotation(
              rotation,
              absences,
              substitutions,
            );

            const assignedName = getTeamMemberName(
              resolution.assignedTeamMemberId,
            );

            const effectiveName = getTeamMemberName(
              resolution.effectiveTeamMemberId,
            );

            const status = getDateRangeStatus(
              rotation.startDate,
              rotation.endDate,
            );

            return (
              <article key={rotation.id} className={styles.item}>
                <div className={styles.period}>
                  <strong>KW {getCalendarWeek(rotation.startDate)}</strong>

                  <span>
                    {formatDate(rotation.startDate)}
                    {" – "}
                    {formatDate(rotation.endDate)}
                  </span>

                  <span className={styles.status}>
                    {status === "past"
                      ? "Vergangen"
                      : status === "current"
                        ? "Aktuell"
                        : "Zukünftig"}
                  </span>
                </div>

                <div className={styles.assignment}>
                  <span className={styles.label}>Eingeteilt</span>

                  <strong>{assignedName}</strong>
                </div>

                <div className={styles.result}>
                  {resolution.status === "regular" ? (
                    <span className={styles.regular}>Regulär</span>
                  ) : null}

                  {resolution.status === "substitution" ? (
                    <>
                      <span className={styles.substitution}>Vertretung</span>

                      <span>{effectiveName}</span>
                    </>
                  ) : null}

                  {resolution.status === "uncovered" ? (
                    <span className={styles.uncovered}>Nicht besetzt</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
