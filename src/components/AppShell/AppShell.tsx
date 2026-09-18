import type { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar/Sidebar";

import type { CurrentUser } from "@/lib/auth";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
  currentUser: CurrentUser;
}

export const AppShell = ({ children, currentUser }: AppShellProps) => {
  return (
    <div className={styles.appShell}>
      <Sidebar currentUser={currentUser} />

      <main className={styles.content}>{children}</main>
    </div>
  );
};

AppShell.displayName = "AppShell";
