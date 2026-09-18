"use client";

import { useMemo } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { getDateRangeStatus } from "@/utils/date";

import { RotationList } from "./RotationList";

import styles from "./RotationsOverview.module.css";

type RotationTypeFilter = "all" | "dispatcher" | "deployment";

type RotationStatusFilter = "all" | "current" | "upcoming" | "past";

interface RotationsOverviewProps {
  dispatcherRotations: RotationAssignment[];
  deploymentRotations: RotationAssignment[];
  absences: Absence[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
}

const isRotationTypeFilter = (
  value: string | null,
): value is RotationTypeFilter => {
  return value === "all" || value === "dispatcher" || value === "deployment";
};

const isRotationStatusFilter = (
  value: string | null,
): value is RotationStatusFilter => {
  return (
    value === "all" ||
    value === "current" ||
    value === "upcoming" ||
    value === "past"
  );
};

const sortRotations = (
  rotations: RotationAssignment[],
  statusFilter: RotationStatusFilter,
) => {
  return [...rotations].sort((first, second) => {
    if (statusFilter === "past") {
      return second.startDate.localeCompare(first.startDate);
    }

    return first.startDate.localeCompare(second.startDate);
  });
};

export const RotationsOverview = ({
  dispatcherRotations,
  deploymentRotations,
  absences,
  substitutions,
  teamMembers,
}: RotationsOverviewProps) => {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type");

  const statusParam = searchParams.get("status");

  const typeFilter: RotationTypeFilter = isRotationTypeFilter(typeParam)
    ? typeParam
    : "all";

  const statusFilter: RotationStatusFilter = isRotationStatusFilter(statusParam)
    ? statusParam
    : "all";

  const updateFilters = (values: {
    type?: RotationTypeFilter;
    status?: RotationStatusFilter;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (values.type !== undefined) {
      if (values.type === "all") {
        params.delete("type");
      } else {
        params.set("type", values.type);
      }
    }

    if (values.status !== undefined) {
      if (values.status === "all") {
        params.delete("status");
      } else {
        params.set("status", values.status);
      }
    }

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const filteredDispatcherRotations = useMemo(() => {
    if (typeFilter === "deployment") {
      return [];
    }

    const filtered = dispatcherRotations.filter(
      (rotation) =>
        statusFilter === "all" ||
        getDateRangeStatus(rotation.startDate, rotation.endDate) ===
          statusFilter,
    );

    return sortRotations(filtered, statusFilter);
  }, [dispatcherRotations, statusFilter, typeFilter]);

  const filteredDeploymentRotations = useMemo(() => {
    if (typeFilter === "dispatcher") {
      return [];
    }

    const filtered = deploymentRotations.filter(
      (rotation) =>
        statusFilter === "all" ||
        getDateRangeStatus(rotation.startDate, rotation.endDate) ===
          statusFilter,
    );

    return sortRotations(filtered, statusFilter);
  }, [deploymentRotations, statusFilter, typeFilter]);

  const resultCount =
    filteredDispatcherRotations.length + filteredDeploymentRotations.length;

  const totalCount = dispatcherRotations.length + deploymentRotations.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.filterGroups}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Typ</span>

          <div className={styles.filters} aria-label="Rotationstyp filtern">
            {(
              [
                ["all", "Alle"],
                ["dispatcher", "Dispatcher"],
                ["deployment", "Deployment"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  typeFilter === value ? styles.activeFilter : styles.filter
                }
                aria-pressed={typeFilter === value}
                onClick={() =>
                  updateFilters({
                    type: value,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>

          <div className={styles.filters} aria-label="Rotationsstatus filtern">
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
                className={
                  statusFilter === value ? styles.activeFilter : styles.filter
                }
                aria-pressed={statusFilter === value}
                onClick={() =>
                  updateFilters({
                    status: value,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <span className={styles.resultCount} aria-live="polite">
        {resultCount} von {totalCount}{" "}
        {totalCount === 1 ? "Rotation" : "Rotationen"}
      </span>

      {resultCount === 0 ? (
        <p className={styles.empty}>
          Keine Rotationen für diese Filterkombination vorhanden.
        </p>
      ) : (
        <div className={styles.results}>
          {filteredDispatcherRotations.length > 0 ? (
            <RotationList
              title="Dispatcher"
              description="Wöchentliche Verantwortung für Monitoring und New Relic."
              rotations={filteredDispatcherRotations}
              absences={absences}
              substitutions={substitutions}
              teamMembers={teamMembers}
            />
          ) : null}

          {filteredDeploymentRotations.length > 0 ? (
            <RotationList
              title="Deployment"
              description="Alle zwei Wochen findet ein Deployment statt. T2 Team und Code Busters wechseln sich ab; bei den Code Busters rotiert die zuständige Person weiter."
              rotations={filteredDeploymentRotations}
              absences={absences}
              substitutions={substitutions}
              teamMembers={teamMembers}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

RotationsOverview.displayName = "RotationsOverview";
