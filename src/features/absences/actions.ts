"use server";

import { revalidatePath } from "next/cache";

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

const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

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

const validateInput = (input: OwnAbsenceInput): string | undefined => {
  if (!input.startDate || !input.endDate) {
    return "Bitte Start- und Enddatum auswählen.";
  }

  if (input.endDate < input.startDate) {
    return "Das Enddatum darf nicht vor dem Startdatum liegen.";
  }

  if (!["vacation", "sickLeave", "other"].includes(input.type)) {
    return "Die ausgewählte Abwesenheitsart ist ungültig.";
  }

  return undefined;
};

const validateBusinessRules = async (
  teamMemberId: string,
  input: OwnAbsenceInput,
  excludeAbsenceId?: string,
): Promise<string | undefined> => {
  const startDate = toDatabaseDate(input.startDate);
  const endDate = toDatabaseDate(input.endDate);

  const overlappingAbsence = await prisma.absence.findFirst({
    where: {
      teamMemberId,

      ...(excludeAbsenceId
        ? {
            id: {
              not: excludeAbsenceId,
            },
          }
        : {}),

      startDate: {
        lte: endDate,
      },

      endDate: {
        gte: startDate,
      },
    },
  });

  if (overlappingAbsence) {
    return "Für diesen Zeitraum besteht bereits eine Abwesenheit.";
  }

  if (!input.substituteTeamMemberId) {
    return undefined;
  }

  if (input.substituteTeamMemberId === teamMemberId) {
    return "Du kannst dich nicht selbst als Vertretung auswählen.";
  }

  const substitute = await prisma.teamMember.findUnique({
    where: {
      id: input.substituteTeamMemberId,
    },
  });

  if (!substitute) {
    return "Die ausgewählte Vertretung existiert nicht.";
  }

  if (!substitute.active) {
    return `${substitute.displayName} ist deaktiviert und kann nicht als Vertretung ausgewählt werden.`;
  }

  const substituteAbsence = await prisma.absence.findFirst({
    where: {
      teamMemberId: substitute.id,

      startDate: {
        lte: endDate,
      },

      endDate: {
        gte: startDate,
      },
    },
  });

  if (substituteAbsence) {
    return `${substitute.displayName} ist in diesem Zeitraum selbst abwesend.`;
  }

  const substitutionConflict = await prisma.substitution.findFirst({
    where: {
      substituteTeamMemberId: substitute.id,

      ...(excludeAbsenceId
        ? {
            absenceId: {
              not: excludeAbsenceId,
            },
          }
        : {}),

      absence: {
        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },
      },
    },

    include: {
      absence: {
        include: {
          teamMember: true,
        },
      },
    },
  });

  if (substitutionConflict) {
    return `${substitute.displayName} vertritt in diesem Zeitraum bereits ${substitutionConflict.absence.teamMember.displayName}.`;
  }

  return undefined;
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

  if (!input.startDate || !input.endDate || input.endDate < input.startDate) {
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

  const startDate = toDatabaseDate(input.startDate);
  const endDate = toDatabaseDate(input.endDate);

  const candidates = await prisma.teamMember.findMany({
    where: {
      active: true,

      id: {
        not: currentUser.id,
      },
    },

    orderBy: {
      displayName: "asc",
    },
  });

  return Promise.all(
    candidates.map(async (candidate): Promise<SubstituteAvailability> => {
      const absence = await prisma.absence.findFirst({
        where: {
          teamMemberId: candidate.id,

          startDate: {
            lte: endDate,
          },

          endDate: {
            gte: startDate,
          },
        },
      });

      if (absence) {
        return {
          id: candidate.id,
          displayName: candidate.displayName,
          available: false,
          reason: "selbst abwesend",
        };
      }

      const substitutionConflict = await prisma.substitution.findFirst({
        where: {
          substituteTeamMemberId: candidate.id,

          ...(input.absenceId
            ? {
                absenceId: {
                  not: input.absenceId,
                },
              }
            : {}),

          absence: {
            startDate: {
              lte: endDate,
            },

            endDate: {
              gte: startDate,
            },
          },
        },
      });

      if (substitutionConflict) {
        return {
          id: candidate.id,
          displayName: candidate.displayName,
          available: false,
          reason: "bereits als Vertretung eingetragen",
        };
      }

      return {
        id: candidate.id,
        displayName: candidate.displayName,
        available: true,
      };
    }),
  );
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

  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateBusinessRules(currentUser.id, input);

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

  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateBusinessRules(
    currentUser.id,
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

      await transaction.substitution.deleteMany({
        where: {
          absenceId,
        },
      });

      if (input.substituteTeamMemberId) {
        await transaction.substitution.create({
          data: {
            absenceId,
            substituteTeamMemberId: input.substituteTeamMemberId,
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
