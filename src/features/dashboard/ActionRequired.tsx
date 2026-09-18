import Link from "next/link";

import styles from "./ActionRequired.module.css";

export interface ActionRequiredItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
  href?: string;
  actionLabel?: string;
}

interface ActionRequiredProps {
  items: ActionRequiredItem[];
}

export const ActionRequired = ({ items }: ActionRequiredProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2>Handlungsbedarf</h2>

          <p>
            Themen, bei denen aktuell noch etwas geklärt oder ergänzt werden
            sollte.
          </p>
        </div>

        <span
          className={
            items.length > 0 ? styles.countWarning : styles.countSuccess
          }
        >
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className={styles.success}>
          <strong>Aktuell kein Handlungsbedarf</strong>

          <p>
            Für die relevanten Rotationen und deine kommenden Urlaube ist
            derzeit alles vorbereitet.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.id} className={styles.item}>
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.warningIcon} aria-hidden="true">
                    !
                  </span>

                  <strong>{item.title}</strong>
                </div>

                <p>{item.description}</p>

                {item.meta ? (
                  <span className={styles.meta}>{item.meta}</span>
                ) : null}
              </div>

              {item.href ? (
                <Link href={item.href} className={styles.link}>
                  {item.actionLabel ?? "Ansehen"}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

ActionRequired.displayName = "ActionRequired";
