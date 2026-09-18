import "server-only";

import { prisma } from "@/lib/prisma";

import type { Absence } from "@/types/team";

export interface AbsenceRuleInput {
  teamMemberId: string;
  type: Absence["type"];
  startDate: string;
  endDate: string;
  substituteTeamMemberId?: string;
}

export interface SubstituteAvailability {
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

export const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

export const validateAbsenceInput = (
  input: AbsenceRuleInput,
): string | undefined => {
  if (!input.teamMemberId || !input.startDate || !input.endDate) {
    return "Bitte alle Pflichtfelder ausfüllen.";
  }

  if (input.endDate < input.startDate) {
    return "Das Enddatum darf nicht vor dem Startdatum liegen.";
  }

  if (!["vacation", "sickLeave", "other"].includes(input.type)) {
    return "Die ausgewählte Abwesenheitsart ist ungültig.";
  }

  if (
    input.substituteTeamMemberId &&
    input.substituteTeamMemberId === input.teamMemberId
  ) {
    return "Ein Teammitglied kann sich nicht selbst vertreten.";
  }

  return undefined;
};

export const validateAbsenceBusinessRules = async (
  input: AbsenceRuleInput,
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

  const substitutionConflict = await prisma.substitution.findFirst({
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

  if (substitutionConflict) {
    return `${substitute.displayName} vertritt in diesem Zeitraum bereits ${substitutionConflict.absence.teamMember.displayName}.`;
  }

  return undefined;
};

export const getAvailableSubstitutesForAbsence = async ({
  teamMemberId,
  startDate,
  endDate,
  currentAbsenceId,
}: GetAvailableSubstitutesInput): Promise<SubstituteAvailability[]> => {
  if (!teamMemberId || !startDate || !endDate || endDate < startDate) {
    return [];
  }

  const databaseStartDate = toDatabaseDate(startDate);
  const databaseEndDate = toDatabaseDate(endDate);

  const candidates = await prisma.teamMember.findMany({
    where: {
      active: true,

      id: {
        not: teamMemberId,
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
            lte: databaseEndDate,
          },

          endDate: {
            gte: databaseStartDate,
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
              lte: databaseEndDate,
            },

            endDate: {
              gte: databaseStartDate,
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
