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
    },
    create: {
      firstName: "Shpetim",
      lastName: "Islami",
      displayName: "Shpetim Islami",
      email: "shpetim.islami@example.com",
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
    },
    create: {
      firstName: "Stefan",
      lastName: "Bozkurt",
      displayName: "Stefan Bozkurt",
      email: "stefan.bozkurt@example.com",
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
    },
    create: {
      firstName: "Denis",
      lastName: "Fejzic",
      displayName: "Denis Fejzic",
      email: "denis.fejzic@example.com",
    },
  });

  await prisma.absence.upsert({
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

  await prisma.absence.upsert({
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

  await prisma.absence.upsert({
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
      id: "substitution-1",
    },
    update: {
      teamMemberId: shpetim.id,
      substituteTeamMemberId: stefan.id,
      startDate: date("2026-09-07"),
      endDate: date("2026-09-11"),
    },
    create: {
      id: "substitution-1",
      teamMemberId: shpetim.id,
      substituteTeamMemberId: stefan.id,
      startDate: date("2026-09-07"),
      endDate: date("2026-09-11"),
    },
  });

  await prisma.substitution.upsert({
    where: {
      id: "substitution-2",
    },
    update: {
      teamMemberId: denis.id,
      substituteTeamMemberId: shpetim.id,
      startDate: date("2026-09-14"),
      endDate: date("2026-09-18"),
    },
    create: {
      id: "substitution-2",
      teamMemberId: denis.id,
      substituteTeamMemberId: shpetim.id,
      startDate: date("2026-09-14"),
      endDate: date("2026-09-18"),
    },
  });

  await prisma.substitution.upsert({
    where: {
      id: "substitution-3",
    },
    update: {
      teamMemberId: stefan.id,
      substituteTeamMemberId: denis.id,
      startDate: date("2026-09-28"),
      endDate: date("2026-10-02"),
    },
    create: {
      id: "substitution-3",
      teamMemberId: stefan.id,
      substituteTeamMemberId: denis.id,
      startDate: date("2026-09-28"),
      endDate: date("2026-10-02"),
    },
  });

  const dispatcherConfig = await prisma.rotationConfig.upsert({
    where: {
      type: RotationType.dispatcher,
    },
    update: {
      startDate: date("2026-08-31"),
      numberOfWeeks: 52,
      startIndex: 0,
    },
    create: {
      type: RotationType.dispatcher,
      startDate: date("2026-08-31"),
      numberOfWeeks: 52,
      startIndex: 0,
    },
  });

  const deploymentConfig = await prisma.rotationConfig.upsert({
    where: {
      type: RotationType.deployment,
    },
    update: {
      startDate: date("2026-08-31"),
      numberOfWeeks: 52,
      startIndex: 1,
    },
    create: {
      type: RotationType.deployment,
      startDate: date("2026-08-31"),
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
