import type { Absence, Substitution } from "@/types/team";

export const absences: Absence[] = [
  {
    id: "absence-1",
    teamMemberId: "1",
    startDate: "2026-09-07",
    endDate: "2026-09-11",
    type: "vacation",
  },
  {
    id: "absence-2",
    teamMemberId: "3",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    type: "vacation",
  },
  {
    id: "absence-3",
    teamMemberId: "2",
    startDate: "2026-09-28",
    endDate: "2026-10-02",
    type: "vacation",
  },
];

export const substitutions: Substitution[] = [
  {
    id: "substitution-1",
    teamMemberId: "1",
    substituteTeamMemberId: "2",
    startDate: "2026-09-07",
    endDate: "2026-09-11",
  },
  {
    id: "substitution-2",
    teamMemberId: "3",
    substituteTeamMemberId: "1",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
  },
  {
    id: "substitution-3",
    teamMemberId: "2",
    substituteTeamMemberId: "3",
    startDate: "2026-09-28",
    endDate: "2026-10-02",
  },
];
