import Link from "next/link";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { getAppData } from "@/data/appData";

import { resolveRotation } from "@/features/rotations/utils";
import { getTeamMemberName } from "@/features/team/utils";

import { getCurrentRotation, getDateRangeStatus } from "@/utils/date";

import styles from "./page.module.css";

export default async function AdminPage() {
  const {
    teamMembers,
    absences,
    substitutions,
    dispatcherRotations,
    deploymentRotations,
  } = await getAppData();

  const activeTeamMembers = teamMembers.filter((member) => member.active);

  const currentAbsences = absences.filter(
    (absence) =>
      getDateRangeStatus(absence.startDate, absence.endDate) === "current",
  );

  const today = new Date();

  const currentDispatcher = getCurrentRotation(dispatcherRotations, today);

  const currentDeployment = getCurrentRotation(deploymentRotations, today);

  const dispatcherResolution = currentDispatcher
    ? resolveRotation(currentDispatcher, absences, substitutions)
    : undefined;

  const deploymentResolution = currentDeployment
    ? resolveRotation(currentDeployment, absences, substitutions)
    : undefined;

  const getRotationName = (
    resolution: typeof dispatcherResolution | undefined,
  ) => {
    if (!resolution) {
      return "Nicht eingeteilt";
    }

    if (resolution.status === "uncovered") {
      return "Nicht besetzt";
    }

    return getTeamMemberName(resolution.effectiveTeamMemberId, teamMembers);
  };

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Admin",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Admin-Bereich"
        description="Verwalte Teammitglieder, Abwesenheiten und Rotationen."
      />

      <section className={styles.summary} aria-labelledby="admin-summary">
        <h2 id="admin-summary" className={styles.sectionTitle}>
          Aktueller Status
        </h2>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Aktive Teammitglieder</span>

            <strong className={styles.summaryValue}>
              {activeTeamMembers.length}
            </strong>

            <span className={styles.summaryDescription}>
              von {teamMembers.length} insgesamt
            </span>
          </article>

          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Aktuell abwesend</span>

            <strong className={styles.summaryValue}>
              {currentAbsences.length}
            </strong>

            <span className={styles.summaryDescription}>
              {currentAbsences.length === 0
                ? "Niemand ist aktuell abwesend"
                : currentAbsences
                    .map((absence) =>
                      getTeamMemberName(absence.teamMemberId, teamMembers),
                    )
                    .join(", ")}
            </span>
          </article>

          <article
            className={`${styles.summaryCard} ${
              dispatcherResolution?.status === "uncovered"
                ? styles.summaryCardWarning
                : ""
            }`}
          >
            <span className={styles.summaryLabel}>Dispatcher</span>

            <strong className={styles.summaryName}>
              {getRotationName(dispatcherResolution)}
            </strong>

            <span className={styles.summaryDescription}>
              {!dispatcherResolution
                ? "Keine Rotation vorhanden"
                : dispatcherResolution.status === "regular"
                  ? "Regulär eingeteilt"
                  : dispatcherResolution.status === "substitution"
                    ? `Vertretung für ${getTeamMemberName(
                        dispatcherResolution.assignedTeamMemberId,
                        teamMembers,
                      )}`
                    : "Abwesend – keine Vertretung"}
            </span>
          </article>

          <article
            className={`${styles.summaryCard} ${
              deploymentResolution?.status === "uncovered"
                ? styles.summaryCardWarning
                : ""
            }`}
          >
            <span className={styles.summaryLabel}>Deployment</span>

            <strong className={styles.summaryName}>
              {getRotationName(deploymentResolution)}
            </strong>

            <span className={styles.summaryDescription}>
              {!deploymentResolution
                ? "Keine Rotation vorhanden"
                : deploymentResolution.status === "regular"
                  ? "Regulär eingeteilt"
                  : deploymentResolution.status === "substitution"
                    ? `Vertretung für ${getTeamMemberName(
                        deploymentResolution.assignedTeamMemberId,
                        teamMembers,
                      )}`
                    : "Abwesend – keine Vertretung"}
            </span>
          </article>
        </div>
      </section>

      <section className={styles.management} aria-labelledby="admin-management">
        <h2 id="admin-management" className={styles.sectionTitle}>
          Verwaltung
        </h2>

        <div className={styles.grid}>
          <Link href="/admin/team" className={styles.card}>
            <div>
              <h3>Team</h3>

              <p>Teammitglieder anlegen, bearbeiten oder deaktivieren.</p>
            </div>

            <span className={styles.cardMeta}>
              {activeTeamMembers.length} aktiv
            </span>
          </Link>

          <Link href="/admin/absences" className={styles.card}>
            <div>
              <h3>Abwesenheiten</h3>

              <p>Abwesenheiten und Vertretungen verwalten.</p>
            </div>

            <span className={styles.cardMeta}>
              {currentAbsences.length} aktuell
            </span>
          </Link>

          <Link href="/admin/rotations" className={styles.card}>
            <div>
              <h3>Rotationen</h3>

              <p>Dispatcher- und Deployment-Rotationen konfigurieren.</p>
            </div>

            <span className={styles.cardMeta}>2 Rotationen</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
