import "server-only";

import { getCurrentSession } from "@/lib/session";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  role: "admin" | "member";
}

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const { teamMember } = session;

  if (!teamMember.username) {
    return null;
  }

  return {
    id: teamMember.id,
    email: teamMember.email,
    displayName: teamMember.displayName,
    username: teamMember.username,
    role: teamMember.role,
  };
};
