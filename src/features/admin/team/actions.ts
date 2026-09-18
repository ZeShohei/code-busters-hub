"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

interface SaveTeamMemberInput {
  firstName: string;
  lastName: string;
  email: string;
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
};

export const createTeamMember = async (
  input: SaveTeamMemberInput,
): Promise<ActionResult> => {
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
  const validationError = validateInput(input);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const normalized = normalizeInput(input);

  try {
    await prisma.teamMember.update({
      where: {
        id,
      },
      data: {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        displayName: `${normalized.firstName} ${normalized.lastName}`,
        email: normalized.email,
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
  try {
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
