import Link from "next/link";

import { formatDate } from "@/utils/date";

import styles from "./VacationHandovers.module.css";

export interface VacationHandoverDashboardItem {
  absenceId: string;

  vacationerName: string;

  startDate: string;
  endDate: string;

  hasHandover: boolean;

  taskCount: number;

  emergencyContact?: string;
  nextStep?: string;
  knownRisks?: string;
  deploymentPlan?: string;
}

interface VacationHandoversProps {
  items: VacationHandoverDashboardItem[];
}

export const VacationHandovers = ({ items }: VacationHandoversProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Meine Urlaubsvertretungen</h2>

          <p>
            Die wichtigsten Informationen für Urlaube, bei denen du als
            Vertretung eingetragen bist.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Aktuell stehen keine Urlaubsvertretungen für dich an.
        </p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.absenceId} className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <span>Urlaubsvertretung für</span>

                  <strong>{item.vacationerName}</strong>
                </div>

                <span
                  className={
                    item.hasHandover ? styles.readyBadge : styles.missingBadge
                  }
                >
                  {item.hasHandover ? "Übergabe vorhanden" : "Übergabe fehlt"}
                </span>
              </header>

              <div className={styles.period}>
                {formatDate(item.startDate)}
                {" – "}
                {formatDate(item.endDate)}
              </div>

              {item.hasHandover ? (
                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span>Offene Aufgaben</span>

                    <strong>{item.taskCount}</strong>
                  </div>

                  <div className={styles.detail}>
                    <span>Kontakt im Notfall</span>

                    <strong>
                      {item.emergencyContact ?? "Nicht angegeben"}
                    </strong>
                  </div>

                  {item.nextStep ? (
                    <div className={styles.highlight}>
                      <span>Nächster wichtiger Schritt</span>

                      <strong>{item.nextStep}</strong>
                    </div>
                  ) : null}

                  {item.knownRisks ? (
                    <div className={styles.warning}>
                      <span>Bekannte Risiken / Probleme</span>

                      <p>{item.knownRisks}</p>
                    </div>
                  ) : null}

                  {item.deploymentPlan ? (
                    <div className={styles.info}>
                      <span>Deploy-Plan</span>

                      <p>{item.deploymentPlan}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className={styles.noHandover}>
                  Für diesen Urlaub wurde noch keine Übergabe eingetragen.
                </p>
              )}

              <div className={styles.actions}>
                <Link
                  href={`/absences/${item.absenceId}/handover`}
                  className={styles.link}
                >
                  Übergabe ansehen
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

VacationHandovers.displayName = "VacationHandovers";
