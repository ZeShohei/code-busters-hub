import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

import styles from "./page.module.css";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.header}>
          <span className={styles.logo}>Code Busters Hub</span>

          <h1 id="login-title">Anmelden</h1>

          <p>Melde dich mit deinem Benutzernamen und Passwort an.</p>
        </div>

        <LoginForm />
      </section>
    </div>
  );
}
