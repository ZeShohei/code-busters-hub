"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { Absence } from "@/types/team";

interface SaveAbsenceInput {
  teamMemberId: string;
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

const validateInput = (input: SaveAbsenceInput): string | undefined => {
  if (!input.teamMemberId || !input.startDate || !input.endDate) {
    return "Bitte alle Pflichtfelder ausfüllen.";
  }

  if (input.endDate < input.startDate) {
    return "Das Enddatum darf nicht vor dem Startdatum liegen.";
  }

  if (
    input.substituteTeamMemberId &&
    input.substituteTeamMemberId === input.teamMemberId
  ) {
    return "Ein Teammitglied kann sich nicht selbst vertreten.";
  }

  return undefined;
};

const revalidateAbsencePages = () => {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/absences");
  revalidatePath("/rotations");
  revalidatePath("/admin");
  revalidatePath("/admin/absences");
};

export const createAbsence = async (
  input: SaveAbsenceInput,
): Promise<ActionResult> => {
  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const absence = await transaction.absence.create({
        data: {
          teamMemberId: input.teamMemberId,
          type: input.type,
          startDate: toDatabaseDate(input.startDate),
          endDate: toDatabaseDate(input.endDate),
        },
      });

      if (input.substituteTeamMemberId) {
        await transaction.substitution.create({
          data: {
            absenceId: absence.id,
            substituteTeamMemberId: input.substituteTeamMemberId,
          },
        });
      }
    });

    revalidateAbsencePages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to create absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht gespeichert werden.",
    };
  }
};

export const updateAbsence = async (
  absenceId: string,
  input: SaveAbsenceInput,
): Promise<ActionResult> => {
  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const existingAbsence = await transaction.absence.findUnique({
        where: {
          id: absenceId,
        },
        include: {
          substitution: true,
        },
      });

      if (!existingAbsence) {
        throw new Error("Absence not found.");
      }

      await transaction.absence.update({
        where: {
          id: absenceId,
        },
        data: {
          teamMemberId: input.teamMemberId,
          type: input.type,
          startDate: toDatabaseDate(input.startDate),
          endDate: toDatabaseDate(input.endDate),
        },
      });

      if (input.substituteTeamMemberId) {
        await transaction.substitution.upsert({
          where: {
            absenceId,
          },
          update: {
            substituteTeamMemberId: input.substituteTeamMemberId,
          },
          create: {
            absenceId,
            substituteTeamMemberId: input.substituteTeamMemberId,
          },
        });
      } else if (existingAbsence.substitution) {
        await transaction.substitution.delete({
          where: {
            absenceId,
          },
        });
      }
    });

    revalidateAbsencePages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht aktualisiert werden.",
    };
  }
};

export const deleteAbsence = async (
  absenceId: string,
): Promise<ActionResult> => {
  try {
    await prisma.absence.delete({
      where: {
        id: absenceId,
      },
    });

    revalidateAbsencePages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht gelöscht werden.",
    };
  }
};
