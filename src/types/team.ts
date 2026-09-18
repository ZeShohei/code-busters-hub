export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  active: boolean;
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
  absenceId: string;
  teamMemberId: string;
  substituteTeamMemberId: string;
  startDate: string;
  endDate: string;
}

export interface RotationAssignment {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  type: "deployment" | "dispatcher";
}

export interface RotationConfig {
  participantTeamMemberIds: string[];
  startDate: string;
  numberOfWeeks: number;
  startIndex: number;
  type: RotationAssignment["type"];
}

export type RotationStatus = "regular" | "substitution" | "uncovered";

export interface RotationResolution {
  status: RotationStatus;
  assignedTeamMemberId: string;
  effectiveTeamMemberId: string;
}
