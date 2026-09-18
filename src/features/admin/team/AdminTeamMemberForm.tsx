"use client";

import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import type { TeamMember, TeamMemberRole } from "@/types/team";

import {
  createTeamMember,
  setTeamMemberActive,
  updateTeamMember,
} from "./actions";

import styles from "./AdminTeamMemberForm.module.css";

interface AdminTeamMemberFormProps {
  teamMember?: TeamMember;
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: TeamMemberRole;
}

export const AdminTeamMemberForm = ({
  teamMember,
}: AdminTeamMemberFormProps) => {
  const router = useRouter();

  const isEditing = teamMember !== undefined;

  const [values, setValues] = useState<FormValues>({
    firstName: teamMember?.firstName ?? "",
    lastName: teamMember?.lastName ?? "",
    email: teamMember?.email ?? "",
    role: teamMember?.role ?? "member",
  });

  const [error, setError] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    try {
      const result = teamMember
        ? await updateTeamMember(teamMember.id, values)
        : await createTeamMember(values);

      if (!result.success) {
        setError(
          result.error ?? "Die Änderung konnte nicht gespeichert werden.",
        );

        return;
      }

      router.push("/admin/team");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!teamMember) {
      return;
    }

    setError(undefined);
    setIsChangingStatus(true);

    try {
      const newStatus = !teamMember.active;

      const result = await setTeamMemberActive(teamMember.id, newStatus);

      if (!result.success) {
        setError(result.error ?? "Der Status konnte nicht geändert werden.");

        return;
      }

      router.refresh();
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="firstName">Vorname</label>

          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={values.firstName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="lastName">Nachname</label>

          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={values.lastName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">E-Mail-Adresse</label>

          <input
            id="email"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="role">Rolle</label>

          <select
            id="role"
            name="role"
            value={values.role}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                role: event.target.value as TeamMemberRole,
              }))
            }
          >
            <option value="member">Mitglied</option>

            <option value="admin">Admin</option>
          </select>

          <span className={styles.hint}>
            Admins können Team, Abwesenheiten und Rotationen verwalten.
          </span>
        </div>
      </div>

      {teamMember ? (
        <div className={styles.statusBox}>
          <div>
            <strong>Benutzerstatus</strong>

            <p>
              Dieses Teammitglied ist aktuell{" "}
              {teamMember.active ? "aktiv" : "deaktiviert"}.
            </p>
          </div>

          <button
            type="button"
            className={
              teamMember.active
                ? styles.deactivateButton
                : styles.activateButton
            }
            disabled={isSaving || isChangingStatus}
            onClick={handleStatusChange}
          >
            {isChangingStatus
              ? "Wird geändert …"
              : teamMember.active
                ? "Deaktivieren"
                : "Aktivieren"}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => router.push("/admin/team")}
          disabled={isSaving || isChangingStatus}
        >
          Abbrechen
        </button>

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving || isChangingStatus}
        >
          {isSaving
            ? "Speichert …"
            : isEditing
              ? "Änderungen speichern"
              : "Teammitglied anlegen"}
        </button>
      </div>
    </form>
  );
};
