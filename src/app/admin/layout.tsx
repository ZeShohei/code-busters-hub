import type { ReactNode } from "react";

import { AdminNavigation } from "@/features/admin/AdminNavigation";

import styles from "./layout.module.css";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className={styles.layout}>
      <AdminNavigation />

      {children}
    </div>
  );
}
