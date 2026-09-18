"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./AdminNavigation.module.css";

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

export const AdminNavigation = () => {
  const pathname = usePathname();

  return (
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
  );
};
