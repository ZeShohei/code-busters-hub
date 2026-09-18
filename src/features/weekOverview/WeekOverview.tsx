"use client";

import { useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { resolveRotation } from "@/features/rotations/utils";
import { RotationStatusBadge } from "@/features/rotations/RotationStatusBadge";
import { getTeamMemberName } from "@/features/team/utils";

import {
  addWeeks,
  formatDate,
  formatDayMonth,
  formatWeekDay,
  formatWeekRange,
  getCurrentRotation,
  getWeekDays,
  isDateInRange,
  isSameDay,
} from "@/utils/date";

import styles from "./WeekOverview.module.css";

interface WeekOverviewProps {
  absences: Absence[];
  deploymentRotations: RotationAssignment[];
  dispatcherRotations: RotationAssignment[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
}

const toDateString = (date: Date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDeploymentKindLabel = (rotation: RotationAssignment) => {
  switch (rotation.deploymentKind) {
    case "special":
      return "Sonderdeployment";

    case "rescheduled":
      return "Verschoben";

    default:
      return "Deployment";
  }
};

export const WeekOverview = ({
  absences,
  deploymentRotations,
  dispatcherRotations,
  substitutions,
  teamMembers,
}: WeekOverviewProps) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const today = new Date();

  const weekDays = getWeekDays(selectedDate);

  const monday = weekDays[0];
  const friday = weekDays[weekDays.length - 1];

  /*
   * Dispatcher bleibt eine klassische
   * Wochenrotation.
   */
  const currentDispatcher = getCurrentRotation(dispatcherRotations, monday);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const handlePreviousWeek = () => {
    setSelectedDate((currentDate) => addWeeks(currentDate, -1));
  };

  const handleNextWeek = () => {
    setSelectedDate((currentDate) => addWeeks(currentDate, 1));
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  const currentWeekDays = getWeekDays(today);

  const isCurrentWeek = isSameDay(monday, currentWeekDays[0]);

  return (
    <section className={styles.weekOverview}>
      <header className={styles.header}>
        <div>
          <h2>Wochenübersicht</h2>

          <p>{formatWeekRange(monday, friday)}</p>
        </div>

        <div className={styles.navigation} aria-label="Wochennavigation">
          <button
            type="button"
            className={styles.navigationButton}
            onClick={handlePreviousWeek}
          >
            ← Vorige Woche
          </button>

          <button
            type="button"
            className={styles.navigationButton}
            onClick={handleCurrentWeek}
            disabled={isCurrentWeek}
          >
            Heute
          </button>

          <button
            type="button"
            className={styles.navigationButton}
            onClick={handleNextWeek}
          >
            Nächste Woche →
          </button>
        </div>
      </header>

      <div className={styles.rotationOverview}>
        <article className={styles.rotation}>
          <span>Dispatcher</span>

          <strong>
            {dispatcherResolution
              ? getTeamMemberName(
                  dispatcherResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"}
          </strong>

          {dispatcherResolution ? (
            <RotationStatusBadge
              resolution={dispatcherResolution}
              effectiveTeamMemberName={
                dispatcherResolution.status === "substitution"
                  ? getTeamMemberName(
                      dispatcherResolution.effectiveTeamMemberId,
                      teamMembers,
                    )
                  : undefined
              }
            />
          ) : null}
        </article>

        <article className={styles.rotationInfo}>
          <span>Deployments</span>

          <strong>Am jeweiligen Tag</strong>

          <p>
            Reguläre Deployments finden alle zwei Wochen am Donnerstag statt.
            Verschiebungen und Sonderdeployments werden am tatsächlichen Termin
            angezeigt.
          </p>
        </article>
      </div>

      <div className={styles.days}>
        {weekDays.map((day) => {
          const dayString = toDateString(day);

          const dayAbsences = absences.filter((absence) =>
            isDateInRange(absence.startDate, absence.endDate, day),
          );

          const dayDeployments = deploymentRotations
            .filter((rotation) => rotation.startDate === dayString)
            .sort((first, second) =>
              first.startDate.localeCompare(second.startDate),
            );

          const isToday = isSameDay(day, today);

          const hasContent =
            dayAbsences.length > 0 || dayDeployments.length > 0;

          return (
            <article
              key={day.toISOString()}
              className={`${styles.day} ${isToday ? styles.today : ""}`}
            >
              <header className={styles.dayHeader}>
                <strong>{formatWeekDay(day)}</strong>

                <span>{formatDayMonth(day)}</span>
              </header>

              <div className={styles.dayContent}>
                {dayDeployments.map((rotation) => {
                  const resolution = resolveRotation(
                    rotation,
                    absences,
                    substitutions,
                  );

                  const assignedName = getTeamMemberName(
                    resolution.assignedTeamMemberId,
                    teamMembers,
                  );

                  const effectiveName = getTeamMemberName(
                    resolution.effectiveTeamMemberId,
                    teamMembers,
                  );

                  return (
                    <div key={rotation.id} className={styles.deployment}>
                      <div className={styles.deploymentHeader}>
                        <strong>{getDeploymentKindLabel(rotation)}</strong>

                        <span>{effectiveName}</span>
                      </div>

                      <RotationStatusBadge
                        resolution={resolution}
                        effectiveTeamMemberName={
                          resolution.status === "substitution"
                            ? effectiveName
                            : undefined
                        }
                      />

                      {resolution.status === "substitution" ? (
                        <span className={styles.deploymentMeta}>
                          Vertretung für {assignedName}
                        </span>
                      ) : null}

                      {resolution.status === "uncovered" ? (
                        <span className={styles.deploymentWarning}>
                          {assignedName} ist abwesend und es ist keine
                          Vertretung eingetragen.
                        </span>
                      ) : null}

                      {rotation.deploymentKind === "rescheduled" &&
                      rotation.originalDate ? (
                        <span className={styles.deploymentMeta}>
                          Ursprünglich {formatDate(rotation.originalDate)}
                        </span>
                      ) : null}

                      {rotation.reason ? (
                        <span className={styles.deploymentMeta}>
                          {rotation.reason}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {dayAbsences.map((absence) => (
                  <div key={absence.id} className={styles.absence}>
                    <strong>
                      {getTeamMemberName(absence.teamMemberId, teamMembers)}
                    </strong>

                    <span>
                      {absence.type === "vacation"
                        ? "Urlaub"
                        : absence.type === "sickLeave"
                          ? "Krankenstand"
                          : "Abwesend"}
                    </span>
                  </div>
                ))}

                {!hasContent ? (
                  <p className={styles.noEntries}>Keine Einträge</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

WeekOverview.displayName = "WeekOverview";
