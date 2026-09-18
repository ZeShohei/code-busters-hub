"use client";

import { useActionState } from "react";

import { loginAction } from "./actions";

import styles from "./LoginForm.module.css";

const initialState = {
  error: undefined as string | undefined,
};

export const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="username">Benutzername</label>

        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          disabled={isPending}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Passwort</label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
        />
      </div>

      {state.error ? (
        <div className={styles.error} role="alert">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isPending}
      >
        {isPending ? "Anmeldung läuft …" : "Anmelden"}
      </button>
    </form>
  );
};

LoginForm.displayName = "LoginForm";
