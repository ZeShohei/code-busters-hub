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

type DeploymentScheduleMode = "continue" | "restart";

interface SaveRotationConfigInput {
  type: RotationAssignment["type"];
  startDate: string;
  numberOfWeeks: number;
  participantTeamMemberIds: string[];
  startTeamMemberId: string;

  deploymentStartsWithT2: boolean;
  deploymentScheduleMode: DeploymentScheduleMode;
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

  effectiveStartDate?: string;
  continued?: boolean;
}

interface DeploymentContinuation {
  effectiveStartDate: string;
  deploymentStartsWithT2: boolean;
  startTeamMemberId: string;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const toDatabaseDate = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

const toDateString = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const addUtcDays = (date: Date, amount: number) => {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + amount);

  return result;
};

const getThursdayOnOrAfter = (date: Date) => {
  const result = new Date(date);

  const currentDay = result.getUTCDay();

  const thursday = 4;

  const daysUntilThursday = (thursday - currentDay + 7) % 7;

  result.setUTCDate(result.getUTCDate() + daysUntilThursday);

  return result;
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

/*
 * Berechnet für eine neue Deployment-Konfiguration
 * den nächsten Slot der bisherigen Rotation.
 *
 * Dabei werden sowohl
 *
 * T2 → Code Busters → T2 → ...
 *
 * als auch die interne Code-Busters-Reihenfolge
 * weitergeführt.
 */
const getDeploymentContinuation = async (
  requestedStartDate: string,
  participantTeamMemberIds: string[],
): Promise<
  | {
      success: true;
      continuation: DeploymentContinuation;
    }
  | {
      success: false;
      error: string;
    }
> => {
  const requestedDate = toDatabaseDate(requestedStartDate);

  const previousConfig = await prisma.rotationConfig.findFirst({
    where: {
      type: "deployment",

      startDate: {
        lt: requestedDate,
      },
    },

    include: {
      participants: {
        orderBy: {
          position: "asc",
        },
      },
    },

    orderBy: {
      startDate: "desc",
    },
  });

  if (!previousConfig) {
    return {
      success: false,

      error:
        "Es gibt keine frühere Deployment-Konfiguration, deren Rhythmus fortgesetzt werden kann. Bitte wähle „Rotation neu starten“.",
    };
  }

  const previousParticipantIds = previousConfig.participants.map(
    (participant) => participant.teamMemberId,
  );

  if (previousParticipantIds.length === 0) {
    return {
      success: false,

      error: "Die vorherige Deployment-Konfiguration enthält keine Teilnehmer.",
    };
  }

  const firstDeploymentDate = getThursdayOnOrAfter(previousConfig.startDate);

  const differenceInDays = Math.max(
    0,
    Math.ceil(
      (requestedDate.getTime() - firstDeploymentDate.getTime()) /
        MILLISECONDS_PER_DAY,
    ),
  );

  /*
   * Deployment-Slots liegen immer
   * exakt 14 Tage auseinander.
   */
  const deploymentSlotIndex =
    differenceInDays === 0 ? 0 : Math.ceil(differenceInDays / 14);

  const effectiveStartDate = addUtcDays(
    firstDeploymentDate,
    deploymentSlotIndex * 14,
  );

  const isT2Slot = (slotIndex: number) => {
    return previousConfig.deploymentStartsWithT2
      ? slotIndex % 2 === 0
      : slotIndex % 2 === 1;
  };

  const deploymentStartsWithT2 = isT2Slot(deploymentSlotIndex);

  /*
   * Wie viele Code-Busters-Slots gab es
   * vor dem neuen ersten Slot?
   *
   * Nur diese Slots bewegen unsere
   * interne Personenrotation weiter.
   */
  let codeBustersSlotsBefore = 0;

  for (let slotIndex = 0; slotIndex < deploymentSlotIndex; slotIndex += 1) {
    if (!isT2Slot(slotIndex)) {
      codeBustersSlotsBefore += 1;
    }
  }

  const nextPreviousParticipantIndex =
    (previousConfig.startIndex + codeBustersSlotsBefore) %
    previousParticipantIds.length;

  const nextTeamMemberId = previousParticipantIds[nextPreviousParticipantIndex];

  /*
   * Wenn die Person, die laut bestehender Rotation
   * als Nächstes dran wäre, aus der neuen Teilnehmerliste
   * entfernt wurde, können wir den Rhythmus nicht
   * eindeutig fortsetzen.
   *
   * Dann muss der Admin bewusst einen Neustart wählen.
   */
  if (!participantTeamMemberIds.includes(nextTeamMemberId)) {
    return {
      success: false,

      error:
        "Die laut bestehender Rotation nächste Code-Busters-Person ist in der neuen Teilnehmerliste nicht mehr enthalten. Bitte nimm die Person wieder auf oder wähle „Rotation neu starten“.",
    };
  }

  return {
    success: true,

    continuation: {
      effectiveStartDate: toDateString(effectiveStartDate),

      deploymentStartsWithT2,

      startTeamMemberId: nextTeamMemberId,
    },
  };
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

  /*
   * Auch im Fortsetzungsmodus schicken wir
   * eine aktuell ausgewählte Startperson mit.
   *
   * Bei einer neuen Deployment-Version wird sie
   * serverseitig durch die errechnete nächste Person
   * ersetzt.
   */
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

    const requestedStartDate = toDatabaseDate(input.startDate);

    /*
     * Wenn exakt diese Version bereits existiert,
     * bearbeiten wir sie lediglich.
     *
     * Dann darf ein erneutes Speichern nicht plötzlich
     * eine neue Fortsetzungsberechnung auslösen.
     */
    const existingConfig = await prisma.rotationConfig.findUnique({
      where: {
        type_startDate: {
          type: input.type,

          startDate: requestedStartDate,
        },
      },

      select: {
        id: true,
      },
    });

    let effectiveStartDate = requestedStartDate;

    let effectiveStartTeamMemberId = input.startTeamMemberId;

    let effectiveDeploymentStartsWithT2 =
      input.type === "deployment" ? input.deploymentStartsWithT2 : false;

    let continued = false;

    /*
     * Nur bei einer NEUEN Deployment-Version
     * und dem Modus "Rhythmus fortsetzen"
     * berechnen wir den nächsten Slot automatisch.
     */
    if (
      input.type === "deployment" &&
      input.deploymentScheduleMode === "continue" &&
      !existingConfig
    ) {
      const continuationResult = await getDeploymentContinuation(
        input.startDate,
        input.participantTeamMemberIds,
      );

      if (!continuationResult.success) {
        return {
          success: false,
          error: continuationResult.error,
        };
      }

      effectiveStartDate = toDatabaseDate(
        continuationResult.continuation.effectiveStartDate,
      );

      effectiveStartTeamMemberId =
        continuationResult.continuation.startTeamMemberId;

      effectiveDeploymentStartsWithT2 =
        continuationResult.continuation.deploymentStartsWithT2;

      continued = true;
    }

    const startIndex = input.participantTeamMemberIds.indexOf(
      effectiveStartTeamMemberId,
    );

    if (startIndex < 0) {
      return {
        success: false,

        error: "Die berechnete Startperson ist nicht Teil der neuen Rotation.",
      };
    }

    await prisma.$transaction(async (transaction) => {
      const config = await transaction.rotationConfig.upsert({
        where: {
          type_startDate: {
            type: input.type,

            startDate: effectiveStartDate,
          },
        },

        update: {
          numberOfWeeks: input.numberOfWeeks,

          startIndex,

          deploymentStartsWithT2: effectiveDeploymentStartsWithT2,
        },

        create: {
          type: input.type,

          startDate: effectiveStartDate,

          numberOfWeeks: input.numberOfWeeks,

          startIndex,

          deploymentStartsWithT2: effectiveDeploymentStartsWithT2,
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

      effectiveStartDate: toDateString(effectiveStartDate),

      continued,
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
