"use client";

import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import styles from "./VacationHandoverForm.module.css";
import { saveVacationHandover } from "@/features/handovers/action";

export interface VacationHandoverTaskValues {
  id?: string;
  title: string;
  repoBranch: string;
  status: string;
  nextSteps: string;
  responsible: string;
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
});

export const VacationHandoverForm = ({
  absenceId,
  canEdit,
  vacationStartDate,
  vacationEndDate,
  vacationerName,
  substituteName,
  initialValues,
}: VacationHandoverFormProps) => {
  const router = useRouter();

  const [values, setValues] = useState<VacationHandoverValues>(initialValues);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const updateValue = (
    field: keyof Omit<VacationHandoverValues, "tasks">,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateTask = (
    index: number,
    field: keyof VacationHandoverTaskValues,
    value: string,
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

  const addTask = () => {
    setValues((current) => ({
      ...current,
      tasks: [...current.tasks, createEmptyTask()],
    }));
  };

  const removeTask = (index: number) => {
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
          Du siehst diese Übergabe als eingetragene Vertretung. Änderungen
          können nur vom Urlauber oder einem Admin vorgenommen werden.
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
            disabled={!canEdit || isSaving}
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

            <p>
              Tickets und Aufgaben, die während des Urlaubs relevant sein
              können.
            </p>
          </div>

          {canEdit ? (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isSaving}
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
              <article key={task.id ?? `new-${index}`} className={styles.task}>
                <div className={styles.taskHeader}>
                  <strong>Aufgabe {index + 1}</strong>

                  {canEdit ? (
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isSaving}
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
                    disabled={!canEdit || isSaving}
                    value={task.title}
                    onChange={(event) =>
                      updateTask(index, "title", event.target.value)
                    }
                    placeholder="z. B. JIRA-1234 – Login Bug"
                  />
                </div>

                <div className={styles.taskGrid}>
                  <div className={styles.field}>
                    <label htmlFor={`task-repo-${index}`}>Repo / Branch</label>

                    <input
                      id={`task-repo-${index}`}
                      type="text"
                      disabled={!canEdit || isSaving}
                      value={task.repoBranch}
                      onChange={(event) =>
                        updateTask(index, "repoBranch", event.target.value)
                      }
                      placeholder="we-website-theme/feature/..."
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`task-status-${index}`}>Status</label>

                    <input
                      id={`task-status-${index}`}
                      type="text"
                      disabled={!canEdit || isSaving}
                      value={task.status}
                      onChange={(event) =>
                        updateTask(index, "status", event.target.value)
                      }
                      placeholder="z. B. In Progress"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor={`task-next-${index}`}>Nächste Schritte</label>

                  <textarea
                    id={`task-next-${index}`}
                    rows={3}
                    disabled={!canEdit || isSaving}
                    value={task.nextSteps}
                    onChange={(event) =>
                      updateTask(index, "nextSteps", event.target.value)
                    }
                    placeholder="Was muss als Nächstes passieren?"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor={`task-responsible-${index}`}>Zuständig</label>

                  <input
                    id={`task-responsible-${index}`}
                    type="text"
                    disabled={!canEdit || isSaving}
                    value={task.responsible}
                    onChange={(event) =>
                      updateTask(index, "responsible", event.target.value)
                    }
                    placeholder="Name oder Team"
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

            <p>
              Entwicklungs-, Deployment- und Infrastrukturthemen, die während
              des Urlaubs wichtig sind.
            </p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="featureBranches">Feature Branches</label>

          <textarea
            id="featureBranches"
            rows={4}
            disabled={!canEdit || isSaving}
            value={values.featureBranches}
            onChange={(event) =>
              updateValue("featureBranches", event.target.value)
            }
            placeholder="Welche Branches oder Pull Requests sind offen?"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="deploymentPlan">Deploy-Plan</label>

          <textarea
            id="deploymentPlan"
            rows={4}
            disabled={!canEdit || isSaving}
            value={values.deploymentPlan}
            onChange={(event) =>
              updateValue("deploymentPlan", event.target.value)
            }
            placeholder="Letzter Merge, nächster geplanter Release, Besonderheiten ..."
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cicdStatus">CI/CD</label>

          <textarea
            id="cicdStatus"
            rows={4}
            disabled={!canEdit || isSaving}
            value={values.cicdStatus}
            onChange={(event) => updateValue("cicdStatus", event.target.value)}
            placeholder="Pipeline-Status und bekannte Probleme"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="environments">Wichtige Umgebungen</label>

          <textarea
            id="environments"
            rows={4}
            disabled={!canEdit || isSaving}
            value={values.environments}
            onChange={(event) =>
              updateValue("environments", event.target.value)
            }
            placeholder="Staging, Testsysteme, Versionen, Besonderheiten ..."
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Bekannte Risiken / Probleme</h2>

            <p>
              Bugs, instabile Systeme und Abhängigkeiten, die bekannt sein
              sollten.
            </p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="knownRisks">Risiken und Probleme</label>

          <textarea
            id="knownRisks"
            rows={5}
            disabled={!canEdit || isSaving}
            value={values.knownRisks}
            onChange={(event) => updateValue("knownRisks", event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="dependencies">Abhängigkeiten</label>

          <textarea
            id="dependencies"
            rows={4}
            disabled={!canEdit || isSaving}
            value={values.dependencies}
            onChange={(event) =>
              updateValue("dependencies", event.target.value)
            }
            placeholder="Andere Teams, externe Systeme oder Ansprechpartner"
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Dokumentation & Links</h2>

            <p>Wichtige technische Dokumentation, Repositories und Tickets.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="technicalDocumentation">
            Technische Dokumentation
          </label>

          <textarea
            id="technicalDocumentation"
            rows={3}
            disabled={!canEdit || isSaving}
            value={values.technicalDocumentation}
            onChange={(event) =>
              updateValue("technicalDocumentation", event.target.value)
            }
            placeholder="Confluence, technische Doku ..."
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="repositories">Repository / Repositories</label>

          <textarea
            id="repositories"
            rows={3}
            disabled={!canEdit || isSaving}
            value={values.repositories}
            onChange={(event) =>
              updateValue("repositories", event.target.value)
            }
            placeholder="GitHub- oder GitLab-Links"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="tickets">Tickets</label>

          <textarea
            id="tickets"
            rows={3}
            disabled={!canEdit || isSaving}
            value={values.tickets}
            onChange={(event) => updateValue("tickets", event.target.value)}
            placeholder="Jira-Board, relevante Filter oder Tickets"
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Sonstiges / Hinweise</h2>

            <p>Alles, was sonst noch für die Vertretung wichtig ist.</p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="notes">Hinweise</label>

          <textarea
            id="notes"
            rows={6}
            disabled={!canEdit || isSaving}
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
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={isSaving}
          onClick={() => router.push("/absences")}
        >
          Zurück
        </button>

        {canEdit ? (
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSaving}
          >
            {isSaving ? "Speichert …" : "Übergabe speichern"}
          </button>
        ) : null}
      </div>
    </form>
  );
};

VacationHandoverForm.displayName = "VacationHandoverForm";
