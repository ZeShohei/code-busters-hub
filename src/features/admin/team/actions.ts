"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/requireAdmin";
import { prisma } from "@/lib/prisma";

import type { TeamMemberRole } from "@/types/team";

interface SaveTeamMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  role: TeamMemberRole;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const normalizeInput = (input: SaveTeamMemberInput) => {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
  };
};

const validateInput = (input: SaveTeamMemberInput): string | undefined => {
  const normalized = normalizeInput(input);

  if (!normalized.firstName || !normalized.lastName || !normalized.email) {
    return "Bitte alle Pflichtfelder ausfüllen.";
  }

  if (!normalized.email.includes("@")) {
    return "Bitte eine gültige E-Mail-Adresse eingeben.";
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

export const createTeamMember = async (
  input: SaveTeamMemberInput,
): Promise<ActionResult> => {
  await requireAdmin();

  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const normalized = normalizeInput(input);

  try {
    await prisma.teamMember.create({
      data: {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        displayName: `${normalized.firstName} ${normalized.lastName}`,
        email: normalized.email,
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
      error:
        "Das Teammitglied konnte nicht angelegt werden. Möglicherweise wird die E-Mail-Adresse bereits verwendet.",
    };
  }
};

export const updateTeamMember = async (
  id: string,
  input: SaveTeamMemberInput,
): Promise<ActionResult> => {
  const currentUser = await requireAdmin();

  const validationError = validateInput(input);

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
    });

    if (!existingMember) {
      return {
        success: false,
        error: "Das Teammitglied wurde nicht gefunden.",
      };
    }

    await prisma.teamMember.update({
      where: {
        id,
      },
      data: {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        displayName: `${normalized.firstName} ${normalized.lastName}`,
        email: normalized.email,
        role: normalized.role,
      },
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
    });

    if (!teamMember) {
      return {
        success: false,
        error: "Das Teammitglied wurde nicht gefunden.",
      };
    }

    await prisma.teamMember.update({
      where: {
        id,
      },
      data: {
        active,
      },
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
