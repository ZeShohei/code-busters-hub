import Link from "next/link";

import type { TeamMember } from "@/types/team";

import styles from "./AdminTeamList.module.css";

interface AdminTeamListProps {
  teamMembers: TeamMember[];
}

export const AdminTeamList = ({ teamMembers }: AdminTeamListProps) => {
  if (teamMembers.length === 0) {
    return <p>Es sind noch keine Teammitglieder vorhanden.</p>;
  }

  return (
    <div className={styles.list}>
      {teamMembers.map((teamMember) => (
        <article key={teamMember.id} className={styles.item}>
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
                teamMember.active ? styles.activeBadge : styles.inactiveBadge
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
  );
};
