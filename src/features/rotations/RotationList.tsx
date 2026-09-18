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
      return "Verschoben";

    default:
      return null;
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

          const cardClassName = [
            styles.card,

            resolution.status === "substitution" ? styles.cardSubstitution : "",

            resolution.status === "uncovered" ? styles.cardWarning : "",
          ]
            .filter(Boolean)
            .join(" ");

          const deploymentKindLabel = getDeploymentKindLabel(rotation);

          return (
            <article key={rotation.id} className={cardClassName}>
              <div className={styles.week}>
                <span>KW</span>

                <strong>{getCalendarWeek(rotation.startDate)}</strong>

                {deploymentKindLabel ? (
                  <small>{deploymentKindLabel}</small>
                ) : null}
              </div>

              <div className={styles.person}>
                <span>Eingeteilt</span>

                <strong>{assignedTeamMemberName}</strong>

                {isT2TeamRotation(rotation) ? (
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
                <span>
                  {rotation.type === "deployment" ? "Termin" : "Zeitraum"}
                </span>

                <strong>
                  {rotation.type === "deployment"
                    ? formatDate(rotation.startDate)
                    : `${formatDate(rotation.startDate)} – ${formatDate(
                        rotation.endDate,
                      )}`}
                </strong>

                {rotation.deploymentKind === "rescheduled" &&
                rotation.originalDate ? (
                  <small>
                    Ursprünglich: {formatDate(rotation.originalDate)}
                  </small>
                ) : null}

                {rotation.reason ? <small>{rotation.reason}</small> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

RotationList.displayName = "RotationList";
