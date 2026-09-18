"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./AdminNavigation.module.css";

interface AdminNavigationProps {
  currentUser: {
    displayName: string;
    email: string;
    role: "admin" | "member";
  };
}

const navigationItems = [
  {
    href: "/admin",
    label: "Übersicht",
    exact: true,
  },
  {
    href: "/admin/team",
    label: "Team",
  },
  {
    href: "/admin/absences",
    label: "Abwesenheiten",
  },
  {
    href: "/admin/rotations",
    label: "Rotationen",
  },
];

export const AdminNavigation = ({ currentUser }: AdminNavigationProps) => {
  const pathname = usePathname();

  return (
    <div className={styles.wrapper}>
      <nav className={styles.navigation} aria-label="Admin-Navigation">
        {navigationItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? styles.activeLink : styles.link}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.user}>
        <div className={styles.userText}>
          <strong>{currentUser.displayName}</strong>

          <span className={styles.email}>{currentUser.email}</span>
        </div>

        <span className={styles.role}>
          {currentUser.role === "admin" ? "Admin" : "Mitglied"}
        </span>
      </div>
    </div>
  );
};
