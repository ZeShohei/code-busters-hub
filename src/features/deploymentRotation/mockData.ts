import type { RotationAssignment } from "@/types/team";

export const deploymentRotations: RotationAssignment[] = [
  {
    id: "deployment-1",
    teamMemberId: "2",
    startDate: "2026-08-31",
    endDate: "2026-09-06",
    type: "deployment",
  },
  {
    id: "deployment-2",
    teamMemberId: "3",
    startDate: "2026-09-07",
    endDate: "2026-09-13",
    type: "deployment",
  },
  {
    id: "deployment-3",
    teamMemberId: "1",
    startDate: "2026-09-14",
    endDate: "2026-09-20",
    type: "deployment",
  },
  {
    id: "deployment-4",
    teamMemberId: "2",
    startDate: "2026-09-21",
    endDate: "2026-09-27",
    type: "deployment",
  },
  {
    id: "deployment-5",
    teamMemberId: "3",
    startDate: "2026-09-28",
    endDate: "2026-10-04",
    type: "deployment",
  },
  {
    id: "deployment-6",
    teamMemberId: "1",
    startDate: "2026-10-05",
    endDate: "2026-10-11",
    type: "deployment",
  },
];
