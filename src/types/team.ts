export type TeamMemberRole = "admin" | "member";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  username: string | null;
  active: boolean;
  role: TeamMemberRole;
}

export interface Absence {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  type: "vacation" | "sickLeave" | "other";
}

export interface Substitution {
  id: string;

  /*
   * Eindeutige fachliche Zuordnung.
   * Wenn eine Vertretung für eine konkrete
   * Abwesenheit gesucht wird, immer diese ID
   * verwenden.
   */
  absenceId: string;

  /*
   * Convenience-Daten aus der zugehörigen
   * Abwesenheit für Übersichten und Filter.
   */
  teamMemberId: string;
  startDate: string;
  endDate: string;

  substituteTeamMemberId: string;
}

export type DeploymentKind = "regular" | "rescheduled" | "special";

export interface RotationAssignment {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  type: "deployment" | "dispatcher";

  deploymentKind?: DeploymentKind;
  originalDate?: string;
  reason?: string;
}

export interface RotationConfig {
  participantTeamMemberIds: string[];
  startDate: string;
  numberOfWeeks: number;
  startIndex: number;
  type: RotationAssignment["type"];
}

export type DeploymentExceptionType = "rescheduled" | "special";

export interface DeploymentException {
  id: string;
  type: DeploymentExceptionType;

  originalDate: string | null;
  deploymentDate: string;

  teamMemberId: string | null;

  reason: string | null;
}

export type RotationStatus = "regular" | "substitution" | "uncovered";

export interface RotationResolution {
  status: RotationStatus;
  assignedTeamMemberId: string;
  effectiveTeamMemberId: string;
}
