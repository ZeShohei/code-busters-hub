"use server";

import { revalidatePath } from "next/cache";

import {
  getAvailableSubstitutesForAbsence,
  toDatabaseDate,
  validateAbsenceBusinessRules,
  validateAbsenceInput,
} from "@/features/absences/absenceRules";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { Absence } from "@/types/team";

interface OwnAbsenceInput {
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
  startDate: string;
  endDate: string;
  absenceId?: string;
}

interface EditableOwnAbsence {
  id: string;
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId: string;
}

const toDateInputValue = (value: Date) => {
  return value.toISOString().slice(0, 10);
};

const getToday = () => {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

const getAuthenticatedUser = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      id: currentUser.id,
    },
  });

  if (!teamMember || !teamMember.active) {
    return null;
  }

  return teamMember;
};

const revalidateAbsencePages = (absenceId?: string) => {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/absences");
  revalidatePath("/rotations");

  revalidatePath("/admin");
  revalidatePath("/admin/absences");
  revalidatePath("/admin/rotations");

  if (absenceId) {
    revalidatePath(`/absences/${absenceId}/edit`);
  }
};

export const getOwnAvailableSubstitutes = async (
  input: GetAvailableSubstitutesInput,
): Promise<SubstituteAvailability[]> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return [];
  }

  if (input.absenceId) {
    const ownAbsence = await prisma.absence.findFirst({
      where: {
        id: input.absenceId,
        teamMemberId: currentUser.id,
      },
    });

    if (!ownAbsence) {
      return [];
    }
  }

  return getAvailableSubstitutesForAbsence({
    teamMemberId: currentUser.id,
    startDate: input.startDate,
    endDate: input.endDate,
    currentAbsenceId: input.absenceId,
  });
};

export const getOwnAbsenceForEdit = async (
  absenceId: string,
): Promise<EditableOwnAbsence | null> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return null;
  }

  const absence = await prisma.absence.findFirst({
    where: {
      id: absenceId,
      teamMemberId: currentUser.id,
    },

    include: {
      substitution: true,
    },
  });

  if (!absence) {
    return null;
  }

  if (absence.startDate <= getToday()) {
    return null;
  }

  return {
    id: absence.id,
    type: absence.type,
    startDate: toDateInputValue(absence.startDate),
    endDate: toDateInputValue(absence.endDate),
    substituteTeamMemberId: absence.substitution?.substituteTeamMemberId ?? "",
  };
};

export const createOwnAbsence = async (
  input: OwnAbsenceInput,
): Promise<ActionResult> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Du bist nicht angemeldet.",
    };
  }

  const ruleInput = {
    ...input,
    teamMemberId: currentUser.id,
  };

  const validationError = validateAbsenceInput(ruleInput);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateAbsenceBusinessRules(ruleInput);

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
          teamMemberId: currentUser.id,
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
    console.error("Failed to create own absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht gespeichert werden.",
    };
  }
};

export const updateOwnAbsence = async (
  absenceId: string,
  input: OwnAbsenceInput,
): Promise<ActionResult> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Du bist nicht angemeldet.",
    };
  }

  const absence = await prisma.absence.findFirst({
    where: {
      id: absenceId,
      teamMemberId: currentUser.id,
    },
  });

  if (!absence) {
    return {
      success: false,
      error: "Die Abwesenheit wurde nicht gefunden.",
    };
  }

  if (absence.startDate <= getToday()) {
    return {
      success: false,
      error:
        "Aktuelle oder vergangene Abwesenheiten können nicht mehr bearbeitet werden.",
    };
  }

  const ruleInput = {
    ...input,
    teamMemberId: currentUser.id,
  };

  const validationError = validateAbsenceInput(ruleInput);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateAbsenceBusinessRules(
    ruleInput,
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
      await transaction.absence.update({
        where: {
          id: absenceId,
        },

        data: {
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
      } else {
        await transaction.substitution.deleteMany({
          where: {
            absenceId,
          },
        });
      }
    });

    revalidateAbsencePages(absenceId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update own absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht aktualisiert werden.",
    };
  }
};

export const cancelOwnAbsence = async (
  absenceId: string,
): Promise<ActionResult> => {
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Du bist nicht angemeldet.",
    };
  }

  const absence = await prisma.absence.findFirst({
    where: {
      id: absenceId,
      teamMemberId: currentUser.id,
    },
  });

  if (!absence) {
    return {
      success: false,
      error: "Die Abwesenheit wurde nicht gefunden.",
    };
  }

  if (absence.startDate <= getToday()) {
    return {
      success: false,
      error:
        "Aktuelle oder vergangene Abwesenheiten können nicht mehr storniert werden.",
    };
  }

  try {
    await prisma.absence.delete({
      where: {
        id: absenceId,
      },
    });

    revalidateAbsencePages(absenceId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to cancel own absence:", error);

    return {
      success: false,
      error: "Die Abwesenheit konnte nicht storniert werden.",
    };
  }
};
