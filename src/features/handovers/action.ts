"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface VacationHandoverTaskInput {
  title: string;
  repoBranch: string;
  status: string;
  nextSteps: string;
  responsible: string;
  completed: boolean;
}

interface SaveVacationHandoverInput {
  emergencyContact: string;

  featureBranches: string;
  deploymentPlan: string;
  cicdStatus: string;
  environments: string;

  knownRisks: string;
  dependencies: string;

  technicalDocumentation: string;
  repositories: string;
  tickets: string;

  notes: string;

  tasks: VacationHandoverTaskInput[];
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const normalizeOptionalValue = (value: string) => {
  const normalized = value.trim();

  return normalized || null;
};

const getAuthenticatedTeamMember = async () => {
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

const revalidateHandoverPages = (absenceId: string) => {
  revalidatePath("/");
  revalidatePath("/absences");
  revalidatePath(`/absences/${absenceId}/handover`);
};

export const saveVacationHandover = async (
  absenceId: string,
  input: SaveVacationHandoverInput,
): Promise<ActionResult> => {
  const currentUser = await getAuthenticatedTeamMember();

  if (!currentUser) {
    return {
      success: false,
      error: "Du bist nicht angemeldet.",
    };
  }

  const absence = await prisma.absence.findUnique({
    where: {
      id: absenceId,
    },
  });

  if (!absence || absence.type !== "vacation") {
    return {
      success: false,
      error: "Der zugehörige Urlaub wurde nicht gefunden.",
    };
  }

  const canEdit =
    absence.teamMemberId === currentUser.id || currentUser.role === "admin";

  if (!canEdit) {
    return {
      success: false,
      error: "Du darfst diese Urlaubsübergabe nicht bearbeiten.",
    };
  }

  const tasks = input.tasks
    .map((task) => ({
      title: task.title.trim(),
      repoBranch: task.repoBranch.trim(),
      status: task.status.trim(),
      nextSteps: task.nextSteps.trim(),
      responsible: task.responsible.trim(),
      completed: task.completed,
    }))
    .filter((task) => task.title.length > 0);

  try {
    await prisma.$transaction(async (transaction) => {
      const existingHandover = await transaction.vacationHandover.findUnique({
        where: {
          absenceId,
        },

        include: {
          tasks: true,
        },
      });

      const completedTasksByTitle = new Map(
        existingHandover?.tasks.map((task) => [task.title, task.completed]) ??
          [],
      );

      const handover = await transaction.vacationHandover.upsert({
        where: {
          absenceId,
        },

        update: {
          emergencyContact: normalizeOptionalValue(input.emergencyContact),

          featureBranches: normalizeOptionalValue(input.featureBranches),

          deploymentPlan: normalizeOptionalValue(input.deploymentPlan),

          cicdStatus: normalizeOptionalValue(input.cicdStatus),

          environments: normalizeOptionalValue(input.environments),

          knownRisks: normalizeOptionalValue(input.knownRisks),

          dependencies: normalizeOptionalValue(input.dependencies),

          technicalDocumentation: normalizeOptionalValue(
            input.technicalDocumentation,
          ),

          repositories: normalizeOptionalValue(input.repositories),

          tickets: normalizeOptionalValue(input.tickets),

          notes: normalizeOptionalValue(input.notes),
        },

        create: {
          absenceId,

          emergencyContact: normalizeOptionalValue(input.emergencyContact),

          featureBranches: normalizeOptionalValue(input.featureBranches),

          deploymentPlan: normalizeOptionalValue(input.deploymentPlan),

          cicdStatus: normalizeOptionalValue(input.cicdStatus),

          environments: normalizeOptionalValue(input.environments),

          knownRisks: normalizeOptionalValue(input.knownRisks),

          dependencies: normalizeOptionalValue(input.dependencies),

          technicalDocumentation: normalizeOptionalValue(
            input.technicalDocumentation,
          ),

          repositories: normalizeOptionalValue(input.repositories),

          tickets: normalizeOptionalValue(input.tickets),

          notes: normalizeOptionalValue(input.notes),
        },
      });

      await transaction.vacationHandoverTask.deleteMany({
        where: {
          vacationHandoverId: handover.id,
        },
      });

      if (tasks.length > 0) {
        await transaction.vacationHandoverTask.createMany({
          data: tasks.map((task, index) => ({
            vacationHandoverId: handover.id,

            title: task.title,

            repoBranch: normalizeOptionalValue(task.repoBranch),

            status: normalizeOptionalValue(task.status),

            nextSteps: normalizeOptionalValue(task.nextSteps),

            responsible: normalizeOptionalValue(task.responsible),

            completed: completedTasksByTitle.get(task.title) ?? task.completed,

            position: index,
          })),
        });
      }
    });

    revalidateHandoverPages(absenceId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to save vacation handover:", error);

    return {
      success: false,
      error: "Die Urlaubsübergabe konnte nicht gespeichert werden.",
    };
  }
};

export const setVacationHandoverTaskCompleted = async (
  taskId: string,
  completed: boolean,
): Promise<ActionResult> => {
  const currentUser = await getAuthenticatedTeamMember();

  if (!currentUser) {
    return {
      success: false,
      error: "Du bist nicht angemeldet.",
    };
  }

  const task = await prisma.vacationHandoverTask.findUnique({
    where: {
      id: taskId,
    },

    include: {
      vacationHandover: {
        include: {
          absence: {
            include: {
              substitution: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    return {
      success: false,
      error: "Die Aufgabe wurde nicht gefunden.",
    };
  }

  const absence = task.vacationHandover.absence;

  const isOwner = absence.teamMemberId === currentUser.id;

  const isAdmin = currentUser.role === "admin";

  const isSubstitute =
    absence.substitution?.substituteTeamMemberId === currentUser.id;

  if (!isOwner && !isAdmin && !isSubstitute) {
    return {
      success: false,
      error: "Du darfst diese Aufgabe nicht ändern.",
    };
  }

  try {
    await prisma.vacationHandoverTask.update({
      where: {
        id: task.id,
      },

      data: {
        completed,
      },
    });

    revalidateHandoverPages(absence.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update vacation handover task:", error);

    return {
      success: false,
      error: "Der Aufgabenstatus konnte nicht gespeichert werden.",
    };
  }
};
