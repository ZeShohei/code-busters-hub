import type { ReactNode } from "react";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Code Busters Hub</div>

        <nav className={styles.navigation}>
          <a href="/">Übersicht</a>
          <a href="/absences">Abwesenheiten</a>
          <a href="/rotations">Rotationen</a>
        </nav>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
};
