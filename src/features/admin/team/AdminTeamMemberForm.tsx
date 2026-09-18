"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { TeamMember } from "@/types/team";

import {
  createTeamMember,
  setTeamMemberActive,
  updateTeamMember,
} from "./actions";

import styles from "./AdminTeamMemberForm.module.css";

interface TeamMemberFormValues {
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminTeamMemberFormProps {
  teamMember?: TeamMember;
}

const defaultValues: TeamMemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
};

export const AdminTeamMemberForm = ({
  teamMember,
}: AdminTeamMemberFormProps) => {
  const router = useRouter();

  const [values, setValues] = useState<TeamMemberFormValues>(
    teamMember
      ? {
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          email: teamMember.email,
        }
      : defaultValues,
  );

  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const isEditing = teamMember !== undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    const result = isEditing
      ? await updateTeamMember(teamMember.id, values)
      : await createTeamMember(values);

    setIsSaving(false);

    if (!result.success) {
      setError(
        result.error ?? "Das Teammitglied konnte nicht gespeichert werden.",
      );

      return;
    }

    router.push("/admin/team");
    router.refresh();
  };

  const handleStatusChange = async () => {
    if (!teamMember) {
      return;
    }

    const newStatus = !teamMember.active;

    if (!newStatus) {
      const confirmed = window.confirm(
        "Möchtest du dieses Teammitglied wirklich deaktivieren? Historische Daten bleiben erhalten.",
      );

      if (!confirmed) {
        return;
      }
    }

    setError(undefined);
    setIsChangingStatus(true);

    const result = await setTeamMemberActive(teamMember.id, newStatus);

    setIsChangingStatus(false);

    if (!result.success) {
      setError(result.error ?? "Der Status konnte nicht geändert werden.");

      return;
    }

    router.push("/admin/team");
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="firstName">Vorname</label>

        <input
          id="firstName"
          type="text"
          autoComplete="given-name"
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
          type="text"
          autoComplete="family-name"
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
          type="email"
          autoComplete="email"
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

      {isEditing ? (
        <div className={styles.status}>
          <span>Status</span>

          <strong>{teamMember.active ? "Aktiv" : "Inaktiv"}</strong>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving || isChangingStatus}
        >
          {isSaving
            ? "Speichern..."
            : isEditing
              ? "Änderungen speichern"
              : "Teammitglied anlegen"}
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isSaving || isChangingStatus}
          onClick={() => router.push("/admin/team")}
        >
          Abbrechen
        </button>

        {teamMember ? (
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
              ? "Status ändern..."
              : teamMember.active
                ? "Teammitglied deaktivieren"
                : "Teammitglied aktivieren"}
          </button>
        ) : null}
      </div>
    </form>
  );
};
