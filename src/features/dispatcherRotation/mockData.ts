import { dispatcherRotationConfig } from "@/features/rotations/config";
import { generateRotations } from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";

const dispatcherTeamMembers = teamMembers.filter((teamMember) =>
  dispatcherRotationConfig.participantTeamMemberIds.includes(teamMember.id),
);

export const dispatcherRotations = generateRotations({
  teamMembers: dispatcherTeamMembers,
  startDate: dispatcherRotationConfig.startDate,
  numberOfWeeks: dispatcherRotationConfig.numberOfWeeks,
  type: dispatcherRotationConfig.type,
  startIndex: dispatcherRotationConfig.startIndex,
});
