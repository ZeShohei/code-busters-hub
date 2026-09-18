import "server-only";

import { generateRotations } from "@/features/rotations/utils";
import { prisma } from "@/lib/prisma";

import type {
  Absence,
  DeploymentException,
  RotationAssignment,
  RotationConfig,
  Substitution,
  TeamMember,
} from "@/types/team";

const toDateString = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const getAppData = async () => {
  const [
    teamMemberRows,
    absenceRows,
    substitutionRows,
    rotationConfigRows,
    deploymentExceptionRows,
  ] = await Promise.all([
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

      orderBy: {
        startDate: "asc",
      },
    }),

    prisma.deploymentException.findMany({
      orderBy: {
        deploymentDate: "asc",
      },
    }),
  ]);

  const teamMembers: TeamMember[] = teamMemberRows.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    displayName: member.displayName,
    email: member.email,
    username: member.username,
    active: member.active,
    role: member.role,
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

  const deploymentExceptions: DeploymentException[] =
    deploymentExceptionRows.map((exception) => ({
      id: exception.id,
      type: exception.type,

      originalDate: exception.originalDate
        ? toDateString(exception.originalDate)
        : null,

      deploymentDate: toDateString(exception.deploymentDate),

      teamMemberId: exception.teamMemberId,

      reason: exception.reason,
    }));

  const mapRotationConfigs = (
    type: "dispatcher" | "deployment",
  ): RotationConfig[] => {
    return rotationConfigRows
      .filter((config) => config.type === type)
      .sort(
        (first, second) =>
          first.startDate.getTime() - second.startDate.getTime(),
      )
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

  const regularDeploymentRotations =
    generateVersionedRotations(deploymentConfigs);

  /*
   * Verschobene Deployments ersetzen
   * exakt den regulären Termin.
   *
   * Sie verändern NICHT den 14-Tage-
   * Rhythmus und auch nicht die weitere
   * Personenreihenfolge.
   */
  const rescheduledByOriginalDate = new Map(
    deploymentExceptions
      .filter(
        (exception) =>
          exception.type === "rescheduled" && exception.originalDate,
      )
      .map((exception) => [exception.originalDate as string, exception]),
  );

  const adjustedDeploymentRotations: RotationAssignment[] =
    regularDeploymentRotations.map((rotation) => {
      const exception = rescheduledByOriginalDate.get(rotation.startDate);

      if (!exception) {
        return {
          ...rotation,

          deploymentKind: "regular",
        };
      }

      return {
        ...rotation,

        id: `deployment-rescheduled-${exception.id}`,

        teamMemberId: exception.teamMemberId ?? rotation.teamMemberId,

        startDate: exception.deploymentDate,

        endDate: exception.deploymentDate,

        deploymentKind: "rescheduled",

        originalDate: rotation.startDate,

        reason: exception.reason ?? undefined,
      };
    });

  /*
   * Sonderdeployments werden zusätzlich
   * eingefügt und beeinflussen die normale
   * Rotation nicht.
   */
  const specialDeployments: RotationAssignment[] = deploymentExceptions
    .filter(
      (exception) => exception.type === "special" && exception.teamMemberId,
    )
    .map((exception) => ({
      id: `deployment-special-${exception.id}`,

      teamMemberId: exception.teamMemberId as string,

      startDate: exception.deploymentDate,

      endDate: exception.deploymentDate,

      type: "deployment",

      deploymentKind: "special",

      reason: exception.reason ?? undefined,
    }));

  const deploymentRotations = [
    ...adjustedDeploymentRotations,
    ...specialDeployments,
  ].sort((first, second) => first.startDate.localeCompare(second.startDate));

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

    deploymentExceptions,
  };
};
