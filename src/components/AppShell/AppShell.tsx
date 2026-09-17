import type { ReactNode } from "react";

import { Navigation } from "@/components/Navigation/Navigation";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Code Busters Hub</div>

        <Navigation />
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
};

AppShell.displayName = "AppShell";
