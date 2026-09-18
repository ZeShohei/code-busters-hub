"use client";

import { useState, type FormEvent } from "react";

import { changeOwnPassword } from "./actions";

import styles from "./ProfilePasswordForm.module.css";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_VALUES: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const ProfilePasswordForm = () => {
  const [values, setValues] = useState<PasswordFormValues>(EMPTY_VALUES);

  const [error, setError] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const updateValue = (key: keyof PasswordFormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setError(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    try {
      const result = await changeOwnPassword(values);

      /*
       * Bei Erfolg führt die Server Action
       * einen Redirect zum Login aus.
       */
      if (!result.success) {
        setError(result.error ?? "Das Passwort konnte nicht geändert werden.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Passwort ändern</h2>

          <p>
            Nach der Änderung wirst du auf allen Geräten abgemeldet und musst
            dich mit dem neuen Passwort erneut anmelden.
          </p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="current-password">Aktuelles Passwort</label>

          <input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(event) =>
              updateValue("currentPassword", event.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="new-password">Neues Passwort</label>

          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(event) => updateValue("newPassword", event.target.value)}
          />

          <span className={styles.hint}>Mindestens 12 Zeichen.</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="confirm-password">Neues Passwort bestätigen</label>

          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) =>
              updateValue("confirmPassword", event.target.value)
            }
          />
        </div>

        {error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSaving}
          >
            {isSaving ? "Passwort wird geändert …" : "Passwort ändern"}
          </button>
        </div>
      </form>
    </section>
  );
};

ProfilePasswordForm.displayName = "ProfilePasswordForm";
