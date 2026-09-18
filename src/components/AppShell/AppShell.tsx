import type { ReactNode } from "react";

import { Navigation } from "@/components/Navigation/Navigation";

import { LogoutButton } from "@/features/auth/LogoutButton";

import { getCurrentUser } from "@/lib/auth";

import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = async ({ children }: AppShellProps) => {
  const currentUser = await getCurrentUser();

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Code Busters Hub</div>

        <Navigation isAdmin={isAdmin} />

        {currentUser ? <LogoutButton /> : null}
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
};

AppShell.displayName = "AppShell";
