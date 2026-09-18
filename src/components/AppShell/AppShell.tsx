import type { ReactNode } from "react";

import { Navigation } from "@/components/Navigation/Navigation";

import { LogoutButton } from "@/features/auth/LogoutButton";

import type { CurrentUser } from "@/lib/auth";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
  currentUser: CurrentUser;
}

export const AppShell = ({ children, currentUser }: AppShellProps) => {
  const isAdmin = currentUser.role === "admin";

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Code Busters Hub</div>

        <Navigation isAdmin={isAdmin} />

        <LogoutButton />
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
};

AppShell.displayName = "AppShell";
