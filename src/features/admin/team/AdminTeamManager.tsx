"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import type { TeamMember, TeamMemberRole } from "@/types/team";

import { createTeamMember, updateTeamMember } from "./actions";

import styles from "./AdminTeamManager.module.css";

interface AdminTeamManagerProps {
  teamMembers: TeamMember[];
  currentUserId: string;
}

interface TeamMemberFormState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  username: string;
  role: TeamMemberRole;
  active: boolean;
}

const EMPTY_FORM: TeamMemberFormState = {
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  username: "",
  role: "member",
  active: true,
};

const getFormState = (teamMember: TeamMember): TeamMemberFormState => {
  return {
    firstName: teamMember.firstName,
    lastName: teamMember.lastName,
    displayName: teamMember.displayName,
    email: teamMember.email,
    username: teamMember.username ?? "",
    role: teamMember.role,
    active: teamMember.active,
  };
};

export const AdminTeamManager = ({
  teamMembers,
  currentUserId,
}: AdminTeamManagerProps) => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");

  const [editingTeamMemberId, setEditingTeamMemberId] = useState<string>();

  const [createForm, setCreateForm] = useState<TeamMemberFormState>(EMPTY_FORM);

  const [editForm, setEditForm] = useState<TeamMemberFormState>(EMPTY_FORM);

  const [error, setError] = useState<string>();

  const [success, setSuccess] = useState<string>();

  const [isSaving, setIsSaving] = useState(false);

  const filteredTeamMembers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) {
      return teamMembers;
    }

    return teamMembers.filter(
      (member) =>
        member.displayName.toLowerCase().includes(normalized) ||
        member.email.toLowerCase().includes(normalized) ||
        member.username?.toLowerCase().includes(normalized),
    );
  }, [searchTerm, teamMembers]);

  const activeCount = teamMembers.filter((member) => member.active).length;

  const adminCount = teamMembers.filter(
    (member) => member.active && member.role === "admin",
  ).length;

  const updateCreateField = <Key extends keyof TeamMemberFormState>(
    key: Key,
    value: TeamMemberFormState[Key],
  ) => {
    setCreateForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(undefined);
    setSuccess(undefined);
  };

  const updateEditField = <Key extends keyof TeamMemberFormState>(
    key: Key,
    value: TeamMemberFormState[Key],
  ) => {
    setEditForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError(undefined);
    setSuccess(undefined);
  };

  const startEditing = (teamMember: TeamMember) => {
    setEditingTeamMemberId(teamMember.id);

    setEditForm(getFormState(teamMember));

    setError(undefined);
    setSuccess(undefined);
  };

  const cancelEditing = () => {
    setEditingTeamMemberId(undefined);

    setEditForm(EMPTY_FORM);

    setError(undefined);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(undefined);
    setSuccess(undefined);
    setIsSaving(true);

    try {
      const result = await createTeamMember({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        displayName: createForm.displayName,
        email: createForm.email,
        username: createForm.username,
        role: createForm.role,
      });

      if (!result.success) {
        setError(
          result.error ?? "Das Teammitglied konnte nicht angelegt werden.",
        );

        return;
      }

      setCreateForm(EMPTY_FORM);

      setSuccess("Teammitglied wurde angelegt.");

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    teamMemberId: string,
  ) => {
    event.preventDefault();

    setError(undefined);
    setSuccess(undefined);
    setIsSaving(true);

    try {
      const result = await updateTeamMember({
        id: teamMemberId,

        firstName: editForm.firstName,

        lastName: editForm.lastName,

        displayName: editForm.displayName,

        email: editForm.email,

        username: editForm.username,

        role: editForm.role,

        active: editForm.active,
      });

      if (!result.success) {
        setError(
          result.error ?? "Das Teammitglied konnte nicht gespeichert werden.",
        );

        return;
      }

      setEditingTeamMemberId(undefined);

      setSuccess("Teammitglied wurde gespeichert.");

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.summary}>
        <div>
          <span>Teammitglieder</span>

          <strong>{teamMembers.length}</strong>
        </div>

        <div>
          <span>Aktiv</span>

          <strong>{activeCount}</strong>
        </div>

        <div>
          <span>Administratoren</span>

          <strong>{adminCount}</strong>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Teammitglied anlegen</h2>

            <p>
              Neue Personen werden standardmäßig als aktive Teammitglieder
              angelegt.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="new-first-name">Vorname</label>

              <input
                id="new-first-name"
                required
                value={createForm.firstName}
                onChange={(event) =>
                  updateCreateField("firstName", event.target.value)
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-last-name">Nachname</label>

              <input
                id="new-last-name"
                required
                value={createForm.lastName}
                onChange={(event) =>
                  updateCreateField("lastName", event.target.value)
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-display-name">Anzeigename</label>

              <input
                id="new-display-name"
                required
                value={createForm.displayName}
                onChange={(event) =>
                  updateCreateField("displayName", event.target.value)
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-email">E-Mail</label>

              <input
                id="new-email"
                type="email"
                required
                value={createForm.email}
                onChange={(event) =>
                  updateCreateField("email", event.target.value)
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-username">Benutzername</label>

              <input
                id="new-username"
                value={createForm.username}
                onChange={(event) =>
                  updateCreateField("username", event.target.value)
                }
                placeholder="Optional"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="new-role">Rolle</label>

              <select
                id="new-role"
                value={createForm.role}
                onChange={(event) =>
                  updateCreateField(
                    "role",
                    event.target.value as TeamMemberRole,
                  )
                }
              >
                <option value="member">Mitglied</option>

                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <p className={styles.hint}>
            Der Benutzername alleine aktiviert noch keinen Login. Das Passwort
            verwalten wir getrennt im Auth-Bereich.
          </p>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSaving}
            >
              {isSaving ? "Speichern..." : "Teammitglied anlegen"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Team verwalten</h2>

            <p>Stammdaten, Rollen und Aktivstatus bearbeiten.</p>
          </div>

          <div className={styles.search}>
            <label htmlFor="admin-team-search">Team durchsuchen</label>

            <input
              id="admin-team-search"
              type="search"
              placeholder="Name, E-Mail oder Benutzername"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
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

        <div className={styles.list}>
          {filteredTeamMembers.map((teamMember) => {
            const isEditing = editingTeamMemberId === teamMember.id;

            const isCurrentUser = teamMember.id === currentUserId;

            if (isEditing) {
              return (
                <form
                  key={teamMember.id}
                  className={`${styles.card} ${styles.editCard}`}
                  onSubmit={(event) => void handleUpdate(event, teamMember.id)}
                >
                  <div className={styles.fields}>
                    <div className={styles.field}>
                      <label htmlFor={`first-name-${teamMember.id}`}>
                        Vorname
                      </label>

                      <input
                        id={`first-name-${teamMember.id}`}
                        required
                        value={editForm.firstName}
                        onChange={(event) =>
                          updateEditField("firstName", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor={`last-name-${teamMember.id}`}>
                        Nachname
                      </label>

                      <input
                        id={`last-name-${teamMember.id}`}
                        required
                        value={editForm.lastName}
                        onChange={(event) =>
                          updateEditField("lastName", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor={`display-name-${teamMember.id}`}>
                        Anzeigename
                      </label>

                      <input
                        id={`display-name-${teamMember.id}`}
                        required
                        value={editForm.displayName}
                        onChange={(event) =>
                          updateEditField("displayName", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor={`email-${teamMember.id}`}>E-Mail</label>

                      <input
                        id={`email-${teamMember.id}`}
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(event) =>
                          updateEditField("email", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor={`username-${teamMember.id}`}>
                        Benutzername
                      </label>

                      <input
                        id={`username-${teamMember.id}`}
                        value={editForm.username}
                        onChange={(event) =>
                          updateEditField("username", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor={`role-${teamMember.id}`}>Rolle</label>

                      <select
                        id={`role-${teamMember.id}`}
                        value={editForm.role}
                        disabled={isCurrentUser}
                        onChange={(event) =>
                          updateEditField(
                            "role",
                            event.target.value as TeamMemberRole,
                          )
                        }
                      >
                        <option value="member">Mitglied</option>

                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <label className={styles.activeToggle}>
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      disabled={isCurrentUser}
                      onChange={(event) =>
                        updateEditField("active", event.target.checked)
                      }
                    />

                    <span>Teammitglied aktiv</span>
                  </label>

                  {isCurrentUser ? (
                    <p className={styles.hint}>
                      Deine eigene Admin-Rolle und dein Aktivstatus können hier
                      nicht geändert werden.
                    </p>
                  ) : null}

                  <div className={styles.actions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isSaving}
                    >
                      {isSaving ? "Speichern..." : "Speichern"}
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={isSaving}
                      onClick={cancelEditing}
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <article key={teamMember.id} className={styles.card}>
                <div className={styles.member}>
                  <div className={styles.avatar} aria-hidden="true">
                    {teamMember.firstName.charAt(0).toUpperCase()}

                    {teamMember.lastName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{teamMember.displayName}</strong>

                    <span>{teamMember.email}</span>

                    <span>
                      Benutzername:{" "}
                      {teamMember.username ?? "Nicht eingerichtet"}
                    </span>
                  </div>
                </div>

                <div className={styles.badges}>
                  <span className={styles.badge}>
                    {teamMember.role === "admin" ? "Admin" : "Mitglied"}
                  </span>

                  <span
                    className={`${styles.badge} ${
                      teamMember.active
                        ? styles.activeBadge
                        : styles.inactiveBadge
                    }`}
                  >
                    {teamMember.active ? "Aktiv" : "Deaktiviert"}
                  </span>

                  {isCurrentUser ? (
                    <span className={styles.badge}>Du</span>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => startEditing(teamMember)}
                >
                  Bearbeiten
                </button>
              </article>
            );
          })}
        </div>

        {filteredTeamMembers.length === 0 ? (
          <p className={styles.empty}>Keine Teammitglieder gefunden.</p>
        ) : null}
      </section>
    </div>
  );
};

AdminTeamManager.displayName = "AdminTeamManager";
