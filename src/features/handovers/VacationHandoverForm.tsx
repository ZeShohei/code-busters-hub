"use client";

import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import {
  deleteVacationHandover,
  saveVacationHandover,
  setVacationHandoverTaskCompleted,
} from "@/features/handovers/action";

import styles from "./VacationHandoverForm.module.css";

export interface VacationHandoverTaskValues {
  id?: string;
  title: string;
  repoBranch: string;
  status: string;
  nextSteps: string;
  responsible: string;
  completed: boolean;
}

export interface VacationHandoverValues {
  emergencyContact: string;

  featureBranches: string;
  deploymentPlan: string;
  cicdStatus: string;
  environments: string;

  knownRisks: string;
  dependencies: string;

  technicalDocumentation: string;
  repositories: string;
  tickets: string;

  notes: string;

  tasks: VacationHandoverTaskValues[];
}

interface VacationHandoverFormProps {
  absenceId: string;

  canEdit: boolean;
  canCompleteTasks: boolean;
  hasHandover: boolean;

  vacationStartDate: string;
  vacationEndDate: string;

  vacationerName: string;
  substituteName?: string;

  initialValues: VacationHandoverValues;
}

const createEmptyTask = (): VacationHandoverTaskValues => ({
  title: "",
  repoBranch: "",
  status: "",
  nextSteps: "",
  responsible: "",
  completed: false,
});

export const VacationHandoverForm = ({
  absenceId,
  canEdit,
  canCompleteTasks,
  hasHandover,
  vacationStartDate,
  vacationEndDate,
  vacationerName,
  substituteName,
  initialValues,
}: VacationHandoverFormProps) => {
  const router = useRouter();

  const [values, setValues] = useState<VacationHandoverValues>(initialValues);

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [updatingTaskId, setUpdatingTaskId] = useState<string>();

  const [error, setError] = useState<string>();

  const [successMessage, setSuccessMessage] = useState<string>();

  const updateValue = (
    field: keyof Omit<VacationHandoverValues, "tasks">,
    value: string,
  ) => {
    if (!canEdit) {
      return;
    }

    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateTask = (
    index: number,
    field: keyof VacationHandoverTaskValues,
    value: string | boolean,
  ) => {
    setValues((current) => ({
      ...current,

      tasks: current.tasks.map((task, taskIndex) =>
        taskIndex === index
          ? {
              ...task,
              [field]: value,
            }
          : task,
      ),
    }));
  };

  const updateTaskContent = (
    index: number,
    field: "title" | "repoBranch" | "status" | "nextSteps" | "responsible",
    value: string,
  ) => {
    if (!canEdit) {
      return;
    }

    updateTask(index, field, value);
  };

  const addTask = () => {
    if (!canEdit) {
      return;
    }

    setValues((current) => ({
      ...current,

      tasks: [...current.tasks, createEmptyTask()],
    }));
  };

  const removeTask = (index: number) => {
    if (!canEdit) {
      return;
    }

    setValues((current) => ({
      ...current,

      tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    setError(undefined);
    setSuccessMessage(undefined);
    setIsSaving(true);

    try {
      const result = await saveVacationHandover(absenceId, values);

      if (!result.success) {
        setError(
          result.error ??
            "Die Urlaubsübergabe konnte nicht gespeichert werden.",
        );

        return;
      }

      setSuccessMessage("Urlaubsübergabe gespeichert.");

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || !hasHandover) {
      return;
    }

    const confirmed = window.confirm(
      "Möchtest du die komplette Urlaubsübergabe wirklich löschen? Alle enthaltenen Aufgaben werden ebenfalls gelöscht.",
    );

    if (!confirmed) {
      return;
    }

    setError(undefined);
    setSuccessMessage(undefined);
    setIsDeleting(true);

    try {
      const result = await deleteVacationHandover(absenceId);

      if (!result.success) {
        setError(
          result.error ?? "Die Urlaubsübergabe konnte nicht gelöscht werden.",
        );

        return;
      }

      router.push("/absences");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskCompletedChange = async (
    index: number,
    completed: boolean,
  ) => {
    const task = values.tasks[index];

    if (!task.id || !canCompleteTasks) {
      return;
    }

    setError(undefined);
    setUpdatingTaskId(task.id);

    updateTask(index, "completed", completed);

    try {
      const result = await setVacationHandoverTaskCompleted(task.id, completed);

      if (!result.success) {
        updateTask(index, "completed", !completed);

        setError(
          result.error ?? "Der Aufgabenstatus konnte nicht gespeichert werden.",
        );

        return;
      }

      router.refresh();
    } finally {
      setUpdatingTaskId(undefined);
    }
  };

  const isBusy = isSaving || isDeleting;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.summary}>
        <div>
          <span>Urlaub</span>

          <strong>{vacationerName}</strong>
        </div>

        <div>
          <span>Zeitraum</span>

          <strong>
            {vacationStartDate} – {vacationEndDate}
          </strong>
        </div>

        <div>
          <span>Vertretung</span>

          <strong>{substituteName ?? "Keine Vertretung eingetragen"}</strong>
        </div>
      </section>

      {!canEdit ? (
        <div className={styles.readOnlyNotice}>
          Diese Urlaubsübergabe wurde vom Beurlaubten erstellt und kann von dir
          nicht verändert werden. Du kannst ausschließlich offene Aufgaben als
          erledigt markieren.
        </div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Kontakt im Notfall</h2>

            <p>Optionaler Kontakt für wirklich dringende Fälle.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="emergencyContact">Kontakt</label>

          <input
            id="emergencyContact"
            type="text"
            disabled={!canEdit || isBusy}
            value={values.emergencyContact}
            onChange={(event) =>
              updateValue("emergencyContact", event.target.value)
            }
            placeholder="z. B. Slack, E-Mail oder Telefonnummer"
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Offene Aufgaben</h2>

            <p>Aufgaben und Tickets für die Vertretung.</p>
          </div>

          {canEdit ? (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isBusy}
              onClick={addTask}
            >
              + Aufgabe hinzufügen
            </button>
          ) : null}
        </div>

        {values.tasks.length === 0 ? (
          <p className={styles.empty}>Keine offenen Aufgaben eingetragen.</p>
        ) : (
          <div className={styles.tasks}>
            {values.tasks.map((task, index) => (
              <article
                key={task.id ?? `new-${index}`}
                className={`${styles.task} ${
                  task.completed ? styles.taskCompleted : ""
                }`}
              >
                <div className={styles.taskHeader}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={task.completed}
                      disabled={
                        !canCompleteTasks ||
                        !task.id ||
                        updatingTaskId === task.id
                      }
                      onChange={(event) =>
                        void handleTaskCompletedChange(
                          index,
                          event.target.checked,
                        )
                      }
                    />

                    <span>{task.completed ? "Erledigt" : "Offen"}</span>
                  </label>

                  {canEdit ? (
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isBusy}
                      onClick={() => removeTask(index)}
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`task-title-${index}`}>
                    Aufgabe / Ticket
                  </label>

                  <input
                    id={`task-title-${index}`}
                    type="text"
                    disabled={!canEdit || isBusy}
                    value={task.title}
                    onChange={(event) =>
                      updateTaskContent(index, "title", event.target.value)
                    }
                  />
                </div>

                <div className={styles.taskGrid}>
                  <div className={styles.field}>
                    <label htmlFor={`task-repo-${index}`}>Repo / Branch</label>

                    <input
                      id={`task-repo-${index}`}
                      type="text"
                      disabled={!canEdit || isBusy}
                      value={task.repoBranch}
                      onChange={(event) =>
                        updateTaskContent(
                          index,
                          "repoBranch",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`task-status-${index}`}>Status</label>

                    <input
                      id={`task-status-${index}`}
                      type="text"
                      disabled={!canEdit || isBusy}
                      value={task.status}
                      onChange={(event) =>
                        updateTaskContent(index, "status", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor={`task-next-${index}`}>Nächste Schritte</label>

                  <textarea
                    id={`task-next-${index}`}
                    rows={3}
                    disabled={!canEdit || isBusy}
                    value={task.nextSteps}
                    onChange={(event) =>
                      updateTaskContent(index, "nextSteps", event.target.value)
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor={`task-responsible-${index}`}>Zuständig</label>

                  <input
                    id={`task-responsible-${index}`}
                    type="text"
                    disabled={!canEdit || isBusy}
                    value={task.responsible}
                    onChange={(event) =>
                      updateTaskContent(
                        index,
                        "responsible",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Laufende Themen</h2>

            <p>Entwicklungs-, Deployment- und Infrastrukturthemen.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="featureBranches">Feature Branches</label>

          <textarea
            id="featureBranches"
            rows={4}
            disabled={!canEdit || isBusy}
            value={values.featureBranches}
            onChange={(event) =>
              updateValue("featureBranches", event.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="deploymentPlan">Deploy-Plan</label>

          <textarea
            id="deploymentPlan"
            rows={4}
            disabled={!canEdit || isBusy}
            value={values.deploymentPlan}
            onChange={(event) =>
              updateValue("deploymentPlan", event.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cicdStatus">CI/CD</label>

          <textarea
            id="cicdStatus"
            rows={4}
            disabled={!canEdit || isBusy}
            value={values.cicdStatus}
            onChange={(event) => updateValue("cicdStatus", event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="environments">Wichtige Umgebungen</label>

          <textarea
            id="environments"
            rows={4}
            disabled={!canEdit || isBusy}
            value={values.environments}
            onChange={(event) =>
              updateValue("environments", event.target.value)
            }
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Bekannte Risiken / Probleme</h2>

            <p>Bugs, instabile Systeme und Abhängigkeiten.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="knownRisks">Risiken und Probleme</label>

          <textarea
            id="knownRisks"
            rows={5}
            disabled={!canEdit || isBusy}
            value={values.knownRisks}
            onChange={(event) => updateValue("knownRisks", event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="dependencies">Abhängigkeiten</label>

          <textarea
            id="dependencies"
            rows={4}
            disabled={!canEdit || isBusy}
            value={values.dependencies}
            onChange={(event) =>
              updateValue("dependencies", event.target.value)
            }
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Dokumentation & Links</h2>

            <p>Technische Dokumentation, Repositories und Tickets.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="technicalDocumentation">
            Technische Dokumentation
          </label>

          <textarea
            id="technicalDocumentation"
            rows={3}
            disabled={!canEdit || isBusy}
            value={values.technicalDocumentation}
            onChange={(event) =>
              updateValue("technicalDocumentation", event.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="repositories">Repository / Repositories</label>

          <textarea
            id="repositories"
            rows={3}
            disabled={!canEdit || isBusy}
            value={values.repositories}
            onChange={(event) =>
              updateValue("repositories", event.target.value)
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="tickets">Tickets</label>

          <textarea
            id="tickets"
            rows={3}
            disabled={!canEdit || isBusy}
            value={values.tickets}
            onChange={(event) => updateValue("tickets", event.target.value)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Sonstiges / Hinweise</h2>

            <p>Weitere wichtige Informationen für die Vertretung.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="notes">Hinweise</label>

          <textarea
            id="notes"
            rows={6}
            disabled={!canEdit || isBusy}
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
          />
        </div>
      </section>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className={styles.success} role="status">
          {successMessage}
        </div>
      ) : null}

      <div className={styles.actions}>
        {canEdit && hasHandover ? (
          <button
            type="button"
            className={styles.deleteButton}
            disabled={isBusy}
            onClick={handleDelete}
          >
            {isDeleting ? "Löscht …" : "Übergabe löschen"}
          </button>
        ) : null}

        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isBusy}
          onClick={() => router.push("/absences")}
        >
          Zurück
        </button>

        {canEdit ? (
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isBusy}
          >
            {isSaving
              ? "Speichert …"
              : hasHandover
                ? "Änderungen speichern"
                : "Übergabe erstellen"}
          </button>
        ) : null}
      </div>
    </form>
  );
};

VacationHandoverForm.displayName = "VacationHandoverForm";
