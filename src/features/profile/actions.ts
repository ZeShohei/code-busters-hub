"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { hashPassword, verifyPassword } from "@/lib/password";

import { prisma } from "@/lib/prisma";

import { deleteCurrentSession } from "@/lib/session";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export const changeOwnPassword = async (
  input: ChangePasswordInput,
): Promise<ActionResult> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Deine Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.",
    };
  }

  if (!input.currentPassword) {
    return {
      success: false,
      error: "Bitte gib dein aktuelles Passwort ein.",
    };
  }

  if (!input.newPassword) {
    return {
      success: false,
      error: "Bitte gib ein neues Passwort ein.",
    };
  }

  if (input.newPassword.length < 12) {
    return {
      success: false,
      error: "Das neue Passwort muss mindestens 12 Zeichen lang sein.",
    };
  }

  if (input.newPassword !== input.confirmPassword) {
    return {
      success: false,
      error: "Die neuen Passwörter stimmen nicht überein.",
    };
  }

  if (input.currentPassword === input.newPassword) {
    return {
      success: false,
      error:
        "Das neue Passwort muss sich vom aktuellen Passwort unterscheiden.",
    };
  }

  try {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        id: currentUser.id,
      },

      select: {
        id: true,
        passwordHash: true,
        active: true,
      },
    });

    if (!teamMember || !teamMember.active) {
      return {
        success: false,
        error: "Dein Benutzerkonto konnte nicht gefunden werden.",
      };
    }

    if (!teamMember.passwordHash) {
      return {
        success: false,
        error: "Für deinen Benutzer ist aktuell kein Passwort eingerichtet.",
      };
    }

    const currentPasswordIsValid = await verifyPassword(
      input.currentPassword,
      teamMember.passwordHash,
    );

    if (!currentPasswordIsValid) {
      return {
        success: false,
        error: "Das aktuelle Passwort ist nicht korrekt.",
      };
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (transaction) => {
      await transaction.teamMember.update({
        where: {
          id: currentUser.id,
        },

        data: {
          passwordHash: newPasswordHash,
        },
      });

      /*
       * Nach einer Passwortänderung werden
       * aus Sicherheitsgründen alle Sessions
       * dieses Benutzers ungültig.
       */
      await transaction.authSession.deleteMany({
        where: {
          teamMemberId: currentUser.id,
        },
      });
    });

    /*
     * Die DB-Session existiert bereits nicht mehr.
     * deleteCurrentSession entfernt zusätzlich
     * den Session-Cookie aus dem Browser.
     */
    await deleteCurrentSession();
  } catch (error) {
    console.error("Failed to change own password:", error);

    return {
      success: false,
      error: "Das Passwort konnte nicht geändert werden.",
    };
  }

  redirect("/login?passwordChanged=true");
};
