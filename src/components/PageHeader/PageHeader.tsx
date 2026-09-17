import type { ReactNode } from "react";

import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) => {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}

      <div className={styles.main}>
        <div className={styles.text}>
          <h1>{title}</h1>

          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>

        {children ? <div className={styles.content}>{children}</div> : null}
      </div>
    </header>
  );
};

PageHeader.displayName = "PageHeader";
