"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/requireAdmin";
import { generateRotations } from "@/features/rotations/utils";

import { prisma } from "@/lib/prisma";

import type {
  DeploymentExceptionType,
  RotationAssignment,
  RotationConfig,
  TeamMember,
} from "@/types/team";

interface SaveRotationConfigInput {
  type: RotationAssignment["type"];
  startDate: string;
  numberOfWeeks: number;
  participantTeamMemberIds: string[];
  startTeamMemberId: string;

  deploymentStartsWithT2: boolean;
}

interface CreateDeploymentExceptionInput {
  type: DeploymentExceptionType;

  originalDate?: string;

  deploymentDate: string;

  teamMemberId?: string;

  reason?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

const toDateString = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const normalizeOptionalValue = (value?: string) => {
  const normalized = value?.trim();

  return normalized || null;
};

const revalidateRotationPages = () => {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/rotations");
  revalidatePath("/admin");
  revalidatePath("/admin/rotations");
};

const getRegularDeploymentRotations = async () => {
  const [teamMemberRows, configRows] = await Promise.all([
    prisma.teamMember.findMany({
      orderBy: {
        displayName: "asc",
      },
    }),

    prisma.rotationConfig.findMany({
      where: {
        type: "deployment",
      },

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

  const configs: RotationConfig[] = configRows.map((config) => ({
    participantTeamMemberIds: config.participants.map(
      (participant) => participant.teamMemberId,
    ),

    startDate: toDateString(config.startDate),

    numberOfWeeks: config.numberOfWeeks,

    startIndex: config.startIndex,

    type: "deployment",

    deploymentStartsWithT2: config.deploymentStartsWithT2,
  }));

  return configs.flatMap((config, index) => {
    const nextConfig = configs[index + 1];

    const participants = config.participantTeamMemberIds
      .map((id) => teamMembers.find((member) => member.id === id))
      .filter((member): member is TeamMember => member !== undefined);

    const rotations = generateRotations({
      teamMembers: participants,

      startDate: config.startDate,

      numberOfWeeks: config.numberOfWeeks,

      type: "deployment",

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

export const updateRotationConfig = async (
  input: SaveRotationConfigInput,
): Promise<ActionResult> => {
  await requireAdmin();

  if (!input.startDate) {
    return {
      success: false,
      error: "Bitte ein Startdatum auswählen.",
    };
  }

  if (input.numberOfWeeks < 1) {
    return {
      success: false,
      error: "Die Anzahl der Wochen muss mindestens 1 betragen.",
    };
  }

  if (input.participantTeamMemberIds.length === 0) {
    return {
      success: false,
      error: "Es muss mindestens ein Teammitglied an der Rotation teilnehmen.",
    };
  }

  if (!input.participantTeamMemberIds.includes(input.startTeamMemberId)) {
    return {
      success: false,
      error: "Die Startperson muss Teil der Rotation sein.",
    };
  }

  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        id: {
          in: input.participantTeamMemberIds,
        },

        active: true,
      },

      select: {
        id: true,
      },
    });

    if (teamMembers.length !== input.participantTeamMemberIds.length) {
      return {
        success: false,

        error:
          "Mindestens ein ausgewähltes Teammitglied existiert nicht oder ist deaktiviert.",
      };
    }

    const startIndex = input.participantTeamMemberIds.indexOf(
      input.startTeamMemberId,
    );

    const startDate = toDatabaseDate(input.startDate);

    await prisma.$transaction(async (transaction) => {
      const config = await transaction.rotationConfig.upsert({
        where: {
          type_startDate: {
            type: input.type,
            startDate,
          },
        },

        update: {
          numberOfWeeks: input.numberOfWeeks,

          startIndex,

          deploymentStartsWithT2:
            input.type === "deployment" ? input.deploymentStartsWithT2 : false,
        },

        create: {
          type: input.type,

          startDate,

          numberOfWeeks: input.numberOfWeeks,

          startIndex,

          deploymentStartsWithT2:
            input.type === "deployment" ? input.deploymentStartsWithT2 : false,
        },
      });

      await transaction.rotationParticipant.deleteMany({
        where: {
          rotationConfigId: config.id,
        },
      });

      await transaction.rotationParticipant.createMany({
        data: input.participantTeamMemberIds.map((teamMemberId, position) => ({
          rotationConfigId: config.id,

          teamMemberId,

          position,
        })),
      });
    });

    revalidateRotationPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update rotation config:", error);

    return {
      success: false,
      error: "Die Rotationskonfiguration konnte nicht gespeichert werden.",
    };
  }
};

export const createDeploymentException = async (
  input: CreateDeploymentExceptionInput,
): Promise<ActionResult> => {
  await requireAdmin();

  if (!input.deploymentDate) {
    return {
      success: false,
      error: "Bitte ein Deployment-Datum auswählen.",
    };
  }

  if (input.type === "rescheduled") {
    if (!input.originalDate) {
      return {
        success: false,
        error: "Bitte ein reguläres Deployment auswählen.",
      };
    }

    if (input.originalDate === input.deploymentDate) {
      return {
        success: false,
        error: "Der neue Termin muss vom ursprünglichen Termin abweichen.",
      };
    }

    const regularDeployments = await getRegularDeploymentRotations();

    const regularDeployment = regularDeployments.find(
      (rotation) => rotation.startDate === input.originalDate,
    );

    if (!regularDeployment) {
      return {
        success: false,
        error:
          "Der ausgewählte ursprüngliche Termin ist kein regulärer Deployment-Termin.",
      };
    }

    const existing = await prisma.deploymentException.findUnique({
      where: {
        originalDate: toDatabaseDate(input.originalDate),
      },
    });

    if (existing) {
      return {
        success: false,
        error:
          "Für dieses reguläre Deployment existiert bereits eine Verschiebung.",
      };
    }
  }

  if (input.type === "special" && !input.teamMemberId) {
    return {
      success: false,
      error:
        "Für ein Sonderdeployment muss eine zuständige Person ausgewählt werden.",
    };
  }

  if (input.teamMemberId) {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: input.teamMemberId,

        active: true,
      },

      select: {
        id: true,
      },
    });

    if (!teamMember) {
      return {
        success: false,
        error: "Die ausgewählte Person existiert nicht oder ist deaktiviert.",
      };
    }
  }

  try {
    await prisma.deploymentException.create({
      data: {
        type: input.type,

        originalDate:
          input.type === "rescheduled" && input.originalDate
            ? toDatabaseDate(input.originalDate)
            : null,

        deploymentDate: toDatabaseDate(input.deploymentDate),

        teamMemberId: input.teamMemberId || null,

        reason: normalizeOptionalValue(input.reason),
      },
    });

    revalidateRotationPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to create deployment exception:", error);

    return {
      success: false,
      error: "Die Deployment-Ausnahme konnte nicht gespeichert werden.",
    };
  }
};

export const deleteDeploymentException = async (
  id: string,
): Promise<ActionResult> => {
  await requireAdmin();

  try {
    await prisma.deploymentException.delete({
      where: {
        id,
      },
    });

    revalidateRotationPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete deployment exception:", error);

    return {
      success: false,
      error: "Die Deployment-Ausnahme konnte nicht gelöscht werden.",
    };
  }
};
