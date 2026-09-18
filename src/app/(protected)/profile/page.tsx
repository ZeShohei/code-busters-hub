import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { ProfilePasswordForm } from "@/features/profile/ProfilePasswordForm";

import { getCurrentUser } from "@/lib/auth";

import styles from "./page.module.css";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Übersicht",
            href: "/",
          },
          {
            label: "Mein Profil",
          },
        ]}
      />

      <PageHeader
        eyebrow="Benutzerkonto"
        title="Mein Profil"
        description="Deine Kontodaten und Sicherheitseinstellungen."
      />

      <section className={styles.profileCard} aria-labelledby="profile-data">
        <div>
          <h2 id="profile-data">Kontodaten</h2>

          <p>Stammdaten und Rollen werden von einem Administrator verwaltet.</p>
        </div>

        <dl className={styles.profileData}>
          <div>
            <dt>Name</dt>

            <dd>{currentUser.displayName}</dd>
          </div>

          <div>
            <dt>E-Mail</dt>

            <dd>{currentUser.email}</dd>
          </div>

          <div>
            <dt>Benutzername</dt>

            <dd>{currentUser.username}</dd>
          </div>

          <div>
            <dt>Rolle</dt>

            <dd>{currentUser.role === "admin" ? "Admin" : "Mitglied"}</dd>
          </div>
        </dl>
      </section>

      <ProfilePasswordForm />
    </section>
  );
}
