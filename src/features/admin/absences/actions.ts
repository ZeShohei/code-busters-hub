"use server";

import { revalidatePath } from "next/cache";

import {
  getAvailableSubstitutesForAbsence,
  toDatabaseDate,
  validateAbsenceBusinessRules,
  validateAbsenceInput,
} from "@/features/absences/absenceRules";

import { requireAdmin } from "@/features/admin/requireAdmin";

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

interface SubstituteAvailability {
  id: string;
  displayName: string;
  available: boolean;
  reason?: string;
}

interface GetAvailableSubstitutesInput {
  teamMemberId: string;
  startDate: string;
  endDate: string;
  currentAbsenceId?: string;
}

const revalidateAbsencePages = () => {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/absences");
  revalidatePath("/rotations");

  revalidatePath("/admin");
  revalidatePath("/admin/absences");
  revalidatePath("/admin/rotations");
};

export const getAvailableSubstitutes = async (
  input: GetAvailableSubstitutesInput,
): Promise<SubstituteAvailability[]> => {
  await requireAdmin();

  return getAvailableSubstitutesForAbsence({
    teamMemberId: input.teamMemberId,
    startDate: input.startDate,
    endDate: input.endDate,
    currentAbsenceId: input.currentAbsenceId,
  });
};

export const createAbsence = async (
  input: SaveAbsenceInput,
): Promise<ActionResult> => {
  await requireAdmin();

  const validationError = validateAbsenceInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateAbsenceBusinessRules(input);

  if (businessRuleError) {
    return {
      success: false,
      error: businessRuleError,
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
  await requireAdmin();

  const validationError = validateAbsenceInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateAbsenceBusinessRules(
    input,
    absenceId,
  );

  if (businessRuleError) {
    return {
      success: false,
      error: businessRuleError,
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
  await requireAdmin();

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
