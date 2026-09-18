import "server-only";

import { generateRotations } from "@/features/rotations/utils";
import { prisma } from "@/lib/prisma";
import type {
  Absence,
  RotationConfig,
  Substitution,
  TeamMember,
} from "@/types/team";

const toDateString = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const getAppData = async () => {
  const [teamMemberRows, absenceRows, substitutionRows, rotationConfigRows] =
    await Promise.all([
      prisma.teamMember.findMany({
        orderBy: {
          displayName: "asc",
        },
      }),

      prisma.absence.findMany({
        orderBy: {
          startDate: "asc",
        },
      }),

      prisma.substitution.findMany({
        orderBy: {
          startDate: "asc",
        },
      }),

      prisma.rotationConfig.findMany({
        include: {
          participants: {
            orderBy: {
              position: "asc",
            },
          },
        },
      }),
    ]);

  const teamMembers: TeamMember[] = teamMemberRows.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    displayName: member.displayName,
    email: member.email,
  }));

  const absences: Absence[] = absenceRows.map((absence) => ({
    id: absence.id,
    teamMemberId: absence.teamMemberId,
    startDate: toDateString(absence.startDate),
    endDate: toDateString(absence.endDate),
    type: absence.type,
  }));

  const substitutions: Substitution[] = substitutionRows.map(
    (substitution) => ({
      id: substitution.id,
      teamMemberId: substitution.teamMemberId,
      substituteTeamMemberId: substitution.substituteTeamMemberId,
      startDate: toDateString(substitution.startDate),
      endDate: toDateString(substitution.endDate),
    }),
  );

  const getRotationConfig = (
    type: "dispatcher" | "deployment",
  ): RotationConfig => {
    const config = rotationConfigRows.find((item) => item.type === type);

    if (!config) {
      throw new Error(`Rotation config "${type}" not found.`);
    }

    return {
      participantTeamMemberIds: config.participants.map(
        (participant) => participant.teamMemberId,
      ),
      startDate: toDateString(config.startDate),
      numberOfWeeks: config.numberOfWeeks,
      startIndex: config.startIndex,
      type,
    };
  };

  const dispatcherConfig = getRotationConfig("dispatcher");

  const deploymentConfig = getRotationConfig("deployment");

  const getParticipants = (config: RotationConfig) => {
    return config.participantTeamMemberIds
      .map((id) => teamMembers.find((member) => member.id === id))
      .filter((member): member is TeamMember => member !== undefined);
  };

  const dispatcherRotations = generateRotations({
    teamMembers: getParticipants(dispatcherConfig),
    startDate: dispatcherConfig.startDate,
    numberOfWeeks: dispatcherConfig.numberOfWeeks,
    type: dispatcherConfig.type,
    startIndex: dispatcherConfig.startIndex,
  });

  const deploymentRotations = generateRotations({
    teamMembers: getParticipants(deploymentConfig),
    startDate: deploymentConfig.startDate,
    numberOfWeeks: deploymentConfig.numberOfWeeks,
    type: deploymentConfig.type,
    startIndex: deploymentConfig.startIndex,
  });

  return {
    teamMembers,
    absences,
    substitutions,

    dispatcherConfig,
    deploymentConfig,

    dispatcherRotations,
    deploymentRotations,
  };
};
