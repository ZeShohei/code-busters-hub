import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
}: PageHeaderProps) => {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}

      <h1>{title}</h1>

      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
};

PageHeader.displayName = "PageHeader";
