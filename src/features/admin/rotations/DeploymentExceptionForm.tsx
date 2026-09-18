"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { getRotationAssigneeName } from "@/features/rotations/utils";

import type {
  DeploymentException,
  DeploymentExceptionType,
  RotationAssignment,
  TeamMember,
} from "@/types/team";

import { formatDate, getDateRangeStatus } from "@/utils/date";

import {
  createDeploymentException,
  deleteDeploymentException,
} from "./actions";

import styles from "./DeploymentExceptionForm.module.css";

interface DeploymentExceptionFormProps {
  teamMembers: TeamMember[];
  exceptions: DeploymentException[];
  deploymentRotations: RotationAssignment[];
}

export const DeploymentExceptionForm = ({
  teamMembers,
  exceptions,
  deploymentRotations,
}: DeploymentExceptionFormProps) => {
  const router = useRouter();

  const activeTeamMembers = teamMembers.filter((member) => member.active);

  const [type, setType] = useState<DeploymentExceptionType>("rescheduled");

  const [originalDate, setOriginalDate] = useState("");

  const [deploymentDate, setDeploymentDate] = useState("");

  const [teamMemberId, setTeamMemberId] = useState("");

  const [reason, setReason] = useState("");

  const [error, setError] = useState<string>();

  const [success, setSuccess] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string>();

  /*
   * Nur noch nicht vergangene reguläre Deployments
   * dürfen verschoben werden.
   *
   * Bereits verschobene Deployments haben
   * deploymentKind === "rescheduled" und werden
   * deshalb hier nicht erneut angeboten.
   */
  const availableRegularDeployments = deploymentRotations
    .filter(
      (rotation) =>
        rotation.type === "deployment" &&
        rotation.deploymentKind === "regular" &&
        getDateRangeStatus(rotation.startDate, rotation.endDate) !== "past",
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));

  const getTeamMemberName = (id: string | null) => {
    if (!id) {
      return "Reguläre Zuständigkeit";
    }

    return (
      teamMembers.find((member) => member.id === id)?.displayName ?? "Unbekannt"
    );
  };

  /*
   * Findet zu einer bestehenden Verschiebung
   * die zugehörige generierte Rotation.
   *
   * Dadurch können wir auch bei teamMemberId === null
   * anzeigen, ob ursprünglich T2 oder ein Code-Busters-
   * Mitglied zuständig war.
   */
  const getExceptionRotation = (exception: DeploymentException) => {
    if (exception.type !== "rescheduled" || !exception.originalDate) {
      return undefined;
    }

    return deploymentRotations.find(
      (rotation) =>
        rotation.deploymentKind === "rescheduled" &&
        rotation.originalDate === exception.originalDate,
    );
  };

  const getExceptionAssigneeName = (exception: DeploymentException) => {
    if (exception.teamMemberId) {
      return getTeamMemberName(exception.teamMemberId);
    }

    const rotation = getExceptionRotation(exception);

    if (rotation) {
      return getRotationAssigneeName(rotation.teamMemberId, teamMembers);
    }

    return "Reguläre Zuständigkeit";
  };

  const handleTypeChange = (nextType: DeploymentExceptionType) => {
    setType(nextType);

    setOriginalDate("");
    setDeploymentDate("");
    setTeamMemberId("");
    setReason("");

    setError(undefined);
    setSuccess(undefined);
  };

  const handleOriginalDeploymentChange = (value: string) => {
    setOriginalDate(value);

    /*
     * Beim Wechsel des Ausgangstermins wird
     * eine eventuell manuell gewählte Person
     * zurückgesetzt.
     *
     * Ohne Override bleibt damit die reguläre
     * Zuständigkeit bestehen – also auch T2.
     */
    setTeamMemberId("");

    setError(undefined);
    setSuccess(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setSuccess(undefined);
    setIsSaving(true);

    try {
      const result = await createDeploymentException({
        type,

        originalDate: type === "rescheduled" ? originalDate : undefined,

        deploymentDate,

        teamMemberId: teamMemberId || undefined,

        reason,
      });

      if (!result.success) {
        setError(
          result.error ?? "Die Ausnahme konnte nicht gespeichert werden.",
        );

        return;
      }

      setOriginalDate("");
      setDeploymentDate("");
      setTeamMemberId("");
      setReason("");

      setSuccess(
        type === "rescheduled"
          ? "Deployment wurde verschoben."
          : "Sonderdeployment wurde hinzugefügt.",
      );

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Möchtest du diese Deployment-Ausnahme wirklich löschen?",
    );

    if (!confirmed) {
      return;
    }

    setError(undefined);
    setSuccess(undefined);
    setDeletingId(id);

    try {
      const result = await deleteDeploymentException(id);

      if (!result.success) {
        setError(result.error ?? "Die Ausnahme konnte nicht gelöscht werden.");

        return;
      }

      router.refresh();
    } finally {
      setDeletingId(undefined);
    }
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2>Deployment-Ausnahmen</h2>

          <p>
            Reguläre Deployments verschieben oder zusätzliche Sonderdeployments
            eintragen.
          </p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="deployment-exception-type">Art</label>

          <select
            id="deployment-exception-type"
            value={type}
            onChange={(event) =>
              handleTypeChange(event.target.value as DeploymentExceptionType)
            }
          >
            <option value="rescheduled">
              Reguläres Deployment verschieben
            </option>

            <option value="special">Sonderdeployment</option>
          </select>
        </div>

        <div className={styles.grid}>
          {type === "rescheduled" ? (
            <div className={styles.field}>
              <label htmlFor="original-deployment-date">
                Reguläres Deployment
              </label>

              <select
                id="original-deployment-date"
                required
                value={originalDate}
                onChange={(event) =>
                  handleOriginalDeploymentChange(event.target.value)
                }
              >
                <option value="">Bitte Deployment auswählen</option>

                {availableRegularDeployments.map((rotation) => (
                  <option key={rotation.id} value={rotation.startDate}>
                    {formatDate(rotation.startDate)}
                    {" – "}
                    {getRotationAssigneeName(
                      rotation.teamMemberId,
                      teamMembers,
                    )}
                  </option>
                ))}
              </select>

              {availableRegularDeployments.length === 0 ? (
                <span>
                  Aktuell gibt es keine kommenden regulären Deployments, die
                  verschoben werden können.
                </span>
              ) : null}
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="new-deployment-date">
              {type === "rescheduled" ? "Neuer Termin" : "Termin"}
            </label>

            <input
              id="new-deployment-date"
              type="date"
              required
              value={deploymentDate}
              onChange={(event) => {
                setDeploymentDate(event.target.value);

                setError(undefined);
                setSuccess(undefined);
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="deployment-team-member">Zuständig</label>

            <select
              id="deployment-team-member"
              required={type === "special"}
              value={teamMemberId}
              onChange={(event) => {
                setTeamMemberId(event.target.value);

                setError(undefined);
                setSuccess(undefined);
              }}
            >
              <option value="">
                {type === "rescheduled"
                  ? "Reguläre Zuständigkeit beibehalten"
                  : "Bitte auswählen"}
              </option>

              {activeTeamMembers.map((teamMember) => (
                <option key={teamMember.id} value={teamMember.id}>
                  {teamMember.displayName}
                </option>
              ))}
            </select>

            {type === "rescheduled" && originalDate ? (
              <span>
                Ohne Auswahl bleibt die ursprüngliche Zuständigkeit erhalten,
                also auch T2 Team bei einem T2-Termin.
              </span>
            ) : null}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="deployment-exception-reason">Grund / Hinweis</label>

          <textarea
            id="deployment-exception-reason"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);

              setError(undefined);
              setSuccess(undefined);
            }}
            placeholder="Optional, z. B. Feiertag, Hotfix oder Sonderrelease"
          />
        </div>

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
            disabled={
              isSaving ||
              (type === "rescheduled" &&
                availableRegularDeployments.length === 0)
            }
          >
            {isSaving
              ? "Speichern..."
              : type === "rescheduled"
                ? "Deployment verschieben"
                : "Sonderdeployment hinzufügen"}
          </button>
        </div>
      </form>

      <div className={styles.list}>
        <h3>Eingetragene Ausnahmen</h3>

        {exceptions.length === 0 ? (
          <p className={styles.empty}>Keine Deployment-Ausnahmen vorhanden.</p>
        ) : (
          exceptions.map((exception) => (
            <article key={exception.id} className={styles.item}>
              <div>
                <strong>
                  {exception.type === "rescheduled"
                    ? "Verschoben"
                    : "Sonderdeployment"}
                </strong>

                <span>
                  {exception.type === "rescheduled" && exception.originalDate
                    ? `${formatDate(exception.originalDate)} → ${formatDate(
                        exception.deploymentDate,
                      )}`
                    : formatDate(exception.deploymentDate)}
                </span>

                <span>Zuständig: {getExceptionAssigneeName(exception)}</span>

                {exception.reason ? <span>{exception.reason}</span> : null}
              </div>

              <button
                type="button"
                disabled={deletingId === exception.id}
                onClick={() => void handleDelete(exception.id)}
              >
                {deletingId === exception.id ? "Löscht..." : "Löschen"}
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

DeploymentExceptionForm.displayName = "DeploymentExceptionForm";
