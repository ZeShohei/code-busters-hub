"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { Absence, TeamMember } from "@/types/team";

import { createAbsence, deleteAbsence, updateAbsence } from "./actions";

import styles from "./AdminAbsenceForm.module.css";

interface AdminAbsenceFormValues {
  teamMemberId: string;
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId: string;
}

interface AdminAbsenceFormProps {
  teamMembers: TeamMember[];
  absenceId?: string;
  initialValues?: AdminAbsenceFormValues;
}

const defaultValues: AdminAbsenceFormValues = {
  teamMemberId: "",
  type: "vacation",
  startDate: "",
  endDate: "",
  substituteTeamMemberId: "",
};

export const AdminAbsenceForm = ({
  teamMembers,
  absenceId,
  initialValues = defaultValues,
}: AdminAbsenceFormProps) => {
  const router = useRouter();

  const [values, setValues] = useState(initialValues);

  const [error, setError] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = absenceId !== undefined;

  const availableSubstitutes = teamMembers.filter(
    (member) => member.id !== values.teamMemberId,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    const input = {
      teamMemberId: values.teamMemberId,
      type: values.type,
      startDate: values.startDate,
      endDate: values.endDate,
      substituteTeamMemberId: values.substituteTeamMemberId || undefined,
    };

    const result =
      isEditing && absenceId
        ? await updateAbsence(absenceId, input)
        : await createAbsence(input);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error ?? "Es ist ein Fehler aufgetreten.");

      return;
    }

    router.push("/admin/absences");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!absenceId) {
      return;
    }

    const confirmed = window.confirm(
      "Möchtest du diese Abwesenheit wirklich löschen?",
    );

    if (!confirmed) {
      return;
    }

    setError(undefined);
    setIsDeleting(true);

    const result = await deleteAbsence(absenceId);

    setIsDeleting(false);

    if (!result.success) {
      setError(result.error ?? "Die Abwesenheit konnte nicht gelöscht werden.");

      return;
    }

    router.push("/admin/absences");
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="teamMember">Teammitglied</label>

        <select
          id="teamMember"
          value={values.teamMemberId}
          required
          onChange={(event) => {
            const teamMemberId = event.target.value;

            setValues((current) => ({
              ...current,
              teamMemberId,
              substituteTeamMemberId:
                current.substituteTeamMemberId === teamMemberId
                  ? ""
                  : current.substituteTeamMemberId,
            }));
          }}
        >
          <option value="">Bitte auswählen</option>

          {teamMembers.map((teamMember) => (
            <option key={teamMember.id} value={teamMember.id}>
              {teamMember.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="type">Art der Abwesenheit</label>

        <select
          id="type"
          value={values.type}
          onChange={(event) => {
            setValues((current) => ({
              ...current,
              type: event.target.value as Absence["type"],
            }));
          }}
        >
          <option value="vacation">Urlaub</option>

          <option value="sickLeave">Krankenstand</option>

          <option value="other">Sonstige Abwesenheit</option>
        </select>
      </div>

      <div className={styles.dateFields}>
        <div className={styles.field}>
          <label htmlFor="startDate">Von</label>

          <input
            id="startDate"
            type="date"
            value={values.startDate}
            required
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                startDate: event.target.value,
              }));
            }}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="endDate">Bis</label>

          <input
            id="endDate"
            type="date"
            value={values.endDate}
            required
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                endDate: event.target.value,
              }));
            }}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="substitute">Vertretung</label>

        <select
          id="substitute"
          value={values.substituteTeamMemberId}
          onChange={(event) => {
            setValues((current) => ({
              ...current,
              substituteTeamMemberId: event.target.value,
            }));
          }}
        >
          <option value="">Keine Vertretung</option>

          {availableSubstitutes.map((teamMember) => (
            <option key={teamMember.id} value={teamMember.id}>
              {teamMember.displayName}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving || isDeleting}
        >
          {isSaving
            ? "Speichern..."
            : isEditing
              ? "Änderungen speichern"
              : "Abwesenheit anlegen"}
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isSaving || isDeleting}
          onClick={() => router.push("/admin/absences")}
        >
          Abbrechen
        </button>

        {isEditing ? (
          <button
            type="button"
            className={styles.deleteButton}
            disabled={isSaving || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Löschen..." : "Abwesenheit löschen"}
          </button>
        ) : null}
      </div>
    </form>
  );
};
