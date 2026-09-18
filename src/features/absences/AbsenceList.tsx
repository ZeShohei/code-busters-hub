"use client";

import Link from "next/link";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useMemo, useState } from "react";

import type { Absence, Substitution, TeamMember } from "@/types/team";

import { getTeamMemberName } from "@/features/team/utils";

import {
  formatDate,
  getDateRangeStatus,
  getDateRangeStatusLabel,
} from "@/utils/date";

import { cancelOwnAbsence } from "./actions";

import styles from "./AbsenceList.module.css";

type AbsenceFilter = "all" | "current" | "upcoming" | "past";

interface AbsenceListProps {
  absences: Absence[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

const isAbsenceFilter = (value: string | null): value is AbsenceFilter => {
  return (
    value === "all" ||
    value === "current" ||
    value === "upcoming" ||
    value === "past"
  );
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
  currentUserId,
}: AbsenceListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cancellingAbsenceId, setCancellingAbsenceId] = useState<string>();

  const [actionError, setActionError] = useState<string>();

  const statusParam = searchParams.get("status");

  const filter: AbsenceFilter = isAbsenceFilter(statusParam)
    ? statusParam
    : "all";

  const searchTerm = searchParams.get("q") ?? "";

  const updateSearchParams = (values: {
    status?: AbsenceFilter;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (values.status !== undefined) {
      if (values.status === "all") {
        params.delete("status");
      } else {
        params.set("status", values.status);
      }
    }

    if (values.q !== undefined) {
      const searchValue = values.q.trim();

      if (searchValue) {
        params.set("q", values.q);
      } else {
        params.delete("q");
      }
    }

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleCancelAbsence = async (absenceId: string) => {
    const confirmed = window.confirm(
      "Möchtest du diese Abwesenheit wirklich stornieren?",
    );

    if (!confirmed) {
      return;
    }

    setActionError(undefined);
    setCancellingAbsenceId(absenceId);

    try {
      const result = await cancelOwnAbsence(absenceId);

      if (!result.success) {
        setActionError(
          result.error ?? "Die Abwesenheit konnte nicht storniert werden.",
        );

        return;
      }

      router.refresh();
    } finally {
      setCancellingAbsenceId(undefined);
    }
  };

  const filteredAbsences = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return absences.filter((absence) => {
      const matchesStatus =
        filter === "all" ||
        getDateRangeStatus(absence.startDate, absence.endDate) === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const teamMember = teamMembers.find(
        (member) => member.id === absence.teamMemberId,
      );

      if (!teamMember) {
        return false;
      }

      return (
        teamMember.displayName.toLowerCase().includes(normalizedSearchTerm) ||
        teamMember.email.toLowerCase().includes(normalizedSearchTerm)
      );
    });
  }, [absences, filter, searchTerm, teamMembers]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <label htmlFor="absence-search" className={styles.searchLabel}>
            Abwesenheiten durchsuchen
          </label>

          <input
            id="absence-search"
            type="search"
            value={searchTerm}
            onChange={(event) =>
              updateSearchParams({
                q: event.target.value,
              })
            }
            placeholder="Name oder E-Mail suchen"
            className={styles.search}
          />
        </div>

        <div className={styles.filters} aria-label="Abwesenheiten filtern">
          {(
            [
              ["all", "Alle"],
              ["current", "Aktuell"],
              ["upcoming", "Kommend"],
              ["past", "Vergangen"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? styles.activeFilter : styles.filter}
              onClick={() =>
                updateSearchParams({
                  status: value,
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <span className={styles.resultCount}>
        {filteredAbsences.length} von {absences.length} Abwesenheiten
      </span>

      {actionError ? (
        <div className={styles.actionError} role="alert">
          {actionError}
        </div>
      ) : null}

      {filteredAbsences.length === 0 ? (
        <p className={styles.empty}>Keine passenden Abwesenheiten gefunden.</p>
      ) : (
        <div className={styles.list}>
          {filteredAbsences.map((absence) => {
            const status = getDateRangeStatus(
              absence.startDate,
              absence.endDate,
            );

            const substitution = substitutions.find(
              (item) => item.absenceId === absence.id,
            );

            const isOwnAbsence = absence.teamMemberId === currentUserId;

            const canManage = isOwnAbsence && status === "upcoming";

            const canManageHandover =
              isOwnAbsence && absence.type === "vacation" && status !== "past";

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
                    {getDateRangeStatusLabel(status)}
                  </strong>

                  {canManageHandover || canManage ? (
                    <div className={styles.itemActions}>
                      {canManageHandover ? (
                        <Link
                          href={`/absences/${absence.id}/handover`}
                          className={styles.editLink}
                        >
                          Übergabe
                        </Link>
                      ) : null}

                      {canManage ? (
                        <>
                          <Link
                            href={`/absences/${absence.id}/edit`}
                            className={styles.editLink}
                          >
                            Bearbeiten
                          </Link>

                          <button
                            type="button"
                            className={styles.cancelButton}
                            disabled={cancellingAbsenceId === absence.id}
                            onClick={() => handleCancelAbsence(absence.id)}
                          >
                            {cancellingAbsenceId === absence.id
                              ? "Storniert …"
                              : "Stornieren"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
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
