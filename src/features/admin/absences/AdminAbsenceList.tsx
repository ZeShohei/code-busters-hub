"use client";

import Link from "next/link";

import { formatDate } from "@/utils/date";
import type { Absence, Substitution, TeamMember } from "@/types/team";

import styles from "./AdminAbsenceList.module.css";

interface AdminAbsenceListProps {
  teamMembers: TeamMember[];
  absences: Absence[];
  substitutions: Substitution[];
}

export const AdminAbsenceList = ({
  teamMembers,
  absences,
  substitutions,
}: AdminAbsenceListProps) => {
  const getTeamMember = (teamMemberId: string) => {
    return teamMembers.find((member) => member.id === teamMemberId);
  };

  const getAbsenceTypeLabel = (type: Absence["type"]) => {
    switch (type) {
      case "vacation":
        return "Urlaub";

      case "sickLeave":
        return "Krankenstand";

      case "other":
        return "Sonstige Abwesenheit";
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Abwesenheiten</h2>

        <Link href="/admin/absences/new" className={styles.addButton}>
          + Abwesenheit hinzufügen
        </Link>
      </div>

      {absences.length === 0 ? (
        <p>Keine Abwesenheiten vorhanden.</p>
      ) : (
        <div className={styles.list}>
          {absences.map((absence) => {
            const teamMember = getTeamMember(absence.teamMemberId);

            const substitution = substitutions.find(
              (item) => item.absenceId === absence.id,
            );

            const substitute = substitution
              ? getTeamMember(substitution.substituteTeamMemberId)
              : undefined;

            return (
              <article key={absence.id} className={styles.item}>
                <div>
                  <strong>{teamMember?.displayName ?? "Unbekannt"}</strong>

                  <p>
                    {formatDate(absence.startDate)}
                    {" – "}
                    {formatDate(absence.endDate)}
                  </p>

                  <p>Typ: {getAbsenceTypeLabel(absence.type)}</p>

                  <p>Vertretung: {substitute?.displayName ?? "Keine"}</p>
                </div>

                <div className={styles.actions}>
                  <Link href={`/admin/absences/${absence.id}/edit`}>
                    Bearbeiten
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

AdminAbsenceList.displayName = "AdminAbsenceList";
