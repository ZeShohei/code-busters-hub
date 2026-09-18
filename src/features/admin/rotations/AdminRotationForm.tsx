"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import type { RotationConfig, TeamMember } from "@/types/team";

import { formatDate, parseDate } from "@/utils/date";

import { updateRotationConfig } from "./actions";

import styles from "./AdminRotationForm.module.css";

interface AdminRotationFormProps {
  title: string;
  config: RotationConfig;
  teamMembers: TeamMember[];
}

type DeploymentScheduleMode = "continue" | "restart";

const getThursdayOnOrAfter = (dateString: string) => {
  const date = parseDate(dateString);

  const currentDay = date.getDay();

  const thursday = 4;

  const daysUntilThursday = (thursday - currentDay + 7) % 7;

  date.setDate(date.getDate() + daysUntilThursday);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getWeekdayLabel = (dateString: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    weekday: "long",
  }).format(parseDate(dateString));
};

export const AdminRotationForm = ({
  title,
  config,
  teamMembers,
}: AdminRotationFormProps) => {
  const router = useRouter();

  const activeTeamMembers = teamMembers.filter((member) => member.active);

  const initialParticipantIds = config.participantTeamMemberIds.filter((id) =>
    activeTeamMembers.some((member) => member.id === id),
  );

  const initialStartTeamMemberId =
    initialParticipantIds[config.startIndex] ?? initialParticipantIds[0] ?? "";

  const [participantTeamMemberIds, setParticipantTeamMemberIds] = useState(
    initialParticipantIds,
  );

  const [startDate, setStartDate] = useState(config.startDate);

  const [numberOfWeeks, setNumberOfWeeks] = useState(config.numberOfWeeks);

  const [startTeamMemberId, setStartTeamMemberId] = useState(
    initialStartTeamMemberId,
  );

  const [deploymentStartsWithT2, setDeploymentStartsWithT2] = useState(
    config.deploymentStartsWithT2,
  );

  /*
   * Standardmäßig führen wir bei einer neuen
   * Deployment-Version den bestehenden Rhythmus fort.
   */
  const [deploymentScheduleMode, setDeploymentScheduleMode] =
    useState<DeploymentScheduleMode>("continue");

  const [error, setError] = useState<string>();

  const [success, setSuccess] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const isDeployment = config.type === "deployment";

  /*
   * Diese Vorschau ist nur für einen bewussten
   * Neustart relevant.
   *
   * Beim Fortsetzen wird der tatsächliche nächste
   * Deployment-Slot serverseitig aus der bisherigen
   * Rotation berechnet.
   */
  const firstRestartDeploymentDate = useMemo(() => {
    if (!isDeployment || !startDate || deploymentScheduleMode !== "restart") {
      return undefined;
    }

    return getThursdayOnOrAfter(startDate);
  }, [deploymentScheduleMode, isDeployment, startDate]);

  const getTeamMember = (id: string) => {
    return activeTeamMembers.find((member) => member.id === id);
  };

  const firstInternalTeamMember = getTeamMember(startTeamMemberId);

  const toggleParticipant = (teamMemberId: string) => {
    setSuccess(undefined);
    setError(undefined);

    setParticipantTeamMemberIds((current) => {
      if (current.includes(teamMemberId)) {
        const next = current.filter((id) => id !== teamMemberId);

        if (startTeamMemberId === teamMemberId) {
          setStartTeamMemberId(next[0] ?? "");
        }

        return next;
      }

      const next = [...current, teamMemberId];

      if (!startTeamMemberId) {
        setStartTeamMemberId(teamMemberId);
      }

      return next;
    });
  };

  const moveParticipant = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= participantTeamMemberIds.length) {
      return;
    }

    setParticipantTeamMemberIds((current) => {
      const next = [...current];

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next;
    });

    setSuccess(undefined);
    setError(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setSuccess(undefined);
    setIsSaving(true);

    try {
      const result = await updateRotationConfig({
        type: config.type,

        startDate,

        numberOfWeeks,

        participantTeamMemberIds,

        startTeamMemberId,

        deploymentStartsWithT2,

        deploymentScheduleMode: isDeployment
          ? deploymentScheduleMode
          : "restart",
      });

      if (!result.success) {
        setError(
          result.error ?? "Die Rotation konnte nicht gespeichert werden.",
        );

        return;
      }

      if (isDeployment && result.continued && result.effectiveStartDate) {
        setSuccess(
          `Der bestehende Deployment-Rhythmus wurde fortgeführt. Die neue Konfiguration beginnt mit dem nächsten regulären Deployment am ${formatDate(
            result.effectiveStartDate,
          )}.`,
        );
      } else {
        setSuccess(
          "Rotationskonfiguration wurde gespeichert. Frühere Rotationen bleiben unverändert.",
        );
      }

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <div>
          <h2>{title}</h2>

          <p>
            {isDeployment
              ? "T2 Team und Code Busters wechseln sich bei den zweiwöchigen Deployments ab."
              : "Teilnehmer und Reihenfolge dieser Rotation verwalten. Änderungen gelten ab dem gewählten Datum."}
          </p>
        </div>
      </div>

      <div className={styles.info}>
        <strong>
          {isDeployment
            ? "Deployment alle zwei Wochen"
            : "Versionierte Rotation"}
        </strong>

        <p>
          {isDeployment
            ? "Alle zwei Wochen findet donnerstags ein Deployment statt. T2 Team und Code Busters wechseln sich dabei ab. Bei einem Code-Busters-Termin wird die interne Personenrotation um genau eine Person weitergeschaltet."
            : "Beim Speichern wird die bestehende Historie nicht überschrieben. Die neue Konfiguration gilt erst ab dem angegebenen Datum."}
        </p>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${config.type}-start-date`}>
            {isDeployment ? "Änderung gültig ab" : "Gültig ab"}
          </label>

          <input
            id={`${config.type}-start-date`}
            type="date"
            required
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);

              setSuccess(undefined);

              setError(undefined);
            }}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${config.type}-weeks`}>
            {isDeployment ? "Planungszeitraum in Wochen" : "Anzahl Wochen"}
          </label>

          <input
            id={`${config.type}-weeks`}
            type="number"
            min={1}
            required
            value={numberOfWeeks}
            onChange={(event) => {
              setNumberOfWeeks(Number(event.target.value));

              setSuccess(undefined);

              setError(undefined);
            }}
          />
        </div>
      </div>

      {isDeployment ? (
        <>
          <div className={styles.field}>
            <label htmlFor="deployment-schedule-mode">
              Verhalten des Deployment-Rhythmus
            </label>

            <select
              id="deployment-schedule-mode"
              value={deploymentScheduleMode}
              onChange={(event) => {
                setDeploymentScheduleMode(
                  event.target.value as DeploymentScheduleMode,
                );

                setSuccess(undefined);

                setError(undefined);
              }}
            >
              <option value="continue">Rhythmus fortsetzen</option>

              <option value="restart">Rotation neu starten</option>
            </select>
          </div>

          {deploymentScheduleMode === "continue" ? (
            <div className={styles.info}>
              <strong>Bestehenden Rhythmus fortsetzen</strong>

              <p>
                Der nächste reguläre Deployment-Termin wird automatisch aus der
                bisherigen Rotation ermittelt. Dabei bleiben sowohl der Wechsel
                zwischen T2 Team und Code Busters als auch die interne
                Code-Busters-Reihenfolge erhalten.
              </p>

              <p>
                Das gewählte Datum ist der frühestmögliche Zeitpunkt der
                Änderung. Die neue Konfiguration beginnt tatsächlich mit dem
                ersten regulären Deployment ab diesem Datum.
              </p>
            </div>
          ) : (
            <div className={styles.info}>
              <strong>Rotation bewusst neu starten</strong>

              <p>
                Verwende diese Option nur, wenn T2/Code-Busters und die interne
                Personenrotation ab diesem Zeitpunkt bewusst neu festgelegt
                werden sollen.
              </p>
            </div>
          )}
        </>
      ) : null}

      {isDeployment && deploymentScheduleMode === "restart" ? (
        <div className={styles.field}>
          <label htmlFor="deployment-first-team">
            Erstes Deployment der neuen Rotation
          </label>

          <select
            id="deployment-first-team"
            value={deploymentStartsWithT2 ? "t2" : "code-busters"}
            onChange={(event) => {
              setDeploymentStartsWithT2(event.target.value === "t2");

              setSuccess(undefined);

              setError(undefined);
            }}
          >
            <option value="t2">T2 Team</option>

            <option value="code-busters">Code Busters</option>
          </select>
        </div>
      ) : null}

      {isDeployment &&
      deploymentScheduleMode === "restart" &&
      firstRestartDeploymentDate ? (
        <div className={styles.info}>
          <strong>Erster regulärer Deployment-Termin</strong>

          <p>
            {getWeekdayLabel(firstRestartDeploymentDate)},{" "}
            {formatDate(firstRestartDeploymentDate)}
            {" – "}
            {deploymentStartsWithT2
              ? "T2 Team"
              : (firstInternalTeamMember?.displayName ?? "Code Busters")}
            .
          </p>

          <p>
            Danach:{" "}
            {deploymentStartsWithT2
              ? `${
                  firstInternalTeamMember?.displayName ?? "Code Busters"
                } → T2 Team → nächste Code-Busters-Person → T2 Team`
              : "T2 Team → nächste Code-Busters-Person → T2 Team"}
            .
          </p>
        </div>
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend>Teilnehmer</legend>

        <div className={styles.checkboxList}>
          {activeTeamMembers.map((teamMember) => (
            <label key={teamMember.id} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={participantTeamMemberIds.includes(teamMember.id)}
                onChange={() => toggleParticipant(teamMember.id)}
              />

              <span>{teamMember.displayName}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Reihenfolge</legend>

        {participantTeamMemberIds.length === 0 ? (
          <p>Noch keine Teilnehmer ausgewählt.</p>
        ) : (
          <ol className={styles.participantList}>
            {participantTeamMemberIds.map((teamMemberId, index) => {
              const teamMember = getTeamMember(teamMemberId);

              if (!teamMember) {
                return null;
              }

              return (
                <li key={teamMemberId} className={styles.participant}>
                  <span>
                    {index + 1}. {teamMember.displayName}
                  </span>

                  <div className={styles.orderActions}>
                    <button
                      type="button"
                      aria-label={`${teamMember.displayName} nach oben verschieben`}
                      disabled={index === 0}
                      onClick={() => moveParticipant(index, -1)}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`${teamMember.displayName} nach unten verschieben`}
                      disabled={index === participantTeamMemberIds.length - 1}
                      onClick={() => moveParticipant(index, 1)}
                    >
                      ↓
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </fieldset>

      {/*
       * Beim Fortsetzen wird die nächste Person
       * automatisch aus der bisherigen Rotation
       * bestimmt.
       *
       * Nur Dispatcher und bewusster Deployment-
       * Neustart benötigen eine manuelle Startperson.
       */}
      {!isDeployment || deploymentScheduleMode === "restart" ? (
        <div className={styles.field}>
          <label htmlFor={`${config.type}-start-member`}>
            {isDeployment
              ? "Erste Code-Busters-Person"
              : "Erste Person der Rotation"}
          </label>

          <select
            id={`${config.type}-start-member`}
            required
            value={startTeamMemberId}
            onChange={(event) => {
              setStartTeamMemberId(event.target.value);

              setSuccess(undefined);

              setError(undefined);
            }}
          >
            <option value="">Bitte auswählen</option>

            {participantTeamMemberIds.map((teamMemberId) => {
              const teamMember = getTeamMember(teamMemberId);

              if (!teamMember) {
                return null;
              }

              return (
                <option key={teamMember.id} value={teamMember.id}>
                  {teamMember.displayName}
                </option>
              );
            })}
          </select>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className={styles.success} role="status">
          {success}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSaving}
        >
          {isSaving ? "Speichern..." : "Rotation speichern"}
        </button>
      </div>
    </form>
  );
};

AdminRotationForm.displayName = "AdminRotationForm";
