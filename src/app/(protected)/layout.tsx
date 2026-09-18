import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell/AppShell";

import { getCurrentUser } from "@/lib/auth";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
