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

  /*
   * Team
   */

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

  /*
   * Abwesenheiten
   */

  const absences: Absence[] = absenceRows.map((absence) => ({
    id: absence.id,

    teamMemberId: absence.teamMemberId,

    startDate: toDateString(absence.startDate),

    endDate: toDateString(absence.endDate),

    type: absence.type,
  }));

  /*
   * Vertretungen
   */

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

  /*
   * Deployment-Ausnahmen
   */

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

  /*
   * RotationConfigs aus Prisma in unsere
   * Frontend-/Domain-Typen überführen.
   */

  const mapRotationConfigs = (
    type: RotationAssignment["type"],
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

        deploymentStartsWithT2:
          type === "deployment" ? config.deploymentStartsWithT2 : false,
      }));
  };

  const dispatcherConfigs = mapRotationConfigs("dispatcher");

  const deploymentConfigs = mapRotationConfigs("deployment");

  /*
   * Mehrere historische Rotationskonfigurationen
   * werden hintereinander angewendet.
   *
   * Sobald eine neue Konfiguration beginnt,
   * endet die vorherige Version.
   */

  const generateVersionedRotations = (
    configs: RotationConfig[],
  ): RotationAssignment[] => {
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

        deploymentStartsWithT2: config.deploymentStartsWithT2,
      });

      if (!nextConfig) {
        return rotations;
      }

      return rotations.filter(
        (rotation) => rotation.startDate < nextConfig.startDate,
      );
    });
  };

  /*
   * Aktuellste Konfiguration für die Admin-Formulare.
   */

  const getLatestConfig = (
    configs: RotationConfig[],
    type: RotationAssignment["type"],
  ): RotationConfig => {
    const config = configs[configs.length - 1];

    if (config) {
      return config;
    }

    /*
     * Fallback, falls für einen Rotationstyp noch keine
     * Konfiguration in der Datenbank existiert.
     *
     * Dadurch stürzt die gesamte App nicht ab.
     */
    return {
      participantTeamMemberIds: [],
      startDate: toDateString(new Date()),
      numberOfWeeks: 52,
      startIndex: 0,
      type,
      deploymentStartsWithT2: false,
    };
  };

  const dispatcherConfig = getLatestConfig(dispatcherConfigs, "dispatcher");

  const deploymentConfig = getLatestConfig(deploymentConfigs, "deployment");

  /*
   * Dispatcher
   */

  const dispatcherRotations = generateVersionedRotations(dispatcherConfigs);

  /*
   * Reguläre Deployments
   *
   * Die Grundrotation enthält bereits:
   *
   * T2 Team
   * → Code Busters
   * → T2 Team
   * → Code Busters
   * ...
   *
   * Innerhalb der Code Busters wird die Personenrotation
   * nur bei einem Code-Busters-Slot weitergeschaltet.
   */

  const regularDeploymentRotations =
    generateVersionedRotations(deploymentConfigs);

  /*
   * Verschobene Deployments.
   *
   * Eine Verschiebung verändert ausschließlich das Datum.
   * Der zugrunde liegende Slot bleibt derselbe.
   *
   * Beispiel:
   *
   * 24.09. T2
   * wird auf 22.09. verschoben
   *
   * Danach bleibt:
   *
   * 08.10. Stefan
   * 22.10. T2
   * 05.11. Shpetim
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

        /*
         * Ohne manuelle Überschreibung bleibt die reguläre
         * Zuständigkeit bestehen.
         *
         * Das kann auch T2 Team sein.
         */
        teamMemberId: exception.teamMemberId ?? rotation.teamMemberId,

        startDate: exception.deploymentDate,

        endDate: exception.deploymentDate,

        deploymentKind: "rescheduled",

        originalDate: rotation.startDate,

        reason: exception.reason ?? undefined,
      };
    });

  /*
   * Sonderdeployments.
   *
   * Diese werden zusätzlich zur normalen Rotation
   * eingetragen und verändern den Rhythmus nicht.
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
