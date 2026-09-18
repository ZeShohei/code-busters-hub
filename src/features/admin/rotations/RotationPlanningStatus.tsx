import type { RotationConfig } from "@/types/team";

import { addWeeks, formatDate, parseDate } from "@/utils/date";

import styles from "./RotationPlanningStatus.module.css";

interface RotationPlanningStatusProps {
  config: RotationConfig;
  title: string;
}

const WARNING_WEEKS = 12;

const toDateString = (date: Date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getRemainingWeeks = (endDate: Date) => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  endDate.setHours(0, 0, 0, 0);

  const difference = endDate.getTime() - today.getTime();

  return Math.ceil(difference / (7 * 24 * 60 * 60 * 1000));
};

export const RotationPlanningStatus = ({
  config,
  title,
}: RotationPlanningStatusProps) => {
  const startDate = parseDate(config.startDate);

  const endDate = addWeeks(startDate, config.numberOfWeeks);

  const remainingWeeks = getRemainingWeeks(new Date(endDate));

  const endDateString = toDateString(endDate);

  const isExpired = remainingWeeks <= 0;

  const isWarning = !isExpired && remainingWeeks <= WARNING_WEEKS;

  const status = isExpired ? "expired" : isWarning ? "warning" : "ok";

  return (
    <section className={`${styles.status} ${styles[status]}`}>
      <div>
        <span className={styles.label}>Planungsstatus</span>

        <strong>{title}</strong>
      </div>

      <div className={styles.details}>
        <span>
          Geplant bis <strong>{formatDate(endDateString)}</strong>
        </span>

        {isExpired ? (
          <p>
            Der Planungszeitraum ist abgelaufen. Bitte lege eine neue
            Rotationskonfiguration an.
          </p>
        ) : isWarning ? (
          <p>
            Der Planungszeitraum endet in ungefähr{" "}
            <strong>
              {remainingWeeks} {remainingWeeks === 1 ? "Woche" : "Wochen"}
            </strong>
            . Plane rechtzeitig die nächste Version.
          </p>
        ) : (
          <p>
            Noch ungefähr <strong>{remainingWeeks} Wochen</strong> geplant.
          </p>
        )}
      </div>
    </section>
  );
};

RotationPlanningStatus.displayName = "RotationPlanningStatus";
