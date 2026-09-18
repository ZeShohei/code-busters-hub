"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { RotationAssignment } from "@/types/team";

interface SaveRotationConfigInput {
  type: RotationAssignment["type"];
  startDate: string;
  numberOfWeeks: number;
  participantTeamMemberIds: string[];
  startTeamMemberId: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
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
