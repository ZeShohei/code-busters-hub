import type { RotationConfig, TeamMember } from "@/types/team";
import { formatDate } from "@/utils/date";

import styles from "./RotationConfigHistory.module.css";

interface RotationConfigHistoryProps {
  configs: RotationConfig[];
  teamMembers: TeamMember[];
}

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
                    <dt>Generierte Wochen</dt>

                    <dd>{config.numberOfWeeks}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
