import type { ReactNode } from "react";

import styles from "./AppShell.module.css";
import Link from "next/link";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Code Busters Hub</div>

        <nav className={styles.navigation}>
          <Link href={"/"}>Übersicht</Link>
          <Link href="/absences">Abwesenheiten</Link>
          <Link href="/rotations">Rotationen</Link>
        </nav>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
};
