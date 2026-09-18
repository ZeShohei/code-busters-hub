"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/requireAdmin";
import { prisma } from "@/lib/prisma";

import type { DeploymentExceptionType, RotationAssignment } from "@/types/team";

interface SaveRotationConfigInput {
  type: RotationAssignment["type"];
  startDate: string;
  numberOfWeeks: number;
  participantTeamMemberIds: string[];
  startTeamMemberId: string;
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
        },

        create: {
          type: input.type,
          startDate,

          numberOfWeeks: input.numberOfWeeks,

          startIndex,
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
        error: "Bitte den ursprünglichen Deployment-Termin auswählen.",
      };
    }

    if (input.originalDate === input.deploymentDate) {
      return {
        success: false,
        error: "Der neue Termin muss vom ursprünglichen Termin abweichen.",
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
          "Für diesen regulären Deployment-Termin existiert bereits eine Verschiebung.",
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
