"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearLoginThrottle,
  isLoginAllowed,
  recordFailedLogin,
} from "@/lib/loginThrottle";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

import { createSession, deleteCurrentSession } from "@/lib/session";

interface LoginState {
  error?: string;
}

const INVALID_LOGIN_MESSAGE = "Benutzername oder Passwort ist ungültig.";

const BLOCKED_LOGIN_MESSAGE =
  "Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuche es in einigen Minuten erneut.";

const getClientAddress = async () => {
  const requestHeaders = await headers();

  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    const firstAddress = forwardedFor.split(",")[0]?.trim();

    if (firstAddress) {
      return firstAddress;
    }
  }

  const realIp = requestHeaders.get("x-real-ip");

  if (realIp) {
    return realIp;
  }

  /*
   * Lokal bzw. ohne vorgeschalteten
   * Reverse Proxy steht eventuell keine
   * Client-IP zur Verfügung.
   */
  return "unknown";
};

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

  const clientAddress = await getClientAddress();

  const loginAllowed = await isLoginAllowed({
    username,
    clientAddress,
  });

  if (!loginAllowed) {
    return {
      error: BLOCKED_LOGIN_MESSAGE,
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

  if (!teamMember || !teamMember.active || !teamMember.passwordHash) {
    await recordFailedLogin({
      username,
      clientAddress,
    });

    return {
      error: INVALID_LOGIN_MESSAGE,
    };
  }

  const passwordValid = await verifyPassword(password, teamMember.passwordHash);

  if (!passwordValid) {
    await recordFailedLogin({
      username,
      clientAddress,
    });

    return {
      error: INVALID_LOGIN_MESSAGE,
    };
  }

  await clearLoginThrottle({
    username,
    clientAddress,
  });

  await createSession(teamMember.id);

  redirect("/");
};

export const logoutAction = async () => {
  await deleteCurrentSession();

  redirect("/login");
};
