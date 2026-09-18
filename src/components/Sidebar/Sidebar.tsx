import { Navigation } from "@/components/Navigation/Navigation";

import { LogoutButton } from "@/features/auth/LogoutButton";

import type { CurrentUser } from "@/lib/auth";

import styles from "./Sidebar.module.css";

interface SidebarProps {
  currentUser: CurrentUser;
}

export const Sidebar = ({ currentUser }: SidebarProps) => {
  const isAdmin = currentUser.role === "admin";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Code Busters Hub</div>

      <div className={styles.navigation}>
        <Navigation isAdmin={isAdmin} />
      </div>

      <div className={styles.footer}>
        <LogoutButton />
      </div>
    </aside>
  );
};

Sidebar.displayName = "Sidebar";
