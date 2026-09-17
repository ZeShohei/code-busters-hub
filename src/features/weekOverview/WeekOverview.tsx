"use client";

import { useState } from "react";

import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { resolveRotation } from "@/features/rotations/utils";
import { getTeamMemberName } from "@/features/team/utils";

import {
  addWeeks,
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
   * Für die Wochenrotation verwenden wir
   * den Montag der aktuell ausgewählten Woche.
   */
  const currentDispatcher = getCurrentRotation(dispatcherRotations, monday);

  const currentDeployment = getCurrentRotation(deploymentRotations, monday);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
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

          {dispatcherResolution?.status === "regular" && (
            <span className={styles.regular}>Regulär eingeteilt</span>
          )}

          {dispatcherResolution?.status === "substitution" && (
            <span className={styles.substitution}>
              Vertretung für{" "}
              {getTeamMemberName(
                dispatcherResolution.assignedTeamMemberId,
                teamMembers,
              )}
            </span>
          )}

          {dispatcherResolution?.status === "uncovered" && (
            <span className={styles.warning}>
              Abwesend – keine Vertretung eingetragen
            </span>
          )}
        </article>

        <article className={styles.rotation}>
          <span>Deployment</span>

          <strong>
            {deploymentResolution
              ? getTeamMemberName(
                  deploymentResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"}
          </strong>

          {deploymentResolution?.status === "regular" && (
            <span className={styles.regular}>Regulär eingeteilt</span>
          )}

          {deploymentResolution?.status === "substitution" && (
            <span className={styles.substitution}>
              Vertretung für{" "}
              {getTeamMemberName(
                deploymentResolution.assignedTeamMemberId,
                teamMembers,
              )}
            </span>
          )}

          {deploymentResolution?.status === "uncovered" && (
            <span className={styles.warning}>
              Abwesend – keine Vertretung eingetragen
            </span>
          )}
        </article>
      </div>

      <div className={styles.days}>
        {weekDays.map((day) => {
          const dayAbsences = absences.filter((absence) =>
            isDateInRange(absence.startDate, absence.endDate, day),
          );

          const isToday = isSameDay(day, today);

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
                {dayAbsences.length === 0 ? (
                  <p className={styles.noAbsences}>Keine Abwesenheiten</p>
                ) : (
                  dayAbsences.map((absence) => (
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
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

WeekOverview.displayName = "WeekOverview";
