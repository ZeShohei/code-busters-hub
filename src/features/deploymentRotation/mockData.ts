import { teamMembers } from "@/data/mockData";
import { deploymentRotationConfig } from "@/features/rotations/config";
import { generateRotations } from "@/features/rotations/utils";

const deploymentTeamMembers = teamMembers.filter((teamMember) =>
  deploymentRotationConfig.participantTeamMemberIds.includes(teamMember.id),
);

export const deploymentRotations = generateRotations({
  teamMembers: deploymentTeamMembers,
  startDate: deploymentRotationConfig.startDate,
  numberOfWeeks: deploymentRotationConfig.numberOfWeeks,
  type: deploymentRotationConfig.type,
  startIndex: deploymentRotationConfig.startIndex,
});
