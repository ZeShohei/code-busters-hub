import "server-only";

import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
}

/*
 * Temporärer lokaler Benutzer.
 *
 * Später wird die Identität aus Microsoft Entra ID /
 * Microsoft Teams Auth übernommen.
 */
const LOCAL_USER_EMAIL = "denis.fejzic@example.com";

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      email: LOCAL_USER_EMAIL,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });

  if (!teamMember) {
    return null;
  }

  return {
    id: teamMember.id,
    email: teamMember.email,
    displayName: teamMember.displayName,
    role: teamMember.role,
  };
};
