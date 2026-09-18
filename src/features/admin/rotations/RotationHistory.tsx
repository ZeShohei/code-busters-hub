"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { formatDate, getCalendarWeek, getDateRangeStatus } from "@/utils/date";

import {
  getRotationAssigneeName,
  isT2TeamRotation,
  resolveRotation,
} from "@/features/rotations/utils";

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

const PAGE_SIZE = 12;

const getDeploymentKindLabel = (rotation: RotationAssignment) => {
  switch (rotation.deploymentKind) {
    case "special":
      return "Sonderdeployment";

    case "rescheduled":
      return "Verschobenes Deployment";

    default:
      return "Reguläres Deployment";
  }
};

export const RotationHistory = ({
  title,
  rotations,
  teamMembers,
  absences,
  substitutions,
}: RotationHistoryProps) => {
  const [filter, setFilter] = useState<HistoryFilter>("upcoming");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [search, setSearch] = useState("");

  const isDeploymentHistory = rotations.some(
    (rotation) => rotation.type === "deployment",
  );

  const changeFilter = (newFilter: HistoryFilter) => {
    setFilter(newFilter);
    setVisibleCount(PAGE_SIZE);
  };

  const getAssigneeName = useCallback(
    (teamMemberId: string) => {
      return getRotationAssigneeName(teamMemberId, teamMembers);
    },
    [teamMembers],
  );

  const filteredRotations = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()
      .replace(/^kw\s*/, "");

    const filtered = rotations.filter((rotation) => {
      const status = getDateRangeStatus(rotation.startDate, rotation.endDate);

      const matchesStatus = filter === "all" || status === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const resolution = resolveRotation(rotation, absences, substitutions);

      const assignedName = getAssigneeName(
        resolution.assignedTeamMemberId,
      ).toLowerCase();

      const effectiveName = getAssigneeName(
        resolution.effectiveTeamMemberId,
      ).toLowerCase();

      const calendarWeek = String(getCalendarWeek(rotation.startDate));

      const deploymentKind =
        rotation.type === "deployment"
          ? getDeploymentKindLabel(rotation).toLowerCase()
          : "";

      const reason = rotation.reason?.toLowerCase() ?? "";

      return (
        assignedName.includes(normalizedSearch) ||
        effectiveName.includes(normalizedSearch) ||
        calendarWeek === normalizedSearch ||
        deploymentKind.includes(normalizedSearch) ||
        reason.includes(normalizedSearch)
      );
    });

    return filtered.sort((first, second) => {
      if (filter === "past") {
        return second.startDate.localeCompare(first.startDate);
      }

      return first.startDate.localeCompare(second.startDate);
    });
  }, [absences, filter, rotations, search, substitutions, getAssigneeName]);

  const visibleRotations = filteredRotations.slice(0, visibleCount);

  const hasMore = visibleCount < filteredRotations.length;

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <div>
          <h2>{title}</h2>

          <p>
            {isDeploymentHistory
              ? "Vorschau und Verlauf der Deployment-Termine inklusive T2 Team, Verschiebungen und Sonderdeployments."
              : "Verlauf aller generierten Rotationsschritte."}
          </p>
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
              placeholder={
                isDeploymentHistory ? "Name, T2, KW oder Typ" : "Name oder KW"
              }
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

            const assignedName = getAssigneeName(
              resolution.assignedTeamMemberId,
            );

            const effectiveName = getAssigneeName(
              resolution.effectiveTeamMemberId,
            );

            const status = getDateRangeStatus(
              rotation.startDate,
              rotation.endDate,
            );

            const isDeployment = rotation.type === "deployment";

            const isT2 = isT2TeamRotation(rotation);

            return (
              <article key={rotation.id} className={styles.item}>
                <div className={styles.period}>
                  <strong>KW {getCalendarWeek(rotation.startDate)}</strong>

                  <span>
                    {isDeployment
                      ? formatDate(rotation.startDate)
                      : `${formatDate(rotation.startDate)} – ${formatDate(
                          rotation.endDate,
                        )}`}
                  </span>

                  {isDeployment ? (
                    <span>{getDeploymentKindLabel(rotation)}</span>
                  ) : null}

                  {rotation.deploymentKind === "rescheduled" &&
                  rotation.originalDate ? (
                    <span>
                      Ursprünglich: {formatDate(rotation.originalDate)}
                    </span>
                  ) : null}

                  {rotation.reason ? <span>{rotation.reason}</span> : null}

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

                  {isT2 ? (
                    <span className={styles.label}>Externes Team</span>
                  ) : null}
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

RotationHistory.displayName = "RotationHistory";
