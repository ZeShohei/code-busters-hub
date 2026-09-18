import "server-only";

import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export const requireAdmin = async () => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    notFound();
  }

  return user;
};
