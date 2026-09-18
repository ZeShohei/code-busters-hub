"use client";

import Link from "next/link";

import { useMemo, useState } from "react";

import type {
  Absence,
  RotationAssignment,
  RotationResolution,
  TeamMember,
} from "@/types/team";

import { formatDate } from "@/utils/date";

import styles from "./TeamList.module.css";

interface DeploymentResolutionItem {
  rotation: RotationAssignment;
  resolution: RotationResolution;
}

interface TeamListProps {
  teamMembers: TeamMember[];
  absences: Absence[];
  dispatcherParticipantIds: string[];
  deploymentParticipantIds: string[];
  dispatcherResolution?: RotationResolution;
  deploymentResolutionsThisWeek: DeploymentResolutionItem[];
}

export const TeamList = ({
  teamMembers,
  absences,
  dispatcherParticipantIds,
  deploymentParticipantIds,
  dispatcherResolution,
  deploymentResolutionsThisWeek,
}: TeamListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeamMembers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return teamMembers;
    }

    return teamMembers.filter(
      (teamMember) =>
        teamMember.displayName.toLowerCase().includes(normalizedSearchTerm) ||
        teamMember.email.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [searchTerm, teamMembers]);

  const getCurrentAbsence = (teamMemberId: string) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return absences.find((absence) => {
      if (absence.teamMemberId !== teamMemberId) {
        return false;
      }

      const [startYear, startMonth, startDay] = absence.startDate
        .split("-")
        .map(Number);

      const [endYear, endMonth, endDay] = absence.endDate
        .split("-")
        .map(Number);

      const start = new Date(startYear, startMonth - 1, startDay);

      const end = new Date(endYear, endMonth - 1, endDay);

      return today >= start && today <= end;
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <label htmlFor="team-search" className={styles.searchLabel}>
          Team durchsuchen
        </label>

        <input
          id="team-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Name oder E-Mail suchen"
          className={styles.search}
        />

        <span className={styles.resultCount}>
          {filteredTeamMembers.length} von {teamMembers.length} Personen
        </span>
      </div>

      {filteredTeamMembers.length === 0 ? (
        <p className={styles.empty}>Keine Teammitglieder gefunden.</p>
      ) : (
        <div className={styles.teamList}>
          {filteredTeamMembers.map((teamMember) => {
            const currentAbsence = getCurrentAbsence(teamMember.id);

            const participatesInDispatcher = dispatcherParticipantIds.includes(
              teamMember.id,
            );

            const participatesInDeployment = deploymentParticipantIds.includes(
              teamMember.id,
            );

            const isEffectiveDispatcher =
              dispatcherResolution?.effectiveTeamMemberId === teamMember.id;

            const isAssignedDispatcher =
              dispatcherResolution?.assignedTeamMemberId === teamMember.id;

            const isSubstitutedDispatcher =
              dispatcherResolution?.status === "substitution" &&
              isAssignedDispatcher &&
              !isEffectiveDispatcher;

            /*
             * Ein Teammitglied kann innerhalb einer Woche
             * theoretisch für mehrere Deployments relevant sein,
             * z. B. regulär + Sonderdeployment.
             */
            const effectiveDeployments = deploymentResolutionsThisWeek.filter(
              ({ resolution }) =>
                resolution.effectiveTeamMemberId === teamMember.id,
            );

            const substitutedDeployments = deploymentResolutionsThisWeek.filter(
              ({ resolution }) =>
                resolution.status === "substitution" &&
                resolution.assignedTeamMemberId === teamMember.id &&
                resolution.effectiveTeamMemberId !== teamMember.id,
            );

            const regularDeployments = effectiveDeployments.filter(
              ({ resolution }) => resolution.status === "regular",
            );

            const deploymentSubstitutions = effectiveDeployments.filter(
              ({ resolution }) => resolution.status === "substitution",
            );

            const hasCurrentResponsibility =
              isEffectiveDispatcher ||
              effectiveDeployments.length > 0 ||
              isSubstitutedDispatcher ||
              substitutedDeployments.length > 0;

            return (
              <article key={teamMember.id} className={styles.teamMember}>
                <div className={styles.person}>
                  <div className={styles.avatar} aria-hidden="true">
                    {teamMember.firstName.charAt(0).toUpperCase()}

                    {teamMember.lastName.charAt(0).toUpperCase()}
                  </div>

                  <div className={styles.personDetails}>
                    <Link
                      href={`/team/${teamMember.id}`}
                      className={styles.personLink}
                    >
                      {teamMember.displayName}
                    </Link>

                    <a href={`mailto:${teamMember.email}`}>
                      {teamMember.email}
                    </a>
                  </div>
                </div>

                <div className={styles.statusSection}>
                  <span className={styles.label}>Status</span>

                  {currentAbsence ? (
                    <span className={`${styles.badge} ${styles.badgeAbsent}`}>
                      {currentAbsence.type === "vacation"
                        ? "Urlaub"
                        : currentAbsence.type === "sickLeave"
                          ? "Krankenstand"
                          : "Abwesend"}
                    </span>
                  ) : (
                    <span
                      className={`${styles.badge} ${styles.badgeAvailable}`}
                    >
                      Verfügbar
                    </span>
                  )}
                </div>

                <div className={styles.rotationSection}>
                  <span className={styles.label}>Rotationen</span>

                  <div className={styles.badges}>
                    {participatesInDispatcher ? (
                      <span className={styles.badge}>Dispatcher</span>
                    ) : null}

                    {participatesInDeployment ? (
                      <span className={styles.badge}>Deployment</span>
                    ) : null}

                    {!participatesInDispatcher && !participatesInDeployment ? (
                      <span className={styles.muted}>Keine Rotation</span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.currentSection}>
                  <span className={styles.label}>Diese Woche</span>

                  <div className={styles.badges}>
                    {isEffectiveDispatcher ? (
                      <span
                        className={`${styles.badge} ${
                          dispatcherResolution?.status === "substitution"
                            ? styles.badgeSubstitution
                            : styles.badgeCurrent
                        }`}
                      >
                        {dispatcherResolution?.status === "substitution"
                          ? "Dispatcher-Vertretung"
                          : "Dispatcher"}
                      </span>
                    ) : null}

                    {regularDeployments.map(({ rotation }) => (
                      <span
                        key={`deployment-regular-${rotation.id}`}
                        className={`${styles.badge} ${styles.badgeCurrent}`}
                      >
                        Deployment {formatDate(rotation.startDate)}
                      </span>
                    ))}

                    {deploymentSubstitutions.map(({ rotation }) => (
                      <span
                        key={`deployment-substitution-${rotation.id}`}
                        className={`${styles.badge} ${styles.badgeSubstitution}`}
                      >
                        Deployment-Vertretung {formatDate(rotation.startDate)}
                      </span>
                    ))}

                    {isSubstitutedDispatcher ? (
                      <span
                        className={`${styles.badge} ${styles.badgeReplaced}`}
                      >
                        Dispatcher vertreten
                      </span>
                    ) : null}

                    {substitutedDeployments.map(({ rotation }) => (
                      <span
                        key={`deployment-replaced-${rotation.id}`}
                        className={`${styles.badge} ${styles.badgeReplaced}`}
                      >
                        Deployment vertreten {formatDate(rotation.startDate)}
                      </span>
                    ))}

                    {!hasCurrentResponsibility ? (
                      <span className={styles.muted}>Keine Verantwortung</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

TeamList.displayName = "TeamList";
