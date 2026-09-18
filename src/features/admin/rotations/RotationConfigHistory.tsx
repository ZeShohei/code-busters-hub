import type { RotationConfig, TeamMember } from "@/types/team";

import { formatDate, parseDate } from "@/utils/date";

import styles from "./RotationConfigHistory.module.css";

interface RotationConfigHistoryProps {
  configs: RotationConfig[];
  teamMembers: TeamMember[];
}

const getThursdayOnOrAfter = (dateString: string) => {
  const date = parseDate(dateString);

  const currentDay = date.getDay();

  const thursday = 4;

  const daysUntilThursday = (thursday - currentDay + 7) % 7;

  date.setDate(date.getDate() + daysUntilThursday);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const RotationConfigHistory = ({
  configs,
  teamMembers,
}: RotationConfigHistoryProps) => {
  const getTeamMemberName = (teamMemberId: string) => {
    return (
      teamMembers.find((member) => member.id === teamMemberId)?.displayName ??
      "Unbekannt"
    );
  };

  const sortedConfigs = [...configs].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <h3>Versionshistorie</h3>

        <p>
          Frühere Konfigurationen bleiben erhalten und werden nicht durch neue
          Versionen überschrieben.
        </p>
      </div>

      {sortedConfigs.length === 0 ? (
        <p>Noch keine Konfiguration vorhanden.</p>
      ) : (
        <div className={styles.list}>
          {sortedConfigs.map((config, index) => {
            const startMemberId =
              config.participantTeamMemberIds[config.startIndex];

            const isDeployment = config.type === "deployment";

            const firstDeploymentDate = isDeployment
              ? getThursdayOnOrAfter(config.startDate)
              : undefined;

            return (
              <article
                key={`${config.type}-${config.startDate}`}
                className={styles.item}
              >
                <div className={styles.itemHeader}>
                  <div>
                    <span className={styles.label}>Gültig ab</span>

                    <strong>{formatDate(config.startDate)}</strong>
                  </div>

                  {index === 0 ? (
                    <span className={styles.latest}>Neueste Version</span>
                  ) : null}
                </div>

                <dl className={styles.details}>
                  <div>
                    <dt>Reihenfolge</dt>

                    <dd>
                      {config.participantTeamMemberIds
                        .map(getTeamMemberName)
                        .join(" → ")}
                    </dd>
                  </div>

                  <div>
                    <dt>Erste Person</dt>

                    <dd>
                      {startMemberId ? getTeamMemberName(startMemberId) : "–"}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      {isDeployment ? "Planungszeitraum" : "Generierte Wochen"}
                    </dt>

                    <dd>
                      {config.numberOfWeeks}{" "}
                      {config.numberOfWeeks === 1 ? "Woche" : "Wochen"}
                    </dd>
                  </div>

                  {isDeployment && firstDeploymentDate ? (
                    <div>
                      <dt>Erster regulärer Deployment-Termin</dt>

                      <dd>{formatDate(firstDeploymentDate)}</dd>
                    </div>
                  ) : null}

                  {isDeployment ? (
                    <div>
                      <dt>Rhythmus</dt>

                      <dd>Donnerstag, alle 14 Tage</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

RotationConfigHistory.displayName = "RotationConfigHistory";
