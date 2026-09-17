import type { TeamMember } from "@/types/team";

export const getTeamMemberName = (
  teamMemberId: string,
  teamMembers: TeamMember[],
) => {
  const teamMember = teamMembers.find((member) => member.id === teamMemberId);

  return teamMember?.displayName ?? "Unbekannt";
};
