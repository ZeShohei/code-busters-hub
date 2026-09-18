"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";
import { formatDate, getCalendarWeek, getDateRangeStatus } from "@/utils/date";
import { resolveRotation } from "@/features/rotations/utils";
import { RotationStatusBadge } from "@/features/rotations/RotationStatusBadge";

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
  const PAGE_SIZE = 12;

  const [filter, setFilter] = useState<HistoryFilter>("upcoming");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");

  const changeFilter = (newFilter: HistoryFilter) => {
    setFilter(newFilter);
    setVisibleCount(PAGE_SIZE);
  };

  const getTeamMemberName = useCallback(
    (teamMemberId: string) => {
      return (
        teamMembers.find((member) => member.id === teamMemberId)?.displayName ??
        "Unbekannt"
      );
    },
    [teamMembers],
  );

  const filteredRotations = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()
      .replace(/^kw\s*/, "");

    const filtered = rotations.filter((rotation) => {
      const matchesStatus =
        filter === "all" ||
        getDateRangeStatus(rotation.startDate, rotation.endDate) === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const resolution = resolveRotation(rotation, absences, substitutions);

      const assignedName = getTeamMemberName(
        resolution.assignedTeamMemberId,
      ).toLowerCase();

      const effectiveName = getTeamMemberName(
        resolution.effectiveTeamMemberId,
      ).toLowerCase();

      const calendarWeek = String(getCalendarWeek(rotation.startDate));

      return (
        assignedName.includes(normalizedSearch) ||
        effectiveName.includes(normalizedSearch) ||
        calendarWeek === normalizedSearch
      );
    });

    return filtered.sort((a, b) => {
      if (filter === "past") {
        return b.startDate.localeCompare(a.startDate);
      }

      return a.startDate.localeCompare(b.startDate);
    });
  }, [absences, filter, rotations, search, substitutions, getTeamMemberName]);

  const visibleRotations = filteredRotations.slice(0, visibleCount);

  const hasMore = visibleCount < filteredRotations.length;

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <div>
          <h2>{title}</h2>

          <p>Verlauf aller generierten Rotationsschritte.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.search}>
            <label
              htmlFor={`rotation-history-search-${title}`}
              className={styles.searchLabel}
            >
              History durchsuchen
            </label>

            <input
              id={`rotation-history-search-${title}`}
              type="search"
              value={search}
              placeholder="Name oder KW"
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>

          <div className={styles.filters} aria-label="History filtern">
            <button
              type="button"
              className={filter === "all" ? styles.activeFilter : styles.filter}
              onClick={() => changeFilter("all")}
            >
              Alle
            </button>

            <button
              type="button"
              className={
                filter === "past" ? styles.activeFilter : styles.filter
              }
              onClick={() => changeFilter("past")}
            >
              Vergangenheit
            </button>

            <button
              type="button"
              className={
                filter === "current" ? styles.activeFilter : styles.filter
              }
              onClick={() => changeFilter("current")}
            >
              Aktuell
            </button>

            <button
              type="button"
              className={
                filter === "upcoming" ? styles.activeFilter : styles.filter
              }
              onClick={() => changeFilter("upcoming")}
            >
              Zukunft
            </button>
          </div>
        </div>
      </div>

      {filteredRotations.length === 0 ? (
        <p>Für diesen Filter sind keine Rotationen vorhanden.</p>
      ) : (
        <div className={styles.list}>
          <p className={styles.resultCount}>
            {filteredRotations.length}{" "}
            {filteredRotations.length === 1 ? "Eintrag" : "Einträge"}
          </p>
          {visibleRotations.map((rotation) => {
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
                  <RotationStatusBadge
                    resolution={resolution}
                    effectiveTeamMemberName={
                      resolution.status === "substitution"
                        ? effectiveName
                        : undefined
                    }
                  />
                </div>
              </article>
            );
          })}
          {hasMore ? (
            <div className={styles.loadMore}>
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() =>
                  setVisibleCount((current) => current + PAGE_SIZE)
                }
              >
                Mehr anzeigen
              </button>

              <span>
                {visibleRotations.length} von {filteredRotations.length}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};
