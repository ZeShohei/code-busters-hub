import type { ReactNode } from "react";

import { AdminNavigation } from "@/features/admin/AdminNavigation";
import { requireAdmin } from "@/features/admin/requireAdmin";

import styles from "./layout.module.css";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdmin();

  return (
    <div className={styles.layout}>
      <AdminNavigation />

      {children}
    </div>
  );
}
