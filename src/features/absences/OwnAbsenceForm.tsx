"use client";

import { FormEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import type { Absence } from "@/types/team";

import { createOwnAbsence, getOwnAvailableSubstitutes } from "./actions";

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

export const OwnAbsenceForm = () => {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    type: "vacation",
    startDate: "",
    endDate: "",
    substituteTeamMemberId: "",
  });

  const [availableSubstitutes, setAvailableSubstitutes] = useState<
    SubstituteAvailability[]
  >([]);

  const [isLoadingSubstitutes, setIsLoadingSubstitutes] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

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
  }, [values.startDate, values.endDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setIsSaving(true);

    try {
      const result = await createOwnAbsence({
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        substituteTeamMemberId: values.substituteTeamMemberId || undefined,
      });

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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="type">Art der Abwesenheit</label>

        <select
          id="type"
          name="type"
          value={values.type}
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
            value={values.startDate}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                startDate: event.target.value,
                substituteTeamMemberId: "",
              }));

              setAvailableSubstitutes([]);
            }}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="endDate">Bis</label>

          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={values.startDate || undefined}
            value={values.endDate}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                endDate: event.target.value,
                substituteTeamMemberId: "",
              }));

              setAvailableSubstitutes([]);
            }}
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
            !values.startDate || !values.endDate || isLoadingSubstitutes
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
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isSaving}
          onClick={() => router.push("/absences")}
        >
          Abbrechen
        </button>

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving}
        >
          {isSaving ? "Speichert …" : "Abwesenheit eintragen"}
        </button>
      </div>
    </form>
  );
};

OwnAbsenceForm.displayName = "OwnAbsenceForm";
