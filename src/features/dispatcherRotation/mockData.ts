import { generateRotations } from "@/features/rotations/utils";
import { teamMembers } from "@/features/team/mockData";

export const dispatcherRotations = generateRotations({
  teamMembers,
  startDate: "2026-08-31",
  numberOfWeeks: 12,
  type: "dispatcher",
  startIndex: 0,
});
