"use client";

import Link from "next/link";

import { useMemo, useState } from "react";

import type { TeamMember } from "@/types/team";

import styles from "./AdminTeamList.module.css";

interface AdminTeamListProps {
  teamMembers: TeamMember[];
}

export const AdminTeamList = ({ teamMembers }: AdminTeamListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeamMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = normalizedSearch
      ? teamMembers.filter(
          (teamMember) =>
            teamMember.displayName.toLowerCase().includes(normalizedSearch) ||
            teamMember.email.toLowerCase().includes(normalizedSearch) ||
            teamMember.username?.toLowerCase().includes(normalizedSearch),
        )
      : teamMembers;

    return [...filtered].sort((first, second) => {
      /*
       * Aktive Personen zuerst.
       */
      if (first.active !== second.active) {
        return first.active ? -1 : 1;
      }

      /*
       * Innerhalb der Gruppen
       * alphabetisch sortieren.
       */
      return first.displayName.localeCompare(second.displayName, "de");
    });
  }, [searchTerm, teamMembers]);

  if (teamMembers.length === 0) {
    return <p>Es sind noch keine Teammitglieder vorhanden.</p>;
  }

  const activeCount = teamMembers.filter(
    (teamMember) => teamMember.active,
  ).length;

  return (
    <section className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <label htmlFor="admin-team-search">Team durchsuchen</label>

          <input
            id="admin-team-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Name, E-Mail oder Benutzername"
          />
        </div>

        <div className={styles.statistics}>
          <span>
            {filteredTeamMembers.length} von {teamMembers.length} Personen
          </span>

          <span>{activeCount} aktiv</span>
        </div>
      </div>

      {filteredTeamMembers.length === 0 ? (
        <p className={styles.empty}>
          Keine Teammitglieder für diese Suche gefunden.
        </p>
      ) : (
        <div className={styles.list}>
          {filteredTeamMembers.map((teamMember) => (
            <article
              key={teamMember.id}
              className={`${styles.item} ${
                !teamMember.active ? styles.inactiveItem : ""
              }`}
            >
              <div className={styles.person}>
                <strong>{teamMember.displayName}</strong>

                <span className={styles.email}>{teamMember.email}</span>

                <span className={styles.email}>
                  Benutzername: {teamMember.username ?? "Nicht eingerichtet"}
                </span>
              </div>

              <div className={styles.badges}>
                <span
                  className={
                    teamMember.role === "admin"
                      ? styles.adminBadge
                      : styles.memberBadge
                  }
                >
                  {teamMember.role === "admin" ? "Admin" : "Mitglied"}
                </span>

                <span
                  className={
                    teamMember.active
                      ? styles.activeBadge
                      : styles.inactiveBadge
                  }
                >
                  {teamMember.active ? "Aktiv" : "Deaktiviert"}
                </span>
              </div>

              <Link
                href={`/admin/team/${teamMember.id}/edit`}
                className={styles.editLink}
              >
                Bearbeiten
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

AdminTeamList.displayName = "AdminTeamList";
