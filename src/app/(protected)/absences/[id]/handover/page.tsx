import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader/PageHeader";

import { VacationHandoverForm } from "@/features/handovers/VacationHandoverForm";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { formatDate } from "@/utils/date";

import styles from "../../page.module.css";

interface VacationHandoverPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VacationHandoverPage({
  params,
}: VacationHandoverPageProps) {
  const { id } = await params;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    notFound();
  }

  const currentTeamMember = await prisma.teamMember.findUnique({
    where: {
      id: currentUser.id,
    },
  });

  if (!currentTeamMember || !currentTeamMember.active) {
    notFound();
  }

  const absence = await prisma.absence.findUnique({
    where: {
      id,
    },

    include: {
      teamMember: true,

      substitution: {
        include: {
          substituteTeamMember: true,
        },
      },

      vacationHandover: {
        include: {
          tasks: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });

  if (!absence || absence.type !== "vacation") {
    notFound();
  }

  const isOwner = absence.teamMemberId === currentTeamMember.id;

  const isAdmin = currentTeamMember.role === "admin";

  const isSubstitute =
    absence.substitution?.substituteTeamMemberId === currentTeamMember.id;

  if (!isOwner && !isAdmin && !isSubstitute) {
    notFound();
  }

  /*
   * Nur Urlauber oder Admin dürfen
   * das eigentliche Protokoll verändern.
   */
  const canEdit = isOwner || isAdmin;

  /*
   * Die Vertretung darf Aufgaben abhaken.
   * Urlauber/Admin dürfen das ebenfalls.
   */
  const canCompleteTasks = isOwner || isAdmin || isSubstitute;

  const handover = absence.vacationHandover;

  return (
    <section className={styles.page}>
      <Breadcrumbs
        items={[
          {
            label: "Übersicht",
            href: "/",
          },
          {
            label: "Abwesenheiten",
            href: "/absences",
          },
          {
            label: "Urlaubsübergabe",
          },
        ]}
      />

      <PageHeader
        eyebrow="Urlaubsübergabe"
        title={`Übergabe für ${absence.teamMember.displayName}`}
        description={
          canEdit
            ? "Halte alle wichtigen Aufgaben, Themen und Hinweise für deine Vertretung fest."
            : "Hier findest du das Übergabeprotokoll für deine Urlaubsvertretung."
        }
      />

      <VacationHandoverForm
        absenceId={absence.id}
        canEdit={canEdit}
        canCompleteTasks={canCompleteTasks}
        vacationerName={absence.teamMember.displayName}
        vacationStartDate={formatDate(
          absence.startDate.toISOString().slice(0, 10),
        )}
        vacationEndDate={formatDate(absence.endDate.toISOString().slice(0, 10))}
        substituteName={absence.substitution?.substituteTeamMember.displayName}
        initialValues={{
          emergencyContact: handover?.emergencyContact ?? "",

          featureBranches: handover?.featureBranches ?? "",

          deploymentPlan: handover?.deploymentPlan ?? "",

          cicdStatus: handover?.cicdStatus ?? "",

          environments: handover?.environments ?? "",

          knownRisks: handover?.knownRisks ?? "",

          dependencies: handover?.dependencies ?? "",

          technicalDocumentation: handover?.technicalDocumentation ?? "",

          repositories: handover?.repositories ?? "",

          tickets: handover?.tickets ?? "",

          notes: handover?.notes ?? "",

          tasks:
            handover?.tasks.map((task) => ({
              id: task.id,
              title: task.title,

              repoBranch: task.repoBranch ?? "",

              status: task.status ?? "",

              nextSteps: task.nextSteps ?? "",

              responsible: task.responsible ?? "",

              completed: task.completed,
            })) ?? [],
        }}
      />
    </section>
  );
}
