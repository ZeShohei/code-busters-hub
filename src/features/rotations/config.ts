import type { RotationConfig } from "@/types/team";

export const dispatcherRotationConfig: RotationConfig = {
  participantTeamMemberIds: ["1", "2", "3"],
  startDate: "2026-08-31",
  numberOfWeeks: 12,
  startIndex: 0,
  type: "dispatcher",
};

export const deploymentRotationConfig: RotationConfig = {
  participantTeamMemberIds: ["1", "2", "3"],
  startDate: "2026-08-31",
  numberOfWeeks: 12,
  startIndex: 1,
  type: "deployment",
};
