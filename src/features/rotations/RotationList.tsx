import type {
  Absence,
  RotationAssignment,
  Substitution,
  TeamMember,
} from "@/types/team";

import { formatDate, getCalendarWeek } from "@/utils/date";

import {
  getRotationAssigneeName,
  isT2TeamRotation,
  resolveRotation,
} from "./utils";

import { RotationStatusBadge } from "./RotationStatusBadge";

import styles from "./RotationList.module.css";

interface RotationListProps {
  title: string;
  description: string;
  rotations: RotationAssignment[];
  absences: Absence[];
  substitutions: Substitution[];
  teamMembers: TeamMember[];
}

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

export const RotationList = ({
  title,
  description,
  rotations,
  absences,
  substitutions,
  teamMembers,
}: RotationListProps) => {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2>{title}</h2>

        <p>{description}</p>
      </header>

      <div className={styles.list}>
        {rotations.map((rotation) => {
          const resolution = resolveRotation(rotation, absences, substitutions);

          const assignedTeamMemberName = getRotationAssigneeName(
            resolution.assignedTeamMemberId,
            teamMembers,
          );

          const effectiveTeamMemberName = getRotationAssigneeName(
            resolution.effectiveTeamMemberId,
            teamMembers,
          );

          const isDeployment = rotation.type === "deployment";

          const isT2 = isT2TeamRotation(rotation);

          const cardClassName = [
            styles.card,

            resolution.status === "substitution" ? styles.cardSubstitution : "",

            resolution.status === "uncovered" ? styles.cardWarning : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={rotation.id} className={cardClassName}>
              <div className={styles.week}>
                <span>KW</span>

                <strong>{getCalendarWeek(rotation.startDate)}</strong>

                {isDeployment ? (
                  <small>{getDeploymentKindLabel(rotation)}</small>
                ) : (
                  <small>Dispatcher</small>
                )}
              </div>

              <div className={styles.person}>
                <span>Eingeteilt</span>

                <strong>{assignedTeamMemberName}</strong>

                {isT2 ? (
                  <span>Externes Team</span>
                ) : (
                  <RotationStatusBadge
                    resolution={resolution}
                    effectiveTeamMemberName={
                      resolution.status === "substitution"
                        ? effectiveTeamMemberName
                        : undefined
                    }
                  />
                )}
              </div>

              <div className={styles.period}>
                <span>{isDeployment ? "Deployment-Termin" : "Zeitraum"}</span>

                <strong>
                  {isDeployment
                    ? formatDate(rotation.startDate)
                    : `${formatDate(rotation.startDate)} – ${formatDate(
                        rotation.endDate,
                      )}`}
                </strong>

                {rotation.deploymentKind === "rescheduled" &&
                rotation.originalDate ? (
                  <small>
                    Ursprünglicher Termin: {formatDate(rotation.originalDate)}
                  </small>
                ) : null}

                {rotation.reason ? (
                  <small>Hinweis: {rotation.reason}</small>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

RotationList.displayName = "RotationList";
