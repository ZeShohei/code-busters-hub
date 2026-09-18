"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Navigation.module.css";

const navigationItems = [
  {
    href: "/",
    label: "Übersicht",
  },
  {
    href: "/team",
    label: "Team",
  },
  {
    href: "/absences",
    label: "Abwesenheiten",
  },
  {
    href: "/rotations",
    label: "Rotationen",
  },
  {
    href: "/admin",
    label: "Admin",
  },
];

const isNavigationItemActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation} aria-label="Hauptnavigation">
      {navigationItems.map((item) => {
        const isActive = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${isActive ? styles.activeLink : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

Navigation.displayName = "Navigation";
