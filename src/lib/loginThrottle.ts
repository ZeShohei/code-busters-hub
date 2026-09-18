import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

const addMinutes = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const createIdentifierHash = (username: string, clientAddress: string) => {
  return createHash("sha256")
    .update(`${username.toLowerCase()}|${clientAddress}`)
    .digest("hex");
};

interface LoginThrottleInput {
  username: string;
  clientAddress: string;
}

export const isLoginAllowed = async ({
  username,
  clientAddress,
}: LoginThrottleInput): Promise<boolean> => {
  const identifierHash = createIdentifierHash(username, clientAddress);

  const throttle = await prisma.loginThrottle.findUnique({
    where: {
      identifierHash,
    },
  });

  if (!throttle) {
    return true;
  }

  const now = new Date();

  if (throttle.blockedUntil && throttle.blockedUntil > now) {
    return false;
  }

  const windowExpiresAt = addMinutes(throttle.windowStartedAt, WINDOW_MINUTES);

  if (windowExpiresAt <= now) {
    await prisma.loginThrottle.update({
      where: {
        identifierHash,
      },
      data: {
        failedAttempts: 0,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });

    return true;
  }

  if (throttle.blockedUntil && throttle.blockedUntil <= now) {
    await prisma.loginThrottle.update({
      where: {
        identifierHash,
      },
      data: {
        failedAttempts: 0,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });
  }

  return true;
};

export const recordFailedLogin = async ({
  username,
  clientAddress,
}: LoginThrottleInput) => {
  const identifierHash = createIdentifierHash(username, clientAddress);

  const now = new Date();

  const existing = await prisma.loginThrottle.findUnique({
    where: {
      identifierHash,
    },
  });

  if (!existing) {
    await prisma.loginThrottle.create({
      data: {
        identifierHash,
        failedAttempts: 1,
        windowStartedAt: now,
      },
    });

    return;
  }

  const windowExpiresAt = addMinutes(existing.windowStartedAt, WINDOW_MINUTES);

  if (windowExpiresAt <= now) {
    await prisma.loginThrottle.update({
      where: {
        identifierHash,
      },
      data: {
        failedAttempts: 1,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });

    return;
  }

  const failedAttempts = existing.failedAttempts + 1;

  const blockedUntil =
    failedAttempts >= MAX_FAILED_ATTEMPTS
      ? addMinutes(now, BLOCK_MINUTES)
      : null;

  await prisma.loginThrottle.update({
    where: {
      identifierHash,
    },
    data: {
      failedAttempts,
      blockedUntil,
    },
  });
};

export const clearLoginThrottle = async ({
  username,
  clientAddress,
}: LoginThrottleInput) => {
  const identifierHash = createIdentifierHash(username, clientAddress);

  await prisma.loginThrottle.deleteMany({
    where: {
      identifierHash,
    },
  });
};

export const deleteExpiredLoginThrottles = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.loginThrottle.deleteMany({
    where: {
      updatedAt: {
        lt: cutoff,
      },
    },
  });
};
