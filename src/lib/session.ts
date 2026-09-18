import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "code-busters-session";

const SESSION_DURATION_DAYS = 14;

const createSessionToken = () => {
  return randomBytes(32).toString("hex");
};

const hashSessionToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

const getSessionExpiry = () => {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  return expiresAt;
};

export const createSession = async (teamMemberId: string) => {
  const token = createSessionToken();

  const tokenHash = hashSessionToken(token);

  const expiresAt = getSessionExpiry();

  await prisma.authSession.create({
    data: {
      tokenHash,
      teamMemberId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
};

export const deleteCurrentSession = async () => {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await prisma.authSession.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const getCurrentSession = async () => {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash,
    },
    include: {
      teamMember: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  if (!session.teamMember.active) {
    return null;
  }

  return session;
};

export const deleteExpiredSessions = async () => {
  await prisma.authSession.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
};
