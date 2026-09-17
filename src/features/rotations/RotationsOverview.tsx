"use client";

import { useMemo, useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";
import { isDateInRange, parseDate } from "@/utils/date";

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

const getRotationStatus = (
  rotation: RotationAssignment,
): Exclude<RotationStatusFilter, "all"> => {
  const today = new Date();

  if (isDateInRange(rotation.startDate, rotation.endDate, today)) {
    return "current";
  }

  if (parseDate(rotation.startDate) > today) {
    return "upcoming";
  }

  return "past";
};

export const RotationsOverview = ({
  dispatcherRotations,
  deploymentRotations,
  absences,
  substitutions,
  teamMembers,
}: RotationsOverviewProps) => {
  const [typeFilter, setTypeFilter] = useState<RotationTypeFilter>("all");

  const [statusFilter, setStatusFilter] = useState<RotationStatusFilter>("all");

  const filteredDispatcherRotations = useMemo(() => {
    if (typeFilter === "deployment") {
      return [];
    }

    return dispatcherRotations.filter(
      (rotation) =>
        statusFilter === "all" || getRotationStatus(rotation) === statusFilter,
    );
  }, [dispatcherRotations, statusFilter, typeFilter]);

  const filteredDeploymentRotations = useMemo(() => {
    if (typeFilter === "dispatcher") {
      return [];
    }

    return deploymentRotations.filter(
      (rotation) =>
        statusFilter === "all" || getRotationStatus(rotation) === statusFilter,
    );
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
            <button
              type="button"
              className={
                typeFilter === "all" ? styles.activeFilter : styles.filter
              }
              onClick={() => setTypeFilter("all")}
            >
              Alle
            </button>

            <button
              type="button"
              className={
                typeFilter === "dispatcher"
                  ? styles.activeFilter
                  : styles.filter
              }
              onClick={() => setTypeFilter("dispatcher")}
            >
              Dispatcher
            </button>

            <button
              type="button"
              className={
                typeFilter === "deployment"
                  ? styles.activeFilter
                  : styles.filter
              }
              onClick={() => setTypeFilter("deployment")}
            >
              Deployment
            </button>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>

          <div className={styles.filters} aria-label="Rotationsstatus filtern">
            <button
              type="button"
              className={
                statusFilter === "all" ? styles.activeFilter : styles.filter
              }
              onClick={() => setStatusFilter("all")}
            >
              Alle
            </button>

            <button
              type="button"
              className={
                statusFilter === "current" ? styles.activeFilter : styles.filter
              }
              onClick={() => setStatusFilter("current")}
            >
              Aktuell
            </button>

            <button
              type="button"
              className={
                statusFilter === "upcoming"
                  ? styles.activeFilter
                  : styles.filter
              }
              onClick={() => setStatusFilter("upcoming")}
            >
              Kommend
            </button>

            <button
              type="button"
              className={
                statusFilter === "past" ? styles.activeFilter : styles.filter
              }
              onClick={() => setStatusFilter("past")}
            >
              Vergangen
            </button>
          </div>
        </div>
      </div>

      <span className={styles.resultCount}>
        {resultCount} von {totalCount} Rotationen
      </span>

      {resultCount === 0 ? (
        <p className={styles.empty}>
          Keine Rotationen für diese Filterkombination vorhanden.
        </p>
      ) : (
        <div className={styles.results}>
          {filteredDispatcherRotations.length > 0 && (
            <RotationList
              title="Dispatcher"
              description="Wöchentliche Verantwortung für Monitoring und New Relic."
              rotations={filteredDispatcherRotations}
              absences={absences}
              substitutions={substitutions}
              teamMembers={teamMembers}
            />
          )}

          {filteredDeploymentRotations.length > 0 && (
            <RotationList
              title="Deployment"
              description="Wöchentliche Verantwortung für Deployments."
              rotations={filteredDeploymentRotations}
              absences={absences}
              substitutions={substitutions}
              teamMembers={teamMembers}
            />
          )}
        </div>
      )}
    </div>
  );
};

RotationsOverview.displayName = "RotationsOverview";
