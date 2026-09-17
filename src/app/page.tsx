import { absences, substitutions } from "@/features/absences/mockData";
import { deploymentRotations } from "@/features/deploymentRotation/mockData";
import { dispatcherRotations } from "@/features/dispatcherRotation/mockData";
import { resolveRotation } from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";
import { getTeamMemberName } from "@/features/team/utils";
import { WeekOverview } from "@/features/weekOverview/WeekOverview";
import { getCurrentRotation, isDateAfter, isDateInRange } from "@/utils/date";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { DashboardCard } from "@/components/DashboardCard/DashboardCard";
import { UpcomingAbsences } from "@/features/absences/UpcomingAbsences";

import styles from "./page.module.css";

export default function Home() {
  const currentDispatcher = getCurrentRotation(dispatcherRotations);

  const currentDeployment = getCurrentRotation(deploymentRotations);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
    : undefined;

  const currentAbsences = absences.filter((absence) =>
    isDateInRange(absence.startDate, absence.endDate),
  );

  const upcomingAbsences = absences
    .filter((absence) => isDateAfter(absence.startDate))
    .slice(0, 3);

  return (
    <section className={styles.dashboard}>
      <PageHeader
        eyebrow="Code Busters Hub"
        title="Teamübersicht"
        description="Alles Wichtige zu Abwesenheiten, Vertretungen und Rotationen auf einen Blick."
      />

      <div className={styles.grid}>
        <DashboardCard
          label="Dispatcher diese Woche"
          value={
            dispatcherResolution
              ? getTeamMemberName(
                  dispatcherResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"
          }
          status={
            dispatcherResolution?.status === "substitution" ||
            dispatcherResolution?.status === "uncovered"
              ? "warning"
              : "default"
          }
          description={
            dispatcherResolution?.status === "substitution" ? (
              <>
                Vertretung für{" "}
                {getTeamMemberName(
                  dispatcherResolution.assignedTeamMemberId,
                  teamMembers,
                )}
              </>
            ) : dispatcherResolution?.status === "uncovered" ? (
              <>Abwesend – keine Vertretung eingetragen</>
            ) : (
              <>Verantwortlich für Monitoring und New Relic.</>
            )
          }
        />

        <DashboardCard
          label="Deployment diese Woche"
          value={
            deploymentResolution
              ? getTeamMemberName(
                  deploymentResolution.effectiveTeamMemberId,
                  teamMembers,
                )
              : "Nicht eingeteilt"
          }
          status={
            deploymentResolution?.status === "substitution" ||
            deploymentResolution?.status === "uncovered"
              ? "warning"
              : "default"
          }
          description={
            deploymentResolution?.status === "substitution" ? (
              <>
                Vertretung für{" "}
                {getTeamMemberName(
                  deploymentResolution.assignedTeamMemberId,
                  teamMembers,
                )}
              </>
            ) : deploymentResolution?.status === "uncovered" ? (
              <>Abwesend – keine Vertretung eingetragen</>
            ) : (
              <>Zuständig für die aktuelle Deployment-Rotation.</>
            )
          }
        />

        <DashboardCard
          label="Heute abwesend"
          value={currentAbsences.length}
          description={
            currentAbsences.length === 0
              ? "Heute sind keine Abwesenheiten eingetragen."
              : currentAbsences
                  .map((absence) =>
                    getTeamMemberName(absence.teamMemberId, teamMembers),
                  )
                  .join(", ")
          }
        />
      </div>

      <WeekOverview
        absences={absences}
        substitutions={substitutions}
        teamMembers={teamMembers}
        dispatcherRotations={dispatcherRotations}
        deploymentRotations={deploymentRotations}
      />

      <UpcomingAbsences absences={upcomingAbsences} teamMembers={teamMembers} />
    </section>
  );
}
