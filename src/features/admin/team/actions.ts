"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/requireAdmin";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

import type { TeamMemberRole } from "@/types/team";

interface SaveTeamMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  role: TeamMemberRole;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

type RotationType = "dispatcher" | "deployment";

const normalizeInput = (input: SaveTeamMemberInput) => {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    username: input.username.trim().toLowerCase(),
    password: input.password ?? "",
    role: input.role,
  };
};

const validateInput = (
  input: SaveTeamMemberInput,
  isCreating: boolean,
): string | undefined => {
  const normalized = normalizeInput(input);

  if (
    !normalized.firstName ||
    !normalized.lastName ||
    !normalized.email ||
    !normalized.username
  ) {
    return "Bitte alle Pflichtfelder ausfüllen.";
  }

  if (!normalized.email.includes("@")) {
    return "Bitte eine gültige E-Mail-Adresse eingeben.";
  }

  if (normalized.username.length < 3) {
    return "Der Benutzername muss mindestens 3 Zeichen lang sein.";
  }

  if (normalized.username.length > 50) {
    return "Der Benutzername darf maximal 50 Zeichen lang sein.";
  }

  if (!/^[a-z0-9._-]+$/.test(normalized.username)) {
    return "Der Benutzername darf nur Kleinbuchstaben, Zahlen, Punkt, Bindestrich und Unterstrich enthalten.";
  }

  if (isCreating && !normalized.password) {
    return "Bitte ein Passwort für das neue Teammitglied eingeben.";
  }

  if (normalized.password && normalized.password.length < 12) {
    return "Das Passwort muss mindestens 12 Zeichen lang sein.";
  }

  if (normalized.role !== "admin" && normalized.role !== "member") {
    return "Die ausgewählte Rolle ist ungültig.";
  }

  return undefined;
};

const revalidateTeamPages = () => {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/absences");
  revalidatePath("/rotations");

  revalidatePath("/admin");
  revalidatePath("/admin/team");
  revalidatePath("/admin/absences");
  revalidatePath("/admin/rotations");
};

const getActiveAdminCount = async () => {
  return prisma.teamMember.count({
    where: {
      active: true,
      role: "admin",
    },
  });
};

const addWeeks = (date: Date, numberOfWeeks: number) => {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + numberOfWeeks * 7);

  return result;
};

/*
 * Prüft, ob ein Teammitglied noch in einer
 * aktuell wirksamen oder zukünftigen
 * Rotationskonfiguration enthalten ist.
 *
 * Historische Konfigurationen werden ignoriert.
 */
const getRelevantRotationParticipations = async (
  teamMemberId: string,
): Promise<RotationType[]> => {
  const configs = await prisma.rotationConfig.findMany({
    include: {
      participants: {
        select: {
          teamMemberId: true,
        },
      },
    },

    orderBy: [
      {
        type: "asc",
      },
      {
        startDate: "asc",
      },
    ],
  });

  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  const relevantTypes = new Set<RotationType>();

  const rotationTypes: RotationType[] = ["dispatcher", "deployment"];

  for (const type of rotationTypes) {
    const typeConfigs = configs.filter((config) => config.type === type);

    if (typeConfigs.length === 0) {
      continue;
    }

    /*
     * Aktuelle Konfiguration:
     * die letzte Version, deren Startdatum
     * bereits erreicht wurde.
     */
    const currentConfig = [...typeConfigs]
      .reverse()
      .find((config) => config.startDate <= today);

    if (currentConfig) {
      const plannedEnd = addWeeks(
        currentConfig.startDate,
        currentConfig.numberOfWeeks,
      );

      const nextConfig = typeConfigs.find(
        (config) => config.startDate > currentConfig.startDate,
      );

      /*
       * Eine Version endet entweder mit ihrem
       * Planungszeitraum oder sobald eine neue
       * Version beginnt.
       */
      const effectiveEnd =
        nextConfig && nextConfig.startDate < plannedEnd
          ? nextConfig.startDate
          : plannedEnd;

      const isStillRelevant = effectiveEnd >= today;

      const containsTeamMember = currentConfig.participants.some(
        (participant) => participant.teamMemberId === teamMemberId,
      );

      if (isStillRelevant && containsTeamMember) {
        relevantTypes.add(type);
      }
    }

    /*
     * Auch bereits angelegte zukünftige
     * Konfigurationen müssen geprüft werden.
     */
    const futureConfigs = typeConfigs.filter(
      (config) => config.startDate > today,
    );

    const isInFutureConfig = futureConfigs.some((config) =>
      config.participants.some(
        (participant) => participant.teamMemberId === teamMemberId,
      ),
    );

    if (isInFutureConfig) {
      relevantTypes.add(type);
    }
  }

  return [...relevantTypes];
};

const getRotationParticipationError = async (
  teamMemberId: string,
): Promise<string | undefined> => {
  const rotationTypes = await getRelevantRotationParticipations(teamMemberId);

  if (rotationTypes.length === 0) {
    return undefined;
  }

  if (
    rotationTypes.includes("dispatcher") &&
    rotationTypes.includes("deployment")
  ) {
    return "Das Teammitglied ist noch Teilnehmer der Dispatcher- und Deployment-Rotation. Entferne es zuerst aus beiden Rotationen.";
  }

  if (rotationTypes.includes("dispatcher")) {
    return "Das Teammitglied ist noch Teilnehmer der Dispatcher-Rotation. Entferne es zuerst aus der Rotation.";
  }

  return "Das Teammitglied ist noch Teilnehmer der Deployment-Rotation. Entferne es zuerst aus der Rotation.";
};

export const createTeamMember = async (
  input: SaveTeamMemberInput,
): Promise<ActionResult> => {
  await requireAdmin();

  const validationError = validateInput(input, true);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const normalized = normalizeInput(input);

  try {
    const existingUser = await prisma.teamMember.findFirst({
      where: {
        OR: [
          {
            email: normalized.email,
          },
          {
            username: normalized.username,
          },
        ],
      },

      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === normalized.email) {
        return {
          success: false,
          error: "Diese E-Mail-Adresse wird bereits verwendet.",
        };
      }

      return {
        success: false,
        error: "Dieser Benutzername wird bereits verwendet.",
      };
    }

    const passwordHash = await hashPassword(normalized.password);

    await prisma.teamMember.create({
      data: {
        firstName: normalized.firstName,

        lastName: normalized.lastName,

        displayName: `${normalized.firstName} ${normalized.lastName}`,

        email: normalized.email,

        username: normalized.username,

        passwordHash,

        active: true,

        role: normalized.role,
      },
    });

    revalidateTeamPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to create team member:", error);

    return {
      success: false,
      error: "Das Teammitglied konnte nicht angelegt werden.",
    };
  }
};

export const updateTeamMember = async (
  id: string,
  input: SaveTeamMemberInput,
): Promise<ActionResult> => {
  const currentUser = await requireAdmin();

  const validationError = validateInput(input, false);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  if (id === currentUser.id && input.role !== "admin") {
    return {
      success: false,
      error: "Du kannst dir deine eigene Admin-Rolle nicht entziehen.",
    };
  }

  const normalized = normalizeInput(input);

  try {
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        role: true,
        active: true,
      },
    });

    if (!existingMember) {
      return {
        success: false,
        error: "Das Teammitglied wurde nicht gefunden.",
      };
    }

    /*
     * Ein aktiver Admin darf nur zum Mitglied
     * herabgestuft werden, wenn ein weiterer
     * aktiver Admin übrig bleibt.
     */
    if (
      existingMember.active &&
      existingMember.role === "admin" &&
      normalized.role !== "admin"
    ) {
      const activeAdminCount = await getActiveAdminCount();

      if (activeAdminCount <= 1) {
        return {
          success: false,
          error:
            "Der letzte aktive Administrator kann nicht zum Mitglied herabgestuft werden.",
        };
      }
    }

    const conflictingMember = await prisma.teamMember.findFirst({
      where: {
        id: {
          not: id,
        },

        OR: [
          {
            email: normalized.email,
          },
          {
            username: normalized.username,
          },
        ],
      },

      select: {
        email: true,
        username: true,
      },
    });

    if (conflictingMember) {
      if (conflictingMember.email === normalized.email) {
        return {
          success: false,
          error: "Diese E-Mail-Adresse wird bereits verwendet.",
        };
      }

      return {
        success: false,
        error: "Dieser Benutzername wird bereits verwendet.",
      };
    }

    const passwordHash = normalized.password
      ? await hashPassword(normalized.password)
      : undefined;

    await prisma.$transaction(async (transaction) => {
      await transaction.teamMember.update({
        where: {
          id,
        },

        data: {
          firstName: normalized.firstName,

          lastName: normalized.lastName,

          displayName: `${normalized.firstName} ${normalized.lastName}`,

          email: normalized.email,

          username: normalized.username,

          role: normalized.role,

          ...(passwordHash
            ? {
                passwordHash,
              }
            : {}),
        },
      });

      /*
       * Nach einer Passwortänderung werden
       * bestehende Sessions beendet.
       */
      if (passwordHash) {
        await transaction.authSession.deleteMany({
          where: {
            teamMemberId: id,
          },
        });
      }
    });

    revalidateTeamPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to update team member:", error);

    return {
      success: false,
      error: "Das Teammitglied konnte nicht aktualisiert werden.",
    };
  }
};

export const setTeamMemberActive = async (
  id: string,
  active: boolean,
): Promise<ActionResult> => {
  const currentUser = await requireAdmin();

  if (id === currentUser.id && !active) {
    return {
      success: false,
      error: "Du kannst deinen eigenen Benutzer nicht deaktivieren.",
    };
  }

  try {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        active: true,
        role: true,
      },
    });

    if (!teamMember) {
      return {
        success: false,
        error: "Das Teammitglied wurde nicht gefunden.",
      };
    }

    /*
     * Ist der gewünschte Status ohnehin bereits
     * gesetzt, müssen wir nichts verändern.
     */
    if (teamMember.active === active) {
      return {
        success: true,
      };
    }

    if (!active) {
      /*
       * Der letzte aktive Admin darf nicht
       * deaktiviert werden.
       */
      if (teamMember.role === "admin") {
        const activeAdminCount = await getActiveAdminCount();

        if (activeAdminCount <= 1) {
          return {
            success: false,
            error:
              "Der letzte aktive Administrator kann nicht deaktiviert werden.",
          };
        }
      }

      /*
       * Eine Person darf nicht deaktiviert werden,
       * solange sie noch Teil einer aktuellen oder
       * zukünftigen Rotationskonfiguration ist.
       *
       * Wir verändern die Rotation bewusst nicht
       * automatisch, damit weder Personenreihenfolge
       * noch T2-Rhythmus unerwartet verändert werden.
       */
      const rotationError = await getRotationParticipationError(id);

      if (rotationError) {
        return {
          success: false,
          error: rotationError,
        };
      }
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.teamMember.update({
        where: {
          id,
        },

        data: {
          active,
        },
      });

      /*
       * Beim Deaktivieren werden sämtliche
       * vorhandenen Sessions beendet.
       */
      if (!active) {
        await transaction.authSession.deleteMany({
          where: {
            teamMemberId: id,
          },
        });
      }
    });

    revalidateTeamPages();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to change team member status:", error);

    return {
      success: false,
      error: "Der Status des Teammitglieds konnte nicht geändert werden.",
    };
  }
};
