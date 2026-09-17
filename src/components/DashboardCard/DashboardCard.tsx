import type { ReactNode } from "react";

import styles from "./DashboardCard.module.css";

interface DashboardCardProps {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  status?: "default" | "warning";
}

export const DashboardCard = ({
  label,
  value,
  description,
  status = "default",
}: DashboardCardProps) => {
  return (
    <article
      className={`${styles.card} ${
        status === "warning" ? styles.warningCard : ""
      }`}
    >
      <span className={styles.label}>{label}</span>

      <strong className={styles.value}>{value}</strong>

      {description ? (
        <div
          className={status === "warning" ? styles.warning : styles.description}
        >
          {description}
        </div>
      ) : null}
    </article>
  );
};

DashboardCard.displayName = "DashboardCard";
