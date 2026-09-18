"use client";

import { FormEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import type { Absence } from "@/types/team";

import {
  cancelOwnAbsence,
  createOwnAbsence,
  getOwnAvailableSubstitutes,
  updateOwnAbsence,
} from "./actions";

import styles from "./OwnAbsenceForm.module.css";

interface SubstituteAvailability {
  id: string;
  displayName: string;
  available: boolean;
  reason?: string;
}

interface FormValues {
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId: string;
}

interface EditableAbsence {
  id: string;
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId: string;
}

interface OwnAbsenceFormProps {
  absence?: EditableAbsence;
}

export const OwnAbsenceForm = ({ absence }: OwnAbsenceFormProps) => {
  const router = useRouter();

  const isEditMode = Boolean(absence);

  const [values, setValues] = useState<FormValues>({
    type: absence?.type ?? "vacation",
    startDate: absence?.startDate ?? "",
    endDate: absence?.endDate ?? "",
    substituteTeamMemberId: absence?.substituteTeamMemberId ?? "",
  });

  const [availableSubstitutes, setAvailableSubstitutes] = useState<
    SubstituteAvailability[]
  >([]);

  const [isLoadingSubstitutes, setIsLoadingSubstitutes] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string>();

  useEffect(() => {
    if (
      !values.startDate ||
      !values.endDate ||
      values.endDate < values.startDate
    ) {
      return;
    }

    let cancelled = false;

    const loadSubstitutes = async () => {
      setIsLoadingSubstitutes(true);

      try {
        const result = await getOwnAvailableSubstitutes({
          startDate: values.startDate,
          endDate: values.endDate,
          absenceId: absence?.id,
        });

        if (!cancelled) {
          setAvailableSubstitutes(result);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSubstitutes(false);
        }
      }
    };

    void loadSubstitutes();

    return () => {
      cancelled = true;
    };
  }, [absence?.id, values.startDate, values.endDate]);

  const handleStartDateChange = (value: string) => {
    setValues((current) => ({
      ...current,
      startDate: value,
      substituteTeamMemberId: "",
    }));

    setAvailableSubstitutes([]);
  };

  const handleEndDateChange = (value: string) => {
    setValues((current) => ({
      ...current,
      endDate: value,
      substituteTeamMemberId: "",
    }));

    setAvailableSubstitutes([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    try {
      const input = {
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        substituteTeamMemberId: values.substituteTeamMemberId || undefined,
      };

      const result = absence
        ? await updateOwnAbsence(absence.id, input)
        : await createOwnAbsence(input);

      if (!result.success) {
        setError(
          result.error ?? "Die Abwesenheit konnte nicht gespeichert werden.",
        );

        return;
      }

      router.push("/absences");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAbsence = async () => {
    if (!absence) {
      return;
    }

    const confirmed = window.confirm(
      "Möchtest du diese Abwesenheit wirklich stornieren?",
    );

    if (!confirmed) {
      return;
    }

    setError(undefined);
    setIsDeleting(true);

    try {
      const result = await cancelOwnAbsence(absence.id);

      if (!result.success) {
        setError(
          result.error ?? "Die Abwesenheit konnte nicht storniert werden.",
        );

        return;
      }

      router.push("/absences");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isSaving || isDeleting;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="type">Art der Abwesenheit</label>

        <select
          id="type"
          name="type"
          value={values.type}
          disabled={isBusy}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              type: event.target.value as Absence["type"],
            }))
          }
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
            name="startDate"
            type="date"
            required
            disabled={isBusy}
            value={values.startDate}
            onChange={(event) => handleStartDateChange(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="endDate">Bis</label>

          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            disabled={isBusy}
            min={values.startDate || undefined}
            value={values.endDate}
            onChange={(event) => handleEndDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="substitute">Vertretung</label>

        <select
          id="substitute"
          name="substitute"
          value={values.substituteTeamMemberId}
          disabled={
            isBusy ||
            !values.startDate ||
            !values.endDate ||
            values.endDate < values.startDate ||
            isLoadingSubstitutes
          }
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              substituteTeamMemberId: event.target.value,
            }))
          }
        >
          <option value="">Keine Vertretung</option>

          {availableSubstitutes.map((substitute) => (
            <option
              key={substitute.id}
              value={substitute.id}
              disabled={!substitute.available}
            >
              {substitute.displayName}

              {!substitute.available && substitute.reason
                ? ` – ${substitute.reason}`
                : ""}
            </option>
          ))}
        </select>

        <span className={styles.hint}>
          {isLoadingSubstitutes
            ? "Verfügbare Vertretungen werden geprüft …"
            : "Nicht verfügbare Teammitglieder können nicht ausgewählt werden."}
        </span>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <div className={styles.actions}>
        {absence ? (
          <button
            type="button"
            className={styles.deleteButton}
            disabled={isBusy}
            onClick={handleCancelAbsence}
          >
            {isDeleting ? "Storniert …" : "Abwesenheit stornieren"}
          </button>
        ) : null}

        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isBusy}
          onClick={() => router.push("/absences")}
        >
          Abbrechen
        </button>

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isBusy}
        >
          {isSaving
            ? "Speichert …"
            : isEditMode
              ? "Änderungen speichern"
              : "Abwesenheit eintragen"}
        </button>
      </div>
    </form>
  );
};

OwnAbsenceForm.displayName = "OwnAbsenceForm";
