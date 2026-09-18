"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSession, deleteCurrentSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

interface LoginState {
  error?: string;
}

export const loginAction = async (
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  const usernameValue = formData.get("username");

  const passwordValue = formData.get("password");

  if (typeof usernameValue !== "string" || typeof passwordValue !== "string") {
    return {
      error: "Bitte Benutzername und Passwort eingeben.",
    };
  }

  const username = usernameValue.trim().toLowerCase();

  const password = passwordValue;

  if (!username || !password) {
    return {
      error: "Bitte Benutzername und Passwort eingeben.",
    };
  }

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      active: true,
      passwordHash: true,
    },
  });

  /*
   * Absichtlich dieselbe Fehlermeldung
   * für unbekannte Benutzer und falsche
   * Passwörter.
   */
  if (!teamMember || !teamMember.active || !teamMember.passwordHash) {
    return {
      error: "Benutzername oder Passwort ist ungültig.",
    };
  }

  const passwordValid = await verifyPassword(password, teamMember.passwordHash);

  if (!passwordValid) {
    return {
      error: "Benutzername oder Passwort ist ungültig.",
    };
  }

  await createSession(teamMember.id);

  redirect("/");
};

export const logoutAction = async () => {
  await deleteCurrentSession();

  redirect("/login");
};
