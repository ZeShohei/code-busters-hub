import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, RotationType } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const date = (value: string) => {
  return new Date(`${value}T00:00:00.000Z`);
};

const main = async () => {
  const shpetim = await prisma.teamMember.upsert({
    where: {
      email: "shpetim.islami@example.com",
    },
    update: {
      firstName: "Shpetim",
      lastName: "Islami",
      displayName: "Shpetim Islami",
      active: true,
    },
    create: {
      firstName: "Shpetim",
      lastName: "Islami",
      displayName: "Shpetim Islami",
      email: "shpetim.islami@example.com",
      active: true,
    },
  });

  const stefan = await prisma.teamMember.upsert({
    where: {
      email: "stefan.bozkurt@example.com",
    },
    update: {
      firstName: "Stefan",
      lastName: "Bozkurt",
      displayName: "Stefan Bozkurt",
      active: true,
    },
    create: {
      firstName: "Stefan",
      lastName: "Bozkurt",
      displayName: "Stefan Bozkurt",
      email: "stefan.bozkurt@example.com",
      active: true,
    },
  });

  const denis = await prisma.teamMember.upsert({
    where: {
      email: "denis.fejzic@example.com",
    },
    update: {
      firstName: "Denis",
      lastName: "Fejzic",
      displayName: "Denis Fejzic",
      active: true,
    },
    create: {
      firstName: "Denis",
      lastName: "Fejzic",
      displayName: "Denis Fejzic",
      email: "denis.fejzic@example.com",
      active: true,
    },
  });

  const shpetimAbsence = await prisma.absence.upsert({
    where: {
      id: "absence-1",
    },
    update: {
      teamMemberId: shpetim.id,
      startDate: date("2026-09-07"),
      endDate: date("2026-09-11"),
      type: "vacation",
    },
    create: {
      id: "absence-1",
      teamMemberId: shpetim.id,
      startDate: date("2026-09-07"),
      endDate: date("2026-09-11"),
      type: "vacation",
    },
  });

  const denisAbsence = await prisma.absence.upsert({
    where: {
      id: "absence-2",
    },
    update: {
      teamMemberId: denis.id,
      startDate: date("2026-09-14"),
      endDate: date("2026-09-18"),
      type: "vacation",
    },
    create: {
      id: "absence-2",
      teamMemberId: denis.id,
      startDate: date("2026-09-14"),
      endDate: date("2026-09-18"),
      type: "vacation",
    },
  });

  const stefanAbsence = await prisma.absence.upsert({
    where: {
      id: "absence-3",
    },
    update: {
      teamMemberId: stefan.id,
      startDate: date("2026-09-28"),
      endDate: date("2026-10-02"),
      type: "vacation",
    },
    create: {
      id: "absence-3",
      teamMemberId: stefan.id,
      startDate: date("2026-09-28"),
      endDate: date("2026-10-02"),
      type: "vacation",
    },
  });

  await prisma.substitution.upsert({
    where: {
      absenceId: shpetimAbsence.id,
    },
    update: {
      substituteTeamMemberId: stefan.id,
    },
    create: {
      absenceId: shpetimAbsence.id,
      substituteTeamMemberId: stefan.id,
    },
  });

  await prisma.substitution.upsert({
    where: {
      absenceId: denisAbsence.id,
    },
    update: {
      substituteTeamMemberId: shpetim.id,
    },
    create: {
      absenceId: denisAbsence.id,
      substituteTeamMemberId: shpetim.id,
    },
  });

  await prisma.substitution.upsert({
    where: {
      absenceId: stefanAbsence.id,
    },
    update: {
      substituteTeamMemberId: denis.id,
    },
    create: {
      absenceId: stefanAbsence.id,
      substituteTeamMemberId: denis.id,
    },
  });

  const dispatcherStartDate = date("2026-08-31");

  const dispatcherConfig = await prisma.rotationConfig.upsert({
    where: {
      type_startDate: {
        type: RotationType.dispatcher,
        startDate: dispatcherStartDate,
      },
    },
    update: {
      numberOfWeeks: 52,
      startIndex: 0,
    },
    create: {
      type: RotationType.dispatcher,
      startDate: dispatcherStartDate,
      numberOfWeeks: 52,
      startIndex: 0,
    },
  });

  const deploymentStartDate = date("2026-08-31");

  const deploymentConfig = await prisma.rotationConfig.upsert({
    where: {
      type_startDate: {
        type: RotationType.deployment,
        startDate: deploymentStartDate,
      },
    },
    update: {
      numberOfWeeks: 52,
      startIndex: 1,
    },
    create: {
      type: RotationType.deployment,
      startDate: deploymentStartDate,
      numberOfWeeks: 52,
      startIndex: 1,
    },
  });

  await prisma.rotationParticipant.deleteMany({
    where: {
      rotationConfigId: {
        in: [dispatcherConfig.id, deploymentConfig.id],
      },
    },
  });

  await prisma.rotationParticipant.createMany({
    data: [
      {
        rotationConfigId: dispatcherConfig.id,
        teamMemberId: shpetim.id,
        position: 0,
      },
      {
        rotationConfigId: dispatcherConfig.id,
        teamMemberId: stefan.id,
        position: 1,
      },
      {
        rotationConfigId: dispatcherConfig.id,
        teamMemberId: denis.id,
        position: 2,
      },
      {
        rotationConfigId: deploymentConfig.id,
        teamMemberId: shpetim.id,
        position: 0,
      },
      {
        rotationConfigId: deploymentConfig.id,
        teamMemberId: stefan.id,
        position: 1,
      },
      {
        rotationConfigId: deploymentConfig.id,
        teamMemberId: denis.id,
        position: 2,
      },
    ],
  });

  console.log("Seed erfolgreich abgeschlossen.");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });
