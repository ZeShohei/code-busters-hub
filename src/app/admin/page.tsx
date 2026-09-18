import Link from "next/link";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import styles from "./page.module.css";

export default function AdminPage() {
  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Admin",
          },
        ]}
      />

      <PageHeader
        eyebrow="Administration"
        title="Admin-Bereich"
        description="Verwalte Teammitglieder, Abwesenheiten und Rotationen."
      />

      <div className={styles.grid}>
        <Link href="/admin/absences" className={styles.card}>
          <h2>Abwesenheiten</h2>

          <p>
            Abwesenheiten und Vertretungen anlegen, bearbeiten oder löschen.
          </p>
        </Link>

        <div className={styles.cardDisabled}>
          <h2>Team</h2>

          <p>Teammitglieder verwalten.</p>

          <span>Demnächst</span>
        </div>

        <div className={styles.cardDisabled}>
          <h2>Rotationen</h2>

          <p>Dispatcher- und Deployment-Rotation konfigurieren.</p>

          <span>Demnächst</span>
        </div>
      </div>
    </div>
  );
}
