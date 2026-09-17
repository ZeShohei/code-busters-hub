export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
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
