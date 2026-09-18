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
        include: {
          absence: true,
        },
        orderBy: {
          absence: {
            startDate: "asc",
          },
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
    active: member.active,
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
      absenceId: substitution.absenceId,
      teamMemberId: substitution.absence.teamMemberId,
      substituteTeamMemberId: substitution.substituteTeamMemberId,
      startDate: toDateString(substitution.absence.startDate),
      endDate: toDateString(substitution.absence.endDate),
    }),
  );

  const mapRotationConfigs = (
    type: "dispatcher" | "deployment",
  ): RotationConfig[] => {
    return rotationConfigRows
      .filter((config) => config.type === type)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map((config) => ({
        participantTeamMemberIds: config.participants.map(
          (participant) => participant.teamMemberId,
        ),
        startDate: toDateString(config.startDate),
        numberOfWeeks: config.numberOfWeeks,
        startIndex: config.startIndex,
        type,
      }));
  };

  const dispatcherConfigs = mapRotationConfigs("dispatcher");

  const deploymentConfigs = mapRotationConfigs("deployment");

  const generateVersionedRotations = (configs: RotationConfig[]) => {
    return configs.flatMap((config, index) => {
      const nextConfig = configs[index + 1];

      const participants = config.participantTeamMemberIds
        .map((id) => teamMembers.find((member) => member.id === id))
        .filter((member): member is TeamMember => member !== undefined);

      const rotations = generateRotations({
        teamMembers: participants,
        startDate: config.startDate,
        numberOfWeeks: config.numberOfWeeks,
        type: config.type,
        startIndex: config.startIndex,
      });

      if (!nextConfig) {
        return rotations;
      }

      return rotations.filter(
        (rotation) => rotation.startDate < nextConfig.startDate,
      );
    });
  };

  const getLatestConfig = (configs: RotationConfig[]) => {
    const config = configs[configs.length - 1];

    if (!config) {
      throw new Error("Rotation config not found.");
    }

    return config;
  };

  const dispatcherConfig = getLatestConfig(dispatcherConfigs);

  const deploymentConfig = getLatestConfig(deploymentConfigs);

  const dispatcherRotations = generateVersionedRotations(dispatcherConfigs);

  const deploymentRotations = generateVersionedRotations(deploymentConfigs);

  return {
    teamMembers,
    absences,
    substitutions,

    dispatcherConfig,
    deploymentConfig,

    dispatcherConfigs,
    deploymentConfigs,

    dispatcherRotations,
    deploymentRotations,
  };
};
