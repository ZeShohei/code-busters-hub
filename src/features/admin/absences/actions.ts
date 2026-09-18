"use server";

import { revalidatePath } from "next/cache";

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

const validateBusinessRules = async (
  input: SaveAbsenceInput,
  currentAbsenceId?: string,
): Promise<string | undefined> => {
  const startDate = toDatabaseDate(input.startDate);

  const endDate = toDatabaseDate(input.endDate);

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      id: input.teamMemberId,
    },
  });

  if (!teamMember) {
    return "Das ausgewählte Teammitglied existiert nicht.";
  }

  const overlappingAbsence = await prisma.absence.findFirst({
    where: {
      teamMemberId: input.teamMemberId,

      startDate: {
        lte: endDate,
      },

      endDate: {
        gte: startDate,
      },

      ...(currentAbsenceId
        ? {
            id: {
              not: currentAbsenceId,
            },
          }
        : {}),
    },
  });

  if (overlappingAbsence) {
    return `${teamMember.displayName} hat in diesem Zeitraum bereits eine Abwesenheit.`;
  }

  if (!input.substituteTeamMemberId) {
    return undefined;
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
    return `${substitute.displayName} ist im ausgewählten Zeitraum selbst abwesend und kann die Vertretung nicht übernehmen.`;
  }

  const substituteConflict = await prisma.substitution.findFirst({
    where: {
      substituteTeamMemberId: substitute.id,

      absence: {
        startDate: {
          lte: endDate,
        },

        endDate: {
          gte: startDate,
        },

        ...(currentAbsenceId
          ? {
              id: {
                not: currentAbsenceId,
              },
            }
          : {}),
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

  if (substituteConflict) {
    return `${substitute.displayName} vertritt in diesem Zeitraum bereits ${substituteConflict.absence.teamMember.displayName}.`;
  }

  return undefined;
};

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

export const getAvailableSubstitutes = async (
  input: GetAvailableSubstitutesInput,
): Promise<SubstituteAvailability[]> => {
  await requireAdmin();

  if (
    !input.teamMemberId ||
    !input.startDate ||
    !input.endDate ||
    input.endDate < input.startDate
  ) {
    return [];
  }

  const startDate = toDatabaseDate(input.startDate);

  const endDate = toDatabaseDate(input.endDate);

  const candidates = await prisma.teamMember.findMany({
    where: {
      active: true,

      id: {
        not: input.teamMemberId,
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

          absence: {
            startDate: {
              lte: endDate,
            },

            endDate: {
              gte: startDate,
            },

            ...(input.currentAbsenceId
              ? {
                  id: {
                    not: input.currentAbsenceId,
                  },
                }
              : {}),
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
  await requireAdmin();

  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateBusinessRules(input);

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

  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const businessRuleError = await validateBusinessRules(input, absenceId);

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
